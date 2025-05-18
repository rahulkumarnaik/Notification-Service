require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const notificationRoutes = require('./routes/notificationRoutes');
const { setupQueue } = require('./services/queueService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Notification Service API');
});

// Routes
app.use('/api', notificationRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/notification-service', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB');
  // Setup message queue after DB connection
  return setupQueue();
})
.then(() => {
  // Start server after queue setup
  app.listen(PORT, () => {
    console.log(`Notification service running on port ${PORT}`);
  });
})
.catch(err => {
  console.error('Failed to start server:', err);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: 'Something went wrong!' });
});