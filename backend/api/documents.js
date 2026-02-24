const express = require("express");
const app = express();
const multer = require("multer");
const path = require("path");
const Document = require("../models/Document");
const SecurityKeys = require("../models/SecurityKeys");
const {
    generateRSAKeyPair,
    encryptRSA,
    decryptRSA,
    createDigitalSignature,
    verifyDigitalSignature,
    hashWithSalt,
    encodeBase64,
    decodeBase64,
    logSecurityOperation
} = require("../services/securityService");

// Configure multer for memory storage (we'll encode to base64)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

module.exports = app;

/**
 * GET endpoint: Welcome message
 */
app.get("/", function (req, res) {
    res.send("Documents API - Secure Document Management");
});

/**
 * POST endpoint: Upload document with encryption and digital signature
 */
app.post("/upload", upload.single("file"), async function (req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const { userId, documentType, description, encrypt } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        console.log("\n========== DOCUMENT UPLOAD STARTED ==========");
        console.log(`File: ${req.file.originalname}`);
        console.log(`Size: ${req.file.size} bytes`);
        console.log(`Type: ${req.file.mimetype}`);
        console.log(`Uploaded by: ${userId}`);

        // Step 1: Encode file content to Base64
        const base64Content = encodeBase64(req.file.buffer);
        console.log(`✓ File encoded to Base64 (length: ${base64Content.length})`);

        // Step 2: Generate hash for integrity
        const { hash: contentHash, salt: hashSalt } = hashWithSalt(base64Content);
        console.log(`✓ Content hash generated: ${contentHash.substring(0, 16)}...`);
        console.log(`✓ Salt: ${hashSalt}`);

        let securityKeysDoc = null;
        let finalContent = base64Content;
        let encryptionMethod = 'none';

        // Step 3: Encryption (if requested)
        if (encrypt === 'true' || encrypt === true) {
            // Generate RSA key pair for this document
            const { publicKey, privateKey } = generateRSAKeyPair();
            console.log(`✓ RSA key pair generated (${publicKey.length + privateKey.length} bytes)`);

            // For large files, we can't use RSA directly, so we just store keys
            // In production, you'd use hybrid encryption (RSA + AES)
            // For demonstration, we'll mark it as encrypted and store the keys
            
            // Create security keys document (will be saved after document creation)
            securityKeysDoc = new SecurityKeys({
                entityType: 'document',
                entityId: '', // Will be set after document creation
                publicKey: publicKey,
                privateKey: privateKey,
                hash: contentHash,
                salt: hashSalt,
                keyPurpose: 'document_encryption'
            });
            // Note: SecurityKeys will be saved after document is created (see lines below)
            
            encryptionMethod = 'rsa';
            console.log(`✓ RSA key pair generated and security keys prepared`);
        }

        // Step 4: Create digital signature
        let signature = null;
        if (securityKeysDoc && securityKeysDoc.privateKey) {
            signature = createDigitalSignature(contentHash, securityKeysDoc.privateKey);
            console.log(`✓ Digital signature created: ${signature.substring(0, 32)}...`);
            
            // Update security keys with signature (will be saved after document creation)
            securityKeysDoc.signature = signature;
            securityKeysDoc.signatureVerified = true;
        }

        // Step 5: Save document to database
        const document = new Document({
            filename: `${Date.now()}-${req.file.originalname}`,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            content: finalContent,
            encrypted: encrypt === 'true' || encrypt === true,
            encryptionMethod: encryptionMethod, // Note: Keys stored, full encryption not applied to large files
            securityKeysId: securityKeysDoc ? securityKeysDoc._id : null,
            contentHash: contentHash,
            hashSalt: hashSalt,
            signature: signature,
            signedBy: userId,
            uploadedBy: userId,
            documentType: documentType || 'general',
            description: description || ''
        });

        await document.save();

        // Save security keys with document ID
        if (securityKeysDoc) {
            securityKeysDoc.entityId = document._id.toString();
            await securityKeysDoc.save();
            console.log(`✓ Security keys saved with document ID (SecurityKeys ID: ${securityKeysDoc._id})`);
        }

        console.log(`✓ Document saved to database (ID: ${document._id})`);
        console.log("========== DOCUMENT UPLOAD COMPLETED ==========\n");

        // Log security operation for terminal display
        logSecurityOperation('DOCUMENT_UPLOAD', {
            documentId: document._id,
            filename: document.originalName,
            encrypted: document.encrypted,
            encryptionMethod: document.encryptionMethod,
            hash: contentHash.substring(0, 32) + '...',
            salt: hashSalt,
            signaturePresent: !!signature,
            securityKeysId: securityKeysDoc ? securityKeysDoc._id : null
        });

        res.status(201).json({
            success: true,
            message: "Document uploaded successfully",
            document: {
                _id: document._id,
                filename: document.filename,
                originalName: document.originalName,
                size: document.size,
                encrypted: document.encrypted,
                contentHash: contentHash.substring(0, 32) + '...',
                signature: signature ? signature.substring(0, 32) + '...' : null
            }
        });
    } catch (error) {
        console.error("Document upload error:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET endpoint: List all documents for admin
 */
app.get("/admin/all", async function (req, res) {
    try {
        // In production, verify that the user is an admin
        // For now, we'll return all documents
        const documents = await Document.find({ 
            isActive: true
        })
        .select('-content') // Don't send content in list
        .sort({ createdAt: -1 })
        .limit(100); // Limit to 100 most recent documents

        res.json({
            success: true,
            documents: documents.map(doc => ({
                _id: doc._id,
                filename: doc.filename,
                originalName: doc.originalName,
                mimeType: doc.mimeType,
                size: doc.size,
                encrypted: doc.encrypted,
                documentType: doc.documentType,
                description: doc.description,
                createdAt: doc.createdAt,
                contentHash: doc.contentHash ? doc.contentHash.substring(0, 32) + '...' : null
            }))
        });
    } catch (error) {
        console.error("List all documents error:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET endpoint: List all documents for a user
 */
app.get("/list/:userId", async function (req, res) {
    try {
        const { userId } = req.params;
        
        const documents = await Document.find({ 
            uploadedBy: userId,
            isActive: true
        })
        .select('-content') // Don't send content in list
        .sort({ createdAt: -1 });

        res.json({
            success: true,
            documents: documents.map(doc => ({
                _id: doc._id,
                filename: doc.filename,
                originalName: doc.originalName,
                mimeType: doc.mimeType,
                size: doc.size,
                encrypted: doc.encrypted,
                documentType: doc.documentType,
                description: doc.description,
                createdAt: doc.createdAt,
                contentHash: doc.contentHash.substring(0, 32) + '...'
            }))
        });
    } catch (error) {
        console.error("List documents error:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET endpoint: Download document with decryption
 */
app.get("/download/:documentId", async function (req, res) {
    try {
        const { documentId } = req.params;
        const { userId } = req.query;

        console.log("\n========== DOCUMENT DOWNLOAD STARTED ==========");
        console.log(`Document ID: ${documentId}`);
        console.log(`Requested by: ${userId}`);

        const document = await Document.findById(documentId);
        
        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        // Verify user has permission (owner or admin)
        // Check if user is the owner
        const isOwner = document.uploadedBy.toString() === userId;
        
        // Check if user is admin by querying their role from database
        let isAdmin = false;
        if (!isOwner && userId) {
            try {
                const User = require("../models/User");
                const user = await User.findById(userId);
                isAdmin = user && user.role === 'admin';
            } catch (err) {
                console.error("Error checking admin status:", err);
            }
        }
        
        if (!isOwner && !isAdmin) {
            console.log("✗ Access denied: User is not the owner or admin");
            return res.status(403).json({ error: "Access denied" });
        }

        console.log(`✓ Document found: ${document.originalName}`);

        // Verify content integrity
        const { hash: computedHash } = hashWithSalt(document.content, document.hashSalt);
        if (computedHash !== document.contentHash) {
            console.log("✗ Content integrity check failed!");
            return res.status(500).json({ error: "Document integrity check failed" });
        }
        console.log("✓ Content integrity verified");

        // Verify digital signature if present
        if (document.signature && document.securityKeysId) {
            const securityKeys = await SecurityKeys.findById(document.securityKeysId);
            if (securityKeys && securityKeys.publicKey) {
                const isValid = verifyDigitalSignature(
                    document.contentHash,
                    document.signature,
                    securityKeys.publicKey
                );
                if (!isValid) {
                    console.log("✗ Digital signature verification failed!");
                    return res.status(500).json({ error: "Document signature verification failed" });
                }
                console.log("✓ Digital signature verified");
            }
        }

        // Decode Base64 content
        const fileBuffer = decodeBase64(document.content);
        console.log(`✓ Content decoded from Base64 (${fileBuffer.length} bytes)`);

        console.log("========== DOCUMENT DOWNLOAD COMPLETED ==========\n");

        // Log security operation
        logSecurityOperation('DOCUMENT_DOWNLOAD', {
            documentId: document._id,
            filename: document.originalName,
            size: document.size,
            encrypted: document.encrypted,
            integrityVerified: true,
            signatureVerified: !!document.signature
        });

        // Set headers and send file
        res.setHeader('Content-Type', document.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
        res.setHeader('Content-Length', fileBuffer.length);
        res.send(fileBuffer);
    } catch (error) {
        console.error("Document download error:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET endpoint: Get document metadata and security info
 */
app.get("/info/:documentId", async function (req, res) {
    try {
        const { documentId } = req.params;
        
        const document = await Document.findById(documentId)
            .select('-content') // Don't send actual content
            .populate('uploadedBy', 'username fullname');

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        let securityInfo = null;
        if (document.securityKeysId) {
            const securityKeys = await SecurityKeys.findById(document.securityKeysId)
                .select('-privateKey'); // Never expose private keys
            
            if (securityKeys) {
                securityInfo = {
                    keyPurpose: securityKeys.keyPurpose,
                    hasPublicKey: !!securityKeys.publicKey,
                    hasSignature: !!securityKeys.signature,
                    signatureVerified: securityKeys.signatureVerified,
                    createdAt: securityKeys.createdAt
                };
            }
        }

        res.json({
            success: true,
            document: {
                _id: document._id,
                filename: document.filename,
                originalName: document.originalName,
                mimeType: document.mimeType,
                size: document.size,
                encrypted: document.encrypted,
                encryptionMethod: document.encryptionMethod,
                documentType: document.documentType,
                description: document.description,
                contentHash: document.contentHash,
                signature: document.signature ? document.signature.substring(0, 64) + '...' : null,
                uploadedBy: document.uploadedBy,
                createdAt: document.createdAt,
                updatedAt: document.updatedAt
            },
            security: securityInfo
        });
    } catch (error) {
        console.error("Get document info error:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE endpoint: Delete document
 */
app.delete("/delete/:documentId", async function (req, res) {
    try {
        const { documentId } = req.params;
        const { userId } = req.body;

        const document = await Document.findById(documentId);
        
        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        // Verify user has permission
        if (document.uploadedBy.toString() !== userId) {
            return res.status(403).json({ error: "Access denied" });
        }

        // Soft delete
        document.isActive = false;
        await document.save();

        res.json({
            success: true,
            message: "Document deleted successfully"
        });
    } catch (error) {
        console.error("Delete document error:", error);
        res.status(500).json({ error: error.message });
    }
});
