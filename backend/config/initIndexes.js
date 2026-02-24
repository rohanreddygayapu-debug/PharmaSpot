const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const User = require('../models/User');

/**
 * Ensure all model indexes are properly created, especially sparse unique indexes
 * This is important for models with sparse unique indexes (like Doctor.physID)
 * to prevent E11000 duplicate key errors on null values
 */
const initIndexes = async () => {
    try {
        console.log('Initializing database indexes...');
        
        // Initialize indexes for all critical models
        // This will create/update indexes as defined in their schemas
        const models = [Doctor, Patient, User];
        
        await Promise.all(models.map(model => model.init()));
        
        console.log('✓ Database indexes initialized successfully');
    } catch (error) {
        console.error('Error initializing indexes:', error);
        // Don't throw - allow server to continue starting
    }
};

module.exports = initIndexes;
