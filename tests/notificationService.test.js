const NotificationService = require('../backend/services/notificationService');

// Mock Socket.IO
const mockIo = {
    emit: jest.fn(),
    on: jest.fn(),
};

// Mock Product and Notification models
jest.mock('../backend/models/Product');
jest.mock('../backend/models/Notification');

const Product = require('../backend/models/Product');
const Notification = require('../backend/models/Notification');

describe('NotificationService', () => {
    let service;

    beforeEach(() => {
        service = new NotificationService(mockIo);
        jest.clearAllMocks();
    });

    afterEach(() => {
        service.stop();
    });

    test('should start the notification service', () => {
        expect(service.isRunning).toBe(false);
        service.start();
        expect(service.isRunning).toBe(true);
    });

    test('should stop the notification service', () => {
        service.start();
        expect(service.isRunning).toBe(true);
        service.stop();
        expect(service.isRunning).toBe(false);
    });

    test('should emit notification when called', () => {
        const notification = {
            type: 'low_stock',
            title: 'Low Stock Alert',
            message: 'Product X is running low',
        };

        service.emitNotification(notification);
        expect(mockIo.emit).toHaveBeenCalledWith('notification', notification);
    });

    test('should create notification with correct data', async () => {
        const notificationData = {
            type: 'low_stock',
            title: 'Test Notification',
            message: 'Test message',
            priority: 'high',
        };

        const mockNotification = {
            ...notificationData,
            _id: '123',
            save: jest.fn().mockResolvedValue(true),
        };

        Notification.mockImplementation(() => mockNotification);

        const result = await service.createNotification(notificationData);
        expect(result).toEqual(mockNotification);
        expect(mockNotification.save).toHaveBeenCalled();
    });

    test('should check for low stock products', async () => {
        const mockProducts = [
            { _id: '1', name: 'Product A', quantity: 5, minStock: 10 },
            { _id: '2', name: 'Product B', quantity: 0, minStock: 10 },
            { _id: '3', name: 'Product C', quantity: 20, minStock: 10 },
        ];

        Product.find.mockResolvedValue(mockProducts);
        Notification.findOne.mockResolvedValue(null);
        Notification.mockImplementation((data) => ({
            ...data,
            save: jest.fn().mockResolvedValue(true),
        }));

        await service.checkLowStock();

        // Should create notifications for products with low/out of stock
        expect(Notification).toHaveBeenCalledTimes(2);
        expect(mockIo.emit).toHaveBeenCalledTimes(2);
    });

    test('should handle errors gracefully', async () => {
        Product.find.mockRejectedValue(new Error('Database error'));

        // Should not throw error
        await expect(service.checkLowStock()).resolves.not.toThrow();
    });
});

describe('Notification priorities', () => {
    let service;

    beforeEach(() => {
        service = new NotificationService(mockIo);
        jest.clearAllMocks();
    });

    test('should set critical priority for out of stock', async () => {
        const mockProduct = {
            _id: '1',
            name: 'Product A',
            quantity: 0,
            minStock: 10,
        };

        Product.findById.mockResolvedValue(mockProduct);
        Notification.findOne.mockResolvedValue(null);
        
        const mockNotification = {
            save: jest.fn().mockResolvedValue(true),
        };
        Notification.mockImplementation((data) => {
            Object.assign(mockNotification, data);
            return mockNotification;
        });

        await service.triggerStockCheck('1');

        expect(mockNotification.priority).toBe('critical');
        expect(mockNotification.type).toBe('out_of_stock');
    });

    test('should set high priority for very low stock', async () => {
        const mockProduct = {
            _id: '1',
            name: 'Product A',
            quantity: 3,
            minStock: 10,
        };

        Product.findById.mockResolvedValue(mockProduct);
        Notification.findOne.mockResolvedValue(null);
        
        const mockNotification = {
            save: jest.fn().mockResolvedValue(true),
        };
        Notification.mockImplementation((data) => {
            Object.assign(mockNotification, data);
            return mockNotification;
        });

        await service.triggerStockCheck('1');

        expect(mockNotification.priority).toBe('high');
        expect(mockNotification.type).toBe('low_stock');
    });
});
