const mongoose = require('mongoose');

/**
 * Document Model
 * Stores encrypted documents with security metadata
 */
const documentSchema = new mongoose.Schema({
    // Document metadata
    filename: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    
    // Encoded/Encrypted content
    content: {
        type: String,
        required: true // Base64 encoded content
    },
    
    // Security features
    encrypted: {
        type: Boolean,
        default: false
    },
    encryptionMethod: {
        type: String,
        enum: ['none', 'rsa', 'aes'],
        default: 'none'
    },
    
    // Reference to security keys
    securityKeysId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SecurityKeys',
        default: null
    },
    
    // Hash for integrity
    contentHash: {
        type: String,
        required: true
    },
    hashSalt: {
        type: String,
        required: true
    },
    
    // Digital signature
    signature: {
        type: String,
        default: null
    },
    signedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    
    // Document ownership
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Document type/category
    documentType: {
        type: String,
        default: 'general'
    },
    
    // Status
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Additional metadata
    description: {
        type: String,
        default: ''
    },
    tags: [{
        type: String
    }]
}, {
    timestamps: true
});

// Create indexes
documentSchema.index({ uploadedBy: 1 });
documentSchema.index({ documentType: 1 });
documentSchema.index({ isActive: 1 });
documentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Document', documentSchema);
