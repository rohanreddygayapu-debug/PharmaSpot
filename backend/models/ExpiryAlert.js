const mongoose = require('mongoose');

const expiryAlertSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    batchNumber: {
        type: String
    },
    expiryDate: {
        type: Date,
        required: true
    },
    quantity: {
        type: Number,
        default: 0
    },
    daysUntilExpiry: {
        type: Number,
        default: 0
    },
    alertLevel: {
        type: String,
        enum: ['critical', 'warning', 'info'],
        default: 'info'
    },
    status: {
        type: String,
        enum: ['active', 'resolved', 'dismissed'],
        default: 'active'
    },
    fefoRank: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

expiryAlertSchema.index({ expiryDate: 1 });
expiryAlertSchema.index({ status: 1 });
expiryAlertSchema.index({ fefoRank: 1 });

module.exports = mongoose.model('ExpiryAlert', expiryAlertSchema);
