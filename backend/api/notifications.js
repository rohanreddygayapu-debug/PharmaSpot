const app = require("express")();
const Notification = require("../models/Notification");

module.exports = app;

/**
 * GET endpoint: Get all notifications.
 *
 * @param {Object} req request object.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/all", async function (req, res) {
    try {
        const notifications = await Notification.find({})
            .sort({ createdAt: -1 })
            .limit(100);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET endpoint: Get unread notifications.
 *
 * @param {Object} req request object.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/unread", async function (req, res) {
    try {
        const notifications = await Notification.find({ 
            read: false,
            dismissed: false 
        })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET endpoint: Get unread count.
 *
 * @param {Object} req request object.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/unread/count", async function (req, res) {
    try {
        const count = await Notification.countDocuments({ 
            read: false,
            dismissed: false 
        });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST endpoint: Mark notification as read.
 *
 * @param {Object} req request object with notification ID.
 * @param {Object} res response object.
 * @returns {void}
 */
app.post("/read/:id", async function (req, res) {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { read: true },
            { new: true }
        );
        res.json(notification);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST endpoint: Mark all notifications as read.
 *
 * @param {Object} req request object.
 * @param {Object} res response object.
 * @returns {void}
 */
app.post("/read-all", async function (req, res) {
    try {
        await Notification.updateMany(
            { read: false },
            { read: true }
        );
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST endpoint: Dismiss a notification.
 *
 * @param {Object} req request object with notification ID.
 * @param {Object} res response object.
 * @returns {void}
 */
app.post("/dismiss/:id", async function (req, res) {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { dismissed: true, read: true },
            { new: true }
        );
        res.json(notification);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE endpoint: Delete a notification.
 *
 * @param {Object} req request object with notification ID.
 * @param {Object} res response object.
 * @returns {void}
 */
app.delete("/:id", async function (req, res) {
    try {
        await Notification.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE endpoint: Clear all read notifications.
 *
 * @param {Object} req request object.
 * @param {Object} res response object.
 * @returns {void}
 */
app.delete("/clear/read", async function (req, res) {
    try {
        await Notification.deleteMany({ read: true });
        res.json({ success: true, message: 'All read notifications cleared' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
