const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        unique: true,
        sparse: true
    },
    ref_number: {
        type: String,
        default: ""
    },
    items: [{
        productId: {
            // Accept both ObjectId and String for flexibility with mock data
            // In production with MongoDB, this should be ObjectId
            type: mongoose.Schema.Types.Mixed,
            required: true,
            validate: {
                validator: function(v) {
                    // Allow ObjectId or string values
                    return v && (typeof v === 'string' || mongoose.Types.ObjectId.isValid(v));
                },
                message: 'productId must be a valid ObjectId or string'
            }
        },
        name: String,
        quantity: Number,
        price: Number,
        cost: Number,
        total: Number
    }],
    subtotal: {
        type: Number,
        default: 0
    },
    tax: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        default: 0
    },
    payment: {
        type: Number,
        default: 0
    },
    change: {
        type: Number,
        default: 0
    },
    paymentMethod: {
        type: String,
        default: 'cash'
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
    },
    customer: {
        type: String,
        default: "0"
    },
    customerInfo: {
        name: {
            type: String,
            trim: true
        },
        phone: {
            type: String,
            trim: true
        },
        email: {
            type: String,
            trim: true
        }
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    user: {
        type: String
    },
    till: {
        type: String
    },
    status: {
        type: String,
        default: 'completed',
        enum: ['completed', 'pending', 'on-hold', 'cancelled']
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ ref_number: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
