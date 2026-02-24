# Quick Start Guide - Security Features

This guide will help you get started with the security features in PharmaSpot.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or remote connection)
- npm or yarn

## Installation

1. **Clone the repository**
```bash
git clone https://github.com/punithsai18/Hack.git
cd Hack
```

2. **Install dependencies**
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies (optional)
cd ..
npm install
```

3. **Configure environment**
```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB connection string
```

4. **Start the server**
```bash
cd backend
npm start
```

The server will start on port 5000 by default.

## Testing Security Features

### Test 1: Security Service Functions

Run the security service test to verify all cryptographic functions work correctly:

```bash
cd backend
node test-security.js
```

Expected output:
```
========== SECURITY SERVICE TEST ==========

Test 1: Hashing with Salt
✓ Salt generated: ...
✓ Hash generated: ...
✓ Hash verification: PASSED

Test 2: RSA Encryption/Decryption
✓ RSA key pair generated
✓ Message encrypted: ...
✓ Message decrypted: ...
✓ Encryption test: PASSED

... (all tests)

All security features working correctly!
```

### Test 2: API Endpoints

Run the API integration test:

```bash
cd backend
# Make sure server is running first
npm start &

# In another terminal
node test-api.js
```

## Using Security Features

### 1. User Registration with Enhanced Security

```bash
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "email": "alice@example.com",
    "password": "MySecurePass123!",
    "fullName": "Alice Smith",
    "role": "user"
  }'
```

**What happens:**
- Password is hashed with bcrypt (10 rounds)
- Custom 16-byte salt is generated
- Password is hashed again with SHA-256 + custom salt
- RSA-2048 key pair is generated for the user
- Security keys are stored in database
- All operations are logged to terminal

**Terminal Output:**
```
========== USER REGISTRATION ==========
Username: alice
Custom Salt: 3f2a8b9c4d5e6f7a8b9c0d1e2f3a4b5c
Custom Hash: 8a7b9c4d5e6f7a8b9c0d1e2f3a4b5c6d...
Security Keys ID: 507f1f77bcf86cd799439011
========================================
```

### 2. Upload Encrypted Document

```bash
curl -X POST http://localhost:5000/api/documents/upload \
  -F "file=@/path/to/document.pdf" \
  -F "userId=USER_ID_HERE" \
  -F "documentType=medical" \
  -F "description=Lab Results" \
  -F "encrypt=true"
```

**What happens:**
- File is read into memory buffer
- Content is encoded to Base64
- SHA-256 hash is generated with random salt
- RSA-2048 key pair is generated (if encrypt=true)
- Digital signature is created using private key
- Document and keys are stored in database
- All operations are logged to terminal

**Terminal Output:**
```
========== DOCUMENT UPLOAD STARTED ==========
File: document.pdf
Size: 256000 bytes
Type: application/pdf
Uploaded by: 507f1f77bcf86cd799439012
✓ File encoded to Base64 (length: 341333)
✓ Content hash generated: 9d8e7f6a...
✓ Salt: 4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e
✓ RSA key pair generated (4096 bytes)
✓ Security keys stored (ID: 507f1f77bcf86cd799439013)
✓ Digital signature created: 5a6b7c8d...
✓ Document saved to database (ID: 507f1f77bcf86cd799439014)
========== DOCUMENT UPLOAD COMPLETED ==========
```

### 3. Download Document (Admin/Owner)

```bash
curl -X GET "http://localhost:5000/api/documents/download/DOCUMENT_ID?userId=USER_ID" \
  --output downloaded_file.pdf
```

**What happens:**
- Access control is verified (owner or admin)
- Content integrity is checked (hash verification)
- Digital signature is verified (if present)
- Base64 content is decoded to buffer
- File is sent as download
- All operations are logged to terminal

**Terminal Output:**
```
========== DOCUMENT DOWNLOAD STARTED ==========
Document ID: 507f1f77bcf86cd799439014
Requested by: 507f1f77bcf86cd799439012
✓ Document found: document.pdf
✓ Content integrity verified
✓ Digital signature verified
✓ Content decoded from Base64 (256000 bytes)
========== DOCUMENT DOWNLOAD COMPLETED ==========
```

### 4. Initialize Key Exchange for Secure Messaging

**Step 1: Alice initializes key exchange**
```bash
curl -X POST http://localhost:5000/api/messaging/init-key-exchange \
  -H "Content-Type: application/json" \
  -d '{"userId": "alice_user_id"}'
```

**Step 2: Bob initializes key exchange**
```bash
curl -X POST http://localhost:5000/api/messaging/init-key-exchange \
  -H "Content-Type: application/json" \
  -d '{"userId": "bob_user_id"}'
```

**Step 3: Alice completes key exchange with Bob**
```bash
curl -X POST http://localhost:5000/api/messaging/complete-key-exchange \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "alice_user_id",
    "otherUserId": "bob_user_id"
  }'
