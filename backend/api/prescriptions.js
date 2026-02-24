const app = require("express")();
const Prescription = require("../models/Prescription");
const mockData = require("../config/mockData");

module.exports = app;

// Get all prescriptions
app.get("/", async function (req, res) {
    try {
        let prescriptions;
        try {
            prescriptions = await Prescription.find({});
        } catch (dbError) {
            console.log('Database not available, using mock data');
            prescriptions = mockData.prescriptions;
        }
        res.json(prescriptions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get prescription by ID
app.get("/:id", async function (req, res) {
    try {
        const prescription = await Prescription.findById(req.params.id);
        if (!prescription) {
            return res.status(404).json({ error: "Prescription not found" });
        }
        res.json(prescription);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new prescription
app.post("/", async function (req, res) {
    try {
        const prescription = new Prescription(req.body);
        await prescription.save();
        res.status(201).json(prescription);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update prescription
app.put("/:id", async function (req, res) {
    try {
        const prescription = await Prescription.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!prescription) {
            return res.status(404).json({ error: "Prescription not found" });
        }
        res.json(prescription);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete prescription
app.delete("/:id", async function (req, res) {
    try {
        const prescription = await Prescription.findByIdAndDelete(req.params.id);
        if (!prescription) {
            return res.status(404).json({ error: "Prescription not found" });
        }
        res.json({ message: "Prescription deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
