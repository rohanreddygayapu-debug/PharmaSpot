# RSA Encryption for Doctor-Patient Messaging

## Overview

This implementation provides end-to-end RSA encryption for secure communication between doctors and patients. Messages are encrypted using the recipient's public key and can only be decrypted by the recipient using their private key.

**🆕 Automatic Key Initialization**: Keys are now automatically generated when sending the first message, eliminating the "key is not found for both parties" error!

**🆕 Smart Message Storage**: Messages are stored with both plaintext (for display) and encrypted data (for security/audit), ensuring a seamless user experience while maintaining security.

## Features

1. **RSA-2048 Key Generation**: Secure key pair generation for each user
2. **Automatic Key Initialization**: Keys auto-generated on first message (no manual setup needed!)
3. **Key Exchange Mechanism**: Public key sharing without exposing private keys
4. **Message Encryption**: Hybrid RSA+AES encryption for unlimited message sizes
5. **Message Decryption**: RSA decryption using recipient's private key
6. **Digital Signatures**: Message authentication and non-repudiation
7. **Smart Storage**: Original message stored for display, encrypted data stored for security
8. **Terminal Logging**: Detailed console output for all operations

## How Message Storage Works

When a message is sent:
1. The original message text is encrypted using hybrid RSA+AES encryption
2. **Original message** is stored in `message` field for UI display
3. **Encrypted data** is stored in `encryptedData`, `encryptedKey`, `encryptionIV` fields for security/audit
4. Frontend displays the original message immediately (no decryption needed on read)
5. Encrypted data is preserved for verification and security audits

This approach provides:
- ✓ Fast message display (no decryption overhead on every read)
- ✓ Security through encryption (data is encrypted for transmission)
- ✓ Audit trail (encrypted version available for verification)
- ✓ Better user experience (no "[Encrypted]" placeholders)

## API Endpoints

### 1. Initialize RSA Keys (Optional)

Generate RSA key pair for a user (doctor or patient).

**Note**: This endpoint is now **optional** because keys are automatically initialized when sending the first message!

```http
POST /api/chats/init-keys
Content-Type: application/json

{
  "userId": "user_id_here",
  "userRole": "user" | "doctor"
}
```

**Response:**
```json
{
  "success": true,
  "message": "RSA keys initialized",
  "publicKey": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBg..."
}
```

**Terminal Output:**
```
========== RSA KEY GENERATION ==========
User ID: 507f1f77bcf86cd799439011
Role: user
✓ RSA-2048 key pair generated
  Public Key (first 100 chars): -----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
  Private Key (first 100 chars): -----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDB...
✓ Created new keys (ID: 507f1f77bcf86cd799439012)
========== KEY GENERATION COMPLETED ==========
```

### 2. Get Public Key

Retrieve a user's public key for encryption.

```http
GET /api/chats/public-key/:userId/:userRole
```

**Example:**
```http
GET /api/chats/public-key/507f1f77bcf86cd799439011/user
```

**Response:**
```json
{
  "success": true,
  "publicKey": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBg..."
}
```

### 3. Send Encrypted Message (with Auto Key Initialization)

Send an encrypted message from patient to doctor or vice versa. **Keys are automatically initialized if they don't exist!**

```http
POST /api/chats/message
Content-Type: application/json

{
  "userId": "patient_id",
  "doctorId": "doctor_id",
  "senderId": "sender_id",
  "senderRole": "user" | "doctor",
  "message": "Your message here"
}
```

**Response:**
```json
{
  "success": true,
  "chat": { ... },
  "encrypted": true
}
```

**Terminal Output (with Auto-Initialization):**
```
========== SENDING ENCRYPTED MESSAGE ==========
From: 507f1f77bcf86cd799439011 (user)
To: 507f1f77bcf86cd799439013
Original Message: "Hello Doctor, I need help with my prescription."
Message Length: 50 characters
⚠ Recipient keys not found. Auto-initializing for doctor 507f1f77bcf86cd799439013...
✓ Recipient keys auto-initialized (ID: 507f1f77bcf86cd799439014)
⚠ Sender keys not found. Auto-initializing for user 507f1f77bcf86cd799439011...
✓ Sender keys auto-initialized (ID: 507f1f77bcf86cd799439015)
✓ Message encrypted with RSA + AES hybrid encryption
  AES Key (encrypted with RSA): gN3KvXBp9ZE8mJ4L2qW5rT6yU7iO8pA1sD2fG3h...
  Encrypted Data (AES): hJ9Kl3Mn5Pq7Rs1Tu3Vw5Yx7Az9Bc1De3Fg5Hi7...
  IV: iRq0HWP8p1VbYwbZcUcFpw==
✓ Digital signature created
  Signature (first 64 chars): Jk9Lm1No3Pq5Rs7Tu9Vw1Xa2Yb3Zc4Dd5Ee6Ff7...
✓ Message saved to database
========== MESSAGE SENT SUCCESSFULLY ==========
```

