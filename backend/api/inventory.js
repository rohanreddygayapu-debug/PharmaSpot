const app = require("express")();
const Product = require("../models/Product");
const validator = require("validator");
const mockData = require("../config/mockData");

module.exports = app;

/**
 * GET endpoint: Get the welcome message for the Inventory API.
 *
 * @param {Object} req request object.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/", function (req, res) {
    res.send("Inventory API");
});

/**
 * GET endpoint: Get product details by product ID.
 *
 * @param {Object} req request object with product ID as a parameter.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/product/:productId", async function (req, res) {
    try {
        if (!req.params.productId) {
            return res.status(400).send("ID field is required.");
        }
        const product = await Product.findById(req.params.productId);
        res.send(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET endpoint: Get details of all products.
 *
 * @param {Object} req request object.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/products", async function (req, res) {
    try {
        let products;
        try {
            products = await Product.find({});
        } catch (dbError) {
            console.log('Database not available, using mock data');
            products = mockData.products;
        }
        res.send(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST endpoint: Create or update a product.
 *
 * @param {Object} req request object with product data in the body.
 * @param {Object} res response object.
 * @returns {void}
 */
app.post("/product", async function (req, res) {
    try {
        const productData = req.body;
        
        if (productData.id && productData.id !== "") {
            // Update existing product
            const { id, ...updateData } = productData;
            await Product.findByIdAndUpdate(id, updateData);
            res.sendStatus(200);
        } else {
            // Create new product
            delete productData.id;
            const newProduct = new Product(productData);
            await newProduct.save();
            res.send(newProduct);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Internal Server Error",
            message: `An unexpected error occurred. ${error}`,
        });
    }
});

/**
 * DELETE endpoint: Delete a product by product ID.
 *
 * @param {Object} req request object with product ID as a parameter.
 * @param {Object} res response object.
 * @returns {void}
 */
app.delete("/product/:productId", async function (req, res) {
    try {
        await Product.findByIdAndDelete(req.params.productId);
        res.sendStatus(200);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Internal Server Error",
            message: `An unexpected error occurred. ${error}`,
        });
    }
});

/**
 * POST endpoint: Find product by SKU/barcode.
 *
 * @param {Object} req request object with SKU in the body.
 * @param {Object} res response object.
 * @returns {void}
 */
app.post("/product/sku", async function (req, res) {
    try {
        const sku = validator.escape(req.body.sku);
        const product = await Product.findOne({ barcode: sku });
        
        if (product) {
            res.send(product);
        } else {
            res.send({ status: 404, message: "Product not found" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST endpoint: Update stock for a product (when new stock arrives or delivery completed).
 *
 * @param {Object} req request object with productId and quantity to add in the body.
 * @param {Object} res response object.
 * @returns {void}
 */
app.post("/stock/add", async function (req, res) {
    try {
        const { productId, quantity, reason } = req.body;
        
        if (!productId || !quantity || quantity <= 0) {
            return res.status(400).json({ 
                error: "productId and positive quantity are required" 
            });
        }

        const product = await Product.findByIdAndUpdate(
            productId,
            { $inc: { quantity: quantity, stock: quantity } },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        // Trigger notification check for this product
        if (req.notificationService) {
            req.notificationService.triggerStockCheck(productId);
        }

        res.json({ 
            success: true, 
            message: `Stock updated: ${quantity} units added${reason ? ' (' + reason + ')' : ''}`,
            product 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Internal Server Error",
            message: `An unexpected error occurred. ${error}`,
        });
    }
});

/**
 * POST endpoint: Remove stock for a product (expired, damaged, etc).
 *
 * @param {Object} req request object with productId and quantity to remove in the body.
 * @param {Object} res response object.
 * @returns {void}
 */
app.post("/stock/remove", async function (req, res) {
    try {
        const { productId, quantity, reason } = req.body;
        
        if (!productId || !quantity || quantity <= 0) {
            return res.status(400).json({ 
                error: "productId and positive quantity are required" 
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        // Ensure we don't go negative
        const actualRemoval = Math.min(quantity, product.quantity || 0);
        
        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            { $inc: { quantity: -actualRemoval, stock: -actualRemoval } },
            { new: true }
        );

        // Trigger notification check for this product
        if (req.notificationService) {
            req.notificationService.triggerStockCheck(productId);
        }

        res.json({ 
            success: true, 
            message: `Stock removed: ${actualRemoval} units${reason ? ' (' + reason + ')' : ''}`,
            product: updatedProduct 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Internal Server Error",
            message: `An unexpected error occurred. ${error}`,
        });
    }
});
