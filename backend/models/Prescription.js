const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
    patientID: {
        type: String,
        required: true,
        trim: true
    },
    physID: {
        type: String,
        required: true,
        trim: true
    },
    NDC: {
        type: String,
        required: true,
        trim: true
    },
    qty: {
        type: Number,
        default: 0
    },
    days: {
        type: Number,
        default: 0
    },
    refills: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Prescription', prescriptionSchema);
