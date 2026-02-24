const mongoose = require('mongoose');

const drugSchema = new mongoose.Schema({
    brandName: {
        type: String,
        required: true,
        trim: true
    },
    genericName: {
        type: String,
        trim: true
    },
    NDC: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    dosage: {
        type: Number
    },
    expDate: {
        type: String,
        trim: true
    },
    supID: {
        type: String,
        trim: true
    },
    purchasePrice: {
        type: Number,
        default: 0
    },
    sellPrice: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Drug', drugSchema);
