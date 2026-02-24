const app = require("express")();
const Settings = require("../models/Settings");

module.exports = app;

/**
 * GET endpoint: Get the welcome message for the Settings API.
 *
 * @param {Object} req request object.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/", function (req, res) {
    res.send("Settings API");
});

/**
 * GET endpoint: Get settings details.
 *
 * @param {Object} req request object.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/get", async function (req, res) {
    try {
        // Get all settings as key-value pairs
        const settings = await Settings.find({});
        
        // Convert array of settings to object
        const settingsObj = {};
        settings.forEach(setting => {
            settingsObj[setting.key] = setting.value;
        });
        
        res.send(settingsObj);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST endpoint: Create or update settings.
 *
 * @param {Object} req request object with settings data in the body.
 * @param {Object} res response object.
 * @returns {void}
 */
app.post("/post", async function (req, res) {
    try {
        const settingsData = req.body;
        
        // Update or create each setting
        for (const [key, value] of Object.entries(settingsData)) {
            await Settings.findOneAndUpdate(
                { key: key },
                { key: key, value: value },
                { upsert: true, new: true }
            );
        }
        
        res.sendStatus(200);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Internal Server Error",
            message: `An unexpected error occurred. ${error}`,
        });
    }
});
