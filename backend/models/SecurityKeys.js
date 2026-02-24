const mongoose = require('mongoose');

/**
 * Security Keys Model
 * Stores encryption keys, hashes, and signatures for the system
 */
const securityKeysSchema = new mongoose.Schema({
    // Entity reference (user, document, message, etc.)
    entityType: {
        type: String,
        required: true,
        enum: ['user', 'doctor', 'document', 'message', 'system']
    },
    entityId: {
        type: String,
        required: true
    },
    
    // RSA Keys
    // NOTE: Private keys should be encrypted at rest using encryptPrivateKey()
    // before storage and decrypted using decryptPrivateKey() when retrieved
    publicKey: {
        type: String,
        default: null
    },
    privateKey: {
        type: String,
        default: null
    },
    // IV for private key encryption (when encrypted at rest)
    privateKeyIV: {
        type: String,
        default: null
    },
    
    // Diffie-Hellman Keys for key exchange
    dhPublicKey: {
        type: String,
        default: null
    },
    dhPrivateKey: {
        type: String,
        default: null
    },
    dhPrime: {
        type: String,
        default: null
    },
    dhGenerator: {
        type: String,
        default: null
    },
    
    // Shared secrets from key exchange
    sharedSecret: {
        type: String,
        default: null
    },
    
    // Hash and Salt
    hash: {
        type: String,
        default: null
    },
    salt: {
        type: String,
        default: null
    },
    
    // Digital Signature
    signature: {
        type: String,
        default: null
    },
    signatureVerified: {
        type: Boolean,
        default: false
    },
    
    // AES encryption IV
    aesIV: {
        type: String,
        default: null
    },
    
    // Metadata
    keyPurpose: {
        type: String,
        default: 'general'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    expiresAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Create index for faster queries
securityKeysSchema.index({ entityType: 1, entityId: 1 });
securityKeysSchema.index({ isActive: 1 });

module.exports = mongoose.model('SecurityKeys', securityKeysSchema);
