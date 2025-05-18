const NotificationService = require('../services/notificationService');

class NotificationController {
  // Send a notification
  static async sendNotification(req, res) {
    try {
      const { userId, type, content, channel } = req.body;
      
      if (!userId || !type || !content || !channel) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Validate notification channel
      if (!['email', 'sms', 'in-app'].includes(channel)) {
        return res.status(400).json({ error: 'Invalid notification channel' });
      }
      
      const notification = await NotificationService.createNotification({
        userId,
        type,
        content,
        channel
      });
      
      res.status(201).json(notification);
    } catch (error) {
      console.error('Error sending notification:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  }

  // Get user notifications
  static async getUserNotifications(req, res) {
    try {
      const userId = req.params.id;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      const notifications = await NotificationService.getNotificationsByUserId(userId);
      res.status(200).json(notifications);
    } catch (error) {
      console.error('Error retrieving notifications:', error);
      res.status(500).json({ error: 'Failed to retrieve notifications' });
    }
  }
}

module.exports = NotificationController;