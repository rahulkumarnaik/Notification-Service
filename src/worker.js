require('dotenv').config();
const mongoose = require('mongoose');
const { setupQueue } = require('./services/queueService');

console.log('Starting notification worker...');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/notification-service', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Worker connected to MongoDB');
  // Setup message queue after DB connection
  return setupQueue();
})
.then(() => {
  console.log('Worker is now processing notifications from the queue');
})
.catch(err => {
  console.error('Failed to start worker:', err);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Worker shutting down...');
  try {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});