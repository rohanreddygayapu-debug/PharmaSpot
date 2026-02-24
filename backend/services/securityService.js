const crypto = require('crypto');

/**
 * Security Service
 * Provides encryption, hashing, digital signatures, and key management
 */

// RSA Configuration
const RSA_KEY_SIZE = 2048;
const RSA_PUBLIC_EXPONENT = 65537;

// Hashing Configuration
const HASH_ALGORITHM = 'sha256';
const SALT_LENGTH = 16; // 16 bytes = 128 bits

/**
 * Generate a cryptographically secure random salt
 * @param {number} length - Length of salt in bytes (default: 16)
 * @returns {string} - Hex encoded salt
 */
function generateSalt(length = SALT_LENGTH) {
    return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash data with salt using SHA-256
 * @param {string} data - Data to hash
 * @param {string} salt - Salt to use (if not provided, generates new one)
 * @returns {Object} - Object containing hash and salt
 */
function hashWithSalt(data, salt = null) {
    if (!salt) {
        salt = generateSalt();
    }
    
    const hash = crypto.createHash(HASH_ALGORITHM)
        .update(data + salt)
        .digest('hex');
    
    return { hash, salt };
}

/**
 * Verify hashed data with salt
 * @param {string} data - Original data
 * @param {string} hash - Hash to verify against
 * @param {string} salt - Salt used in hashing
 * @returns {boolean} - True if data matches hash
 */
function verifyHash(data, hash, salt) {
    const { hash: computedHash } = hashWithSalt(data, salt);
    return computedHash === hash;
}

/**
 * Generate RSA key pair
 * @returns {Object} - Object containing publicKey and privateKey in PEM format
 */
function generateRSAKeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: RSA_KEY_SIZE,
        publicExponent: RSA_PUBLIC_EXPONENT,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });
    
    return { publicKey, privateKey };
}

/**
 * Encrypt data using RSA public key
 * Note: RSA can only encrypt small amounts of data (up to 190 bytes for RSA-2048 with OAEP)
 * For longer messages, use hybrid encryption (encryptHybrid)
 * @param {string} data - Data to encrypt (max 190 bytes)
 * @param {string} publicKey - RSA public key in PEM format
 * @returns {string} - Base64 encoded encrypted data
 */
function encryptRSA(data, publicKey) {
    const buffer = Buffer.from(data, 'utf8');
    const encrypted = crypto.publicEncrypt(
        {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
        },
        buffer
    );
    return encrypted.toString('base64');
}

/**
 * Decrypt data using RSA private key
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @param {string} privateKey - RSA private key in PEM format
 * @returns {string} - Decrypted data
 */
function decryptRSA(encryptedData, privateKey) {
    const buffer = Buffer.from(encryptedData, 'base64');
    const decrypted = crypto.privateDecrypt(
        {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
        },
        buffer
    );
    return decrypted.toString('utf8');
}

/**
 * Hybrid encryption: RSA + AES for large messages
 * Uses AES-256 for message encryption and RSA for key encryption
 * @param {string} data - Data to encrypt (any length)
 * @param {string} publicKey - RSA public key in PEM format
 * @returns {Object} - Object containing encrypted AES key, IV, and encrypted data
 */
function encryptHybrid(data, publicKey) {
    // Generate random AES key
    const aesKey = crypto.randomBytes(32); // 256-bit key
    const iv = crypto.randomBytes(16);
    
    // Encrypt data with AES
    const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv);
    let encryptedData = cipher.update(data, 'utf8', 'base64');
    encryptedData += cipher.final('base64');
    
    // Encrypt AES key with RSA
    const encryptedKey = crypto.publicEncrypt(
        {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
        },
        aesKey
    ).toString('base64');
    
    return {
        encryptedKey,
        encryptedData,
        iv: iv.toString('base64')
    };
}

/**
 * Hybrid decryption: RSA + AES for large messages
 * @param {string} encryptedKey - Base64 encoded encrypted AES key
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @param {string} iv - Base64 encoded initialization vector
 * @param {string} privateKey - RSA private key in PEM format
 * @returns {string} - Decrypted data
 */
function decryptHybrid(encryptedKey, encryptedData, iv, privateKey) {
    // Decrypt AES key with RSA
    const aesKey = crypto.privateDecrypt(
        {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
        },
        Buffer.from(encryptedKey, 'base64')
    );
    
    // Decrypt data with AES
    const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        aesKey,
        Buffer.from(iv, 'base64')
    );
    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
}

/**
 * Create digital signature using private key
 * @param {string} data - Data to sign
 * @param {string} privateKey - RSA private key in PEM format
 * @returns {string} - Base64 encoded signature
 */
function createDigitalSignature(data, privateKey) {
    const sign = crypto.createSign('SHA256');
    sign.update(data);
    sign.end();
    const signature = sign.sign(privateKey);
    return signature.toString('base64');
}

/**
 * Verify digital signature using public key
 * @param {string} data - Original data
 * @param {string} signature - Base64 encoded signature
 * @param {string} publicKey - RSA public key in PEM format
 * @returns {boolean} - True if signature is valid
 */
function verifyDigitalSignature(data, signature, publicKey) {
    const verify = crypto.createVerify('SHA256');
    verify.update(data);
    verify.end();
    return verify.verify(publicKey, Buffer.from(signature, 'base64'));
}

