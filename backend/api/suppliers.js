const app = require("express")();
const Supplier = require("../models/Supplier");
const mockData = require("../config/mockData");

module.exports = app;

// Get all suppliers
app.get("/", async function (req, res) {
    try {
        let suppliers;
        try {
            suppliers = await Supplier.find({});
        } catch (dbError) {
            console.log('Database not available, using mock data');
            suppliers = mockData.suppliers;
        }
        res.json(suppliers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get supplier by ID
app.get("/:id", async function (req, res) {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) {
            return res.status(404).json({ error: "Supplier not found" });
        }
        res.json(supplier);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new supplier
app.post("/", async function (req, res) {
    try {
        const supplier = new Supplier(req.body);
        await supplier.save();
        res.status(201).json(supplier);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update supplier
app.put("/:id", async function (req, res) {
    try {
        const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!supplier) {
            return res.status(404).json({ error: "Supplier not found" });
        }
        res.json(supplier);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete supplier
app.delete("/:id", async function (req, res) {
    try {
        const supplier = await Supplier.findByIdAndDelete(req.params.id);
        if (!supplier) {
            return res.status(404).json({ error: "Supplier not found" });
        }
        res.json({ message: "Supplier deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
