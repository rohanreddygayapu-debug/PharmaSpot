require('dotenv').config();
const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmaspot';

async function fixDoctorIndex() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get the collection
        const collection = mongoose.connection.collection('doctors');

        // Drop the existing physID index if it exists
        console.log('Checking for existing physID index...');
        const indexes = await collection.indexes();
        const physIDIndex = indexes.find(idx => idx.name === 'physID_1');
        
        if (physIDIndex) {
            console.log('Found physID_1 index, dropping it...');
            await collection.dropIndex('physID_1');
            console.log('✓ Dropped old physID_1 index');
        } else {
            console.log('No physID_1 index found');
        }

        // Create a new sparse unique index for physID
        console.log('Creating new sparse unique index for physID...');
        await collection.createIndex(
            { physID: 1 }, 
            { 
                unique: true, 
                sparse: true,
                name: 'physID_1'
            }
        );
        console.log('✓ Created new sparse unique index for physID');

        console.log('\nIndex fix completed successfully!');
        console.log('Doctors can now register without providing a physID.');
        
        process.exit(0);
    } catch (error) {
        console.error('Error fixing doctor index:', error);
        process.exit(1);
    }
}

fixDoctorIndex();
