const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notificationController');

// Send a notification
router.post('/notifications', NotificationController.sendNotification);

// Get user notifications
router.get('/users/:id/notifications', NotificationController.getUserNotifications);

module.exports = router;