```

**What happens:**
- Diffie-Hellman parameters are generated (2048-bit)
- Public/private key pairs are created
- Shared secret is computed using both parties' keys
- Keys and shared secret are stored in database
- All operations are logged to terminal

### 5. Send Encrypted Message

```bash
curl -X POST http://localhost:5000/api/messaging/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "senderId": "alice_user_id",
    "recipientId": "bob_user_id",
    "message": "Hello Bob! This is confidential."
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent securely",
  "encrypted": "D5E6F7A8B9C0D1E2F3A4B5C6...",
  "iv": "F1A2B3C4D5E6F7A8B9C0D1E2...",
  "signature": "B6C7D8E9F0A1B2C3D4E5F6A7...",
  "hash": "E9F0A1B2C3D4E5F6A7B8C9D0...",
  "salt": "A7B8C9D0E1F2A3B4C5D6E7F8..."
}
```

**What happens:**
- Message is encrypted with AES-256-CBC using shared secret
- Random IV (Initialization Vector) is generated
- Digital signature is created using sender's RSA private key
- SHA-256 hash is generated with random salt
- All operations are logged to terminal

**Terminal Output:**
```
========== SENDING ENCRYPTED MESSAGE ==========
From: alice_user_id
To: bob_user_id
Message length: 31 characters
✓ Message encrypted with AES-256
  Encrypted: D5E6F7A8B9C0D1E2...
  IV: F1A2B3C4D5E6F7A8B9C0D1E2...
✓ Digital signature created
  Signature: B6C7D8E9F0A1B2C3...
✓ Message hash generated
  Hash: E9F0A1B2C3D4E5F6...
  Salt: A7B8C9D0E1F2A3B4C5D6E7F8...
========== MESSAGE SENT ==========
```

### 6. Receive and Decrypt Message

```bash
curl -X POST http://localhost:5000/api/messaging/receive-message \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "bob_user_id",
    "senderId": "alice_user_id",
    "encrypted": "D5E6F7A8B9C0D1E2F3A4B5C6...",
    "iv": "F1A2B3C4D5E6F7A8B9C0D1E2...",
    "signature": "B6C7D8E9F0A1B2C3D4E5F6A7...",
    "hash": "E9F0A1B2C3D4E5F6A7B8C9D0...",
    "salt": "A7B8C9D0E1F2A3B4C5D6E7F8..."
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Message received and decrypted",
  "decrypted": "Hello Bob! This is confidential.",
  "signatureVerified": true,
  "integrityVerified": true
}
```

**What happens:**
- Digital signature is verified using sender's RSA public key
- Message is decrypted using shared secret and IV
- SHA-256 hash is verified for message integrity
- All operations are logged to terminal

**Terminal Output:**
```
========== RECEIVING ENCRYPTED MESSAGE ==========
To: bob_user_id
From: alice_user_id
✓ Digital signature verified
✓ Message decrypted
  Decrypted: Hello Bob! This is confidential.
✓ Message integrity verified
========== MESSAGE RECEIVED ==========
```

## Viewing Security Operations

All security operations are automatically logged to the terminal where the server is running. Look for these markers:

```
========== SECURITY OPERATION ==========
Operation: [OPERATION_NAME]
Timestamp: [ISO_TIMESTAMP]
Details: { ... }
========================================
```

Common operations logged:
- `USER_REGISTRATION` - New user account creation
- `USER_CREATION` - User creation via admin panel
- `DOCUMENT_UPLOAD` - Document upload with encryption
- `DOCUMENT_DOWNLOAD` - Document download with verification
- `KEY_EXCHANGE_INIT` - Key exchange initialization
- `KEY_EXCHANGE_COMPLETE` - Shared secret computation
- `MESSAGE_SEND` - Encrypted message transmission
- `MESSAGE_RECEIVE` - Message decryption and verification

## Database Collections

The security features use these MongoDB collections:

1. **users** - User accounts with password hashes and salts
2. **securitykeys** - Encryption keys, hashes, and signatures
3. **documents** - Encrypted documents with metadata

Query examples:

```javascript
// Find user's security keys
db.securitykeys.findOne({ entityType: 'user', entityId: 'USER_ID' })

// Find all documents for a user
db.documents.find({ uploadedBy: ObjectId('USER_ID'), isActive: true })

// Find all RSA key pairs
db.securitykeys.find({ keyPurpose: 'user_authentication' })
```

## Security Best Practices

1. **Never expose private keys** - Private keys are stored encrypted in database
2. **Verify signatures** - Always verify digital signatures before processing
3. **Check integrity** - Verify hashes before using documents
4. **Use HTTPS** - In production, always use HTTPS/TLS
5. **Rotate keys** - Consider implementing key expiration and rotation
6. **Monitor logs** - Review security operation logs regularly
7. **Backup keys** - Securely backup encryption keys
8. **Strong passwords** - Enforce strong password policies
9. **Rate limiting** - Already implemented to prevent brute force
10. **Input validation** - All inputs are sanitized and validated

## Troubleshooting

### Server won't start
```bash
# Check if port 5000 is in use
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3000 npm start
```

### MongoDB connection issues
```bash
# Check MongoDB is running
systemctl status mongod

# Or use MongoDB Atlas connection string in .env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
```

### Tests failing
```bash
# Make sure all dependencies are installed
npm install

# Make sure server is running for API tests
npm start &

# Run tests
node test-security.js
node test-api.js
```

## API Documentation

For complete API documentation, see [SECURITY_IMPLEMENTATION.md](./SECURITY_IMPLEMENTATION.md)

## Support

For issues or questions:
- Check the [main README](../README.md)
- Open an [issue on GitHub](https://github.com/punithsai18/Hack/issues)
- Review the [security implementation docs](./SECURITY_IMPLEMENTATION.md)

## License

MIT License - See LICENSE file for details.
