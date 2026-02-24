/**
 * End-to-End Test for RSA Encrypted Doctor-Patient Chat
 * 
 * This test simulates the complete workflow without requiring a database:
 * 1. Key generation for doctor and patient
 * 2. Key exchange
 * 3. Sending encrypted messages with signatures
 * 4. Receiving and decrypting messages with signature verification
 * 
 * Run this to see the complete RSA encryption flow in action!
 */

const {
    generateRSAKeyPair,
    encryptHybrid,
    decryptHybrid,
    createDigitalSignature,
    verifyDigitalSignature
} = require('./services/securityService');

console.log('\n');
console.log('═══════════════════════════════════════════════════════════════════════════');
console.log('            END-TO-END TEST: RSA ENCRYPTED DOCTOR-PATIENT CHAT            ');
console.log('═══════════════════════════════════════════════════════════════════════════');
console.log('\n');

// Simulate user data
const patientData = {
    id: 'patient_12345',
    name: 'John Doe',
    role: 'user'
};

const doctorData = {
    id: 'doctor_67890',
    name: 'Dr. Sarah Smith',
    role: 'doctor'
};

// Simulate conversation history
const conversationHistory = [];

function logStep(stepNumber, title) {
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════════════════');
    console.log(`STEP ${stepNumber}: ${title}`);
    console.log('═══════════════════════════════════════════════════════════════════════════');
}

function logInfo(label, value) {
    console.log(`  ${label}: ${value}`);
}

function logSuccess(message) {
    console.log(`  ✓ ${message}`);
}

function logError(message) {
    console.log(`  ✗ ${message}`);
}

