require('dotenv').config();
const http = require("http");
const express = require("express")();
const server = http.createServer(express);
const { Server } = require("socket.io");
const bodyParser = require("body-parser");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const connectDB = require("./config/database");
const initDefaultUser = require("./config/initDefaultUser");
const initIndexes = require("./config/initIndexes");
const NotificationService = require("./services/notificationService");

const PORT = process.env.PORT || 5000;
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
});

// Initialize Socket.IO with CORS
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || "*",
        methods: ["GET", "POST"]
    }
});

// Initialize notification service
let notificationService;

console.log("Server starting...");

// Connect to MongoDB and initialize default user
connectDB().then((connected) => {
    if (connected) {
        console.log('✓ MongoDB connected - using database');
        
        // Initialize indexes first to ensure proper sparse unique indexes
        initIndexes().catch(err => {
            console.error('Failed to initialize indexes:', err.message);
        });
        
        // Then initialize default user
        initDefaultUser().catch(err => {
            console.error('Failed to initialize default user:', err.message);
        });

        // Start notification service
        notificationService = new NotificationService(io);
        notificationService.start();
    } else {
        console.log('✗ MongoDB connection failed - using mock data fallback');
    }
});

express.use(cors());
express.use(bodyParser.json());
express.use(bodyParser.urlencoded({ extended: false }));
express.use(limiter);

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Make notificationService available to routes
express.use((req, res, next) => {
    req.notificationService = notificationService;
    next();
});

express.get("/", function (req, res) {
    res.send("POS Server Online.");
});

express.use("/api/inventory", require("./api/inventory"));
express.use("/api/customers", require("./api/customers"));
express.use("/api/categories", require("./api/categories"));
express.use("/api/settings", require("./api/settings"));
express.use("/api/users", require("./api/users"));
express.use("/api/doctors", require("./api/doctors"));
express.use("/api/patients", require("./api/patients"));
express.use("/api/drugs", require("./api/drugs"));
express.use("/api/insurance", require("./api/insurance"));
express.use("/api/prescriptions", require("./api/prescriptions"));
express.use("/api/suppliers", require("./api/suppliers"));
express.use("/api/forecast", require("./api/forecast"));
express.use("/api/expiry", require("./api/expiry"));
express.use("/api/autoreorder", require("./api/autoreorder"));
express.use("/api/chatbot", require("./api/chatbot"));
express.use("/api/chats", require("./api/chats"));
express.use("/api/appointments", require("./api/appointments"));
express.use("/api/transactions", require("./api/transactions"));
express.use("/api/file-analysis", require("./api/fileAnalysis"));
express.use("/api/notifications", require("./api/notifications"));
express.use("/api/documents", require("./api/documents"));
express.use("/api/messaging", require("./api/messaging"));

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});