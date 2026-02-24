const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    fullname: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        enum: ['admin', 'worker', 'user', 'doctor'],
        default: 'user'
    },
    status: {
        type: String,
        default: 'Logged Out'
    },
    perm_products: {
        type: Number,
        default: 0
    },
    perm_categories: {
        type: Number,
        default: 0
    },
    perm_transactions: {
        type: Number,
        default: 0
    },
    perm_users: {
        type: Number,
        default: 0
    },
    perm_settings: {
        type: Number,
        default: 0
    },
    otpCode: {
        type: String,
        default: null
    },
    otpExpiry: {
        type: Date,
        default: null
    },
    otpAttempts: {
        type: Number,
        default: 0
    },
    otpBlockedUntil: {
        type: Date,
        default: null
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    // Security enhancements
    passwordSalt: {
        type: String,
        default: null
    },
    passwordHash: {
        type: String,
        default: null
    },
    // Reference to user's security keys
    securityKeysId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SecurityKeys',
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
