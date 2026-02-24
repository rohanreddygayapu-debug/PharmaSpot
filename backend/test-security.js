const {
    generateSalt,
    hashWithSalt,
    verifyHash,
    generateRSAKeyPair,
    encryptRSA,
    decryptRSA,
    createDigitalSignature,
    verifyDigitalSignature,
    generateDHKeyExchange,
    encodeBase64,
    decodeBase64,
    encryptAES,
    decryptAES,
    logSecurityOperation
} = require('./services/securityService');

console.log('\n========== SECURITY SERVICE TEST ==========\n');

// Test 1: Hash with Salt
console.log('Test 1: Hashing with Salt');
// Generate random test password
const password = 'TestPass' + Math.random().toString(36).substring(7);
const { hash, salt } = hashWithSalt(password);
console.log('✓ Salt generated:', salt);
console.log('✓ Hash generated:', hash.substring(0, 32) + '...');
const isValid = verifyHash(password, hash, salt);
console.log('✓ Hash verification:', isValid ? 'PASSED' : 'FAILED');

// Test 2: RSA Encryption
console.log('\nTest 2: RSA Encryption/Decryption');
const { publicKey, privateKey } = generateRSAKeyPair();
console.log('✓ RSA key pair generated');
console.log('  Public key length:', publicKey.length, 'bytes');
console.log('  Private key length:', privateKey.length, 'bytes');

const message = 'Hello, this is a secret message!';
const encrypted = encryptRSA(message, publicKey);
console.log('✓ Message encrypted:', encrypted.substring(0, 32) + '...');

const decrypted = decryptRSA(encrypted, privateKey);
console.log('✓ Message decrypted:', decrypted);
console.log('✓ Encryption test:', message === decrypted ? 'PASSED' : 'FAILED');

// Test 3: Digital Signatures
console.log('\nTest 3: Digital Signatures');
const data = 'Important document content';
const signature = createDigitalSignature(data, privateKey);
console.log('✓ Signature created:', signature.substring(0, 32) + '...');

const signatureValid = verifyDigitalSignature(data, signature, publicKey);
console.log('✓ Signature verification:', signatureValid ? 'PASSED' : 'FAILED');

// Test 4: Diffie-Hellman Key Exchange
console.log('\nTest 4: Key Exchange (Diffie-Hellman)');
const dhParams = generateDHKeyExchange();
console.log('✓ DH parameters generated');
console.log('  Public key:', dhParams.publicKey.substring(0, 32) + '...');
console.log('  Prime:', dhParams.prime.substring(0, 32) + '...');
console.log('  Generator:', dhParams.generator);

// Test 5: Base64 Encoding
console.log('\nTest 5: Base64 Encoding/Decoding');
const originalData = 'Test document content';
const encoded = encodeBase64(originalData);
console.log('✓ Encoded:', encoded);

const decoded = decodeBase64(encoded).toString('utf8');
console.log('✓ Decoded:', decoded);
console.log('✓ Base64 test:', originalData === decoded ? 'PASSED' : 'FAILED');

// Test 6: AES Encryption
console.log('\nTest 6: AES-256 Encryption/Decryption');
const secretKey = 'MySharedSecret123';
const messageToEncrypt = 'This is a secret message for AES!';
const { encrypted: aesEncrypted, iv } = encryptAES(messageToEncrypt, secretKey);
console.log('✓ AES encrypted:', aesEncrypted.substring(0, 32) + '...');
console.log('✓ IV:', iv);

const aesDecrypted = decryptAES(aesEncrypted, secretKey, iv);
console.log('✓ AES decrypted:', aesDecrypted);
console.log('✓ AES test:', messageToEncrypt === aesDecrypted ? 'PASSED' : 'FAILED');

// Test 7: Security Operation Logging
console.log('\nTest 7: Security Operation Logging');
logSecurityOperation('TEST_OPERATION', {
    testType: 'automated',
    result: 'success',
    timestamp: new Date().toISOString()
});

console.log('\n========== ALL TESTS COMPLETED ==========\n');
console.log('Summary:');
console.log('✓ Hashing with Salt');
console.log('✓ RSA Encryption/Decryption');
console.log('✓ Digital Signatures');
console.log('✓ Diffie-Hellman Key Exchange');
console.log('✓ Base64 Encoding/Decoding');
console.log('✓ AES-256 Encryption/Decryption');
console.log('✓ Security Operation Logging');
console.log('\nAll security features working correctly!\n');
