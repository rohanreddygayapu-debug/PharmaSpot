import React, { useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import './NotificationPanel.css';

// Time formatting constants
const SECONDS_IN_MINUTE = 60;
const SECONDS_IN_HOUR = 3600;
const SECONDS_IN_DAY = 86400;

const NotificationPanel = () => {
    const {
        notifications,
        unreadCount,
        isConnected,
        markAsRead,
        markAllAsRead,
        dismissNotification,
        clearReadNotifications,
    } = useNotifications();

    const [isOpen, setIsOpen] = useState(false);
    const [filter, setFilter] = useState('all'); // all, low_stock, expiry_alert

    const togglePanel = () => {
        setIsOpen(!isOpen);
    };

    const handleNotificationClick = (notification) => {
        if (!notification.read) {
            markAsRead(notification._id);
        }
    };

    const handleDismiss = (e, notificationId) => {
        e.stopPropagation();
        dismissNotification(notificationId);
    };

    const getPriorityIcon = (priority) => {
        switch (priority) {
            case 'critical':
                return '🔴';
            case 'high':
                return '🟠';
            case 'medium':
                return '🟡';
            case 'low':
                return '🟢';
            default:
                return '🔵';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'low_stock':
                return '📦';
            case 'out_of_stock':
                return '❌';
            case 'expiry_alert':
                return '⏰';
            default:
                return '📢';
        }
    };

    const filteredNotifications = filter === 'all' 
        ? notifications 
        : notifications.filter(n => n.type === filter);

    const formatTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        
        if (seconds < SECONDS_IN_MINUTE) return 'Just now';
        if (seconds < SECONDS_IN_HOUR) return `${Math.floor(seconds / SECONDS_IN_MINUTE)}m ago`;
        if (seconds < SECONDS_IN_DAY) return `${Math.floor(seconds / SECONDS_IN_HOUR)}h ago`;
        return `${Math.floor(seconds / SECONDS_IN_DAY)}d ago`;
    };

    return (
        <div className="notification-wrapper">
            <button className="notification-bell" onClick={togglePanel}>
                🔔
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
                {!isConnected && (
                    <span className="connection-indicator" title="Disconnected">⚠️</span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="notification-overlay" onClick={togglePanel}></div>
                    <div className="notification-panel">
                        <div className="notification-header">
                            <h3>Notifications</h3>
                            <div className="notification-actions">
                                {unreadCount > 0 && (
                                    <button 
                                        className="btn-link"
                                        onClick={markAllAsRead}
                                        title="Mark all as read"
                                    >
                                        ✓ All
                                    </button>
                                )}
                                <button 
                                    className="btn-link"
                                    onClick={clearReadNotifications}
                                    title="Clear read notifications"
                                >
                                    🗑️
                                </button>
                                <button 
                                    className="btn-link close-btn"
                                    onClick={togglePanel}
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        <div className="notification-filters">
                            <button 
                                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                                onClick={() => setFilter('all')}
                            >
                                All
                            </button>
                            <button 
                                className={`filter-btn ${filter === 'low_stock' ? 'active' : ''}`}
                                onClick={() => setFilter('low_stock')}
                            >
                                Stock
                            </button>
                            <button 
                                className={`filter-btn ${filter === 'expiry_alert' ? 'active' : ''}`}
                                onClick={() => setFilter('expiry_alert')}
                            >
                                Expiry
                            </button>
                        </div>

                        <div className="notification-list">
                            {filteredNotifications.length === 0 ? (
                                <div className="notification-empty">
                                    <p>No notifications</p>
                                </div>
                            ) : (
                                filteredNotifications.map((notification) => (
                                    <div
                                        key={notification._id}
                                        className={`notification-item ${notification.read ? 'read' : 'unread'} priority-${notification.priority}`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <div className="notification-icon">
                                            {getTypeIcon(notification.type)}
                                        </div>
                                        <div className="notification-content">
                                            <div className="notification-title">
                                                {getPriorityIcon(notification.priority)} {notification.title}
                                            </div>
                                            <div className="notification-message">
                                                {notification.message}
                                            </div>
                                            <div className="notification-meta">
                                                {notification.productName && (
                                                    <span className="product-name">{notification.productName}</span>
                                                )}
                                                <span className="notification-time">
                                                    {formatTimeAgo(notification.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            className="notification-dismiss"
                                            onClick={(e) => handleDismiss(e, notification._id)}
                                            title="Dismiss"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationPanel;
