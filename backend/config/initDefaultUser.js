const bcrypt = require('bcrypt');
const User = require('../models/User');

const saltRounds = 10;

/**
 * Initialize default admin and worker users if they don't exist
 */
const initDefaultUser = async () => {
    try {
        // Initialize admin user
        const adminUser = await User.findOne({ username: 'admin' });
        
        if (!adminUser) {
            const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin';
            
            // Warn if using default password
            if (defaultPassword === 'admin') {
                console.warn('⚠️  WARNING: Using default password "admin". Set DEFAULT_ADMIN_PASSWORD environment variable for production!');
            }
            
            const hash = await bcrypt.hash(defaultPassword, saltRounds);
            const user = new User({
                username: 'admin',
                fullname: 'Administrator',
                email: 'admin@pharmaspot.com',
                role: 'admin',
                perm_products: 1,
                perm_categories: 1,
                perm_transactions: 1,
                perm_users: 1,
                perm_settings: 1,
                password: hash,
            });
            await user.save();
            console.log('✓ Default admin user created successfully');
            
            // Only log password details in development mode
            if (process.env.NODE_ENV === 'development') {
                console.log('Username: admin');
                console.log(`Password: ${defaultPassword}${defaultPassword === 'admin' ? ' (default)' : ' (custom)'}`);
            }
        } else {
            console.log('✓ Admin user already exists');
        }

        // Initialize worker user
        const workerUser = await User.findOne({ username: 'worker' });
        
        if (!workerUser) {
            const defaultPassword = process.env.DEFAULT_WORKER_PASSWORD || 'worker';
            
            const hash = await bcrypt.hash(defaultPassword, saltRounds);
            const user = new User({
                username: 'worker',
                fullname: 'Worker User',
                email: 'worker@pharmaspot.com',
                role: 'worker',
                perm_products: 0,
                perm_categories: 0,
                perm_transactions: 1,
                perm_users: 0,
                perm_settings: 0,
                password: hash,
            });
            await user.save();
            console.log('✓ Default worker user created successfully');
            
            // Only log password details in development mode
            if (process.env.NODE_ENV === 'development') {
                console.log('Username: worker');
                console.log(`Password: ${defaultPassword}${defaultPassword === 'worker' ? ' (default)' : ' (custom)'}`);
            }
        } else {
            console.log('✓ Worker user already exists');
        }
        
        if (process.env.NODE_ENV === 'development') {
            console.log('IMPORTANT: Change default passwords after first login!');
        }
    } catch (error) {
        console.error('Error initializing default users:', error);
        // Don't throw - allow server to continue starting
    }
};

module.exports = initDefaultUser;
