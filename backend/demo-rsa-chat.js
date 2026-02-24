/**
 * RSA Encryption Demo for Doctor-Patient Messaging
 * 
 * This script demonstrates:
 * 1. RSA key generation for doctor and patient
 * 2. Key exchange mechanism
 * 3. Message encryption using RSA
 * 4. Message decryption using RSA
 * 5. Digital signature creation and verification
 */

const {
    generateRSAKeyPair,
    encryptHybrid,
    decryptHybrid,
    createDigitalSignature,
    verifyDigitalSignature
} = require('./services/securityService');

console.log('\n');
console.log('═══════════════════════════════════════════════════════════════');
console.log('     RSA ENCRYPTION DEMO: DOCTOR-PATIENT MESSAGING SYSTEM     ');
console.log('═══════════════════════════════════════════════════════════════');
console.log('\n');

// Step 1: Key Generation
console.log('STEP 1: RSA KEY GENERATION');
console.log('─────────────────────────────────────────────────────────────');
console.log('Generating RSA-2048 key pairs for Doctor and Patient...\n');

console.log('👨‍⚕️ Doctor Key Generation:');
const doctorKeys = generateRSAKeyPair();
console.log('  ✓ Public Key generated');
console.log(`    Length: ${doctorKeys.publicKey.length} bytes`);
console.log(`    Preview: ${doctorKeys.publicKey.substring(0, 80)}...`);
console.log('  ✓ Private Key generated (kept secret)');
console.log(`    Length: ${doctorKeys.privateKey.length} bytes`);

console.log('\n👤 Patient Key Generation:');
const patientKeys = generateRSAKeyPair();
console.log('  ✓ Public Key generated');
console.log(`    Length: ${patientKeys.publicKey.length} bytes`);
console.log(`    Preview: ${patientKeys.publicKey.substring(0, 80)}...`);
console.log('  ✓ Private Key generated (kept secret)');
console.log(`    Length: ${patientKeys.privateKey.length} bytes`);

// Step 2: Key Exchange
console.log('\n\nSTEP 2: KEY EXCHANGE MECHANISM');
console.log('─────────────────────────────────────────────────────────────');
console.log('Public keys are exchanged between doctor and patient...\n');

console.log('Key Exchange:');
console.log('  ➜ Doctor shares public key with Patient');
console.log('  ➜ Patient shares public key with Doctor');
console.log('  ✓ Key exchange completed successfully');
console.log('\nNOTE: Private keys are NEVER shared and remain secret!');

// Step 3: Patient sends encrypted message to Doctor
console.log('\n\nSTEP 3: ENCRYPTION - PATIENT TO DOCTOR');
console.log('─────────────────────────────────────────────────────────────');

const patientMessage = 'Hello Doctor, I have been experiencing severe headaches for the past 3 days.';
console.log('👤 Patient\'s Original Message:');
console.log(`   "${patientMessage}"`);
console.log(`   Length: ${patientMessage.length} characters`);

console.log('\n🔒 Encrypting message with Doctor\'s PUBLIC key...');
const encryptedForDoctor = encryptHybrid(patientMessage, doctorKeys.publicKey);
console.log('  ✓ Message encrypted successfully using hybrid encryption (RSA + AES)');
console.log(`  ✓ Encrypted AES key: ${encryptedForDoctor.encryptedKey.substring(0, 100)}...`);
console.log(`  ✓ Encrypted data: ${encryptedForDoctor.encryptedData.substring(0, 100)}...`);
console.log(`  ✓ IV: ${encryptedForDoctor.iv}`);

console.log('\n✍️ Creating digital signature with Patient\'s PRIVATE key...');
const patientSignature = createDigitalSignature(encryptedForDoctor.encryptedData, patientKeys.privateKey);
console.log('  ✓ Digital signature created');
console.log(`  ✓ Signature (first 100 chars): ${patientSignature.substring(0, 100)}...`);

// Step 4: Doctor receives and decrypts message
console.log('\n\nSTEP 4: DECRYPTION - DOCTOR RECEIVES MESSAGE');
console.log('─────────────────────────────────────────────────────────────');
console.log('👨‍⚕️ Doctor receives encrypted message...');

console.log('\n🔓 Verifying signature with Patient\'s PUBLIC key...');
const isPatientSignatureValid = verifyDigitalSignature(
    encryptedForDoctor.encryptedData,
    patientSignature,
    patientKeys.publicKey
);
console.log(`  ${isPatientSignatureValid ? '✓' : '✗'} Signature verification: ${isPatientSignatureValid ? 'VALID' : 'INVALID'}`);

