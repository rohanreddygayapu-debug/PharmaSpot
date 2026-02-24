const express = require("express");
const app = express();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const xlsx = require("xlsx");
const Tesseract = require("tesseract.js");
const Product = require("../models/Product");

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, "../uploads");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, "upload-" + uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        const allowedMimes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/csv",
        ];
        const allowedExtensions = [".jpg", ".jpeg", ".png", ".xlsx", ".xls", ".csv"];
        const fileExtension = path.extname(file.originalname).toLowerCase();
        
        if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type. Only images (.jpg, .png) and Excel files (.xlsx, .xls, .csv) are allowed."));
        }
    },
});

module.exports = app;

/**
 * POST endpoint: Analyze uploaded file and extract medicine data
 */
app.post("/analyze", upload.single("file"), async function (req, res) {
    console.log("File analysis request received");
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        console.log("File received:", req.file.originalname, "Type:", req.file.mimetype);
        const filePath = req.file.path;
        const fileType = req.file.mimetype;
        const fileExtension = path.extname(req.file.originalname).toLowerCase();
        let extractedData = [];

        // Process based on file type
        if (fileType.startsWith("image/") || [".jpg", ".jpeg", ".png"].includes(fileExtension)) {
            // Process image with OCR
            console.log("Processing as image file");
            extractedData = await processImageFile(filePath);
        } else if (
            fileType.includes("excel") ||
            fileType.includes("spreadsheet") ||
            fileType === "text/csv" ||
            [".xlsx", ".xls", ".csv"].includes(fileExtension)
        ) {
            // Process Excel/CSV file
            console.log("Processing as Excel/CSV file");
            extractedData = await processExcelFile(filePath);
            console.log("Extracted data:", extractedData.length, "items");
        } else {
            throw new Error("Unsupported file type");
        }

        // Match extracted data with products in database
        console.log("Matching products in database");
        const matchedProducts = await matchProductsWithDatabase(extractedData);
        console.log("Matched products:", matchedProducts.length);

        // Clean up uploaded file asynchronously
        fs.promises.unlink(filePath).catch(err => console.error('Error deleting file:', err));
        console.log("File cleanup initiated");

        const response = {
            success: true,
            extractedItems: extractedData.length,
            matchedProducts: matchedProducts,
            message: `Successfully processed file. Found ${matchedProducts.length} matching products.`,
        };
        console.log("Sending response");
        res.json(response);
    } catch (error) {
        console.error("File analysis error:", error);
        // Clean up file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.promises.unlink(req.file.path).catch(err => console.error('Error deleting file:', err));
        }
        res.status(500).json({ error: error.message });
    }
});

/**
 * Process image file using OCR
 */
async function processImageFile(filePath) {
    try {
        const result = await Tesseract.recognize(filePath, "eng", {
            logger: (m) => console.log(m),
        });

        const text = result.data.text;
        console.log("OCR extracted text:", text);

        // Extract potential medicine names (basic pattern matching)
        // Look for lines that might be medicine names or product codes
        const lines = text.split("\n").filter((line) => line.trim().length > 0);
        const medicinePatterns = [];

        for (const line of lines) {
            const trimmedLine = line.trim();
            // Skip very short lines or lines with only numbers
            if (trimmedLine.length < 3 || /^\d+$/.test(trimmedLine)) {
                continue;
            }
            
            // Extract words that could be medicine names (at least 3 characters)
            const words = trimmedLine
                .split(/\s+/)
                .filter((word) => word.length >= 3 && /[a-zA-Z]/.test(word));
            
            if (words.length > 0) {
                medicinePatterns.push({
                    name: words.join(" "),
                    confidence: "medium",
                });
            }
        }

        return medicinePatterns;
    } catch (error) {
        console.error("OCR processing error:", error);
        throw new Error("Failed to process image: " + error.message);
    }
}

/**
 * Process Excel/CSV file
 */
