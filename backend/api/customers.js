const app = require("express")();
const validator = require("validator");
const Customer = require("../models/Customer");
const mockData = require("../config/mockData");

module.exports = app;

/**
 * GET endpoint: Get the welcome message for the Customer API.
 *
 * @param {Object} req request object.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/", function (req, res) {
    res.send("Customer API");
});

/**
 * GET endpoint: Get customer details by customer ID.
 *
 * @param {Object} req request object with customer ID as a parameter.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/customer/:customerId", async function (req, res) {
    try {
        if (!req.params.customerId) {
            return res.status(400).send("ID field is required.");
        }
        const customer = await Customer.findById(req.params.customerId);
        res.send(customer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET endpoint: Get details of all customers.
 *
 * @param {Object} req request object.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/all", async function (req, res) {
    try {
        let customers;
        try {
            customers = await Customer.find({});
        } catch (dbError) {
            console.log('Database not available, using mock data');
            customers = mockData.customers;
        }
        res.send(customers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST endpoint: Create a new customer.
 *
 * @param {Object} req request object with new customer data in the body.
 * @param {Object} res response object.
 * @returns {void}
 */
app.post("/customer", async function (req, res) {
    try {
        const newCustomer = new Customer(req.body);
        const savedCustomer = await newCustomer.save();
        // Return only necessary fields for security
        res.json({
            _id: savedCustomer._id,
            name: savedCustomer.name,
            phone: savedCustomer.phone,
            email: savedCustomer.email
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Internal Server Error",
            message: "An unexpected error occurred.",
        });
    }
});

/**
 * DELETE endpoint: Delete a customer by customer ID.
 *
 * @param {Object} req request object with customer ID as a parameter.
 * @param {Object} res response object.
 * @returns {void}
 */
app.delete("/customer/:customerId", async function (req, res) {
    try {
        await Customer.findByIdAndDelete(req.params.customerId);
        res.sendStatus(200);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Internal Server Error",
            message: "An unexpected error occurred.",
        });
    }
});

/**
 * PUT endpoint: Update customer details.
 *
 * @param {Object} req request object with updated customer data in the body.
 * @param {Object} res response object.
 * @returns {void}
 */
app.put("/customer", async function (req, res) {
    try {
        let customerId = validator.escape(req.body._id);
        const { _id, ...updateData } = req.body;
        await Customer.findByIdAndUpdate(customerId, updateData);
        res.sendStatus(200);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Internal Server Error",
            message: "An unexpected error occurred.",
        });
    }
});

/**
 * GET endpoint: Get customer purchase history.
 *
 * @param {Object} req request object with customer ID as a parameter.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/customer/:customerId/purchases", async function (req, res) {
    try {
        if (!req.params.customerId) {
            return res.status(400).send("Customer ID is required.");
        }
        
        const Transaction = require("../models/Transaction");
        const purchases = await Transaction.find({ 
            customerId: req.params.customerId 
        }).sort({ createdAt: -1 });
        
        res.send(purchases);
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            error: error.message 
        });
    }
});