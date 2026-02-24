const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderRole: {
        type: String,
        enum: ['user', 'doctor'],
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    // RSA + AES Hybrid Encryption fields
    isEncrypted: {
        type: Boolean,
        default: false
    },
    encryptedKey: {
        type: String,
        trim: true
    },
    encryptedData: {
        type: String,
        trim: true
    },
    encryptionIV: {
        type: String,
        trim: true
    },
    // Digital signature for message integrity
    signature: {
        type: String,
        trim: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    read: {
        type: Boolean,
        default: false
    }
});

const chatSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    messages: [messageSchema],
    lastMessage: {
        type: String,
        trim: true
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['active', 'closed'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Index for efficient queries
chatSchema.index({ userId: 1, doctorId: 1 });
chatSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model('Chat', chatSchema);
