const app = require("express")();
const Category = require("../models/Category");

module.exports = app;

/**
 * GET endpoint: Get the welcome message for the Category API.
 *
 * @param {Object} req  request object.
 * @param {Object} res  response object.
 * @returns {void}
 */
app.get("/", function (req, res) {
    res.send("Category API");
});

/**
 * GET endpoint: Get details of all categories.
 *
 * @param {Object} req  request object.
 * @param {Object} res  response object.
 * @returns {void}
 */
app.get("/all", async function (req, res) {
    try {
        const categories = await Category.find({});
        res.send(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST endpoint: Create a new category.
 *
 * @param {Object} req  request object with new category data in the body.
 * @param {Object} res  response object.
 * @returns {void}
 */
app.post("/category", async function (req, res) {
    try {
        const newCategory = new Category(req.body);
        await newCategory.save();
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
 * DELETE endpoint: Delete a category by category ID.
 *
 * @param {Object} req  request object with category ID as a parameter.
 * @param {Object} res  response object.
 * @returns {void}
 */
app.delete("/category/:categoryId", async function (req, res) {
    try {
        await Category.findByIdAndDelete(req.params.categoryId);
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
 * PUT endpoint: Update category details.
 *
 * @param {Object} req  request object with updated category data in the body.
 * @param {Object} res  response object.
 * @returns {void}
 */
app.put("/category", async function (req, res) {
    try {
        const { id, ...updateData } = req.body;
        await Category.findByIdAndUpdate(id, updateData);
        res.sendStatus(200);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Internal Server Error",
            message: "An unexpected error occurred.",
        });
    }
});