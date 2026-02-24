require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Drug = require('../models/Drug');
const Insurance = require('../models/Insurance');
const Prescription = require('../models/Prescription');
const Supplier = require('../models/Supplier');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmaspot';

// Parse CSV file
function parseCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).map(line => {
        const values = line.split(',');
        const obj = {};
        headers.forEach((header, index) => {
            obj[header.trim()] = values[index] ? values[index].trim() : '';
        });
        return obj;
    });
}

async function importData() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing data
        console.log('Clearing existing data...');
        await Doctor.deleteMany({});
        await Patient.deleteMany({});
        await Drug.deleteMany({});
        await Insurance.deleteMany({});
        await Prescription.deleteMany({});
        await Supplier.deleteMany({});

        const datasetsDir = path.join(__dirname, '../datasets');

        // Import Doctors
        console.log('Importing doctors...');
        const doctors = parseCSV(path.join(datasetsDir, 'DOCTOR1(1).csv'));
        await Doctor.insertMany(doctors);
        console.log(`Imported ${doctors.length} doctors`);

        // Import Patients
        console.log('Importing patients...');
        const patients = parseCSV(path.join(datasetsDir, 'PATIENT1(1).csv'));
        await Patient.insertMany(patients);
        console.log(`Imported ${patients.length} patients`);

        // Import Drugs
        console.log('Importing drugs...');
        const drugs = parseCSV(path.join(datasetsDir, 'DRUGS.csv'));
        await Drug.insertMany(drugs);
        console.log(`Imported ${drugs.length} drugs`);

        // Import Insurance
        console.log('Importing insurance...');
        const insurance = parseCSV(path.join(datasetsDir, 'INSURANCE.csv'));
        await Insurance.insertMany(insurance);
        console.log(`Imported ${insurance.length} insurance records`);

        // Import Prescriptions
        console.log('Importing prescriptions...');
        const prescriptions = parseCSV(path.join(datasetsDir, 'PRESCRIPTIONS.csv'));
        await Prescription.insertMany(prescriptions);
        console.log(`Imported ${prescriptions.length} prescriptions`);

        // Import Suppliers
        console.log('Importing suppliers...');
        const suppliers = parseCSV(path.join(datasetsDir, 'SUPPLIER.csv'));
        await Supplier.insertMany(suppliers);
        console.log(`Imported ${suppliers.length} suppliers`);

        console.log('Data import completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error importing data:', error);
        process.exit(1);
    }
}

importData();
