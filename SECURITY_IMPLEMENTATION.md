# Security Features Implementation Guide

This document provides a comprehensive overview of the security enhancements implemented in the PharmaSpot system.

## Table of Contents

1. [Overview](#overview)
2. [Security Features](#security-features)
3. [Implementation Details](#implementation-details)
4. [API Endpoints](#api-endpoints)
5. [Usage Examples](#usage-examples)
6. [Database Schema](#database-schema)
7. [Terminal Display](#terminal-display)

## Overview

The system now includes enterprise-grade security features to protect sensitive data, ensure data integrity, and provide secure communication between users.

### Key Security Components

- **Password Hashing with Salt**: Secure storage of passwords using bcrypt + custom SHA-256 salt
- **Digital Signatures**: Hash-based signatures for data integrity and authenticity
- **RSA Encryption/Decryption**: Asymmetric encryption for secure data storage
- **Key Exchange Mechanism**: Diffie-Hellman key exchange for secure messaging
- **Base64 Encoding**: Secure document storage with encoding/decoding
- **AES Encryption**: Symmetric encryption for message content

## Security Features

### 1. Password Hashing with Salt (1.5 marks)

**Implementation**: Enhanced password security using dual-layer hashing

```javascript
// Custom salt generation (16 bytes)
const customSalt = generateSalt(16);

// SHA-256 hash with custom salt
const { hash: customHash } = hashWithSalt(password, customSalt);

// Bcrypt hash for backward compatibility
const bcryptHash = await bcrypt.hash(password, saltRounds);
```

**Features**:
- 16-byte cryptographically secure random salt
- SHA-256 hashing combined with salt
- Bcrypt hashing (10 rounds) for additional security
- Salt and hash stored separately in database
- Terminal display of hashing operations

**Database Storage**:
```javascript
{
  password: "bcrypt_hash",
  passwordSalt: "custom_salt_hex",
  passwordHash: "sha256_hash_hex"
}
```

### 2. Digital Signature using Hash (3 marks)

**Implementation**: RSA-based digital signatures for data integrity

```javascript
// Create signature
const signature = createDigitalSignature(data, privateKey);

// Verify signature
const isValid = verifyDigitalSignature(data, signature, publicKey);
```

**Features**:
- RSA-2048 key pair generation
- SHA-256 hash-based signatures
- Signature verification before data access
- Signatures stored with documents and messages
- Terminal display of signature operations

**Use Cases**:
- Document integrity verification
- Message authenticity verification
- Data tampering detection

### 3. RSA Encryption & Decryption (3 marks)

**Implementation**: Asymmetric encryption for sensitive data

```javascript
// Generate key pair
const { publicKey, privateKey } = generateRSAKeyPair();

// Encrypt data
const encrypted = encryptRSA(data, publicKey);

// Decrypt data
const decrypted = decryptRSA(encrypted, privateKey);
```

**Configuration**:
- Key Size: 2048 bits
- Padding: RSA_PKCS1_OAEP_PADDING
- Hash: SHA-256

**Features**:
- Secure key pair generation
- Public key encryption
- Private key decryption
- Keys stored in database
- Terminal display of encrypted/decrypted data

### 4. Key Exchange Mechanism (1.5 marks)

**Implementation**: Diffie-Hellman key exchange for secure communication

```javascript
// Initialize key exchange
const dhParams = generateDHKeyExchange();

// Compute shared secret
const sharedSecret = computeDHSharedSecret(
  privateKey, 
  otherPublicKey, 
  prime, 
  generator
);
```

**Features**:
- 2048-bit Diffie-Hellman parameters
- Secure shared secret computation
- No transmission of private keys
- Shared secrets stored securely
- Terminal display of key exchange process

**Use Cases**:
- Secure messaging setup
- Encrypted communication channels
- Session key establishment

### 5. Base64 Encoding/Decoding (Document Upload)

**Implementation**: Base64 encoding for document storage

```javascript
// Encode document
const base64Content = encodeBase64(fileBuffer);

// Decode document
const fileBuffer = decodeBase64(base64Content);
```

**Features**:
- File buffer to Base64 conversion
- Base64 to buffer decoding
- Database-safe storage format
- Supports all file types
- Hash verification for integrity

### 6. AES-256 Encryption for Messages

**Implementation**: Symmetric encryption using shared secrets

```javascript
// Encrypt message
const { encrypted, iv } = encryptAES(message, sharedSecret);

// Decrypt message
const decrypted = decryptAES(encrypted, sharedSecret, iv);
```

**Configuration**:
- Algorithm: AES-256-CBC
- Key derivation: SHA-256 hash
- Random IV for each message

## Implementation Details

### Security Service Module

Location: `/backend/services/securityService.js`

**Functions Available**:
```javascript
// Hashing with Salt
generateSalt(length)
hashWithSalt(data, salt)
verifyHash(data, hash, salt)

// RSA Encryption/Decryption
generateRSAKeyPair()
encryptRSA(data, publicKey)
decryptRSA(encryptedData, privateKey)

// Digital Signatures
createDigitalSignature(data, privateKey)
verifyDigitalSignature(data, signature, publicKey)

// Key Exchange
generateDHKeyExchange()
computeDHSharedSecret(privateKey, otherPublicKey, prime, generator)

// AES Encryption
encryptAES(data, key)
decryptAES(encryptedData, key, iv)

// Base64 Encoding
encodeBase64(data)
decodeBase64(base64Data)

// Logging
logSecurityOperation(operation, details)
```

## API Endpoints

### User Management (`/api/users`)

#### Register User with Enhanced Security
```http
POST /api/users/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "fullName": "John Doe",
  "role": "user"
}
```

**Response**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "userId": "user_id",
  "role": "user"
}
```

**Security Features Applied**:
- Custom salt generation
- SHA-256 + salt hashing
- Bcrypt hashing
- RSA key pair generation
- Security keys storage

### Document Management (`/api/documents`)

#### Upload Document with Encryption
```http
POST /api/documents/upload
Content-Type: multipart/form-data

file: [binary file data]
userId: "user_id"
documentType: "medical_record"
description: "Patient X-Ray"
encrypt: true
```

**Response**:
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "document": {
    "_id": "doc_id",
    "filename": "timestamp-filename.pdf",
    "originalName": "xray.pdf",
    "size": 1024000,
    "encrypted": true,
    "contentHash": "hash...",
    "signature": "signature..."
  }
}
```

**Security Features Applied**:
- Base64 encoding
- Content hashing with salt
- RSA key pair generation (if encrypted)
- Digital signature creation
- All keys and hashes stored in database

#### Download Document
```http
GET /api/documents/download/:documentId?userId=user_id
```

**Security Features Applied**:
- Access control verification
- Content integrity check
- Digital signature verification
- Base64 decoding
- Terminal logging

#### Get Document Info
```http
GET /api/documents/info/:documentId
```

**Response includes**:
- Document metadata
- Security information
- Hash values
- Signature status
- Encryption status

#### List User Documents
```http
GET /api/documents/list/:userId
```

### Secure Messaging (`/api/messaging`)

#### Initialize Key Exchange
```http
POST /api/messaging/init-key-exchange
Content-Type: application/json

{
  "userId": "user_id"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Key exchange initialized",
  "publicKey": "dh_public_key_base64",
  "prime": "prime_base64",
  "generator": "generator_base64",
  "rsaPublicKey": "rsa_public_key_pem"
}
```

#### Complete Key Exchange
```http
POST /api/messaging/complete-key-exchange
Content-Type: application/json

{
  "userId": "user1_id",
  "otherUserId": "user2_id"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Key exchange completed",
  "sharedSecret": "partial_secret..."
}
```

#### Send Encrypted Message
```http
POST /api/messaging/send-message
Content-Type: application/json

{
  "senderId": "user1_id",
  "recipientId": "user2_id",
  "message": "Hello, this is a secure message!"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Message sent securely",
  "encrypted": "encrypted_content_base64",
  "iv": "iv_base64",
  "signature": "signature_base64",
  "hash": "message_hash",
  "salt": "hash_salt"
}
```

#### Receive and Decrypt Message
```http
POST /api/messaging/receive-message
Content-Type: application/json

{
  "recipientId": "user2_id",
  "senderId": "user1_id",
  "encrypted": "encrypted_content_base64",
  "iv": "iv_base64",
  "signature": "signature_base64",
  "hash": "message_hash",
  "salt": "hash_salt"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Message received and decrypted",
  "decrypted": "Hello, this is a secure message!",
  "signatureVerified": true,
  "integrityVerified": true
}
```

#### Get User Public Keys
```http
GET /api/messaging/public-keys/:userId
```

## Usage Examples

### Example 1: Secure User Registration

```javascript
// Client-side
const response = await fetch('/api/users/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'alice',
    email: 'alice@example.com',
    password: 'MySecurePass123!',
    fullName: 'Alice Smith',
    role: 'user'
  })
});

const result = await response.json();
console.log('User registered:', result.userId);
```

**Terminal Output**:
```
========== USER REGISTRATION ==========
Username: alice
Custom Salt: 3f2a8b9c4d5e6f7a8b9c0d1e2f3a4b5c
Custom Hash: 8a7b9c4d5e6f7a8b9c0d1e2f3a4b5c6d...
Security Keys ID: 507f1f77bcf86cd799439011
========================================

========== SECURITY OPERATION ==========
Operation: USER_REGISTRATION
Timestamp: 2026-01-27T18:45:30.123Z
Details: {
  "userId": "507f1f77bcf86cd799439012",
  "username": "alice",
  "passwordSalt": "3f2a8b9c4d5e6f7a8b9c0d1e2f3a4b5c",
  "passwordHash": "8a7b9c4d5e6f7a8b9c0d1e2f3a4b5c6d...",
  "securityKeysId": "507f1f77bcf86cd799439011"
}
========================================
```

### Example 2: Upload Encrypted Document

```javascript
// Client-side
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('userId', currentUser.id);
formData.append('documentType', 'medical');
formData.append('description', 'Lab Results');
formData.append('encrypt', 'true');

const response = await fetch('/api/documents/upload', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log('Document uploaded:', result.document._id);
```

**Terminal Output**:
```
========== DOCUMENT UPLOAD STARTED ==========
File: lab_results.pdf
Size: 256000 bytes
Type: application/pdf
Uploaded by: 507f1f77bcf86cd799439012
✓ File encoded to Base64 (length: 341333)
✓ Content hash generated: 9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a...
✓ Salt: 4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e
✓ RSA key pair generated (4096 bytes)
✓ Security keys stored (ID: 507f1f77bcf86cd799439013)
✓ Digital signature created: 5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d...
✓ Document saved to database (ID: 507f1f77bcf86cd799439014)
========== DOCUMENT UPLOAD COMPLETED ==========

========== SECURITY OPERATION ==========
Operation: DOCUMENT_UPLOAD
Timestamp: 2026-01-27T18:46:15.456Z
Details: {
  "documentId": "507f1f77bcf86cd799439014",
  "filename": "lab_results.pdf",
  "encrypted": true,
  "encryptionMethod": "rsa",
  "hash": "9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a...",
  "salt": "4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e",
  "signaturePresent": true,
  "securityKeysId": "507f1f77bcf86cd799439013"
}
========================================
```

### Example 3: Secure Messaging Flow

```javascript
// Step 1: Alice initializes key exchange
const aliceInit = await fetch('/api/messaging/init-key-exchange', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: aliceId })
});

// Step 2: Bob initializes key exchange
const bobInit = await fetch('/api/messaging/init-key-exchange', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: bobId })
});

// Step 3: Alice completes key exchange with Bob
const aliceComplete = await fetch('/api/messaging/complete-key-exchange', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: aliceId, otherUserId: bobId })
});

// Step 4: Bob completes key exchange with Alice
const bobComplete = await fetch('/api/messaging/complete-key-exchange', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: bobId, otherUserId: aliceId })
});

// Step 5: Alice sends encrypted message to Bob
const sendMsg = await fetch('/api/messaging/send-message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    senderId: aliceId,
    recipientId: bobId,
    message: 'Hello Bob! This is secure.'
  })
});

const { encrypted, iv, signature, hash, salt } = await sendMsg.json();

// Step 6: Bob receives and decrypts message
const receiveMsg = await fetch('/api/messaging/receive-message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recipientId: bobId,
    senderId: aliceId,
    encrypted,
    iv,
    signature,
    hash,
    salt
  })
});

const { decrypted } = await receiveMsg.json();
console.log('Decrypted message:', decrypted);
```

**Terminal Output**:
```
========== KEY EXCHANGE INITIALIZATION ==========
User ID: alice_id
✓ DH parameters generated
  Public Key: A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3...
  Prime: E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9...
  Generator: Mg==
✓ RSA key pair generated for signatures
✓ Created new security keys (ID: 507f1f77bcf86cd799439015)
========== KEY EXCHANGE INITIALIZATION COMPLETED ==========

========== COMPLETING KEY EXCHANGE ==========
User 1: alice_id
User 2: bob_id
✓ Retrieved keys for both users
✓ Shared secret computed
  Shared Secret: C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8...
========== KEY EXCHANGE COMPLETED ==========

========== SENDING ENCRYPTED MESSAGE ==========
From: alice_id
To: bob_id
Message length: 26 characters
✓ Message encrypted with AES-256
  Encrypted: D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0...
  IV: F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6
✓ Digital signature created
  Signature: B6C7D8E9F0A1B2C3D4E5F6A7B8C9D0E1...
✓ Message hash generated
  Hash: E9F0A1B2C3D4E5F6A7B8C9D0E1F2A3B4...
  Salt: A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2
========== MESSAGE SENT ==========

========== RECEIVING ENCRYPTED MESSAGE ==========
To: bob_id
From: alice_id
✓ Digital signature verified
✓ Message decrypted
  Decrypted: Hello Bob! This is secure.
✓ Message integrity verified
========== MESSAGE RECEIVED ==========
```

## Database Schema

### SecurityKeys Collection

```javascript
{
  _id: ObjectId,
  entityType: String, // 'user', 'document', 'message', 'system'
  entityId: String,
  
  // RSA Keys
  publicKey: String,
  privateKey: String,
  
  // Diffie-Hellman Keys
  dhPublicKey: String,
  dhPrivateKey: String,
  dhPrime: String,
  dhGenerator: String,
  sharedSecret: String,
  
  // Hash and Salt
  hash: String,
  salt: String,
  
  // Digital Signature
  signature: String,
  signatureVerified: Boolean,
  
  // AES encryption IV
  aesIV: String,
  
  // Metadata
  keyPurpose: String,
  isActive: Boolean,
  expiresAt: Date,
  
  createdAt: Date,
  updatedAt: Date
}
```

### Document Collection

```javascript
{
  _id: ObjectId,
  filename: String,
  originalName: String,
  mimeType: String,
  size: Number,
  
  // Base64 encoded content
  content: String,
  
  // Security features
  encrypted: Boolean,
  encryptionMethod: String, // 'none', 'rsa', 'aes'
  securityKeysId: ObjectId,
  
  // Hash for integrity
  contentHash: String,
  hashSalt: String,
  
  // Digital signature
  signature: String,
  signedBy: ObjectId,
  
  // Ownership
  uploadedBy: ObjectId,
  documentType: String,
  isActive: Boolean,
  description: String,
  tags: [String],
  
  createdAt: Date,
  updatedAt: Date
}
```

### User Model Updates

```javascript
{
  // Existing fields...
  
  // Security enhancements
  passwordSalt: String,
  passwordHash: String,
  securityKeysId: ObjectId
}
```

## Terminal Display

All security operations are logged to the terminal for monitoring and debugging:

### Format

```
========== SECURITY OPERATION ==========
Operation: [OPERATION_NAME]
Timestamp: [ISO_TIMESTAMP]
Details: {
  [operation_specific_details]
}
========================================
```

### Logged Operations

1. **USER_REGISTRATION** - User account creation with security keys
2. **USER_CREATION** - User creation via admin panel
3. **DOCUMENT_UPLOAD** - Document upload with encryption
4. **DOCUMENT_DOWNLOAD** - Document download with verification
5. **KEY_EXCHANGE_INIT** - Key exchange initialization
6. **KEY_EXCHANGE_COMPLETE** - Shared secret computation
7. **MESSAGE_SEND** - Encrypted message transmission
8. **MESSAGE_RECEIVE** - Message decryption and verification

### Key Information Displayed

- **Hashes**: First 32-64 characters (truncated for readability)
- **Salts**: Full value in hexadecimal
- **Keys**: First 64-100 characters (truncated)
- **Timestamps**: ISO 8601 format
- **IDs**: Full MongoDB ObjectId
- **Verification Status**: Boolean flags

## Security Best Practices

1. **Never expose private keys** - API responses exclude private keys
2. **Verify signatures** - Always verify digital signatures before processing data
3. **Check integrity** - Verify content hashes before using documents
4. **Access control** - Verify user permissions before allowing downloads
5. **Secure key storage** - Private keys stored encrypted in database
6. **Regular key rotation** - Consider implementing key expiration
7. **Audit logging** - All operations logged to terminal and database
8. **Input validation** - All inputs sanitized and validated
9. **Error handling** - Security errors logged but details hidden from users
10. **Rate limiting** - Prevent brute force attacks (already implemented)

## Testing

### Test User Registration
```bash
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "SecurePass123!",
    "fullName": "Test User",
    "role": "user"
  }'
```

### Test Document Upload
```bash
curl -X POST http://localhost:5000/api/documents/upload \
  -F "file=@/path/to/file.pdf" \
  -F "userId=USER_ID" \
  -F "documentType=test" \
  -F "encrypt=true"
```

### Test Key Exchange
```bash
curl -X POST http://localhost:5000/api/messaging/init-key-exchange \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID"}'
```

## Conclusion

This implementation provides a comprehensive security framework covering:

1. ✅ Password hashing with salt (1.5 marks)
2. ✅ Digital signatures using hash (3 marks)
3. ✅ RSA encryption/decryption (3 marks)
4. ✅ Key exchange mechanism (1.5 marks)
5. ✅ Base64 encoding for documents
6. ✅ Database storage of keys and hashes
7. ✅ Terminal display of operations
8. ✅ Admin document download fix

All security operations are logged to the terminal with detailed information about hashes, salts, keys, and verification status.

## Support

For questions or issues, please refer to the main README or contact the development team.

## License

MIT License - See LICENSE file for details.
