const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmaspot';
        
        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000
        });
        
        console.log('MongoDB connected successfully');
        return true;
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        console.log('Server will continue using mock data fallback.');
        return false;
    }
};

module.exports = connectDB;