async function processExcelFile(filePath) {
    try {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        const extractedItems = [];

        // Try to find columns that contain medicine information
        for (const row of data) {
            const item = {};
            
            // Look for common column names
            const nameColumns = ["name", "medicine", "product", "drug", "item", "medicine_name", "product_name"];
            const quantityColumns = ["quantity", "qty", "amount", "count"];
            const barcodeColumns = ["barcode", "code", "sku", "product_code"];

            // Find medicine name
            for (const col of nameColumns) {
                const key = Object.keys(row).find((k) => k.toLowerCase().includes(col));
                if (key && row[key]) {
                    item.name = String(row[key]).trim();
                    break;
                }
            }

            // Find quantity if available
            for (const col of quantityColumns) {
                const key = Object.keys(row).find((k) => k.toLowerCase().includes(col));
                if (key && row[key]) {
                    item.requestedQuantity = parseInt(row[key]) || 1;
                    break;
                }
            }

            // Find barcode if available
            for (const col of barcodeColumns) {
                const key = Object.keys(row).find((k) => k.toLowerCase().includes(col));
                if (key && row[key]) {
                    item.barcode = String(row[key]).trim();
                    break;
                }
            }

            // Add item if we found at least a name or barcode
            if (item.name || item.barcode) {
                if (!item.requestedQuantity) {
                    item.requestedQuantity = 1;
                }
                extractedItems.push(item);
            }
        }

        return extractedItems;
    } catch (error) {
        console.error("Excel processing error:", error);
        throw new Error("Failed to process Excel file: " + error.message);
    }
}

/**
 * Match extracted data with products in database
 */
async function matchProductsWithDatabase(extractedData) {
    const matchedProducts = [];
    
    // Check if database is available by checking mongoose connection state
    const mongoose = require('mongoose');
    const isDatabaseAvailable = mongoose.connection.readyState === mongoose.STATES.connected;
    console.log("Database available:", isDatabaseAvailable);
    
    const mockProducts = getMockProducts();

    for (const item of extractedData) {
        try {
            let product = null;

            if (isDatabaseAvailable) {
                try {
                    // First try to match by barcode if available
                    if (item.barcode) {
                        product = await Product.findOne({ barcode: item.barcode }).maxTimeMS(2000);
                    }

                    // If no barcode match, try to match by name
                    if (!product && item.name) {
                        // Try exact match first
                        product = await Product.findOne({
                            name: { $regex: new RegExp(`^${item.name}$`, "i") },
                        }).maxTimeMS(2000);

                        // If no exact match, try partial match
                        if (!product) {
                            product = await Product.findOne({
                                name: { $regex: new RegExp(item.name, "i") },
                            }).maxTimeMS(2000);
                        }
                    }
                } catch (dbError) {
                    console.log('Database query error, falling back to mock data:', dbError.message);
                }
            }
            
            // If database not available or product not found in DB, use mock data
            if (!product) {
                console.log('Using mock data for:', item.name || item.barcode);
                
                // Try to find in mock data
                if (item.barcode) {
                    product = mockProducts.find(p => p.barcode === item.barcode);
                }
                
                if (!product && item.name) {
                    product = mockProducts.find(p => 
                        p.name.toLowerCase() === item.name.toLowerCase()
                    );
                    
                    if (!product) {
                        product = mockProducts.find(p => 
                            p.name.toLowerCase().includes(item.name.toLowerCase())
                        );
                    }
                }
            }

            if (product) {
                matchedProducts.push({
                    _id: product._id || product.id || Math.random().toString(),
                    name: product.name,
                    price: product.price,
                    barcode: product.barcode,
                    quantity: product.quantity || product.stock,
                    stock: product.stock || product.quantity,
                    requestedQuantity: item.requestedQuantity || 1,
                    matchedBy: item.barcode ? "barcode" : "name",
                    originalInput: item.name || item.barcode,
                });
            } else {
                // Product not found, include in results with flag
                matchedProducts.push({
                    name: item.name || item.barcode,
                    requestedQuantity: item.requestedQuantity || 1,
                    notFound: true,
                    originalInput: item.name || item.barcode,
                });
            }
        } catch (error) {
            console.error("Error matching product:", error);
        }
    }

    return matchedProducts;
}

/**
 * Get mock products for fallback when database is not available
 */
function getMockProducts() {
    return [
        { id: '1', name: 'Aspirin', price: 9.99, barcode: '123456789', stock: 100, quantity: 100 },
        { id: '2', name: 'Ibuprofen', price: 12.99, barcode: '987654321', stock: 75, quantity: 75 },
        { id: '3', name: 'Vitamin C', price: 15.99, barcode: '456789123', stock: 50, quantity: 50 },
        { id: '4', name: 'Paracetamol', price: 8.99, barcode: '', stock: 120, quantity: 120 },
        { id: '5', name: 'Amoxicillin', price: 25.99, barcode: '', stock: 30, quantity: 30 },
    ];
}

/**
 * GET endpoint: Test endpoint
 */
app.get("/", function (req, res) {
    res.send("File Analysis API");
});