/**
 * Generate Diffie-Hellman parameters for key exchange
 * @returns {Object} - DH parameters and keys
 */
function generateDHKeyExchange() {
    const dh = crypto.createDiffieHellman(2048);
    const publicKey = dh.generateKeys('base64');
    const privateKey = dh.getPrivateKey('base64');
    const prime = dh.getPrime('base64');
    const generator = dh.getGenerator('base64');
    
    return {
        publicKey,
        privateKey,
        prime,
        generator
    };
}

/**
 * Compute shared secret using Diffie-Hellman
 * @param {string} privateKey - Your private key (base64)
 * @param {string} otherPublicKey - Other party's public key (base64)
 * @param {string} prime - Prime number (base64)
 * @param {string} generator - Generator (base64)
 * @returns {string} - Shared secret (base64)
 */
function computeDHSharedSecret(privateKey, otherPublicKey, prime, generator) {
    const dh = crypto.createDiffieHellman(
        Buffer.from(prime, 'base64'),
        Buffer.from(generator, 'base64')
    );
    dh.setPrivateKey(Buffer.from(privateKey, 'base64'));
    dh.generateKeys();
    
    const sharedSecret = dh.computeSecret(Buffer.from(otherPublicKey, 'base64'));
    return sharedSecret.toString('base64');
}

/**
 * Encode data to Base64
 * @param {string|Buffer} data - Data to encode
 * @returns {string} - Base64 encoded data
 */
function encodeBase64(data) {
    if (Buffer.isBuffer(data)) {
        return data.toString('base64');
    }
    return Buffer.from(data).toString('base64');
}

/**
 * Decode Base64 data
 * @param {string} base64Data - Base64 encoded data
 * @returns {Buffer} - Decoded buffer
 */
function decodeBase64(base64Data) {
    return Buffer.from(base64Data, 'base64');
}

/**
 * Encrypt data using AES-256-CBC with a key
 * @param {string} data - Data to encrypt
 * @param {string} key - Encryption key (must be 32 bytes for AES-256)
 * @returns {Object} - Object containing encrypted data and IV
 */
function encryptAES(data, key) {
    // Ensure key is 32 bytes
    const keyBuffer = crypto.createHash('sha256').update(key).digest();
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    return {
        encrypted,
        iv: iv.toString('base64')
    };
}

/**
 * Decrypt AES encrypted data
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @param {string} key - Decryption key
 * @param {string} iv - Initialization vector (base64)
 * @returns {string} - Decrypted data
 */
function decryptAES(encryptedData, key, iv) {
    const keyBuffer = crypto.createHash('sha256').update(key).digest();
    const ivBuffer = Buffer.from(iv, 'base64');
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, ivBuffer);
    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
}

/**
 * Log security operation to console (for terminal display)
 * @param {string} operation - Operation name
 * @param {Object} details - Operation details
 */
function logSecurityOperation(operation, details) {
    // Only log in development or if explicitly enabled
    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_SECURITY_LOGS !== 'true') {
        return;
    }
    
    console.log('\n========== SECURITY OPERATION ==========');
    console.log(`Operation: ${operation}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('Details:', JSON.stringify(details, null, 2));
    console.log('========================================\n');
}

/**
 * Get master encryption key from environment or generate default
 * WARNING: In production, use a secure key management system
 * @returns {string} - Master encryption key
 */
function getMasterKey() {
    const key = process.env.MASTER_ENCRYPTION_KEY;
    
    // In production, require a proper master key
    if (process.env.NODE_ENV === 'production' && (!key || key === 'default-master-key-change-in-production')) {
        throw new Error('MASTER_ENCRYPTION_KEY must be set in production environment. Generate one with: openssl rand -base64 32');
    }
    
    // In development, allow default but warn
    if (!key) {
        console.warn('WARNING: Using default master key. Set MASTER_ENCRYPTION_KEY in .env file for production!');
        return 'default-master-key-change-in-production';
    }
    
    return key;
}

/**
 * Encrypt private key for database storage
 * @param {string} privateKey - Private key to encrypt
 * @returns {Object} - Encrypted key and IV
 */
function encryptPrivateKey(privateKey) {
    const masterKey = getMasterKey();
    return encryptAES(privateKey, masterKey);
}

/**
 * Decrypt private key from database
 * @param {string} encryptedKey - Encrypted private key
 * @param {string} iv - Initialization vector
 * @returns {string} - Decrypted private key
 */
function decryptPrivateKey(encryptedKey, iv) {
    const masterKey = getMasterKey();
    return decryptAES(encryptedKey, masterKey, iv);
}

module.exports = {
    // Hashing with Salt
    generateSalt,
    hashWithSalt,
    verifyHash,
    
    // RSA Encryption/Decryption
    generateRSAKeyPair,
    encryptRSA,
    decryptRSA,
    
    // Hybrid Encryption (RSA + AES for large messages)
    encryptHybrid,
    decryptHybrid,
    
    // Digital Signatures
    createDigitalSignature,
    verifyDigitalSignature,
    
    // Key Exchange (Diffie-Hellman)
    generateDHKeyExchange,
    computeDHSharedSecret,
    
    // AES Encryption (for symmetric encryption)
    encryptAES,
    decryptAES,
    
    // Base64 Encoding/Decoding
    encodeBase64,
    decodeBase64,
    
    // Private Key Protection
    encryptPrivateKey,
    decryptPrivateKey,
    
    // Logging
    logSecurityOperation
};
