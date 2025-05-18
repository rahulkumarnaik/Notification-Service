const Notification = require('../models/notification');
const { queueNotification } = require('./queueService');

class NotificationService {
  // Create a new notification and queue it for processing
  static async createNotification(notificationData) {
    try {
      // Create notification record in database
      const notification = new Notification({
        userId: notificationData.userId,
        type: notificationData.type,
        content: notificationData.content,
        channel: notificationData.channel,
        status: 'pending',
        createdAt: new Date()
      });
      
      await notification.save();
      
      // Queue the notification for processing
      await queueNotification(notification);
      
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Get all notifications for a user
  static async getNotificationsByUserId(userId) {
    try {
      return await Notification.find({ userId }).sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error retrieving notifications:', error);
      throw error;
    }
  }

  // Update notification status
  static async updateNotificationStatus(notificationId, status) {
    try {
      return await Notification.findByIdAndUpdate(
        notificationId,
        { status, updatedAt: new Date() },
        { new: true }
      );
    } catch (error) {
      console.error('Error updating notification status:', error);
      throw error;
    }
  }

  // Process a notification based on its channel
  static async processNotification(notification) {
    try {
      console.log(`Processing ${notification.channel} notification for user ${notification.userId}`);
      
      let success = false;
      
      switch (notification.channel) {
        case 'email':
          success = await this.sendEmailNotification(notification);
          break;
        case 'sms':
          success = await this.sendSmsNotification(notification);
          break;
        case 'in-app':
          success = await this.sendInAppNotification(notification);
          break;
        default:
          throw new Error(`Unsupported notification channel: ${notification.channel}`);
      }
      
      if (success) {
        await this.updateNotificationStatus(notification._id, 'delivered');
        return true;
      } else {
        throw new Error(`Failed to send ${notification.channel} notification`);
      }
    } catch (error) {
      console.error('Error processing notification:', error);
      await this.updateNotificationStatus(notification._id, 'failed');
      throw error;
    }
  }

  // Send email notification
  static async sendEmailNotification(notification) {
    // In a real implementation, this would use nodemailer or similar
    console.log(`Sending email to user ${notification.userId}: ${notification.content}`);
    return true; // Simulate successful delivery
  }

  // Send SMS notification
  static async sendSmsNotification(notification) {
    // In a real implementation, this would use Twilio or similar
    console.log(`Sending SMS to user ${notification.userId}: ${notification.content}`);
    return true; // Simulate successful delivery
  }

  // Send in-app notification
  static async sendInAppNotification(notification) {
    // In a real implementation, this might use WebSockets or similar
    console.log(`Sending in-app notification to user ${notification.userId}: ${notification.content}`);
    return true; // Simulate successful delivery
  }
}

module.exports = NotificationService;