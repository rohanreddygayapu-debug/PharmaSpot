# Real-Time Notification System - Implementation Documentation

## Overview
This document describes the real-time notification system implemented for inventory alerts in the PharmaSpot admin dashboard.

## Features Implemented

### Backend Components

1. **Socket.IO Integration**
   - Socket.IO server configured in `backend/server.js`
   - Real-time bidirectional communication between server and clients
   - Automatic reconnection handling
   - CORS enabled for cross-origin requests

2. **Notification Model** (`backend/models/Notification.js`)
   - MongoDB schema for storing notification history
   - Fields:
     - `type`: low_stock, expiry_alert, out_of_stock, info
     - `title`: Notification title
     - `message`: Detailed message
     - `productId`: Reference to the product
     - `productName`: Cached product name
     - `priority`: low, medium, high, critical
     - `read`: Boolean flag
     - `dismissed`: Boolean flag
     - `metadata`: Additional data (stock levels, expiry dates, etc.)

3. **Notification Service** (`backend/services/notificationService.js`)
   - Monitors inventory in real-time
   - Checks for low stock and expiring items every minute
   - Intelligent duplicate prevention (no repeated notifications within specified timeframes)
   - Priority-based alerting:
     - **Critical**: Out of stock, expired products
     - **High**: Very low stock (<50% of minimum), expires within 7 days
     - **Medium**: Low stock, expires within 14 days
     - **Low**: Expires within 30 days
   - Automatic notification emission via Socket.IO
   - Manual trigger capability for immediate checks after stock updates

4. **Notifications API** (`backend/api/notifications.js`)
   - `GET /api/notifications/all` - Get all notifications (last 100)
   - `GET /api/notifications/unread` - Get unread notifications
   - `GET /api/notifications/unread/count` - Get count of unread notifications
   - `POST /api/notifications/read/:id` - Mark notification as read
   - `POST /api/notifications/read-all` - Mark all as read
   - `POST /api/notifications/dismiss/:id` - Dismiss a notification
   - `DELETE /api/notifications/:id` - Delete a notification
   - `DELETE /api/notifications/clear/read` - Clear all read notifications

5. **Inventory API Integration**
   - Stock add/remove endpoints now trigger immediate notification checks
   - Real-time alerts when stock changes push inventory below thresholds

### Frontend Components

1. **NotificationContext** (`src/contexts/NotificationContext.jsx`)
   - React Context for managing notification state globally
   - Socket.IO client integration
   - Automatic connection/reconnection handling
   - Real-time notification reception
   - Notification sound effects
   - Methods:
     - `markAsRead(id)` - Mark single notification as read
     - `markAllAsRead()` - Mark all notifications as read
     - `dismissNotification(id)` - Dismiss and remove notification
     - `clearReadNotifications()` - Clear all read notifications
     - `loadNotifications()` - Reload notifications from server

2. **NotificationPanel Component** (`src/components/NotificationPanel.jsx`)
   - Notification bell icon with unread count badge
   - Connection status indicator
   - Sliding panel with smooth animations
   - Filter buttons (All, Stock, Expiry)
   - Notification list with:
     - Priority icons (🔴 Critical, 🟠 High, 🟡 Medium, 🟢 Low)
     - Type icons (📦 Low Stock, ❌ Out of Stock, ⏰ Expiry)
     - Product name badges
     - Relative timestamps ("Just now", "5m ago", etc.)
     - Read/unread visual indicators
     - Individual dismiss buttons
   - Bulk actions:
     - Mark all as read
     - Clear read notifications
   - Empty state handling

3. **NotificationPanel Styling** (`src/components/NotificationPanel.css`)
   - Modern, clean design
   - Smooth animations and transitions
   - Priority-based color coding
   - Responsive design for mobile devices
   - Custom scrollbar styling
   - Hover effects for better UX
   - Pulse animation for unread badge

4. **Admin Dashboard Integration**
   - NotificationPanel added to dashboard header
   - Positioned alongside existing dashboard elements
   - Maintains clean, professional layout

5. **App-Level Integration**
   - NotificationProvider wraps the entire app
   - Available to all authenticated users
   - Notifications persist across page navigation

## How It Works

### Notification Flow

