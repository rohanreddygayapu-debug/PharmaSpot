const app = require("express")();
const ExpiryAlert = require("../models/ExpiryAlert");
const Product = require("../models/Product");

module.exports = app;

/**
 * GET endpoint: Get all expiry alerts
 */
app.get("/alerts", async function (req, res) {
    try {
        const alerts = await ExpiryAlert.find({ status: 'active' }).sort({ expiryDate: 1 });
        res.send(alerts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET endpoint: Get FEFO (First Expired, First Out) sorted products
 */
app.get("/fefo", async function (req, res) {
    try {
        const products = await Product.find({ expiryDate: { $exists: true, $ne: null } })
            .sort({ expiryDate: 1 });
        
        const fefoList = products.map((product, index) => {
            const daysUntilExpiry = Math.ceil((new Date(product.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
            return {
                ...product.toObject(),
                fefoRank: index + 1,
                daysUntilExpiry: daysUntilExpiry,
                alertLevel: daysUntilExpiry < 30 ? 'critical' : daysUntilExpiry < 90 ? 'warning' : 'info'
            };
        });

        res.json(fefoList);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST endpoint: Generate expiry alerts
 */
app.post("/generate-alerts", async function (req, res) {
    try {
        const products = await Product.find({ expiryDate: { $exists: true, $ne: null } });
        const alerts = [];

        for (const product of products) {
            const expiryDate = new Date(product.expiryDate);
            const today = new Date();
            const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

            if (daysUntilExpiry <= 90) {
                let alertLevel = 'info';
                if (daysUntilExpiry < 30) alertLevel = 'critical';
                else if (daysUntilExpiry < 90) alertLevel = 'warning';

                const alertData = {
                    productId: product._id,
                    productName: product.name,
                    batchNumber: product.sku || 'N/A',
                    expiryDate: product.expiryDate,
                    quantity: product.stock,
                    daysUntilExpiry: daysUntilExpiry,
                    alertLevel: alertLevel,
                    status: 'active',
                    fefoRank: 0
                };

                await ExpiryAlert.findOneAndUpdate(
                    { productId: product._id, status: 'active' },
                    alertData,
                    { upsert: true, new: true }
                );

                alerts.push(alertData);
            }
        }

        // Update FEFO ranks
        const allAlerts = await ExpiryAlert.find({ status: 'active' }).sort({ expiryDate: 1 });
        for (let i = 0; i < allAlerts.length; i++) {
            allAlerts[i].fefoRank = i + 1;
            await allAlerts[i].save();
        }

        res.json({ 
            message: 'Expiry alerts generated successfully', 
            count: alerts.length,
            alerts 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT endpoint: Update alert status
 */
app.put("/alert/:alertId", async function (req, res) {
    try {
        const alert = await ExpiryAlert.findByIdAndUpdate(
            req.params.alertId,
            { status: req.body.status },
            { new: true }
        );
        res.json(alert);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET endpoint: Get critical expiry alerts (expiring within 30 days)
 */
app.get("/critical", async function (req, res) {
    try {
        const alerts = await ExpiryAlert.find({ 
            status: 'active',
            alertLevel: 'critical'
        }).sort({ expiryDate: 1 });
        res.send(alerts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
