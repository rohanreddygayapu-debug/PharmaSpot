const app = require("express")();
const Drug = require("../models/Drug");
const mockData = require("../config/mockData");

module.exports = app;

// Get all drugs
app.get("/", async function (req, res) {
    try {
        let drugs;
        try {
            drugs = await Drug.find({});
        } catch (dbError) {
            console.log('Database not available, using mock data');
            drugs = mockData.drugs;
        }
        res.json(drugs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get drug by ID
app.get("/:id", async function (req, res) {
    try {
        const drug = await Drug.findById(req.params.id);
        if (!drug) {
            return res.status(404).json({ error: "Drug not found" });
        }
        res.json(drug);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new drug
app.post("/", async function (req, res) {
    try {
        const drug = new Drug(req.body);
        await drug.save();
        res.status(201).json(drug);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update drug
app.put("/:id", async function (req, res) {
    try {
        const drug = await Drug.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!drug) {
            return res.status(404).json({ error: "Drug not found" });
        }
        res.json(drug);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete drug
app.delete("/:id", async function (req, res) {
    try {
        const drug = await Drug.findByIdAndDelete(req.params.id);
        if (!drug) {
            return res.status(404).json({ error: "Drug not found" });
        }
        res.json({ message: "Drug deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