1. **Automatic Monitoring**
   - NotificationService runs periodic checks (every 60 seconds)
   - Scans all products for low stock conditions
   - Scans all products with expiry dates for upcoming expirations
   - Creates and stores notifications in the database
   - Emits notifications via Socket.IO to all connected clients

2. **Manual Triggers**
   - When stock is added or removed via the inventory API
   - Immediate notification check for that specific product
   - Real-time alert if thresholds are crossed

3. **Client Reception**
   - Frontend Socket.IO client receives notifications in real-time
   - NotificationContext updates state
   - NotificationPanel displays new notifications
   - Unread count badge updates
   - Optional sound alert plays

4. **User Interaction**
   - Click notification to mark as read
   - Dismiss individual notifications
   - Filter by type (all, stock, expiry)
   - Mark all as read with one click
   - Clear read notifications to reduce clutter

### Duplicate Prevention

The system intelligently prevents duplicate notifications:
- **Low Stock/Out of Stock**: No duplicate alerts within 1 hour
- **Expiry Alerts**: No duplicate alerts within 24 hours

This prevents notification spam while keeping users informed.

### Priority System

Notifications are automatically assigned priorities:

**Critical Priority:**
- Out of stock items
- Expired products

**High Priority:**
- Very low stock (≤50% of minimum stock level)
- Products expiring within 7 days

**Medium Priority:**
- Low stock (above 50% but below minimum)
- Products expiring within 8-14 days

**Low Priority:**
- Products expiring within 15-30 days

## Technical Details

### Dependencies Added
- **Backend**: `socket.io` (v4.x)
- **Frontend**: `socket.io-client` (v4.x)

### Socket.IO Configuration
```javascript
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
```

### Database Indexes
Optimized query performance with indexes on:
- `read` and `dismissed` fields (compound)
- `type` field
- `priority` field
- `createdAt` field (for sorting)

## Testing

### Manual Testing Steps
1. Start the backend server: `cd backend && npm start`
2. Start the frontend: `npm run dev`
3. Login to admin dashboard
4. Create a product with low stock (below minimum stock level)
5. Observe notification bell badge increment
6. Click bell to view notification
7. Test filters and mark as read functionality
8. Add stock to product above minimum
9. Wait for next check cycle (or trigger manually)

### Automated Testing
Unit tests created in `tests/notificationService.test.js` cover:
- Service start/stop
- Notification creation
- Notification emission
- Low stock detection
- Priority assignment
- Error handling

## Future Enhancements

Possible improvements for future iterations:
1. **Email/SMS Notifications**: Send alerts via email or SMS for critical issues
2. **User Preferences**: Allow users to customize notification types and frequencies
3. **Notification History**: Full searchable history with date range filters
4. **Analytics Dashboard**: Track notification patterns and response times
5. **Role-Based Notifications**: Different alerts for different user roles
6. **Batch Operations**: Bulk dismiss or mark as read with selection
7. **Mobile Push Notifications**: Native mobile app notifications
8. **Custom Alert Thresholds**: Per-product custom thresholds
9. **Scheduled Reports**: Daily/weekly summary reports
10. **Integration with External Systems**: Notify suppliers automatically

## API Usage Examples

### Get Unread Notifications
```javascript
fetch('http://localhost:5000/api/notifications/unread')
  .then(res => res.json())
  .then(notifications => console.log(notifications));
```

### Mark Notification as Read
```javascript
fetch('http://localhost:5000/api/notifications/read/123abc', {
  method: 'POST'
});
```

### Socket.IO Client Connection
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

socket.on('notification', (notification) => {
  console.log('New notification:', notification);
});
```

## Troubleshooting

### No Notifications Appearing
- Check MongoDB connection
- Verify NotificationService started (check server logs)
- Check Socket.IO connection in browser console
- Verify products exist with low stock or expiring dates

### Socket.IO Connection Issues
- Ensure CORS is properly configured
- Check firewall/network settings
- Verify port 5000 is accessible
- Check browser console for connection errors

### Database Connection Errors
- Verify MongoDB is running
- Check .env file for correct connection string
- Ensure proper network connectivity

## Conclusion

The real-time notification system provides administrators with immediate awareness of inventory issues, enabling proactive management and preventing stockouts or expired product sales. The system is designed to be unobtrusive while ensuring critical alerts are never missed.
