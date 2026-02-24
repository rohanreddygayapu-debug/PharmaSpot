const app = require("express")();
const Insurance = require("../models/Insurance");
const mockData = require("../config/mockData");

module.exports = app;

// Get all insurance
app.get("/", async function (req, res) {
    try {
        let insurance;
        try {
            insurance = await Insurance.find({});
        } catch (dbError) {
            console.log('Database not available, using mock data');
            insurance = mockData.insurance;
        }
        res.json(insurance);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get insurance by ID
app.get("/:id", async function (req, res) {
    try {
        const insurance = await Insurance.findById(req.params.id);
        if (!insurance) {
            return res.status(404).json({ error: "Insurance not found" });
        }
        res.json(insurance);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new insurance
app.post("/", async function (req, res) {
    try {
        const insurance = new Insurance(req.body);
        await insurance.save();
        res.status(201).json(insurance);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update insurance
app.put("/:id", async function (req, res) {
    try {
        const insurance = await Insurance.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!insurance) {
            return res.status(404).json({ error: "Insurance not found" });
        }
        res.json(insurance);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete insurance
app.delete("/:id", async function (req, res) {
    try {
        const insurance = await Insurance.findByIdAndDelete(req.params.id);
        if (!insurance) {
            return res.status(404).json({ error: "Insurance not found" });
        }
        res.json({ message: "Insurance deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
