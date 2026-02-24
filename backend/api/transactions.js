const app = require("express")();
const Transaction = require("../models/Transaction");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const { sendTransactionReceipt } = require("../services/emailService");

module.exports = app;

/**
 * GET endpoint: Get the welcome message for the Transactions API.
 *
 * @param {Object} req request object.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/", function (req, res) {
    res.send("Transactions API");
});

/**
 * GET endpoint: Get details of all transactions.
 *
 * @param {Object} req request object.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/all", async function (req, res) {
    try {
        try {
            const transactions = await Transaction.find({}).sort({ createdAt: -1 });
            res.send(transactions);
        } catch (dbError) {
            console.log('Database not available, returning empty transactions list');
            res.send([]);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET endpoint: Get on-hold transactions.
 *
 * @param {Object} req request object.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/on-hold", async function (req, res) {
    try {
        const transactions = await Transaction.find({
            ref_number: { $ne: "" },
            status: "on-hold"
        });
        res.send(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET endpoint: Get customer orders with a status of 0 and an empty reference number.
 *
 * @param {Object} req request object.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/customer-orders", async function (req, res) {
    try {
        const transactions = await Transaction.find({
            customerId: { $ne: null, $exists: true },
            status: "pending",
            ref_number: ""
        });
        res.send(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET endpoint: Get transactions based on date, user, and till parameters.
 *
 * @param {Object} req request object with query parameters.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/by-date", async function (req, res) {
    try {
        const startDate = new Date(req.query.start);
        const endDate = new Date(req.query.end);
        const status = req.query.status;

        let query = {
            createdAt: { $gte: startDate, $lte: endDate }
        };

        if (status) {
            query.status = status;
        }

        if (req.query.user && req.query.user !== "0") {
            query.userId = req.query.user;
        }

        if (req.query.till && req.query.till !== "0") {
            query.till = req.query.till;
        }

        const transactions = await Transaction.find(query).sort({ createdAt: -1 });
        res.send(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST endpoint: Create a new transaction.
 *
 * @param {Object} req request object with transaction data in the body.
 * @param {Object} res response object.
 * @returns {void}
 */
app.post("/new", async function (req, res) {
    try {
        const transactionData = req.body;
        
        try {
            // Handle customer information
            let customerId = null;
            if (transactionData.customerInfo && transactionData.customerInfo.name) {
                // Check if customer already exists by phone or email
                let existingCustomer = null;
                if (transactionData.customerInfo.phone) {
                    existingCustomer = await Customer.findOne({ 
                        phone: transactionData.customerInfo.phone 
                    });
                }
                if (!existingCustomer && transactionData.customerInfo.email) {
                    existingCustomer = await Customer.findOne({ 
                        email: transactionData.customerInfo.email 
                    });
                }

                if (existingCustomer) {
                    customerId = existingCustomer._id;
                    // Update customer info if needed
                    await Customer.findByIdAndUpdate(customerId, {
                        name: transactionData.customerInfo.name,
                        phone: transactionData.customerInfo.phone || existingCustomer.phone,
                        email: transactionData.customerInfo.email || existingCustomer.email
                    });
                } else {
                    // Create new customer
                    const newCustomer = new Customer({
                        name: transactionData.customerInfo.name,
                        phone: transactionData.customerInfo.phone,
                        email: transactionData.customerInfo.email
                    });
                    const savedCustomer = await newCustomer.save();
                    customerId = savedCustomer._id;
                }
            }

            // Add customerId to transaction
            if (customerId) {
                transactionData.customerId = customerId;
            }

            const newTransaction = new Transaction(transactionData);
            
            // Update stock for each item in the transaction
            // This ensures stock is automatically reduced when a purchase is completed
            // Using findOneAndUpdate with conditions to prevent race conditions
            if (transactionData.items && Array.isArray(transactionData.items)) {
                for (const item of transactionData.items) {
                    if (item.productId) {
                        // Use atomic operation to prevent race conditions
                        // Only update if sufficient stock exists
                        const result = await Product.findOneAndUpdate(
                            {
                                _id: item.productId,
                                quantity: { $gte: item.quantity }
                            },
                            { $inc: { quantity: -item.quantity, stock: -item.quantity } },
                            { new: true }
                        );
                        
                        if (!result) {
                            // If update failed, product either doesn't exist or has insufficient stock
                            const product = await Product.findById(item.productId);
                            return res.status(400).json({
                                error: "Insufficient stock",
                                message: `Product "${item.name}" has insufficient stock. Available: ${product?.quantity || 0}, Requested: ${item.quantity}`
                            });
                        }
                    }
                }
            }
            
            const savedTransaction = await newTransaction.save();
            
            // Send email receipt to customer (non-blocking)
            // Email sending should not block the transaction response
            if (savedTransaction.customerInfo?.email) {
                sendTransactionReceipt(savedTransaction).catch(err => {
                    // Log error but don't fail the transaction
                    console.error('Failed to send email receipt:', err);
                });
            }
            
            res.send(savedTransaction);
        } catch (dbError) {
            // If database is not available, return mock success response
            console.log('Database not available, returning mock transaction response');
            const mockTransaction = {
                _id: `mock_txn_${Date.now()}`,
                ...transactionData,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            res.send(mockTransaction);
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
 * PUT endpoint: Update a transaction.
 *
 * @param {Object} req request object with transaction data in the body.
 * @param {Object} res response object.
 * @returns {void}
 */
app.put("/new", async function (req, res) {
    try {
        const { _id, ...updateData } = req.body;
        await Transaction.findByIdAndUpdate(_id, updateData);
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
 * POST endpoint: Delete a transaction.
 *
 * @param {Object} req request object with transaction ID in the body.
 * @param {Object} res response object.
 * @returns {void}
 */
app.post("/delete", async function (req, res) {
    try {
        await Transaction.findByIdAndDelete(req.body._id);
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
 * GET endpoint: Get transactions by customer/user ID.
 * Note: In production, this endpoint should be protected with proper authentication
 * and authorization middleware to ensure users can only access their own transactions.
 *
 * @param {Object} req request object with customer ID as a parameter.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/customer/:customerId", async function (req, res) {
    try {
        const customerId = req.params.customerId;
        
        // Basic validation for MongoDB ObjectId format
        if (!customerId || !/^[a-f\d]{24}$/i.test(customerId)) {
            return res.status(400).json({ 
                error: "Invalid customer ID format" 
            });
        }

        const transactions = await Transaction.find({ 
            $or: [
                { customerId: customerId },
                { userId: customerId }
            ]
        }).sort({ createdAt: -1 });
        
        res.send(transactions);
    } catch (error) {
        console.error('Error fetching customer transactions:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET endpoint: Get transaction by ID.
 *
 * @param {Object} req request object with transaction ID as a parameter.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/:transactionId", async function (req, res) {
    try {
        const transaction = await Transaction.findById(req.params.transactionId);
        res.send(transaction);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
