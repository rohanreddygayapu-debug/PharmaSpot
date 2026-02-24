const app = require("express")();
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const { sendAppointmentNotificationToDoctor, sendAppointmentAcceptanceToPatient } = require("../services/emailService");

module.exports = app;

// Get all appointments for a user
app.get("/user/:userId", async function (req, res) {
    try {
        const appointments = await Appointment.find({ userId: req.params.userId })
            .populate('doctorId', 'username fullname')
            .sort({ appointmentDate: -1 });
        
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all appointments for a doctor
app.get("/doctor/:doctorId", async function (req, res) {
    try {
        // Check if it's a mock doctor user first
        if (req.params.doctorId === 'mock_user_doctor') {
            const mockAppointments = [
                {
                    _id: 'appt1',
                    userId: 'mock_patient_1',
                    doctorId: req.params.doctorId,
                    patientName: 'John Smith',
                    patientPhone: '(555) 234-5678',
                    patientEmail: 'john.smith@email.com',
                    appointmentDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
                    appointmentTime: '10:00 AM',
                    reason: 'Regular checkup',
                    status: 'pending',
                    consultationFee: 150,
                    paymentStatus: 'pending',
                },
                {
                    _id: 'appt2',
                    userId: 'mock_patient_2',
                    doctorId: req.params.doctorId,
                    patientName: 'Emily Davis',
                    patientPhone: '(555) 345-6789',
                    patientEmail: 'emily.davis@email.com',
                    appointmentDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
                    appointmentTime: '2:00 PM',
                    reason: 'Follow-up consultation',
                    status: 'confirmed',
                    consultationFee: 150,
                    paymentStatus: 'pending',
                },
                {
                    _id: 'appt3',
                    userId: 'mock_patient_3',
                    doctorId: req.params.doctorId,
                    patientName: 'Michael Brown',
                    patientPhone: '(555) 456-7890',
                    patientEmail: 'michael.brown@email.com',
                    appointmentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
                    appointmentTime: '11:00 AM',
                    reason: 'Blood pressure check',
                    status: 'completed',
                    consultationFee: 150,
                    paymentStatus: 'paid',
                    notes: 'Patient doing well, blood pressure under control.',
                },
                {
                    _id: 'appt4',
                    userId: 'mock_patient_4',
                    doctorId: req.params.doctorId,
                    patientName: 'Sarah Wilson',
                    patientPhone: '(555) 567-8901',
                    patientEmail: 'sarah.wilson@email.com',
                    appointmentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
                    appointmentTime: '3:30 PM',
                    reason: 'Annual physical examination',
                    status: 'completed',
                    consultationFee: 150,
                    paymentStatus: 'paid',
                    notes: 'All tests normal. Recommended annual follow-up.',
                },
                {
                    _id: 'appt5',
                    userId: 'mock_patient_5',
                    doctorId: req.params.doctorId,
                    patientName: 'Robert Johnson',
                    patientPhone: '(555) 678-9012',
                    patientEmail: 'robert.johnson@email.com',
                    appointmentDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
                    appointmentTime: '9:00 AM',
                    reason: 'Diabetes management consultation',
                    status: 'pending',
                    consultationFee: 150,
                    paymentStatus: 'pending',
                },
            ];
            return res.json(mockAppointments);
        }
        
        const appointments = await Appointment.find({ doctorId: req.params.doctorId })
            .populate('userId', 'username fullname email')
            .sort({ appointmentDate: 1 });
        
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get appointment by ID
app.get("/:id", async function (req, res) {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate('userId', 'username fullname email')
            .populate('doctorId', 'username fullname');
        
        if (!appointment) {
            return res.status(404).json({ error: "Appointment not found" });
        }

        res.json(appointment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new appointment
app.post("/", async function (req, res) {
    try {
        const appointment = new Appointment(req.body);
        await appointment.save();
        
        const populatedAppt = await Appointment.findById(appointment._id)
            .populate('userId', 'username fullname email')
            .populate('doctorId', 'username fullname email');

        // Send email notification to doctor (non-blocking)
        if (populatedAppt.doctorId) {
            const doctorUserId = populatedAppt.doctorId._id || populatedAppt.doctorId;
            
            // Try to get doctor details from Doctor model (has more info like specialization)
            // Fall back to User model data if Doctor profile doesn't exist
            (async () => {
                try {
                    const doctorProfile = await Doctor.findOne({ userId: doctorUserId });
                    const doctorInfo = doctorProfile || populatedAppt.doctorId;
                    await sendAppointmentNotificationToDoctor(populatedAppt, doctorInfo);
                } catch (err) {
                    console.error('Failed to send appointment notification to doctor:', err);
                }
            })();
        }

        res.status(201).json(populatedAppt);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update appointment status
app.put("/:id/status", async function (req, res) {
    try {
        const { status, notes } = req.body;
        
        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { status, notes },
            { new: true }
        ).populate('userId', 'username fullname email')
         .populate('doctorId', 'username fullname email');

        if (!appointment) {
            return res.status(404).json({ error: "Appointment not found" });
        }

        // Send email to patient when doctor confirms/accepts the appointment
        if (status === 'confirmed' && appointment.doctorId) {
            const doctorUserId = appointment.doctorId._id || appointment.doctorId;
            
            // Try to get doctor details from Doctor model (has specialization and other details)
            // Fall back to User model data if Doctor profile doesn't exist
            (async () => {
                try {
                    const doctorProfile = await Doctor.findOne({ userId: doctorUserId });
                    const doctorInfo = doctorProfile || appointment.doctorId;
                    await sendAppointmentAcceptanceToPatient(appointment, doctorInfo);
                } catch (err) {
                    console.error('Failed to send appointment acceptance to patient:', err);
                }
            })();
        }

        res.json(appointment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Cancel appointment
app.post("/:id/cancel", async function (req, res) {
    try {
        const { cancelledBy, cancellationReason } = req.body;
        
        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { 
                status: 'cancelled',
                cancelledBy,
                cancellationReason
            },
            { new: true }
        );

        if (!appointment) {
            return res.status(404).json({ error: "Appointment not found" });
        }

        res.json({ success: true, appointment });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Complete appointment with payment information
app.post("/:id/complete", async function (req, res) {
    try {
        const { paymentMethod, paymentStatus = 'paid' } = req.body;
        
        const updateData = {
            status: 'completed',
            paymentStatus
        };
        
        if (paymentMethod) {
            updateData.paymentMethod = paymentMethod;
        }
        
        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('userId', 'username fullname email')
         .populate('doctorId', 'username fullname email');

        if (!appointment) {
            return res.status(404).json({ error: "Appointment not found" });
        }

        res.json({ success: true, appointment });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete appointment
app.delete("/:id", async function (req, res) {
    try {
        const appointment = await Appointment.findByIdAndDelete(req.params.id);
        
        if (!appointment) {
            return res.status(404).json({ error: "Appointment not found" });
        }

        res.json({ message: "Appointment deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