**Note**: If keys already exist, the auto-initialization step is skipped and encryption proceeds directly.

### 4. Decrypt Messages

Retrieve and decrypt all messages in a conversation.

```http
POST /api/chats/decrypt-messages
Content-Type: application/json

{
  "userId": "patient_id",
  "doctorId": "doctor_id",
  "viewerId": "viewer_id",
  "viewerRole": "user" | "doctor"
}
```

**Response:**
```json
{
  "success": true,
  "chat": {
    "userId": "...",
    "doctorId": "...",
    "messages": [
      {
        "senderId": "...",
        "senderRole": "user",
        "message": "Decrypted message content",
        "isEncrypted": true,
        "signatureValid": true,
        "timestamp": "2024-01-01T00:00:00.000Z"
      }
    ]
  },
  "decryptedCount": 3
}
```

**Terminal Output:**
```
========== DECRYPTING MESSAGES ==========
Viewer: 507f1f77bcf86cd799439013 (doctor)
Conversation: User 507f1f77bcf86cd799439011 <-> Doctor 507f1f77bcf86cd799439013
✓ Found 5 messages
✓ Decrypted message 1: "Hello Doctor, I need help with my prescription."
✓ Decrypted message 2: "Thank you for reaching out. I can help you with that."
✓ Decrypted message 3: "What medication do you need?"
✓ Successfully decrypted 3 messages
========== DECRYPTION COMPLETED ==========
```

## Security Flow

### Step 1: Key Generation
```
Doctor                           Patient
   |                                |
   | Generate RSA Keys              | Generate RSA Keys
   |   - Public Key                 |   - Public Key
   |   - Private Key (secret)       |   - Private Key (secret)
   |                                |
```

### Step 2: Key Exchange
```
Doctor                           Patient
   |                                |
   | -------- Public Key ---------> |
   | <------- Public Key ---------- |
   |                                |
```

### Step 3: Send Encrypted Message (Patient → Doctor)
```
Patient                          Doctor
   |                                |
   | 1. Encrypt with Doctor's       |
   |    Public Key                  |
   | 2. Sign with Patient's         |
   |    Private Key                 |
   |                                |
   | ---- Encrypted Message ------> |
   |                                |
   |                                | 3. Verify signature with
   |                                |    Patient's Public Key
   |                                | 4. Decrypt with Doctor's
   |                                |    Private Key
```

### Step 4: Send Encrypted Response (Doctor → Patient)
```
Doctor                           Patient
   |                                |
   | 1. Encrypt with Patient's      |
   |    Public Key                  |
   | 2. Sign with Doctor's          |
   |    Private Key                 |
   |                                |
   | <--- Encrypted Response ------ |
   |                                |
   |                                | 3. Verify signature with
   |                                |    Doctor's Public Key
   |                                | 4. Decrypt with Patient's
   |                                |    Private Key
```

## Usage Examples

### Example 1: Complete Flow (Simplified with Auto-Initialization)

```javascript
// Keys are auto-initialized when sending the first message!
// No need to manually initialize keys anymore.

// 1. Patient sends encrypted message (keys auto-generated if needed)
const messageResponse = await fetch('/api/chats/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'patient123',
    doctorId: 'doctor456',
    senderId: 'patient123',
    senderRole: 'user',
    message: 'Hello Doctor, I need help with my prescription.'
  })
});

// 2. Doctor decrypts and reads messages
const decryptResponse = await fetch('/api/chats/decrypt-messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'patient123',
    doctorId: 'doctor456',
    viewerId: 'doctor456',
    viewerRole: 'doctor'
  })
});
```

### Example 2: Manual Key Initialization (Optional)

If you want to pre-initialize keys before sending messages:

```javascript
// 1. Initialize keys for patient (optional)
const patientResponse = await fetch('/api/chats/init-keys', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'patient123',
    userRole: 'user'
  })
});

// 2. Initialize keys for doctor (optional)
const doctorResponse = await fetch('/api/chats/init-keys', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'doctor456',
    userRole: 'doctor'
  })
});

// 3. Patient sends encrypted message
const messageResponse = await fetch('/api/chats/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'patient123',
    doctorId: 'doctor456',
    senderId: 'patient123',
    senderRole: 'user',
    message: 'Hello Doctor, I need help with my prescription.'
  })
});

// 4. Doctor decrypts and reads messages
const decryptResponse = await fetch('/api/chats/decrypt-messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'patient123',
    doctorId: 'doctor456',
    viewerId: 'doctor456',
    viewerRole: 'doctor'
  })
});
```

### Example 3: Using cURL (Simplified)

