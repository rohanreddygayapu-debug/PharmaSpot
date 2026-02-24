const app = require("express")();
const Doctor = require("../models/Doctor");
const User = require("../models/User");
const mockData = require("../config/mockData");

module.exports = app;

// Get all doctors
app.get("/", async function (req, res) {
    try {
        let doctors;
        try {
            doctors = await Doctor.find({}).populate('userId', 'username email');
        } catch (dbError) {
            console.log('Database not available, using mock data');
            doctors = mockData.doctors;
        }
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get verified doctors only
app.get("/verified", async function (req, res) {
    try {
        const doctors = await Doctor.find({ verified: true }).populate('userId', 'username email');
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get pending doctors for admin approval
app.get("/pending", async function (req, res) {
    try {
        const doctors = await Doctor.find({ verificationStatus: 'pending' })
            .populate('userId', 'username email')
            .populate('documents.documentId', 'originalName mimeType size encrypted createdAt');
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get doctor by ID
app.get("/:id", async function (req, res) {
    try {
        const doctor = await Doctor.findById(req.params.id)
            .populate('userId', 'username email')
            .populate('documents.documentId', 'originalName mimeType size encrypted createdAt');
        if (!doctor) {
            return res.status(404).json({ error: "Doctor not found" });
        }
        res.json(doctor);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get doctor by user ID
app.get("/user/:userId", async function (req, res) {
    try {
        // Check if it's a mock doctor user first
        if (req.params.userId === 'mock_user_doctor') {
            const mockDoctor = {
                _id: 'mock_doctor_profile',
                userId: req.params.userId,
                name: 'Dr. Sarah Johnson',
                email: 'sarah.johnson@hospital.com',
                phone: '(555) 123-4567',
                address: '123 Medical Plaza, Healthcare City',
                specialization: 'Internal Medicine',
                qualification: 'MD, MBBS',
                experience: 10,
                licenseNumber: 'MED-12345-2015',
                consultationFee: 150,
                verified: true,
                verificationStatus: 'approved',
                bio: 'Experienced internal medicine specialist with over 10 years of clinical practice.',
            };
            return res.json(mockDoctor);
        }
        
        const doctor = await Doctor.findOne({ userId: req.params.userId }).populate('userId', 'username email');
        if (!doctor) {
            return res.status(404).json({ error: "Doctor profile not found" });
        }
        res.json(doctor);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new doctor profile
app.post("/", async function (req, res) {
    try {
        const doctor = new Doctor(req.body);
        await doctor.save();
        res.status(201).json(doctor);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update doctor profile
app.put("/:id", async function (req, res) {
    try {
        const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!doctor) {
            return res.status(404).json({ error: "Doctor not found" });
        }
        res.json(doctor);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Verify doctor (admin only)
app.post("/verify/:id", async function (req, res) {
    try {
        const { adminId, approved, rejectionReason } = req.body;
        
        const updateData = {
            verificationStatus: approved ? 'approved' : 'rejected',
            verified: approved,
            verifiedBy: adminId,
            verifiedAt: new Date()
        };

        if (!approved && rejectionReason) {
            updateData.rejectionReason = rejectionReason;
        }

        const doctor = await Doctor.findByIdAndUpdate(req.params.id, updateData, { new: true });
        
        if (!doctor) {
            return res.status(404).json({ error: "Doctor not found" });
        }

        res.json({ 
            success: true, 
            message: approved ? "Doctor verified successfully" : "Doctor verification rejected",
            doctor 
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete doctor
app.delete("/:id", async function (req, res) {
    try {
        const doctor = await Doctor.findByIdAndDelete(req.params.id);
        if (!doctor) {
            return res.status(404).json({ error: "Doctor not found" });
        }
        res.json({ message: "Doctor deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
