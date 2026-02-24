const mongoose = require('mongoose');

const autoReorderSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier'
    },
    supplierName: {
        type: String
    },
    reorderLevel: {
        type: Number,
        required: true,
        default: 10
    },
    reorderQuantity: {
        type: Number,
        required: true,
        default: 50
    },
    currentStock: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['pending', 'ordered', 'received', 'cancelled'],
        default: 'pending'
    },
    orderDate: {
        type: Date
    },
    expectedDelivery: {
        type: Date
    },
    notificationSent: {
        type: Boolean,
        default: false
    },
    autoOrder: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

autoReorderSchema.index({ productId: 1 });
autoReorderSchema.index({ status: 1 });
autoReorderSchema.index({ autoOrder: 1 });

module.exports = mongoose.model('AutoReorder', autoReorderSchema);