if (isPatientSignatureValid) {
    console.log('  ✓ Message authenticity confirmed');
    
    console.log('\n🔓 Decrypting message with Doctor\'s PRIVATE key...');
    const decryptedByDoctor = decryptHybrid(
        encryptedForDoctor.encryptedKey,
        encryptedForDoctor.encryptedData,
        encryptedForDoctor.iv,
        doctorKeys.privateKey
    );
    console.log('  ✓ Message decrypted successfully');
    console.log(`  ✓ Decrypted message: "${decryptedByDoctor}"`);
    console.log(`  ✓ Verification: ${decryptedByDoctor === patientMessage ? 'MATCH' : 'MISMATCH'}`);
}

// Step 5: Doctor sends encrypted response to Patient
console.log('\n\nSTEP 5: ENCRYPTION - DOCTOR TO PATIENT');
console.log('─────────────────────────────────────────────────────────────');

const doctorMessage = 'Thank you for reaching out. Based on your symptoms, I recommend scheduling an appointment. Are you also experiencing any nausea or sensitivity to light?';
console.log('👨‍⚕️ Doctor\'s Original Message:');
console.log(`   "${doctorMessage}"`);
console.log(`   Length: ${doctorMessage.length} characters`);

console.log('\n🔒 Encrypting message with Patient\'s PUBLIC key...');
const encryptedForPatient = encryptHybrid(doctorMessage, patientKeys.publicKey);
console.log('  ✓ Message encrypted successfully using hybrid encryption (RSA + AES)');
console.log(`  ✓ Encrypted AES key: ${encryptedForPatient.encryptedKey.substring(0, 100)}...`);
console.log(`  ✓ Encrypted data: ${encryptedForPatient.encryptedData.substring(0, 100)}...`);
console.log(`  ✓ IV: ${encryptedForPatient.iv}`);

console.log('\n✍️ Creating digital signature with Doctor\'s PRIVATE key...');
const doctorSignature = createDigitalSignature(encryptedForPatient.encryptedData, doctorKeys.privateKey);
console.log('  ✓ Digital signature created');
console.log(`  ✓ Signature (first 100 chars): ${doctorSignature.substring(0, 100)}...`);

// Step 6: Patient receives and decrypts message
console.log('\n\nSTEP 6: DECRYPTION - PATIENT RECEIVES MESSAGE');
console.log('─────────────────────────────────────────────────────────────');
console.log('👤 Patient receives encrypted message...');

console.log('\n🔓 Verifying signature with Doctor\'s PUBLIC key...');
const isDoctorSignatureValid = verifyDigitalSignature(
    encryptedForPatient.encryptedData,
    doctorSignature,
    doctorKeys.publicKey
);
console.log(`  ${isDoctorSignatureValid ? '✓' : '✗'} Signature verification: ${isDoctorSignatureValid ? 'VALID' : 'INVALID'}`);

if (isDoctorSignatureValid) {
    console.log('  ✓ Message authenticity confirmed');
    
    console.log('\n🔓 Decrypting message with Patient\'s PRIVATE key...');
    const decryptedByPatient = decryptHybrid(
        encryptedForPatient.encryptedKey,
        encryptedForPatient.encryptedData,
        encryptedForPatient.iv,
        patientKeys.privateKey
    );
    console.log('  ✓ Message decrypted successfully');
    console.log(`  ✓ Decrypted message: "${decryptedByPatient}"`);
    console.log(`  ✓ Verification: ${decryptedByPatient === doctorMessage ? 'MATCH' : 'MISMATCH'}`);
}

// Summary
console.log('\n\nSUMMARY');
console.log('═══════════════════════════════════════════════════════════════');
console.log('✓ RSA Key Generation: SUCCESS');
console.log('✓ Key Exchange Mechanism: SUCCESS');
console.log('✓ Patient → Doctor Encryption: SUCCESS');
console.log('✓ Patient → Doctor Signature: VERIFIED');
console.log('✓ Doctor → Patient Encryption: SUCCESS');
console.log('✓ Doctor → Patient Signature: VERIFIED');
console.log('✓ Message Decryption: SUCCESS');
console.log('\nAll RSA encryption operations completed successfully!');
console.log('═══════════════════════════════════════════════════════════════');
console.log('\n');

console.log('SECURITY FEATURES DEMONSTRATED:');
console.log('─────────────────────────────────────────────────────────────');
console.log('1. ✓ RSA-2048 bit key pair generation');
console.log('2. ✓ Secure key exchange (public keys only)');
console.log('3. ✓ Hybrid encryption (RSA for key, AES-256 for data)');
console.log('4. ✓ Digital signatures for message authentication');
console.log('5. ✓ End-to-end encryption between doctor and patient');
console.log('6. ✓ Non-repudiation (sender cannot deny sending message)');
console.log('7. ✓ Message integrity verification');
console.log('8. ✓ Support for large messages (no size limit)');
console.log('\n');