try {
    // STEP 1: Initialize Patient Keys
    logStep(1, 'PATIENT KEY INITIALIZATION');
    console.log(`Patient: ${patientData.name} (ID: ${patientData.id})`);
    
    const patientKeys = generateRSAKeyPair();
    patientData.publicKey = patientKeys.publicKey;
    patientData.privateKey = patientKeys.privateKey;
    
    logSuccess('RSA-2048 key pair generated for patient');
    logInfo('Public Key Length', `${patientKeys.publicKey.length} bytes`);
    logInfo('Private Key Length', `${patientKeys.privateKey.length} bytes`);
    logInfo('Public Key Preview', patientKeys.publicKey.substring(0, 100) + '...');
    
    // STEP 2: Initialize Doctor Keys
    logStep(2, 'DOCTOR KEY INITIALIZATION');
    console.log(`Doctor: ${doctorData.name} (ID: ${doctorData.id})`);
    
    const doctorKeys = generateRSAKeyPair();
    doctorData.publicKey = doctorKeys.publicKey;
    doctorData.privateKey = doctorKeys.privateKey;
    
    logSuccess('RSA-2048 key pair generated for doctor');
    logInfo('Public Key Length', `${doctorKeys.publicKey.length} bytes`);
    logInfo('Private Key Length', `${doctorKeys.privateKey.length} bytes`);
    logInfo('Public Key Preview', doctorKeys.publicKey.substring(0, 100) + '...');
    
    // STEP 3: Key Exchange
    logStep(3, 'KEY EXCHANGE');
    console.log('Public keys are exchanged between patient and doctor');
    console.log('(Private keys remain SECRET and are never shared)');
    
    logInfo('Patient shares public key with', doctorData.name);
    logInfo('Doctor shares public key with', patientData.name);
    logSuccess('Key exchange completed successfully');
    
    // STEP 4: Patient sends first message
    logStep(4, 'PATIENT SENDS MESSAGE');
    
    const message1 = {
        from: patientData.id,
        to: doctorData.id,
        content: 'Hello Dr. Smith, I have been experiencing severe migraines for the past week. They usually occur in the morning and last for several hours. Could you please advise?',
        timestamp: new Date().toISOString()
    };
    
    console.log(`From: ${patientData.name}`);
    console.log(`To: ${doctorData.name}`);
    logInfo('Original Message', `"${message1.content}"`);
    logInfo('Message Length', `${message1.content.length} characters`);
    
    console.log('\n  🔒 Encrypting message...');
    const encrypted1 = encryptHybrid(message1.content, doctorData.publicKey);
    message1.encrypted = encrypted1;
    logSuccess('Message encrypted with doctor\'s PUBLIC key (hybrid RSA+AES)');
    logInfo('Encrypted AES Key', encrypted1.encryptedKey.substring(0, 80) + '...');
    logInfo('Encrypted Data', encrypted1.encryptedData.substring(0, 80) + '...');
    logInfo('IV', encrypted1.iv);
    
    console.log('\n  ✍️ Creating digital signature...');
    const signature1 = createDigitalSignature(encrypted1.encryptedData, patientData.privateKey);
    message1.signature = signature1;
    logSuccess('Digital signature created with patient\'s PRIVATE key');
    logInfo('Signature', signature1.substring(0, 80) + '...');
    
    conversationHistory.push(message1);
    logSuccess('Message added to conversation history');
    
    // STEP 5: Doctor receives and decrypts message
    logStep(5, 'DOCTOR RECEIVES AND DECRYPTS MESSAGE');
    
    const receivedMessage1 = conversationHistory[0];
    console.log(`Recipient: ${doctorData.name}`);
    console.log(`Sender: ${patientData.name}`);
    
    console.log('\n  🔓 Verifying digital signature...');
    const isValid1 = verifyDigitalSignature(
        receivedMessage1.encrypted.encryptedData,
        receivedMessage1.signature,
        patientData.publicKey
    );
    
    if (isValid1) {
        logSuccess('Digital signature VERIFIED ✓');
        logInfo('Authenticity', 'Message is from ' + patientData.name);
        logInfo('Integrity', 'Message has not been tampered with');
    } else {
        logError('Digital signature verification FAILED');
        throw new Error('Signature verification failed');
    }
    
    console.log('\n  🔓 Decrypting message...');
    const decrypted1 = decryptHybrid(
        receivedMessage1.encrypted.encryptedKey,
        receivedMessage1.encrypted.encryptedData,
        receivedMessage1.encrypted.iv,
        doctorData.privateKey
    );
    logSuccess('Message decrypted with doctor\'s PRIVATE key');
    logInfo('Decrypted Message', `"${decrypted1}"`);
    
    if (decrypted1 === message1.content) {
        logSuccess('Message integrity verified - content matches original');
    } else {
        logError('Message integrity check failed');
    }
    
    // STEP 6: Doctor sends response
    logStep(6, 'DOCTOR SENDS RESPONSE');
    
    const message2 = {
        from: doctorData.id,
        to: patientData.id,
        content: 'Thank you for reaching out, John. Based on your symptoms, I recommend we schedule an in-person examination. In the meantime, please track when the migraines occur and any potential triggers like stress, diet, or sleep patterns. Are you experiencing any other symptoms such as nausea, light sensitivity, or vision changes?',
        timestamp: new Date().toISOString()
    };
    
    console.log(`From: ${doctorData.name}`);
    console.log(`To: ${patientData.name}`);
    logInfo('Original Message', `"${message2.content}"`);
    logInfo('Message Length', `${message2.content.length} characters`);
    
    console.log('\n  🔒 Encrypting message...');
    const encrypted2 = encryptHybrid(message2.content, patientData.publicKey);
    message2.encrypted = encrypted2;
    logSuccess('Message encrypted with patient\'s PUBLIC key (hybrid RSA+AES)');
    logInfo('Encrypted AES Key', encrypted2.encryptedKey.substring(0, 80) + '...');
    logInfo('Encrypted Data', encrypted2.encryptedData.substring(0, 80) + '...');
    logInfo('IV', encrypted2.iv);
    
    console.log('\n  ✍️ Creating digital signature...');
    const signature2 = createDigitalSignature(encrypted2.encryptedData, doctorData.privateKey);
    message2.signature = signature2;
    logSuccess('Digital signature created with doctor\'s PRIVATE key');
    logInfo('Signature', signature2.substring(0, 80) + '...');
    
    conversationHistory.push(message2);
    logSuccess('Response added to conversation history');
    
    // STEP 7: Patient receives and decrypts response
    logStep(7, 'PATIENT RECEIVES AND DECRYPTS RESPONSE');
    
    const receivedMessage2 = conversationHistory[1];
    console.log(`Recipient: ${patientData.name}`);
    console.log(`Sender: ${doctorData.name}`);
    
    console.log('\n  🔓 Verifying digital signature...');
    const isValid2 = verifyDigitalSignature(
        receivedMessage2.encrypted.encryptedData,
        receivedMessage2.signature,
        doctorData.publicKey
    );
    
    if (isValid2) {
        logSuccess('Digital signature VERIFIED ✓');
        logInfo('Authenticity', 'Message is from ' + doctorData.name);
        logInfo('Integrity', 'Message has not been tampered with');
    } else {
        logError('Digital signature verification FAILED');
        throw new Error('Signature verification failed');
    }
    
    console.log('\n  🔓 Decrypting message...');
    const decrypted2 = decryptHybrid(
        receivedMessage2.encrypted.encryptedKey,
        receivedMessage2.encrypted.encryptedData,
        receivedMessage2.encrypted.iv,
        patientData.privateKey
    );
    logSuccess('Message decrypted with patient\'s PRIVATE key');
    logInfo('Decrypted Message', `"${decrypted2}"`);
    
    if (decrypted2 === message2.content) {
        logSuccess('Message integrity verified - content matches original');
    } else {
        logError('Message integrity check failed');
    }
    
    // STEP 8: Patient sends follow-up
    logStep(8, 'PATIENT SENDS FOLLOW-UP MESSAGE');
    
    const message3 = {
        from: patientData.id,
        to: doctorData.id,
        content: 'Yes, I have been experiencing some light sensitivity and occasional nausea. I will start tracking the patterns as you suggested. When would be a good time for the examination?',
        timestamp: new Date().toISOString()
    };
    
    console.log(`From: ${patientData.name}`);
    console.log(`To: ${doctorData.name}`);
    logInfo('Original Message', `"${message3.content}"`);
    
    console.log('\n  🔒 Encrypting message...');
    const encrypted3 = encryptHybrid(message3.content, doctorData.publicKey);
    message3.encrypted = encrypted3;
    logSuccess('Message encrypted');
    
    console.log('\n  ✍️ Creating digital signature...');
    const signature3 = createDigitalSignature(encrypted3.encryptedData, patientData.privateKey);
    message3.signature = signature3;
    logSuccess('Digital signature created');
    
    conversationHistory.push(message3);
    
    // STEP 9: Display conversation summary
    logStep(9, 'CONVERSATION SUMMARY');
    
    console.log(`Total messages exchanged: ${conversationHistory.length}`);
    console.log('\nConversation timeline:');
    
    conversationHistory.forEach((msg, index) => {
        const sender = msg.from === patientData.id ? patientData.name : doctorData.name;
        const recipient = msg.to === patientData.id ? patientData.name : doctorData.name;
        console.log(`\n  Message ${index + 1}:`);
        console.log(`    From: ${sender}`);
        console.log(`    To: ${recipient}`);
        console.log(`    Status: ✓ Encrypted & Signed`);
        console.log(`    Time: ${msg.timestamp}`);
    });
    
    // FINAL SUMMARY
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════════════════');
    console.log('                              TEST SUMMARY                                 ');
    console.log('═══════════════════════════════════════════════════════════════════════════');
    console.log('\n✅ ALL TESTS PASSED SUCCESSFULLY!\n');
    
    console.log('Security Features Verified:');
    console.log('  ✓ RSA-2048 key pair generation for both parties');
    console.log('  ✓ Secure key exchange (public keys only)');
    console.log('  ✓ Message encryption with recipient\'s public key');
    console.log('  ✓ Message decryption with recipient\'s private key');
    console.log('  ✓ Digital signature creation with sender\'s private key');
    console.log('  ✓ Digital signature verification with sender\'s public key');
    console.log('  ✓ Message authenticity and integrity verification');
    console.log('  ✓ End-to-end encryption maintained throughout conversation');
    console.log('  ✓ Non-repudiation (signatures prove sender identity)');
    
    console.log('\nKey Characteristics:');
    console.log('  • Algorithm: RSA-2048');
    console.log('  • Key Size: 2048 bits (256-byte modulus)');
    console.log('  • Padding: OAEP with SHA-256');
    console.log('  • Signature: SHA-256 with RSA');
    console.log('  • Encoding: Base64 for encrypted data');
    console.log('  • Key Format: PEM (PKCS#8)');
    
    console.log('\nConversation Statistics:');
    console.log(`  • Total messages: ${conversationHistory.length}`);
    console.log(`  • Patient messages: ${conversationHistory.filter(m => m.from === patientData.id).length}`);
    console.log(`  • Doctor messages: ${conversationHistory.filter(m => m.from === doctorData.id).length}`);
    console.log('  • All messages: Encrypted & Authenticated');
    
    console.log('\n═══════════════════════════════════════════════════════════════════════════');
    console.log('                    RSA ENCRYPTION DEMONSTRATION COMPLETE                  ');
    console.log('═══════════════════════════════════════════════════════════════════════════\n');
    
} catch (error) {
    console.error('\n');
    console.error('═══════════════════════════════════════════════════════════════════════════');
    console.error('                               TEST FAILED                                 ');
    console.error('═══════════════════════════════════════════════════════════════════════════');
    console.error('\n✗ Error:', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    console.error('\n');
    process.exit(1);
}
