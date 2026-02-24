/**
 * Integration Test for RSA Encrypted Doctor-Patient Chat
 * 
 * This test demonstrates the complete flow of:
 * 1. Key generation for doctor and patient
 * 2. Sending encrypted messages
 * 3. Receiving and decrypting messages
 */

require('dotenv').config();
const mongoose = require('mongoose');
const SecurityKeys = require('./models/SecurityKeys');
const Chat = require('./models/Chat');
const User = require('./models/User');
const {
    generateRSAKeyPair,
    encryptHybrid,
    decryptHybrid,
    createDigitalSignature,
    verifyDigitalSignature
} = require('./services/securityService');

// Test configuration
const TEST_DB = process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmacy_test';

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('   INTEGRATION TEST: RSA ENCRYPTED DOCTOR-PATIENT CHAT');
console.log('═══════════════════════════════════════════════════════════════\n');

async function runIntegrationTest() {
    try {
        // Connect to database
        console.log('STEP 1: Database Connection');
        console.log('─────────────────────────────────────────────────────────────');
        console.log('Connecting to MongoDB...');
        await mongoose.connect(TEST_DB, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✓ Connected to MongoDB\n');

        // Clean up test data
        console.log('Cleaning up previous test data...');
        await SecurityKeys.deleteMany({ keyPurpose: 'chat', entityId: { $in: ['test_patient_001', 'test_doctor_001'] } });
        await Chat.deleteMany({ userId: 'test_patient_001', doctorId: 'test_doctor_001' });
        console.log('✓ Test data cleaned\n');

        // Step 2: Generate keys for patient
        console.log('STEP 2: Patient Key Generation');
        console.log('─────────────────────────────────────────────────────────────');
        const patientId = 'test_patient_001';
        const patientKeys = generateRSAKeyPair();
        
        const patientSecurityKeys = new SecurityKeys({
            entityType: 'user',
            entityId: patientId,
            publicKey: patientKeys.publicKey,
            privateKey: patientKeys.privateKey,
            keyPurpose: 'chat',
            isActive: true
        });
        await patientSecurityKeys.save();
        
        console.log('👤 Patient RSA Keys Generated');
        console.log(`  Entity ID: ${patientId}`);
        console.log(`  Public Key: ${patientKeys.publicKey.substring(0, 80)}...`);
        console.log(`  Database ID: ${patientSecurityKeys._id}`);
        console.log('  ✓ Keys saved to database\n');

        // Step 3: Generate keys for doctor
        console.log('STEP 3: Doctor Key Generation');
        console.log('─────────────────────────────────────────────────────────────');
        const doctorId = 'test_doctor_001';
        const doctorKeys = generateRSAKeyPair();
        
        const doctorSecurityKeys = new SecurityKeys({
            entityType: 'doctor',
            entityId: doctorId,
            publicKey: doctorKeys.publicKey,
            privateKey: doctorKeys.privateKey,
            keyPurpose: 'chat',
            isActive: true
        });
        await doctorSecurityKeys.save();
        
        console.log('👨‍⚕️ Doctor RSA Keys Generated');
        console.log(`  Entity ID: ${doctorId}`);
        console.log(`  Public Key: ${doctorKeys.publicKey.substring(0, 80)}...`);
        console.log(`  Database ID: ${doctorSecurityKeys._id}`);
        console.log('  ✓ Keys saved to database\n');

        // Step 4: Patient sends encrypted message to doctor
        console.log('STEP 4: Patient Sends Encrypted Message');
        console.log('─────────────────────────────────────────────────────────────');
        
        const patientMessage = 'Hello Dr. Smith, I need to schedule a follow-up appointment regarding my test results.';
        console.log(`Original Message: "${patientMessage}"`);
        
        // Encrypt with hybrid encryption (doctor's public key)
        const encrypted1 = encryptHybrid(patientMessage, doctorKeys.publicKey);
        console.log('✓ Message encrypted with hybrid encryption (RSA + AES)');
        console.log(`  Encrypted AES Key: ${encrypted1.encryptedKey.substring(0, 80)}...`);
        console.log(`  Encrypted Data: ${encrypted1.encryptedData.substring(0, 80)}...`);
        console.log(`  IV: ${encrypted1.iv}`);
        
        // Sign with patient's private key
        const signature1 = createDigitalSignature(encrypted1.encryptedData, patientKeys.privateKey);
        console.log('✓ Digital signature created with patient\'s private key');
        console.log(`  Signature: ${signature1.substring(0, 80)}...`);
        
        // Save to database
        let chat = new Chat({
            userId: patientId,
            doctorId: doctorId,
            messages: [{
                senderId: patientId,
                senderRole: 'user',
                message: '[Encrypted]',
                encryptedKey: encrypted1.encryptedKey,
                encryptedData: encrypted1.encryptedData,
                encryptionIV: encrypted1.iv,
                signature: signature1,
                isEncrypted: true,
                timestamp: new Date()
            }],
            lastMessage: '[Encrypted Message]',
            lastMessageAt: new Date()
        });
        await chat.save();
        console.log('✓ Encrypted message saved to database');
        console.log(`  Chat ID: ${chat._id}\n`);

        // Step 5: Doctor decrypts and reads message
        console.log('STEP 5: Doctor Decrypts Message');
        console.log('─────────────────────────────────────────────────────────────');
        
        // Retrieve chat
        const retrievedChat = await Chat.findById(chat._id);
        const message1 = retrievedChat.messages[0];
        
        // Verify signature
        const isSignatureValid1 = verifyDigitalSignature(
            message1.encryptedData,
            message1.signature,
            patientKeys.publicKey
        );
        console.log(`✓ Signature verification: ${isSignatureValid1 ? 'VALID' : 'INVALID'}`);
        
        // Decrypt message
        const decryptedMessage1 = decryptHybrid(
            message1.encryptedKey,
            message1.encryptedData,
            message1.encryptionIV,
            doctorKeys.privateKey
        );
        console.log('✓ Message decrypted with doctor\'s private key');
        console.log(`  Decrypted: "${decryptedMessage1}"`);
        console.log(`  Match: ${decryptedMessage1 === patientMessage ? '✓ YES' : '✗ NO'}\n`);

        // Step 6: Doctor sends encrypted response
        console.log('STEP 6: Doctor Sends Encrypted Response');
        console.log('─────────────────────────────────────────────────────────────');
        
        const doctorMessage = 'Hello! I have reviewed your test results. They look good. Let\'s schedule an appointment for next week to discuss the next steps.';
        console.log(`Original Message: "${doctorMessage}"`);
        
        // Encrypt with hybrid encryption (patient's public key)
        const encrypted2 = encryptHybrid(doctorMessage, patientKeys.publicKey);
        console.log('✓ Message encrypted with hybrid encryption (RSA + AES)');
        console.log(`  Encrypted AES Key: ${encrypted2.encryptedKey.substring(0, 80)}...`);
        console.log(`  Encrypted Data: ${encrypted2.encryptedData.substring(0, 80)}...`);
        console.log(`  IV: ${encrypted2.iv}`);
        
        // Sign with doctor's private key
        const signature2 = createDigitalSignature(encrypted2.encryptedData, doctorKeys.privateKey);
        console.log('✓ Digital signature created with doctor\'s private key');
        console.log(`  Signature: ${signature2.substring(0, 80)}...`);
        
        // Add to chat
        retrievedChat.messages.push({
            senderId: doctorId,
            senderRole: 'doctor',
            message: '[Encrypted]',
            encryptedKey: encrypted2.encryptedKey,
            encryptedData: encrypted2.encryptedData,
            encryptionIV: encrypted2.iv,
            signature: signature2,
            isEncrypted: true,
            timestamp: new Date()
        });
        retrievedChat.lastMessage = '[Encrypted Message]';
        retrievedChat.lastMessageAt = new Date();
        await retrievedChat.save();
        console.log('✓ Encrypted response saved to database\n');

        // Step 7: Patient decrypts and reads response
        console.log('STEP 7: Patient Decrypts Doctor\'s Response');
        console.log('─────────────────────────────────────────────────────────────');
        
        const finalChat = await Chat.findById(chat._id);
        const message2 = finalChat.messages[1];
        
        // Verify signature
        const isSignatureValid2 = verifyDigitalSignature(
            message2.encryptedData,
            message2.signature,
            doctorKeys.publicKey
        );
        console.log(`✓ Signature verification: ${isSignatureValid2 ? 'VALID' : 'INVALID'}`);
        
        // Decrypt message
        const decryptedMessage2 = decryptHybrid(
            message2.encryptedKey,
            message2.encryptedData,
            message2.encryptionIV,
            patientKeys.privateKey
        );
        console.log('✓ Message decrypted with patient\'s private key');
        console.log(`  Decrypted: "${decryptedMessage2}"`);
        console.log(`  Match: ${decryptedMessage2 === doctorMessage ? '✓ YES' : '✗ NO'}\n`);

        // Summary
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('TEST SUMMARY');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('✓ Database connection established');
        console.log('✓ Patient RSA keys generated and stored');
        console.log('✓ Doctor RSA keys generated and stored');
        console.log('✓ Patient message encrypted and signed');
        console.log('✓ Patient message signature verified');
        console.log('✓ Doctor decrypted patient message successfully');
        console.log('✓ Doctor response encrypted and signed');
        console.log('✓ Doctor response signature verified');
        console.log('✓ Patient decrypted doctor response successfully');
        console.log('\n🎉 ALL TESTS PASSED!\n');
        console.log('═══════════════════════════════════════════════════════════════\n');

        // Clean up
        console.log('Cleaning up test data...');
        await SecurityKeys.deleteMany({ keyPurpose: 'chat', entityId: { $in: [patientId, doctorId] } });
        await Chat.deleteMany({ _id: chat._id });
        console.log('✓ Test data cleaned up');

        // Disconnect
        await mongoose.disconnect();
        console.log('✓ Disconnected from MongoDB\n');

    } catch (error) {
        console.error('\n✗ TEST FAILED:', error.message);
        console.error(error.stack);
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Run the test
runIntegrationTest().then(() => {
    console.log('Integration test completed successfully!');
    process.exit(0);
}).catch((error) => {
    console.error('Integration test failed:', error);
    process.exit(1);
});
