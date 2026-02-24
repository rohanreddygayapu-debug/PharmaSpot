const express = require("express");
const app = express();
const SecurityKeys = require("../models/SecurityKeys");
const {
    generateDHKeyExchange,
    computeDHSharedSecret,
    encryptAES,
    decryptAES,
    createDigitalSignature,
    verifyDigitalSignature,
    generateRSAKeyPair,
    hashWithSalt,
    logSecurityOperation
} = require("../services/securityService");

module.exports = app;

/**
 * GET endpoint: Welcome message
 */
app.get("/", function (req, res) {
    res.send("Secure Messaging API - Key Exchange & Encryption");
});

/**
 * POST endpoint: Initialize key exchange for a user
 */
app.post("/init-key-exchange", async function (req, res) {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        console.log("\n========== KEY EXCHANGE INITIALIZATION ==========");
        console.log(`User ID: ${userId}`);

        // Generate Diffie-Hellman parameters
        const dhParams = generateDHKeyExchange();
        console.log("✓ DH parameters generated");
        console.log(`  Public Key: ${dhParams.publicKey.substring(0, 32)}...`);
        console.log(`  Prime: ${dhParams.prime.substring(0, 32)}...`);
        console.log(`  Generator: ${dhParams.generator}`);

        // Generate RSA keys for digital signatures
        const { publicKey, privateKey } = generateRSAKeyPair();
        console.log("✓ RSA-2048 key pair generated for signatures");

        // Check if user already has security keys
        let securityKeys = await SecurityKeys.findOne({
            entityType: 'user',
            entityId: userId,
            isActive: true
        });

        if (securityKeys) {
            // Update existing keys
            securityKeys.dhPublicKey = dhParams.publicKey;
            securityKeys.dhPrivateKey = dhParams.privateKey;
            securityKeys.dhPrime = dhParams.prime;
            securityKeys.dhGenerator = dhParams.generator;
            securityKeys.publicKey = publicKey;
            securityKeys.privateKey = privateKey;
            securityKeys.keyPurpose = 'messaging';
            await securityKeys.save();
            console.log(`✓ Updated existing security keys (ID: ${securityKeys._id})`);
        } else {
            // Create new security keys
            securityKeys = new SecurityKeys({
                entityType: 'user',
                entityId: userId,
                dhPublicKey: dhParams.publicKey,
                dhPrivateKey: dhParams.privateKey,
                dhPrime: dhParams.prime,
                dhGenerator: dhParams.generator,
                publicKey: publicKey,
                privateKey: privateKey,
                keyPurpose: 'messaging'
            });
            await securityKeys.save();
            console.log(`✓ Created new security keys (ID: ${securityKeys._id})`);
        }

        console.log("========== KEY EXCHANGE INITIALIZATION COMPLETED ==========\n");

        // Log to terminal
        logSecurityOperation('KEY_EXCHANGE_INIT', {
            userId: userId,
            dhPublicKey: dhParams.publicKey.substring(0, 64) + '...',
            rsaPublicKey: publicKey.substring(0, 100) + '...',
            keyPurpose: 'messaging'
        });

        res.json({
            success: true,
            message: "Key exchange initialized",
            publicKey: dhParams.publicKey,
            prime: dhParams.prime,
            generator: dhParams.generator,
            rsaPublicKey: publicKey
        });
    } catch (error) {
        console.error("Key exchange init error:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST endpoint: Complete key exchange and compute shared secret
 */
app.post("/complete-key-exchange", async function (req, res) {
    try {
        const { userId, otherUserId } = req.body;
        
        if (!userId || !otherUserId) {
            return res.status(400).json({ error: "Both user IDs are required" });
        }

        console.log("\n========== COMPLETING KEY EXCHANGE ==========");
        console.log(`User 1: ${userId}`);
        console.log(`User 2: ${otherUserId}`);

        // Get security keys for both users
        const user1Keys = await SecurityKeys.findOne({
            entityType: 'user',
            entityId: userId,
            isActive: true
        });

        const user2Keys = await SecurityKeys.findOne({
            entityType: 'user',
            entityId: otherUserId,
            isActive: true
        });

        if (!user1Keys || !user2Keys) {
            return res.status(404).json({ error: "Key exchange not initialized for one or both users" });
        }

        console.log("✓ Retrieved keys for both users");

        // Compute shared secret for user1
        const sharedSecret = computeDHSharedSecret(
            user1Keys.dhPrivateKey,
            user2Keys.dhPublicKey,
            user1Keys.dhPrime,
            user1Keys.dhGenerator
        );

        console.log("✓ Shared secret computed");
        console.log(`  Shared Secret: ${sharedSecret.substring(0, 32)}...`);

        // Store shared secret for both users
        user1Keys.sharedSecret = sharedSecret;
        await user1Keys.save();
        
        // User2 also needs the shared secret
        user2Keys.sharedSecret = sharedSecret;
        await user2Keys.save();

        console.log("========== KEY EXCHANGE COMPLETED ==========\n");

        // Log to terminal
        logSecurityOperation('KEY_EXCHANGE_COMPLETE', {
            userId: userId,
            otherUserId: otherUserId,
            sharedSecret: sharedSecret.substring(0, 64) + '...'
        });

        res.json({
            success: true,
            message: "Key exchange completed",
            sharedSecret: sharedSecret.substring(0, 32) + '...' // Show partial for verification
        });
    } catch (error) {
        console.error("Key exchange complete error:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST endpoint: Send encrypted message
 */
app.post("/send-message", async function (req, res) {
    try {
        const { senderId, recipientId, message } = req.body;
        
        if (!senderId || !recipientId || !message) {
            return res.status(400).json({ error: "Sender ID, recipient ID, and message are required" });
        }

        console.log("\n========== SENDING ENCRYPTED MESSAGE ==========");
        console.log(`From: ${senderId}`);
        console.log(`To: ${recipientId}`);
        console.log(`Message length: ${message.length} characters`);

        // Get sender's keys
        const senderKeys = await SecurityKeys.findOne({
            entityType: 'user',
            entityId: senderId,
            isActive: true
        });

        if (!senderKeys || !senderKeys.sharedSecret) {
            return res.status(400).json({ 
                error: "Key exchange not completed. Please initialize key exchange first." 
            });
        }

        // Encrypt message using AES with shared secret
        const { encrypted, iv } = encryptAES(message, senderKeys.sharedSecret);
        console.log("✓ Message encrypted with AES-256");
        console.log(`  Encrypted: ${encrypted.substring(0, 32)}...`);
        console.log(`  IV: ${iv}`);

        // Create digital signature
        const signature = createDigitalSignature(encrypted, senderKeys.privateKey);
        console.log("✓ Digital signature created");
        console.log(`  Signature: ${signature.substring(0, 32)}...`);

        // Generate hash of the message for integrity
        const { hash, salt } = hashWithSalt(message);
        console.log("✓ Message hash generated");
        console.log(`  Hash: ${hash.substring(0, 32)}...`);
        console.log(`  Salt: ${salt}`);

        console.log("========== MESSAGE SENT ==========\n");

        // Log to terminal
        logSecurityOperation('MESSAGE_SEND', {
            from: senderId,
            to: recipientId,
            encrypted: encrypted.substring(0, 64) + '...',
            signature: signature.substring(0, 64) + '...',
            hash: hash,
            iv: iv
        });

        res.json({
            success: true,
            message: "Message sent securely",
            encrypted: encrypted,
            iv: iv,
            signature: signature,
            hash: hash,
            salt: salt
        });
    } catch (error) {
        console.error("Send message error:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST endpoint: Receive and decrypt message
 */
app.post("/receive-message", async function (req, res) {
    try {
        const { recipientId, senderId, encrypted, iv, signature, hash, salt } = req.body;
        
        if (!recipientId || !senderId || !encrypted || !iv) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        console.log("\n========== RECEIVING ENCRYPTED MESSAGE ==========");
        console.log(`To: ${recipientId}`);
        console.log(`From: ${senderId}`);

        // Get recipient's keys
        const recipientKeys = await SecurityKeys.findOne({
            entityType: 'user',
            entityId: recipientId,
            isActive: true
        });

        // Get sender's keys for signature verification
        const senderKeys = await SecurityKeys.findOne({
            entityType: 'user',
            entityId: senderId,
            isActive: true
        });

        if (!recipientKeys || !recipientKeys.sharedSecret) {
            return res.status(400).json({ 
                error: "Key exchange not completed" 
            });
        }

        // Verify digital signature
        if (signature && senderKeys && senderKeys.publicKey) {
            const isValid = verifyDigitalSignature(encrypted, signature, senderKeys.publicKey);
            if (!isValid) {
                console.log("✗ Signature verification failed!");
                return res.status(400).json({ error: "Message signature verification failed" });
            }
            console.log("✓ Digital signature verified");
        }

        // Decrypt message
        const decrypted = decryptAES(encrypted, recipientKeys.sharedSecret, iv);
        console.log("✓ Message decrypted");
        console.log(`  Decrypted: ${decrypted}`);

        // Verify hash if provided
        if (hash && salt) {
            const { hash: computedHash } = hashWithSalt(decrypted, salt);
            if (computedHash !== hash) {
                console.log("✗ Hash verification failed!");
                return res.status(400).json({ error: "Message integrity check failed" });
            }
            console.log("✓ Message integrity verified");
        }

        console.log("========== MESSAGE RECEIVED ==========\n");

        // Log to terminal
        logSecurityOperation('MESSAGE_RECEIVE', {
            from: senderId,
            to: recipientId,
            decrypted: decrypted,
            signatureVerified: !!signature,
            integrityVerified: !!(hash && salt)
        });

        res.json({
            success: true,
            message: "Message received and decrypted",
            decrypted: decrypted,
            signatureVerified: !!signature,
            integrityVerified: !!(hash && salt)
        });
    } catch (error) {
        console.error("Receive message error:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET endpoint: Get user's public keys
 */
app.get("/public-keys/:userId", async function (req, res) {
    try {
        const { userId } = req.params;
        
        const securityKeys = await SecurityKeys.findOne({
            entityType: 'user',
            entityId: userId,
            isActive: true
        });

        if (!securityKeys) {
            return res.status(404).json({ error: "No keys found for user" });
        }

        res.json({
            success: true,
            dhPublicKey: securityKeys.dhPublicKey,
            prime: securityKeys.dhPrime,
            generator: securityKeys.dhGenerator,
            rsaPublicKey: securityKeys.publicKey
        });
    } catch (error) {
        console.error("Get public keys error:", error);
        res.status(500).json({ error: error.message });
    }
});
