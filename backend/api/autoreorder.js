const app = require("express")();
const AutoReorder = require("../models/AutoReorder");
const Product = require("../models/Product");
const Supplier = require("../models/Supplier");

module.exports = app;

/**
 * GET endpoint: Get all auto-reorder configurations
 */
app.get("/all", async function (req, res) {
    try {
        const reorders = await AutoReorder.find({}).sort({ createdAt: -1 });
        res.send(reorders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET endpoint: Get pending reorders
 */
app.get("/pending", async function (req, res) {
    try {
        const reorders = await AutoReorder.find({ status: 'pending' });
        res.send(reorders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST endpoint: Create or update auto-reorder configuration
 */
app.post("/configure", async function (req, res) {
    try {
        const { productId, reorderLevel, reorderQuantity, supplierId, autoOrder } = req.body;
        
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        let supplier = null;
        if (supplierId) {
            supplier = await Supplier.findById(supplierId);
        }

        const reorderData = {
            productId: product._id,
            productName: product.name,
            supplierId: supplier ? supplier._id : null,
            supplierName: supplier ? supplier.name : null,
            reorderLevel: reorderLevel || 10,
            reorderQuantity: reorderQuantity || 50,
            currentStock: product.stock,
            autoOrder: autoOrder !== undefined ? autoOrder : true,
            status: 'pending'
        };

        const reorder = await AutoReorder.findOneAndUpdate(
            { productId: productId },
            reorderData,
            { upsert: true, new: true }
        );

        res.json(reorder);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST endpoint: Check stock levels and trigger auto-reorders
 */
app.post("/check-and-trigger", async function (req, res) {
    try {
        const products = await Product.find({});
        const triggeredReorders = [];

        for (const product of products) {
            const reorderConfig = await AutoReorder.findOne({ 
                productId: product._id,
                autoOrder: true 
            });

            if (reorderConfig && product.stock <= reorderConfig.reorderLevel) {
                // Update reorder status
                reorderConfig.currentStock = product.stock;
                reorderConfig.status = 'ordered';
                reorderConfig.orderDate = new Date();
                
                // Calculate expected delivery (7 days from now)
                const expectedDelivery = new Date();
                expectedDelivery.setDate(expectedDelivery.getDate() + 7);
                reorderConfig.expectedDelivery = expectedDelivery;
                reorderConfig.notificationSent = true;

                await reorderConfig.save();
                triggeredReorders.push(reorderConfig);
            }
        }

        res.json({
            message: 'Auto-reorder check completed',
            triggered: triggeredReorders.length,
            reorders: triggeredReorders
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT endpoint: Update reorder status
 */
app.put("/reorder/:reorderId", async function (req, res) {
    try {
        const reorder = await AutoReorder.findByIdAndUpdate(
            req.params.reorderId,
            req.body,
            { new: true }
        );
        res.json(reorder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE endpoint: Delete auto-reorder configuration
 */
app.delete("/reorder/:reorderId", async function (req, res) {
    try {
        await AutoReorder.findByIdAndDelete(req.params.reorderId);
        res.sendStatus(200);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET endpoint: Get reorder suggestions based on current stock
 */
app.get("/suggestions", async function (req, res) {
    try {
        const products = await Product.find({});
        const suggestions = [];

        for (const product of products) {
            const existingConfig = await AutoReorder.findOne({ productId: product._id });
            
            if (!existingConfig && product.stock < (product.minStock || 10)) {
                suggestions.push({
                    product: product,
                    suggestedReorderLevel: product.minStock || 10,
                    suggestedReorderQuantity: (product.minStock || 10) * 5,
                    currentStock: product.stock,
                    urgency: product.stock === 0 ? 'critical' : 'medium'
                });
            }
        }

        res.json(suggestions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
