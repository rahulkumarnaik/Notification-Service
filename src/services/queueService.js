const amqp = require('amqplib');
const NotificationService = require('./notificationService');

// Queue configuration
const QUEUE_NAME = 'notifications';
const RETRY_QUEUE_NAME = 'notifications.retry';
const MAX_RETRIES = 3;
let channel;

// Setup RabbitMQ connection and channels
async function setupQueue() {
  try {
    // Connect to RabbitMQ
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    channel = await connection.createChannel();
    
    // Setup main notification queue
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    
    // Setup retry queue with dead-letter exchange
    await channel.assertExchange('retry-exchange', 'direct', { durable: true });
    await channel.assertQueue(RETRY_QUEUE_NAME, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': '',
        'x-dead-letter-routing-key': QUEUE_NAME,
      }
    });
    
    // Start consuming messages
    await channel.consume(QUEUE_NAME, processQueueMessage, { noAck: false });
    
    console.log('Message queue setup complete');
    return channel;
  } catch (error) {
    console.error('Failed to setup message queue:', error);
    throw error;
  }
}

// Queue a notification for processing
async function queueNotification(notification) {
  try {
    if (!channel) {
      throw new Error('Queue not initialized');
    }
    
    const message = {
      id: notification._id.toString(),
      userId: notification.userId,
      type: notification.type,
      content: notification.content,
      channel: notification.channel,
      retryCount: 0
    };
    
    await channel.sendToQueue(
      QUEUE_NAME,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
    
    console.log(`Notification ${notification._id} queued for processing`);
    return true;
  } catch (error) {
    console.error('Failed to queue notification:', error);
    throw error;
  }
}

// Process a message from the queue
async function processQueueMessage(msg) {
  if (!msg) return;
  
  try {
    const notification = JSON.parse(msg.content.toString());
    console.log(`Processing notification ${notification.id} from queue`);
    
    // Retrieve the full notification from database
    const fullNotification = await require('../models/notification').findById(notification.id);
    
    if (!fullNotification) {
      console.error(`Notification ${notification.id} not found in database`);
      channel.ack(msg);
      return;
    }
    
    // Process the notification
    await NotificationService.processNotification(fullNotification);
    
    // Acknowledge successful processing
    channel.ack(msg);
    console.log(`Notification ${notification.id} processed successfully`);
  } catch (error) {
    console.error('Error processing notification from queue:', error);
    
    // Parse the message again
    const notification = JSON.parse(msg.content.toString());
    
    // Check if we should retry
    if (notification.retryCount < MAX_RETRIES) {
      // Increment retry count
      notification.retryCount++;
      
      // Calculate exponential backoff delay (in milliseconds)
      const delay = Math.pow(2, notification.retryCount) * 1000;
      
      console.log(`Scheduling retry ${notification.retryCount}/${MAX_RETRIES} for notification ${notification.id} in ${delay}ms`);
      
      // Send to retry queue with delay
      setTimeout(() => {
        channel.sendToQueue(
          QUEUE_NAME,
          Buffer.from(JSON.stringify(notification)),
          { persistent: true }
        );
      }, delay);
      
      // Acknowledge the original message
      channel.ack(msg);
    } else {
      console.error(`Notification ${notification.id} failed after ${MAX_RETRIES} retries`);
      // Update notification status to permanently failed
      await NotificationService.updateNotificationStatus(notification.id, 'failed');
      channel.ack(msg);
    }
  }
}

module.exports = {
  setupQueue,
  queueNotification
};