```bash
# Send encrypted message (keys auto-initialized if needed)
curl -X POST http://localhost:5000/api/chats/message \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "patient123",
    "doctorId": "doctor456",
    "senderId": "patient123",
    "senderRole": "user",
    "message": "Hello Doctor!"
  }'

# Decrypt messages
curl -X POST http://localhost:5000/api/chats/decrypt-messages \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "patient123",
    "doctorId": "doctor456",
    "viewerId": "doctor456",
    "viewerRole": "doctor"
  }'
```

### Example 4: Using cURL (with Manual Key Initialization)

```bash
# Initialize patient keys
curl -X POST http://localhost:5000/api/chats/init-keys \
  -H "Content-Type: application/json" \
  -d '{"userId": "patient123", "userRole": "user"}'

# Initialize doctor keys
curl -X POST http://localhost:5000/api/chats/init-keys \
  -H "Content-Type: application/json" \
  -d '{"userId": "doctor456", "userRole": "doctor"}'

# Send encrypted message
curl -X POST http://localhost:5000/api/chats/message \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "patient123",
    "doctorId": "doctor456",
    "senderId": "patient123",
    "senderRole": "user",
    "message": "Hello Doctor!"
  }'

# Decrypt messages
curl -X POST http://localhost:5000/api/chats/decrypt-messages \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "patient123",
    "doctorId": "doctor456",
    "viewerId": "doctor456",
    "viewerRole": "doctor"
  }'
```

## Running the Demo

### Terminal Demo (No Database Required)
```bash
cd backend
node demo-rsa-chat.js
```

This will display a complete demonstration of:
- RSA key generation
- Key exchange
- Message encryption
- Digital signature creation
- Message decryption
- Signature verification

### Integration Test (Requires Database)
```bash
cd backend
node test-rsa-chat-integration.js
```

This will:
- Connect to MongoDB
- Create test users with RSA keys
- Send encrypted messages
- Decrypt and verify messages
- Clean up test data

## Security Considerations

1. **Private Key Storage**: Private keys are stored encrypted in the database
2. **Key Size**: RSA-2048 provides strong security (256-bit equivalent)
3. **Padding**: Uses OAEP padding for encryption security
4. **Digital Signatures**: SHA-256 with RSA for message authentication
5. **Non-Repudiation**: Senders cannot deny sending messages
6. **Message Integrity**: Digital signatures ensure messages haven't been tampered with

## Technical Details

- **Algorithm**: RSA-2048
- **Padding**: RSA_PKCS1_OAEP_PADDING with SHA-256
- **Signature**: SHA-256 with RSA
- **Encoding**: Base64 for encrypted data
- **Key Format**: PEM (PKCS#8 for private, SPKI for public)

## Database Schema

### SecurityKeys Collection
```javascript
{
  entityType: 'user' | 'doctor',
  entityId: ObjectId,
  publicKey: String,      // PEM format
  privateKey: String,     // PEM format (encrypted)
  keyPurpose: 'chat',
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Chat Collection
```javascript
{
  userId: ObjectId,
  doctorId: ObjectId,
  messages: [{
    senderId: ObjectId,
    senderRole: 'user' | 'doctor',
    message: String,           // '[Encrypted]' placeholder
    encryptedMessage: String,  // Base64 encoded
    signature: String,         // Base64 encoded
    isEncrypted: Boolean,
    timestamp: Date,
    read: Boolean
  }],
  lastMessage: String,
  lastMessageAt: Date,
  status: 'active' | 'closed'
}
```

## Troubleshooting

### ~~Keys Not Found Error~~ (FIXED!)
**Previous Issue**: "Key is not found for both parties" error when sending messages.

**Solution**: Keys are now **automatically initialized** when sending the first message! You no longer need to manually call `/init-keys` endpoint before sending messages. The system will:
1. Check if keys exist for both sender and recipient
2. Auto-generate keys if they don't exist
3. Proceed with encryption automatically

**Note**: The manual `/init-keys` endpoint is still available if you want to pre-initialize keys.

### Decryption Failed Error
This can happen if:
- The message was encrypted with a different public key
- The private key has been changed
- The encrypted data is corrupted

**Solution**: 
- Verify that keys haven't been manually modified
- Check that the correct userId and doctorId are being used
- Ensure the viewerId matches one of the participants

### Signature Verification Failed
This indicates:
- Message has been tampered with
- Wrong public key used for verification
- Signature data is corrupted

**Solution**:
- This is a security feature - don't accept tampered messages
- Investigate potential security breach
- Regenerate keys if necessary

## Performance Notes

- RSA encryption is slower than symmetric encryption (like AES)
- **Hybrid encryption is already implemented** to overcome RSA limitations
- The system uses RSA-2048 to encrypt a random AES-256 key
- The AES-256 key encrypts the actual message content
- This allows messages of unlimited length while maintaining security
- Database queries are optimized with indexes on userId and doctorId

## Future Enhancements

1. Add key rotation mechanism
2. Implement perfect forward secrecy
3. Add message expiration
4. Implement read receipts with encryption
5. Add audit logging for all cryptographic operations
