const app = require("express")();
const InventoryForecast = require("../models/InventoryForecast");
const Product = require("../models/Product");
const Transaction = require("../models/Transaction");

module.exports = app;

/**
 * GET endpoint: Get AI-driven demand forecast for all products
 */
app.get("/all", async function (req, res) {
    try {
        const forecasts = await InventoryForecast.find({}).sort({ lastUpdated: -1 });
        res.send(forecasts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET endpoint: Get demand forecast for a specific product
 */
app.get("/product/:productId", async function (req, res) {
    try {
        const forecast = await InventoryForecast.findOne({ productId: req.params.productId });
        res.send(forecast);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST endpoint: Generate forecast based on historical data
 */
app.post("/generate", async function (req, res) {
    try {
        const products = await Product.find({});
        const forecasts = [];

        for (const product of products) {
            // Get transaction history for the product (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const transactions = await Transaction.find({
                'items.productId': product._id,
                createdAt: { $gte: thirtyDaysAgo }
            });

            // Calculate demand
            let totalQuantitySold = 0;
            transactions.forEach(transaction => {
                const item = transaction.items.find(i => i.productId.toString() === product._id.toString());
                if (item) {
                    totalQuantitySold += item.quantity;
                }
            });

            // Simple forecast calculation
            const avgDailyDemand = totalQuantitySold / 30;
            const weeklyForecast = Math.ceil(avgDailyDemand * 7);
            const confidence = transactions.length > 10 ? 0.85 : 0.60;
            
            let trend = 'stable';
            if (avgDailyDemand > 5) trend = 'high';
            else if (avgDailyDemand < 1) trend = 'low';

            // Update or create forecast
            const forecastData = {
                productId: product._id,
                productName: product.name,
                demandForecast: weeklyForecast,
                recommendedStock: Math.max(weeklyForecast * 2, product.minStock || 10),
                forecastPeriod: 'weekly',
                confidence: confidence,
                trendAnalysis: trend,
                lastUpdated: new Date()
            };

            await InventoryForecast.findOneAndUpdate(
                { productId: product._id },
                forecastData,
                { upsert: true, new: true }
            );

            forecasts.push(forecastData);
        }

        res.json({ 
            message: 'Forecasts generated successfully', 
            count: forecasts.length,
            forecasts 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET endpoint: Get products with shortage alerts
 */
app.get("/shortages", async function (req, res) {
    try {
        const products = await Product.find({});
        const forecasts = await InventoryForecast.find({});
        
        const shortages = [];
        for (const product of products) {
            const forecast = forecasts.find(f => f.productId.toString() === product._id.toString());
            if (forecast && product.stock < forecast.recommendedStock) {
                shortages.push({
                    product: product,
                    forecast: forecast,
                    shortage: forecast.recommendedStock - product.stock
                });
            }
        }

        res.json(shortages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
