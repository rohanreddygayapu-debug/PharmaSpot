const Product = require('../models/Product');
const Notification = require('../models/Notification');

// Configuration constants
const CHECK_INTERVAL = parseInt(process.env.NOTIFICATION_CHECK_INTERVAL) || 60000; // Default: 1 minute
const LOW_STOCK_DUPLICATE_PREVENTION = 3600000; // 1 hour
const EXPIRY_DUPLICATE_PREVENTION = 86400000; // 24 hours

class NotificationService {
    constructor(io) {
        this.io = io;
        this.checkInterval = CHECK_INTERVAL;
        this.isRunning = false;
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        console.log('✓ Notification service started');
        
        // Initial check
        this.checkInventoryAlerts();
        
        // Set up periodic checks
        this.intervalId = setInterval(() => {
            this.checkInventoryAlerts();
        }, this.checkInterval);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.isRunning = false;
            console.log('✓ Notification service stopped');
        }
    }

    async checkInventoryAlerts() {
        try {
            await this.checkLowStock();
            await this.checkExpiringItems();
        } catch (error) {
            console.error('Error checking inventory alerts:', error);
        }
    }

    async checkLowStock() {
        try {
            const products = await Product.find({});
            const now = Date.now();

            for (const product of products) {
                const stock = product.quantity || 0;
                const minStock = product.minStock || 10;

                // Check if already notified recently (within last hour)
                const recentNotification = await Notification.findOne({
                    productId: product._id,
                    type: { $in: ['low_stock', 'out_of_stock'] },
                    createdAt: { $gte: new Date(now - LOW_STOCK_DUPLICATE_PREVENTION) }
                });

                if (recentNotification) continue;

                if (stock === 0) {
                    // Out of stock
                    const notification = await this.createNotification({
                        type: 'out_of_stock',
                        title: 'Out of Stock Alert',
                        message: `${product.name} is out of stock`,
                        productId: product._id,
                        productName: product.name,
                        priority: 'critical',
                        metadata: {
                            currentStock: stock,
                            minStock: minStock
                        }
                    });
                    this.emitNotification(notification);
                } else if (stock <= minStock) {
                    // Low stock
                    const notification = await this.createNotification({
                        type: 'low_stock',
                        title: 'Low Stock Alert',
                        message: `${product.name} is running low (${stock} units remaining)`,
                        productId: product._id,
                        productName: product.name,
                        priority: stock <= minStock / 2 ? 'high' : 'medium',
                        metadata: {
                            currentStock: stock,
                            minStock: minStock
                        }
                    });
                    this.emitNotification(notification);
                }
            }
        } catch (error) {
            console.error('Error checking low stock:', error);
        }
    }

    async checkExpiringItems() {
        try {
            const products = await Product.find({
                expiryDate: { $exists: true, $ne: null }
            });

            const now = new Date();
            const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

            for (const product of products) {
                if (!product.expiryDate) continue;

                const expiryDate = new Date(product.expiryDate);
                const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

                // Check if already notified recently (within last 24 hours)
                const recentNotification = await Notification.findOne({
                    productId: product._id,
                    type: 'expiry_alert',
                    createdAt: { $gte: new Date(now - EXPIRY_DUPLICATE_PREVENTION) }
                });

                if (recentNotification) continue;

                if (expiryDate <= now) {
                    // Already expired
                    const notification = await this.createNotification({
                        type: 'expiry_alert',
                        title: 'Expired Product',
                        message: `${product.name} has expired`,
                        productId: product._id,
                        productName: product.name,
                        priority: 'critical',
                        metadata: {
                            expiryDate: product.expiryDate,
                            daysUntilExpiry: daysUntilExpiry
                        }
                    });
                    this.emitNotification(notification);
                } else if (expiryDate <= thirtyDaysFromNow) {
                    // Expiring soon
                    let priority = 'low';
                    if (daysUntilExpiry <= 7) priority = 'high';
                    else if (daysUntilExpiry <= 14) priority = 'medium';

                    const notification = await this.createNotification({
                        type: 'expiry_alert',
                        title: 'Expiring Soon',
                        message: `${product.name} expires in ${daysUntilExpiry} days`,
                        productId: product._id,
                        productName: product.name,
                        priority: priority,
                        metadata: {
                            expiryDate: product.expiryDate,
                            daysUntilExpiry: daysUntilExpiry
                        }
                    });
                    this.emitNotification(notification);
                }
            }
        } catch (error) {
            console.error('Error checking expiring items:', error);
        }
    }

    async createNotification(data) {
        try {
            const notification = new Notification(data);
            await notification.save();
            return notification;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    emitNotification(notification) {
        if (this.io) {
            this.io.emit('notification', notification);
            console.log(`Notification emitted: ${notification.type} - ${notification.title}`);
        }
    }

    // Manual trigger for immediate notification (e.g., after stock update)
    async triggerStockCheck(productId) {
        try {
            const product = await Product.findById(productId);
            if (!product) return;

            const stock = product.quantity || 0;
            const minStock = product.minStock || 10;

            if (stock === 0) {
                const notification = await this.createNotification({
                    type: 'out_of_stock',
                    title: 'Out of Stock Alert',
                    message: `${product.name} is out of stock`,
                    productId: product._id,
                    productName: product.name,
                    priority: 'critical',
                    metadata: {
                        currentStock: stock,
                        minStock: minStock
                    }
                });
                this.emitNotification(notification);
            } else if (stock <= minStock) {
                const notification = await this.createNotification({
                    type: 'low_stock',
                    title: 'Low Stock Alert',
                    message: `${product.name} is running low (${stock} units remaining)`,
                    productId: product._id,
                    productName: product.name,
                    priority: stock <= minStock / 2 ? 'high' : 'medium',
                    metadata: {
                        currentStock: stock,
                        minStock: minStock
                    }
                });
                this.emitNotification(notification);
            }
        } catch (error) {
            console.error('Error triggering stock check:', error);
        }
    }
}

module.exports = NotificationService;
