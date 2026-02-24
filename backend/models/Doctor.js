const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    physID: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    specialization: {
        type: String,
        trim: true
    },
    qualification: {
        type: String,
        trim: true
    },
    experience: {
        type: Number,
        default: 0
    },
    licenseNumber: {
        type: String,
        trim: true
    },
    documents: [{
        name: {
            type: String,
            required: true
        },
        documentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Document',
            required: true
        },
        type: {
            type: String,
            enum: ['license', 'degree', 'certificate', 'other'],
            default: 'other'
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    verified: {
        type: Boolean,
        default: false
    },
    verificationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    verifiedAt: {
        type: Date
    },
    rejectionReason: {
        type: String,
        trim: true
    },
    availability: [{
        day: {
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        },
        startTime: String,
        endTime: String
    }],
    consultationFee: {
        type: Number,
        default: 0
    },
    bio: {
        type: String,
        trim: true
    },
    profileImage: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Doctor', doctorSchema);
