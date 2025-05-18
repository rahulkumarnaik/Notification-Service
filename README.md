# Notification Service

A comprehensive notification service that supports email, SMS, and in-app notifications with asynchronous processing and retry mechanisms.

## Features

- RESTful API for sending and retrieving notifications
- Support for multiple notification channels (Email, SMS, In-app)
- Asynchronous processing using RabbitMQ message queue
- Automatic retries for failed notifications with exponential backoff
- MongoDB for persistent storage of notification records

## API Endpoints

### Send a Notification
```
POST /api/notifications
```

Request body:
```json
{
  "userId": "user123",
  "type": "alert",
  "content": "Your order has been shipped",
  "channel": "email" // or "sms" or "in-app"
}
```

### Get User Notifications
```
GET /api/users/{id}/notifications
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- RabbitMQ

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Configure environment variables in `.env` file
4. Start the server:
   ```
   npm start
   ```
   
For development with auto-reload:
```
npm run dev
```

## Architecture

- **Controllers**: Handle API requests and responses
- **Services**: Contain business logic for notification processing
- **Models**: Define data structures for notifications
- **Queue Service**: Manages asynchronous processing with RabbitMQ

## Implementation Details

### Notification Flow

1. Client sends a notification request to the API
2. Notification is saved to the database with 'pending' status
3. Notification is queued for asynchronous processing
4. Queue worker processes the notification based on its channel type
5. If successful, notification status is updated to 'delivered'
6. If failed, the system attempts retries with exponential backoff
7. After maximum retries, notification is marked as 'failed'

### Retry Mechanism

The service implements an exponential backoff strategy for retries:
- 1st retry: 2 seconds delay
- 2nd retry: 4 seconds delay
- 3rd retry: 8 seconds delay

After 3 failed attempts, the notification is marked as permanently failed.