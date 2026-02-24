import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { getApiUrl } from '../utils/config';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Load existing notifications
        loadNotifications();

        // Initialize Socket.IO connection
        const socketUrl = getApiUrl().replace('/api', '');
        const newSocket = io(socketUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        newSocket.on('connect', () => {
            console.log('Socket connected');
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected');
            setIsConnected(false);
        });

        newSocket.on('notification', (notification) => {
            console.log('New notification received:', notification);
            addNotification(notification);
            // Play notification sound (optional)
            playNotificationSound();
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, []);

    const loadNotifications = async () => {
        try {
            const response = await fetch(`${getApiUrl()}/notifications/unread`);
            const data = await response.json();
            setNotifications(data);
            setUnreadCount(data.length);
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    };

    const addNotification = (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
    };

    const markAsRead = async (notificationId) => {
        try {
            await fetch(`${getApiUrl()}/notifications/read/${notificationId}`, {
                method: 'POST',
            });
            setNotifications(prev =>
                prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch(`${getApiUrl()}/notifications/read-all`, {
                method: 'POST',
            });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    const dismissNotification = async (notificationId) => {
        try {
            await fetch(`${getApiUrl()}/notifications/dismiss/${notificationId}`, {
                method: 'POST',
            });
            setNotifications(prev => prev.filter(n => n._id !== notificationId));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error dismissing notification:', error);
        }
    };

    const clearReadNotifications = async () => {
        try {
            await fetch(`${getApiUrl()}/notifications/clear/read`, {
                method: 'DELETE',
            });
            setNotifications(prev => prev.filter(n => !n.read));
        } catch (error) {
            console.error('Error clearing notifications:', error);
        }
    };

    const playNotificationSound = () => {
        // Create a simple notification sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            // Ignore audio errors
        }
    };

    const value = {
        notifications,
        unreadCount,
        isConnected,
        markAsRead,
        markAllAsRead,
        dismissNotification,
        clearReadNotifications,
        loadNotifications,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
