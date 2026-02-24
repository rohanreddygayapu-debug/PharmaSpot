# Base64 Encoding/Decoding Flow Diagram

## Upload Flow (Encoding)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DOCUMENT UPLOAD FLOW                         │
└─────────────────────────────────────────────────────────────────────┘

User Action                Backend Processing              Database Storage
───────────                ──────────────────              ────────────────

    👤 Admin                                                    
    │                                                           
    │ 1. Select File                                           
    │    (PDF, Image, etc.)                                    
    ├────────────────►                                         
                      📄 File Buffer                            
                      │                                         
                      │ 2. Base64 Encoding                     
                      │    encodeBase64(buffer)                
                      ▼                                         
                      🔤 Base64 String                          
                      │    "SGVsbG8gV29ybGQ..."                
                      │                                         
                      │ 3. Generate Hash                       
                      │    SHA-256 + Salt                      
                      ▼                                         
                      #️⃣  Hash Value                            
                      │    "a3f2c1d..."                        
                      │                                         
                      │ 4. Create Signature                    
                      │    RSA Sign(hash)                      
                      ▼                                         
                      ✍️  Digital Signature                     
                      │                                         
                      │ 5. Save to Database ───────►  💾 MongoDB
                      │                                  │
                      │                                  ├─ content: Base64 ✅
                      │                                  ├─ hash: SHA-256
                      │                                  ├─ signature: RSA
                      │                                  └─ metadata
                      │
    ◄────────────────┤                                         
    │ 6. Success!                                              
    │    "Document uploaded"                                   
    │    "Base64 Encoded ✅"                                   
    │    "Hash: a3f2c1d..."                                    
    │    "Signature: 4e8b3a..."                                
    ▼
```

## Download Flow (Decoding)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DOCUMENT DOWNLOAD FLOW                        │
└─────────────────────────────────────────────────────────────────────┘

User Action                Backend Processing              Database Retrieval
───────────                ──────────────────              ──────────────────

    👤 Admin                                                    
    │                                                           
    │ 1. Click Download                                        
    │    Button                                                
    ├────────────────►                                         
                      🔍 Fetch Document                         
                      │                           ◄───────  💾 MongoDB
                      │                                  │
                      │ 2. Retrieved Data                ├─ content: Base64
                      ├────────────────────────────────┤├─ hash: SHA-256
                      │                                  ├─ signature: RSA
                      │                                  └─ metadata
                      │
                      │ 3. Verify Integrity
                      │    Re-compute hash
                      ▼
                      ✅ Hash Match?
                      │    Compare hashes
                      │
                      │ 4. Verify Signature
                      │    RSA Verify
                      ▼
                      ✅ Signature Valid?
                      │    Check authenticity
                      │
                      │ 5. Base64 Decoding
                      │    decodeBase64(string)
                      ▼
                      📄 File Buffer
                      │    Original binary data
                      │
    ◄────────────────┤                                         
    │ 6. File Downloaded!                                      
    │    "Integrity verified ✅"                                
    │    "Signature valid ✅"                                   
    │    "Base64 decoded ✅"                                    
    ▼
    💾 Saved to disk
    (Original file restored)
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────────────┐
│                          SECURITY LAYERS                             │
└─────────────────────────────────────────────────────────────────────┘

Layer 1: Base64 Encoding
─────────────────────────
Purpose: Encode binary data for text-based storage
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│ Binary File  │ ─────► │   Base64     │ ─────► │  Text String │
│  (Buffer)    │ encode  │  Encoding    │ decode │   (Buffer)   │
└──────────────┘         └──────────────┘         └──────────────┘
     📄                       🔤                        📄


Layer 2: SHA-256 Hash
─────────────────────
Purpose: Verify document integrity (detect tampering)
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│  Base64      │         │   SHA-256    │         │     Hash     │
│  Content     │ ─────► │   + Salt     │ ─────► │   Stored     │
└──────────────┘   hash  └──────────────┘  verify └──────────────┘
     🔤                       #️⃣                       ✅/❌


Layer 3: RSA Signatures
────────────────────────
Purpose: Verify document authenticity (non-repudiation)
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│  Hash Value  │         │     RSA      │         │   Signature  │
│              │ ─────► │  Private Key │ ─────► │   Verified   │
└──────────────┘   sign  └──────────────┘  verify └──────────────┘
     #️⃣                       🔐                       ✍️✅


Layer 4: Access Control
────────────────────────
Purpose: Prevent unauthorized access
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Request    │         │     Auth     │         │   Document   │
│   + Token    │ ─────► │   Verified   │ ─────► │   Accessed   │
└──────────────┘  check  └──────────────┘  allow  └──────────────┘
     🔑                       👤✅                      📄
```

