const app = require("express")();
const Chat = require("../models/Chat");
const SecurityKeys = require("../models/SecurityKeys");
const {
    generateRSAKeyPair,
    encryptHybrid,
    decryptHybrid,
    createDigitalSignature,
    verifyDigitalSignature,
    logSecurityOperation
} = require("../services/securityService");

module.exports = app;

// Initialize RSA keys for doctor-patient communication
app.post("/init-keys", async function (req, res) {
    try {
        const { userId, userRole } = req.body;
        
        if (!userId || !userRole) {
            return res.status(400).json({ error: "User ID and role are required" });
        }

        console.log("\n========== RSA KEY GENERATION ==========");
        console.log(`User ID: ${userId}`);
        console.log(`Role: ${userRole}`);

        // Generate RSA key pair for this user
        const { publicKey, privateKey } = generateRSAKeyPair();
        console.log("✓ RSA-2048 key pair generated");
        console.log(`  Public Key (first 100 chars): ${publicKey.substring(0, 100)}...`);
        console.log(`  Private Key (first 100 chars): ${privateKey.substring(0, 100)}...`);

        // Check if user already has keys
        let securityKeys = await SecurityKeys.findOne({
            entityType: userRole,
            entityId: userId,
            keyPurpose: 'chat',
            isActive: true
        });

        if (securityKeys) {
            // Update existing keys
            securityKeys.publicKey = publicKey;
            securityKeys.privateKey = privateKey;
            await securityKeys.save();
            console.log(`✓ Updated existing keys (ID: ${securityKeys._id})`);
        } else {
            // Create new security keys
            securityKeys = new SecurityKeys({
                entityType: userRole,
                entityId: userId,
                publicKey: publicKey,
                privateKey: privateKey,
                keyPurpose: 'chat'
            });
            await securityKeys.save();
            console.log(`✓ Created new keys (ID: ${securityKeys._id})`);
        }

        console.log("========== KEY GENERATION COMPLETED ==========\n");

        logSecurityOperation('RSA_KEY_GENERATION', {
            userId: userId,
            userRole: userRole,
            publicKeyLength: publicKey.length,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            message: "RSA keys initialized",
            publicKey: publicKey
        });
    } catch (error) {
        console.error("Key initialization error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get public key for a user
app.get("/public-key/:userId/:userRole", async function (req, res) {
    try {
        const { userId, userRole } = req.params;
        
        const securityKeys = await SecurityKeys.findOne({
            entityType: userRole,
            entityId: userId,
            keyPurpose: 'chat',
            isActive: true
        });

        if (!securityKeys) {
            return res.status(404).json({ error: "No keys found for user" });
        }

        res.json({
            success: true,
            publicKey: securityKeys.publicKey
        });
    } catch (error) {
        console.error("Get public key error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get all chats for a user
app.get("/user/:userId", async function (req, res) {
    try {
        const chats = await Chat.find({ 
            $or: [{ userId: req.params.userId }, { doctorId: req.params.userId }] 
        })
        .populate('userId', 'username fullname')
        .populate('doctorId', 'username fullname')
        .sort({ lastMessageAt: -1 });
        
        res.json(chats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get specific chat between user and doctor
app.get("/conversation/:userId/:doctorId", async function (req, res) {
    try {
        let chat = await Chat.findOne({ 
            userId: req.params.userId, 
            doctorId: req.params.doctorId 
        })
        .populate('userId', 'username fullname')
        .populate('doctorId', 'username fullname');

        if (!chat) {
            // Create new chat if doesn't exist
            chat = new Chat({
                userId: req.params.userId,
                doctorId: req.params.doctorId,
                messages: []
            });
            await chat.save();
        }

        res.json(chat);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Decrypt messages for a specific user viewing a conversation
// NOTE: This endpoint is for verification/audit purposes
// The message field already contains the plaintext for display
// This endpoint can be used to verify encrypted data integrity
app.post("/decrypt-messages", async function (req, res) {
    try {
        const { userId, doctorId, viewerId, viewerRole } = req.body;

        if (!userId || !doctorId || !viewerId || !viewerRole) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        console.log("\n========== DECRYPTING MESSAGES ==========");
        console.log(`Viewer: ${viewerId} (${viewerRole})`);
        console.log(`Conversation: User ${userId} <-> Doctor ${doctorId}`);

        // Get viewer's private key for decryption
        const viewerKeys = await SecurityKeys.findOne({
            entityType: viewerRole,
            entityId: viewerId,
            keyPurpose: 'chat',
            isActive: true
        });

        if (!viewerKeys) {
            return res.status(404).json({ error: "No keys found for viewer" });
        }

        // Get the chat
        let chat = await Chat.findOne({ userId, doctorId })
            .populate('userId', 'username fullname')
            .populate('doctorId', 'username fullname');

        if (!chat) {
            return res.status(404).json({ error: "Chat not found" });
        }

        console.log(`✓ Found ${chat.messages.length} messages`);

        // Decrypt messages that are meant for this viewer
        const decryptedMessages = [];
        let decryptedCount = 0;

        for (const msg of chat.messages) {
            let decryptedMsg = { ...msg.toObject() };

            // Decrypt if message is encrypted
            if (msg.isEncrypted) {
                // If viewer is the sender, they don't need to decrypt (they sent it plaintext)
                // Only decrypt if viewer is the recipient (not the sender)
                if (msg.senderId.toString() !== viewerId) {
                    try {
                        // Decrypt the message using hybrid decryption
                        const decrypted = decryptHybrid(
                            msg.encryptedKey,
                            msg.encryptedData,
                            msg.encryptionIV,
                            viewerKeys.privateKey
                        );
                        
                        // Verify signature if present
                        if (msg.signature) {
                            // Get sender's public key
                            const senderRole = msg.senderRole;
                            const senderKeys = await SecurityKeys.findOne({
                                entityType: senderRole,
                                entityId: msg.senderId,
                                keyPurpose: 'chat',
                                isActive: true
                            });

                            if (senderKeys) {
                                const isValid = verifyDigitalSignature(
                                    msg.encryptedData, 
                                    msg.signature, 
                                    senderKeys.publicKey
                                );
                                
                                if (!isValid) {
                                    console.log(`✗ Signature verification failed for message ${msg._id}`);
                                    decryptedMsg.signatureValid = false;
                                } else {
                                    decryptedMsg.signatureValid = true;
                                }
                            }
                        }

                        decryptedMsg.message = decrypted;
                        decryptedCount++;
                        console.log(`✓ Decrypted message ${decryptedCount}: "${decrypted.substring(0, 50)}${decrypted.length > 50 ? '...' : ''}"`);
                    } catch (error) {
                        console.error(`✗ Failed to decrypt message ${msg._id}:`, error.message);
                        decryptedMsg.decryptionError = true;
                    }
                } else {
                    // Viewer is the sender - mark that decryption is not needed
                    decryptedMsg.message = '[Sent by you - encrypted for recipient]';
                    console.log(`  Message sent by viewer - showing placeholder`);
                }
            }

            decryptedMessages.push(decryptedMsg);
        }

        console.log(`✓ Successfully decrypted ${decryptedCount} messages`);
        console.log("========== DECRYPTION COMPLETED ==========\n");

        logSecurityOperation('CHAT_MESSAGES_DECRYPT', {
            viewerId: viewerId,
            viewerRole: viewerRole,
            totalMessages: chat.messages.length,
            decryptedCount: decryptedCount,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            chat: {
                ...chat.toObject(),
                messages: decryptedMessages
            },
            decryptedCount: decryptedCount
        });
    } catch (error) {
        console.error("Decrypt messages error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Send message with RSA + AES hybrid encryption
app.post("/message", async function (req, res) {
    try {
        const { userId, doctorId, senderId, senderRole, message } = req.body;

        if (!userId || !doctorId || !senderId || !senderRole || !message) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        console.log("\n========== SENDING ENCRYPTED MESSAGE ==========");
        console.log(`From: ${senderId} (${senderRole})`);
        console.log(`To: ${senderRole === 'user' ? doctorId : userId}`);
        console.log(`Original Message: "${message}"`);
        console.log(`Message Length: ${message.length} characters`);

        // Determine recipient ID based on sender role
        const recipientId = senderRole === 'user' ? doctorId : userId;
        const recipientRole = senderRole === 'user' ? 'doctor' : 'user';

        // Get or create recipient's keys
        let recipientKeys = await SecurityKeys.findOne({
            entityType: recipientRole,
            entityId: recipientId,
            keyPurpose: 'chat',
            isActive: true
        });

        // Auto-initialize recipient keys if not found
        if (!recipientKeys) {
            console.log(`⚠ Recipient keys not found. Auto-initializing for ${recipientRole} ${recipientId}...`);
            const { publicKey, privateKey } = generateRSAKeyPair();
            recipientKeys = new SecurityKeys({
                entityType: recipientRole,
                entityId: recipientId,
                publicKey: publicKey,
                privateKey: privateKey,
                keyPurpose: 'chat',
                isActive: true
            });
            await recipientKeys.save();
            console.log(`✓ Recipient keys auto-initialized (ID: ${recipientKeys._id})`);
        }

        // Get or create sender's keys
        let senderKeys = await SecurityKeys.findOne({
            entityType: senderRole,
            entityId: senderId,
            keyPurpose: 'chat',
            isActive: true
        });

        // Auto-initialize sender keys if not found
        if (!senderKeys) {
            console.log(`⚠ Sender keys not found. Auto-initializing for ${senderRole} ${senderId}...`);
            const { publicKey, privateKey } = generateRSAKeyPair();
            senderKeys = new SecurityKeys({
                entityType: senderRole,
                entityId: senderId,
                publicKey: publicKey,
                privateKey: privateKey,
                keyPurpose: 'chat',
                isActive: true
            });
            await senderKeys.save();
            console.log(`✓ Sender keys auto-initialized (ID: ${senderKeys._id})`);
        }

        let encryptedKey = null;
        let encryptedData = null;
        let encryptionIV = null;
        let signature = null;
        let isEncrypted = false;

        // Now both parties have keys, use hybrid encryption (RSA + AES)
        // Encrypt message with hybrid encryption (RSA for key, AES for data)
        const encrypted = encryptHybrid(message, recipientKeys.publicKey);
        encryptedKey = encrypted.encryptedKey;
        encryptedData = encrypted.encryptedData;
        encryptionIV = encrypted.iv;
        
        console.log("✓ Message encrypted with RSA + AES hybrid encryption");
        console.log(`  AES Key (encrypted with RSA): ${encryptedKey.substring(0, 64)}...`);
        console.log(`  Encrypted Data (AES): ${encryptedData.substring(0, 64)}...`);
        console.log(`  IV: ${encryptionIV}`);

        // Sign encrypted data with sender's private key
        signature = createDigitalSignature(encryptedData, senderKeys.privateKey);
        console.log("✓ Digital signature created");
        console.log(`  Signature (first 64 chars): ${signature.substring(0, 64)}...`);

        isEncrypted = true;

        let chat = await Chat.findOne({ userId, doctorId });

        if (!chat) {
            chat = new Chat({
                userId,
                doctorId,
                messages: []
            });
        }

        // Store message with encryption data
        chat.messages.push({
            senderId,
            senderRole,
            message: message, // Store original message for display
            encryptedKey: encryptedKey,
            encryptedData: encryptedData,
            encryptionIV: encryptionIV,
            signature: signature,
            isEncrypted: isEncrypted,
            timestamp: new Date()
        });

        chat.lastMessage = message; // Store original message for preview
        chat.lastMessageAt = new Date();

        await chat.save();

        console.log("✓ Message saved to database");
        console.log("========== MESSAGE SENT SUCCESSFULLY ==========\n");

        logSecurityOperation('CHAT_MESSAGE_SEND', {
            from: senderId,
            to: recipientId,
            encrypted: isEncrypted,
            messageLength: message.length,
            encryptionMethod: 'RSA+AES-Hybrid',
            timestamp: new Date().toISOString()
        });

        res.json({ 
            success: true, 
            chat,
            encrypted: isEncrypted 
        });
    } catch (error) {
        console.error("Send message error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Mark messages as read
app.post("/read/:chatId", async function (req, res) {
    try {
        const { userId } = req.body;
        
        const chat = await Chat.findById(req.params.chatId);
        if (!chat) {
            return res.status(404).json({ error: "Chat not found" });
        }

        // Mark all messages not sent by this user as read
        chat.messages.forEach(msg => {
            if (msg.senderId.toString() !== userId) {
                msg.read = true;
            }
        });

        await chat.save();

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Close chat
app.post("/close/:chatId", async function (req, res) {
    try {
        const chat = await Chat.findByIdAndUpdate(
            req.params.chatId,
            { status: 'closed' },
            { new: true }
        );

        if (!chat) {
            return res.status(404).json({ error: "Chat not found" });
        }

        res.json({ success: true, chat });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
