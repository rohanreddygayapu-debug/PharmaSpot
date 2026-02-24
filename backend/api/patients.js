const app = require("express")();
const Patient = require("../models/Patient");
const mockData = require("../config/mockData");

module.exports = app;

// Get all patients
app.get("/", async function (req, res) {
    try {
        let patients;
        try {
            patients = await Patient.find({});
        } catch (dbError) {
            console.log('Database not available, using mock data');
            patients = mockData.patients;
        }
        res.json(patients);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get patient by ID
app.get("/:id", async function (req, res) {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) {
            return res.status(404).json({ error: "Patient not found" });
        }
        res.json(patient);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new patient
app.post("/", async function (req, res) {
    try {
        const patient = new Patient(req.body);
        await patient.save();
        res.status(201).json(patient);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update patient
app.put("/:id", async function (req, res) {
    try {
        const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!patient) {
            return res.status(404).json({ error: "Patient not found" });
        }
        res.json(patient);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete patient
app.delete("/:id", async function (req, res) {
    try {
        const patient = await Patient.findByIdAndDelete(req.params.id);
        if (!patient) {
            return res.status(404).json({ error: "Patient not found" });
        }
        res.json({ message: "Patient deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
