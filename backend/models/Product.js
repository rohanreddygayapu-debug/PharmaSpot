const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    barcode: {
        type: String,
        trim: true,
        index: true
    },
    sku: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        default: 0
    },
    cost: {
        type: Number,
        default: 0
    },
    stock: {
        type: Number,
        default: 0
    },
    quantity: {
        type: Number,
        default: 0
    },
    minStock: {
        type: Number,
        default: 0
    },
    reorder: {
        type: Number,
        default: 0
    },
    expiryDate: {
        type: Date
    },
    description: {
        type: String,
        trim: true
    },
    image: {
        type: String,
        trim: true
    },
    unit: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

productSchema.index({ barcode: 1 });
productSchema.index({ sku: 1 });

module.exports = mongoose.model('Product', productSchema);