## Admin Dashboard UI

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ADMIN DASHBOARD                              │
│  Welcome back, Admin                                           [👤] │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ [Overview] [Stock] [Verification] [Forecast] [Expiry] [📄 Documents]│
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ 📄 Document Management                                               │
│ Upload and manage documents with Base64 encoding/decoding           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │  Upload New Document                                          │   │
│ ├──────────────────────────────────────────────────────────────┤   │
│ │  File: [Choose File]                                          │   │
│ │  Type: [▼ General ▼]                                          │   │
│ │  Description: [                                           ]   │   │
│ │  [🔒 Upload (Base64 Encoded)]                                 │   │
│ │                                                               │   │
│ │  🔐 Security Features:                                        │   │
│ │   • Base64 encoding for secure storage                       │   │
│ │   • SHA-256 hash for integrity verification                  │   │
│ │   • Digital signature with RSA keys                          │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │  All Documents                                                │   │
│ ├──────┬──────────┬──────┬──────────┬──────────┬──────────────┤   │
│ │ File │   Type   │ Size │ Encrypted│ Uploaded │   Actions    │   │
│ ├──────┼──────────┼──────┼──────────┼──────────┼──────────────┤   │
│ │ doc1 │ [Medical]│ 245KB│ 🔒 Yes   │ Jan 28   │[📥][🗑️]      │   │
│ │ doc2 │ [Legal]  │ 1.2MB│ 🔒 Yes   │ Jan 27   │[📥][🗑️]      │   │
│ │ doc3 │ [General]│ 512KB│ 🔓 No    │ Jan 26   │[📥][🗑️]      │   │
│ └──────┴──────────┴──────┴──────────┴──────────┴──────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

Legend:
[📥] Download (with Base64 decoding + verification)
[🗑️] Delete (soft delete with confirmation)
🔒  Encrypted with RSA keys
🔓  Base64 encoded only
```

## Technology Stack

```
Frontend                  Backend                   Database
────────                  ───────                   ────────

React JSX                 Node.js + Express         MongoDB
    │                         │                         │
    ├─ AdminDashboard         ├─ /api/documents/       ├─ Document Collection
    │                         │   - upload             │   - content (Base64)
    ├─ File Input             │   - download           │   - hash (SHA-256)
    │                         │   - admin/all          │   - signature (RSA)
    ├─ Document List          │   - delete             │   - metadata
    │                         │                         │
    └─ Download/Delete        └─ securityService.js    └─ SecurityKeys Collection
                                 - encodeBase64()          - publicKey
                                 - decodeBase64()          - privateKey
                                 - hashWithSalt()          - signature
                                 - createSignature()
                                 - verifySignature()
```

## Base64 Example

```
Original Binary:
┌─────────────────────────────────────┐
│ 01001000 01100101 01101100 01101100 │  "Hello"
│ 01101111 00100000 01010111 01101111 │  " Wo"
│ 01110010 01101100 01100100           │  "rld"
└─────────────────────────────────────┘

Base64 Encoded:
┌─────────────────────────────────────┐
│ SGVsbG8gV29ybGQ=                    │  ASCII text
└─────────────────────────────────────┘

Stored in MongoDB:
{
  content: "SGVsbG8gV29ybGQ=",         ← Base64 string
  hash: "a591a6d40bf420404...",       ← SHA-256
  signature: "4e8b3a2f1c5d9...",       ← RSA signature
  ...metadata
}

Downloaded & Decoded:
┌─────────────────────────────────────┐
│ 01001000 01100101 01101100 01101100 │  "Hello"
│ 01101111 00100000 01010111 01101111 │  " Wo"
│ 01110010 01101100 01100100           │  "rld"
└─────────────────────────────────────┘
Original binary restored! ✅
```
