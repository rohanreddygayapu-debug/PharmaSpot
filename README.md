# 🏥 PharmaSpot - Comprehensive Healthcare & Pharmacy Management System

![GitHub package.json version](https://img.shields.io/github/package-json/v/punithsai18/Hack) ![GitHub issues](https://img.shields.io/github/issues/punithsai18/Hack) [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

![PharmaSpot Logo](assets/images/logo.svg)

## 📋 Overview

**PharmaSpot** is a comprehensive, modern healthcare management platform that combines pharmacy Point of Sale (POS), telemedicine appointment booking, AI-powered chatbot assistance, and real-time inventory management. Built with cutting-edge technologies, it streamlines pharmacy operations while providing an intuitive interface for both staff and patients.

### Key Highlights
- 💊 **Advanced POS System** with barcode scanning and receipt generation
- 📸 **Image & File Upload** with OCR for automated inventory management
- 📧 **Automated Email System** using Nodemailer for receipts and notifications
- 🔐 **Two-Factor Authentication** with OTP verification via email
- 🔒 **Enterprise Security** with encryption, digital signatures, and key exchange
- 🤖 **AI-Powered Chatbot** for stock queries and expiry tracking
- 👨‍⚕️ **Doctor Appointment System** with booking and payment tracking
- 💬 **Real-Time Chat** between doctors and patients
- 🔔 **Live Notifications** with Socket.IO for inventory alerts
- 📊 **Analytics & Reporting** with demand forecasting
- 📄 **Secure Document Management** with Base64 encoding and encryption

---

## 🚀 Technology Stack

### Frontend
- **⚛️ React 19** - Modern UI library with hooks and context API
- **⚡ Vite 7.2** - Lightning-fast build tool with Hot Module Replacement (HMR)
- **🎨 Modern CSS** - CSS Variables, Grid, and Flexbox for responsive design
- **📊 Chart.js** - Interactive charts for analytics
- **🔌 Socket.IO Client** - Real-time communication
- **🖨️ jsPDF & Print.js** - Client-side PDF generation and printing
- **🧹 DOMPurify** - XSS protection for user-generated content
- **✅ Validator.js** - Input validation

### Backend
- **🟢 Node.js with Express.js** - RESTful API server
- **🍃 MongoDB with Mongoose** - NoSQL database with ODM
- **🔐 bcrypt** - Password hashing and authentication
- **🔒 crypto (Node.js)** - RSA/AES encryption, digital signatures, key exchange
- **📧 Nodemailer** - Email service for receipts and notifications
- **📤 Multer** - File upload handling (images, Excel files)
- **🔍 Tesseract.js** - OCR (Optical Character Recognition) for image processing
- **📑 XLSX** - Excel file parsing for bulk inventory import
- **🔌 Socket.IO** - WebSocket server for real-time features
- **🛡️ CORS & Rate Limiting** - Security middleware
- **📦 dotenv** - Environment variable management

---

## 🌟 Core Features

### 1. 💊 Point of Sale (POS) System

The heart of PharmaSpot is its advanced Point of Sale system designed specifically for pharmacy operations.

#### Transaction Processing
- **Barcode Scanning**: Quickly add products using barcode scanner
- **Manual Product Search**: Search by name, SKU, or category
- **Shopping Cart**: Add, remove, and adjust quantities
- **Multiple Payment Methods**: Cash, Card, Mobile Pay, Insurance
- **Change Calculator**: Automatic change computation
- **Receipt Generation**: Professional PDF receipts with barcodes
- **Receipt Printing**: Direct printing via Print.js
- **Email Receipts**: Auto-send receipts to customer email
- **Customer Database**: Store and retrieve customer information
- **Open Tabs**: Save incomplete transactions for later
- **Transaction History**: Complete audit trail with filters

#### Inventory Integration
- **Real-time Stock Updates**: Automatic inventory adjustment after sales
- **Low Stock Alerts**: Get notified when products run low
- **Expiry Tracking**: FEFO (First Expiry, First Out) suggestions
- **Profit Calculation**: Per-item and total profit tracking
- **Batch Management**: Track products by batch/lot number

### 2. 📸 Image & File Upload in POS

**One of the most powerful features** - automate inventory management with document scanning!

#### OCR-Powered Image Processing

Upload photos of medicine boxes, prescription labels, or inventory lists, and let AI extract the data automatically.

**How it works:**
1. Navigate to Inventory → Upload File
2. Take a photo or upload an image of medicine packaging
3. System uses **Tesseract.js OCR** to read text from the image
4. AI parses medicine information (name, quantity, expiry date, batch number)
5. Review and edit extracted data
6. Import directly into inventory with one click

**Features:**
- **Tesseract.js OCR Engine**: Extracts text from images automatically
- **Supported Formats**: JPG, PNG, JPEG
- **Smart Parsing**: AI interprets unstructured text into structured product data
- **Data Extraction**: Medicine names, quantities, batch numbers, expiry dates
- **Direct Import**: Add extracted products to inventory immediately
- **Error Correction**: Review and edit data before importing

#### Excel/CSV Bulk Import

Import hundreds of products at once from spreadsheets:

- **Supported Formats**: XLSX, XLS, CSV
- **Automatic Column Detection**: Smart mapping of Excel columns to product fields
- **Validation**: Checks for required fields and data formats
- **Bulk Processing**: Add multiple products simultaneously
- **Error Reporting**: Clear feedback on any issues during import

**Technical Implementation:**

```javascript
// File Upload API Endpoint
POST /api/file-analysis/analyze
Content-Type: multipart/form-data
Field: file (image or Excel file)

// Response
{
  "success": true,
  "extractedData": [
    {
      "name": "Aspirin 500mg",
      "quantity": 100,
      "price": 5.99,
      "expiryDate": "2025-12-31",
      "batchNumber": "ASP2025"
    }
  ],
  "source": "ocr" | "excel"
}
```

**Implementation Details:**
- **Multer Middleware**: Handles multipart form data and secure file storage
- **10MB File Limit**: Balances functionality and performance
- **Upload Directory**: `backend/uploads/` (files auto-cleaned after processing)
- **File Type Validation**: Prevents malicious uploads
- **Automatic Cleanup**: Temporary files deleted after processing

### 3. 📧 Nodemailer Email Service

Professional automated email notifications for customers and healthcare providers.

#### Transaction Receipts

Automatically sent after every purchase when customer provides email address.

**Email Contains:**
- Professional HTML template with branding
- Complete transaction details (items, quantities, prices)
- Customer information (name, phone, email)
- Payment summary (subtotal, tax, discount, total, change)
- Invoice number and transaction date
- Formatted tables for easy reading

#### Appointment Notifications

**To Doctor (when patient books):**
- Patient details (name, phone, email)
- Appointment date, time, and reason
- Status indicator
- Action required notification

**To Patient (when doctor accepts):**
- Doctor's name and specialization
- Confirmed appointment date and time
- Consultation fee (if applicable)
- Arrival instructions and notes
- Contact information

#### Email Service Configuration

**Step 1: Configure Environment Variables**

Add to `backend/.env`:
```env
# Email Service Configuration
EMAIL_SERVICE=gmail                    # or 'outlook', 'yahoo', etc.
EMAIL_USER=your-email@gmail.com        # Your email address
EMAIL_PASS=your-app-password           # App-specific password
```

**Step 2: Generate App Password (for Gmail)**
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Generate App Password:
   - Select App: Mail
   - Select Device: Other (Custom name)
   - Copy the 16-character password
4. Use this password in `EMAIL_PASS`

**Email Service Architecture:**
```
Transaction/Appointment → emailService → Nodemailer Transport
                                        ↓
                                 SMTP Server (Gmail)
                                        ↓
                                  Recipient's Inbox
```

**Technical Implementation:**

```javascript
// backend/services/emailService.js
const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send email
await transporter.sendMail({
  from: '"PharmaSpot" <' + process.env.EMAIL_USER + '>',
  to: recipientEmail,
  subject: 'Payment Receipt - Invoice #' + invoiceNumber,
  html: generateReceiptHTML(data)
});
```

**Features:**
- Asynchronous sending (doesn't block transactions)
- Graceful failure (transaction completes even if email fails)
- Professional HTML templates
- Dynamic content generation
- Multi-purpose (receipts, appointments, notifications)
- Detailed error logging

For detailed email setup instructions, see [EMAIL_RECEIPT_SETUP.md](EMAIL_RECEIPT_SETUP.md)

### 4. 🤖 AI-Powered Chatbot

Your intelligent pharmacy assistant powered by natural language processing!

#### Chatbot Capabilities

**Stock Queries:**
- "Show me low stock items"
- "What products are out of stock?"
- "Check inventory for Aspirin"
- "How much stock do we have?"

**Product-Specific Expiry Queries:**
- "How many ORS packets expire in the next 30 days?"
- "Check Aspirin expiry"
- "Show Paracetamol expiring soon"
- "Which Vitamin C tablets are expiring?"

**Sales & Analytics:**
- "Show today's sales"
- "Top selling products this month"
- "Total revenue this week"
- "Generate sales report"

**Demand Forecasting:**
- "Predict demand for next month"
- "Which products need reordering?"
- "Show forecast trends"

#### Expiry Tracking Intelligence

The chatbot uses NLP to understand queries and extract product names intelligently.

**Query Processing Example:**

1. **User Input:** "How many ORS packets expire in the next 30 days?"
2. **Product Name Extraction:** Chatbot extracts "ORS" from query
3. **Database Query:** Searches for ORS products expiring within 30 days
4. **Response Generation:**

```
Found 2 batch(es) of "ORS" expiring in the next 30 days,
with a total quantity of 150 units.

Batch 1: ORS Powder
- Stock: 100 units
- Expiry: 01/15/2025 (15 days remaining)
- SKU: ORS-001

Batch 2: ORS Sachets
- Stock: 50 units
- Expiry: 01/22/2025 (22 days remaining)
- SKU: ORS-002

Suggestions:
✓ Apply FEFO dispensing
✓ Check other expiring products
✓ Generate expiry report
```

#### Quick Actions

Pre-defined queries for common tasks:
- 📦 Stock Check
- ⏰ Product Expiry Check
- 💰 Sales Summary
- 📊 Low Stock Alert
- 🔮 Demand Forecast

#### Technical Implementation

```javascript
// Chatbot API
POST /api/chatbot/query
{
  "query": "How many Aspirin expire in the next 30 days?",
  "context": {}
}

GET /api/chatbot/quick-actions
// Returns suggested queries
```

**Features:**
- Natural Language Processing
- Product name extraction from queries
- MongoDB regex search for flexible matching
- Context-aware responses
- Suggestion system for follow-up actions
- Command support (clear, stop, help)

For detailed chatbot documentation, see [CHATBOT_EXPIRY_FEATURE.md](CHATBOT_EXPIRY_FEATURE.md)

### 5. 👨‍⚕️ Doctor Appointment System

Complete telemedicine platform connecting patients with healthcare providers.

#### For Patients
- **Browse Doctors**: View available doctors with specializations
- **Doctor Profiles**: View credentials, experience, fees, ratings
- **Book Appointments**: Select date, time, and reason for visit
- **Email Confirmations**: Receive automated booking confirmations
- **Appointment History**: Track past and upcoming appointments
- **Real-time Status**: Monitor appointment status (pending/confirmed/completed)
- **Direct Chat**: Message doctor after appointment confirmation

#### For Doctors
- **Professional Dashboard**: Manage profile, credentials, availability
- **Appointment Management**: View, accept, or reject appointments
- **Patient Information**: Access patient details and medical history
- **Payment Tracking**: Record consultation fees and payment methods
- **Appointment Completion**: Mark appointments complete with payment selection
- **Chat with Patients**: Direct messaging within appointment context
- **Email Notifications**: Receive alerts when patients book appointments

#### Payment Method Selection

When doctor completes an appointment, they select payment method:
- 💵 **Cash**
- 💳 **Card**
- 📱 **Mobile Pay**
- 🏥 **Insurance**

Payment details are recorded with appointment for accounting and reporting.

### 6. 💬 Real-Time Chat System

Built with Socket.IO for instant doctor-patient communication.

#### Features
- **Real-time Messaging**: Messages delivered instantly
- **Doctor-Patient Direct Line**: Secure communication channel
- **Chat History**: Persistent message storage in MongoDB
- **Online Status**: See who's currently connected
- **Typing Indicators**: Know when someone is typing
- **Message Timestamps**: Track conversation timeline
- **Unread Indicators**: Never miss important messages
- **Appointment Context**: Chat linked to specific appointments

#### Technical Architecture
```
Frontend (React) ←→ Socket.IO Client ←→ WebSocket Connection
                                              ↕
Backend (Express) ←→ Socket.IO Server ←→ MongoDB (Chat Model)
```

### 7. 🔔 Real-Time Notification System

Stay informed with live inventory alerts powered by Socket.IO.

#### Notification Types
- **📦 Low Stock**: Products below minimum threshold
- **❌ Out of Stock**: Inventory reached zero
- **⏰ Expiry Alerts**: Products expiring within 30/14/7 days
- **✅ Stock Updated**: Confirmation of inventory changes

#### Priority Levels
- 🔴 **Critical**: Out of stock, expired products
- 🟠 **High**: Very low stock (<50% min), expires in 7 days
- 🟡 **Medium**: Low stock, expires in 14 days
- 🟢 **Low**: Expires in 30 days

#### Smart Features
- **Duplicate Prevention**: Intelligent alert throttling
- **Connection Status**: Real-time server connection indicator
- **Filter by Type**: View all, stock only, or expiry only
- **Mark as Read**: Track handled alerts
- **Dismiss Notifications**: Remove irrelevant alerts
- **Bulk Actions**: Mark all as read, clear read notifications
- **Sound Alerts**: Audio notification for new alerts
- **Badge Counter**: Unread notification count

#### Notification Panel

Located in dashboard header:
- Bell icon with pulsing unread badge
- Sliding panel with smooth animations
- Auto-refresh every minute
- Relative timestamps ("5m ago", "Just now")
- Priority-based color coding
- Click notification for details

For detailed notification documentation, see [NOTIFICATION_SYSTEM_DOCS.md](NOTIFICATION_SYSTEM_DOCS.md)

### 8. 📊 Advanced Features

#### Inventory Forecasting
- **Demand Prediction**: ML-based forecasting algorithms
- **Trend Analysis**: Identify seasonal patterns
- **Reorder Suggestions**: Automatic reorder point calculations
- **Stock Optimization**: Minimize overstock and stockouts

#### Auto-Reorder System
- **Automatic Purchase Orders**: Generate POs when stock is low
- **Supplier Integration**: Track and manage suppliers
- **Reorder History**: Complete audit trail
- **Customizable Thresholds**: Set min/max per product

#### Reporting & Analytics
- **Sales Reports**: Daily, weekly, monthly summaries
- **Profit Analysis**: Track gross and net profit
- **Transaction Filtering**: By cashier, date, status, payment method
- **Export to Excel**: Download reports for analysis
- **Visual Dashboards**: Interactive charts with Chart.js

#### Multi-User Support
- **User Roles**: Admin, Cashier, Doctor, Patient
- **Permissions**: Role-based access control (RBAC)
- **Activity Logging**: Track user actions and changes
- **Multiple Cashiers**: Concurrent POS usage
- **Secure Sessions**: JWT token authentication with bcrypt

#### Customer Management
- **Customer Database**: Store profiles and contact info
- **Purchase History**: Track individual transactions
- **Loyalty Tracking**: Monitor frequent customers
- **Email Integration**: Send receipts and promotions

---

## 📁 Project Structure

```
PharmaSpot/
├── backend/                          # Backend Node.js/Express server
│   ├── api/                          # API route handlers
│   │   ├── appointments.js           # Doctor appointment endpoints
│   │   ├── autoreorder.js            # Auto-reorder system
│   │   ├── categories.js             # Product categories
│   │   ├── chatbot.js                # AI chatbot logic
│   │   ├── chats.js                  # Real-time chat messages
│   │   ├── customers.js              # Customer management
│   │   ├── doctors.js                # Doctor profiles & verification
│   │   ├── drugs.js                  # Drug database
│   │   ├── expiry.js                 # Expiry alerts
│   │   ├── fileAnalysis.js           # Image OCR & Excel import
│   │   ├── forecast.js               # Demand forecasting
│   │   ├── insurance.js              # Insurance providers
│   │   ├── inventory.js              # Product inventory
│   │   ├── notifications.js          # Notification system
│   │   ├── patients.js               # Patient records
│   │   ├── prescriptions.js          # Prescription management
│   │   ├── settings.js               # System settings
│   │   ├── suppliers.js              # Supplier management
│   │   ├── transactions.js           # POS transactions
│   │   └── users.js                  # User authentication
│   ├── models/                       # MongoDB Mongoose schemas
│   │   ├── Appointment.js
│   │   ├── Product.js
│   │   ├── Transaction.js
│   │   ├── User.js
│   │   └── ... (17 total models)
│   ├── config/                       # Configuration files
│   │   ├── database.js               # MongoDB connection
│   │   ├── initDefaultUser.js        # Create admin user
│   │   └── initIndexes.js            # Database indexes
│   ├── services/                     # Business logic services
│   │   ├── emailService.js           # Nodemailer email service
│   │   └── notificationService.js    # Real-time notifications
│   ├── uploads/                      # Temporary file upload directory
│   ├── server.js                     # Express server entry point
│   ├── package.json                  # Backend dependencies
│   └── .env                          # Environment variables
│
├── src/                              # React frontend source
│   ├── components/                   # Reusable React components
│   │   ├── AppointmentPaymentModal.jsx
│   │   ├── Charts.jsx
│   │   ├── ChatComponent.jsx
│   │   ├── Chatbot.jsx
│   │   ├── DataTable.jsx
│   │   ├── NotificationPanel.jsx
│   │   ├── POSView.jsx
│   │   └── ... (more components)
│   ├── contexts/                     # React Context providers
│   │   ├── AuthContext.jsx
│   │   └── NotificationContext.jsx
│   ├── pages/                        # Page components
│   │   ├── AdminDashboard.jsx
│   │   ├── DoctorDashboard.jsx
│   │   ├── CustomerDashboard.jsx
│   │   ├── AppointmentBooking.jsx
│   │   ├── ChatPage.jsx
│   │   └── ... (more pages)
│   ├── utils/                        # Utility functions
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── public/                           # Static public assets
├── assets/                           # Static assets
├── tests/                            # Test files
├── .env.example                      # Example environment variables
├── index.html                        # HTML entry point
├── vite.config.js                    # Vite configuration
├── package.json                      # Frontend dependencies
└── README.md                         # This file
```

---

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** v14.0.0 or higher
- **MongoDB** v4.0.0 or higher
- **npm** or **yarn** package manager
- (Optional) Barcode scanner for POS

### Step 1: Clone the Repository
```bash
git clone https://github.com/punithsai18/Hack.git
cd Hack
```

### Step 2: Backend Setup

```bash
cd backend
npm install
```

#### Configure Environment Variables

Create `.env` file in `backend` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/pharmaspot

# Email Service (Nodemailer)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key

# File Upload
MAX_FILE_SIZE=10485760
```

#### Start MongoDB

```bash
# Linux/Mac
sudo systemctl start mongod

# Windows
net start MongoDB

# Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### Start Backend Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Backend runs on `http://localhost:5000`

### Step 3: Frontend Setup

```bash
cd ..  # Back to project root
npm install
```

#### Configure Frontend (Optional)

Create `.env` in project root:

```env
VITE_API_URL=http://localhost:5000/api
```

#### Start Frontend

```bash
npm run dev
```

Frontend available at `http://localhost:3000`

### Step 4: Access Application

1. Open browser: `http://localhost:3000`
2. Login:
   - Username: `admin`
   - Password: `admin`
3. **⚠️ IMPORTANT**: Change admin password immediately!

### Step 5: Configure Email (Optional)

**For Gmail:**
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Generate App Password (Mail app)
4. Add to `backend/.env`:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=generated-app-password
```

**For Outlook:**
```env
EMAIL_SERVICE=hotmail
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

Restart backend after configuring email.

For detailed email setup, see [EMAIL_RECEIPT_SETUP.md](EMAIL_RECEIPT_SETUP.md)

---

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
Include JWT token in headers:
```
Authorization: Bearer <your-jwt-token>
```

### Key Endpoints

#### Authentication
```
POST   /api/users/login              # User login
POST   /api/users/register           # User registration
GET    /api/users/profile            # Get profile
PUT    /api/users/profile            # Update profile
```

#### Inventory Management
```
GET    /api/inventory                # Get all products
GET    /api/inventory/:id            # Get product by ID
POST   /api/inventory                # Add new product
PUT    /api/inventory/:id            # Update product
DELETE /api/inventory/:id            # Delete product
POST   /api/inventory/:id/stock      # Add stock
DELETE /api/inventory/:id/stock      # Remove stock
```

#### File Upload & Analysis
```
POST   /api/file-analysis/analyze   # Upload image/Excel for OCR/import
```

**Example:**
```javascript
const formData = new FormData();
formData.append('file', selectedFile);

const response = await fetch('http://localhost:5000/api/file-analysis/analyze', {
  method: 'POST',
  body: formData
});

const result = await response.json();
// result.extractedData contains parsed products
```

#### Transactions (POS)
```
GET    /api/transactions             # Get all transactions
GET    /api/transactions/:id         # Get transaction
POST   /api/transactions             # Create transaction
GET    /api/transactions/stats       # Get statistics
```

#### Chatbot
```
POST   /api/chatbot/query            # Send query
GET    /api/chatbot/quick-actions    # Get suggestions
```

#### Doctor Appointments
```
GET    /api/appointments             # Get all appointments
GET    /api/appointments/:id         # Get appointment
POST   /api/appointments             # Book appointment
PUT    /api/appointments/:id         # Update appointment
DELETE /api/appointments/:id         # Cancel appointment
POST   /api/appointments/:id/complete  # Mark complete
```

#### Real-Time Chat
```
GET    /api/chats/:appointmentId     # Get messages
POST   /api/chats                    # Send message
```

#### Notifications
```
GET    /api/notifications/all        # Get all notifications
GET    /api/notifications/unread     # Get unread
POST   /api/notifications/read/:id   # Mark as read
POST   /api/notifications/read-all   # Mark all as read
DELETE /api/notifications/:id        # Delete notification
```

For complete API documentation, see [backend/README.md](backend/README.md)

---

## �� Usage Guide

### For Pharmacy Staff (POS)

#### Making a Sale
1. Dashboard → Point of Sale
2. Search products (barcode/name/category)
3. Add to cart
4. Adjust quantities
5. Click **Pay**
6. Enter customer info (name, email, phone)
7. Select payment method
8. Enter amount paid
9. Complete payment
10. Print/email receipt

#### Adding Stock (Manual)
1. Inventory → Products
2. Find product
3. Click **Add Stock**
4. Enter quantity, batch, expiry
5. Save

#### Importing Stock (Bulk)
1. Inventory → Upload File
2. Choose method:
   - Take Photo (camera)
   - Upload Image (JPG, PNG)
   - Upload Excel (XLSX, CSV)
3. Wait for OCR/parsing
4. Review extracted data
5. Edit if needed
6. Click **Import to Inventory**

### For Doctors

#### Setting Up Profile
1. Register as doctor
2. Complete Doctor Details Form
3. Add credentials and specialization
4. Set consultation fee
5. Submit for verification

#### Managing Appointments
1. Login to Doctor Dashboard
2. View Appointments tab
3. Review pending appointments
4. Accept/Reject with reason
5. Mark complete (select payment method)

#### Chatting with Patients
1. After appointment confirmed
2. Click Chat button
3. Real-time messaging opens
4. Type and send messages

### For Patients

#### Booking Appointments
1. Navigate to Book Appointment
2. Browse doctors
3. View profiles
4. Click Book Appointment
5. Select date, time, reason
6. Enter details
7. Submit booking
8. Receive email when accepted

#### Checking Status
1. Login to Customer Dashboard
2. View My Appointments
3. Status: Pending/Confirmed/Completed/Cancelled

### For Administrators

#### Managing Users
1. Settings → Users
2. View all users
3. Add/Edit/Deactivate accounts
4. Change roles and permissions

#### Verifying Doctors
1. Admin Dashboard → Doctor Verification
2. Review applications
3. Check credentials
4. Approve/Reject

#### Monitoring Inventory
1. View Dashboard for stats
2. Check notification panel for alerts
3. Use chatbot for queries

---

## 🚀 Deployment

### Production Build

```bash
npm run build
```

### Environment Variables

**Backend:**
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=production-mongodb-uri
CORS_ORIGIN=https://your-domain.com
EMAIL_USER=production-email
EMAIL_PASS=production-password
JWT_SECRET=strong-secret-key
```

**Frontend:**
```env
VITE_API_URL=https://your-api-domain.com/api
```

### Deployment Options

**Option 1: VPS Server**
- Set up Linux server
- Install Node.js and MongoDB
- Use PM2 for process management
- Configure Nginx reverse proxy
- Set up SSL with Let's Encrypt

**Option 2: Cloud Platforms**
- Backend: Heroku, Railway, Render
- Frontend: Vercel, Netlify
- Database: MongoDB Atlas

**Option 3: Docker**
```bash
docker-compose build
docker-compose up -d
```

---

## 🔒 Security

### Implemented Features
- ✅ Password hashing (bcrypt)
- ✅ **Two-Factor Authentication (2FA)** with OTP via email
- ✅ JWT authentication
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Input validation
- ✅ XSS protection (DOMPurify)
- ✅ File upload validation
- ✅ Environment variable protection
- ✅ OTP verification with attempt limits and cooldown

### OTP Authentication Feature
The system now includes **two-factor authentication** for enhanced security:
- 6-digit OTP sent to registered email after credential validation
- 5-minute OTP expiry for time-bound security
- 3-attempt limit with 30-second cooldown after failures
- Resend OTP capability with cooldown timer
- Secure OTP storage and validation

📖 See [OTP_VERIFICATION_FEATURE.md](OTP_VERIFICATION_FEATURE.md) for complete documentation.

### Best Practices
1. Change default admin password
2. Use strong JWT secret
3. Enable HTTPS
4. Regular backups
5. Keep dependencies updated
6. Use environment variables for secrets
7. Monitor logs for suspicious activity
8. Use app-specific email passwords
9. Configure email service for OTP delivery

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m "Add amazing feature"`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## 📜 License

This project is licensed under the **MIT License** - see [LICENSE](LICENSE) file.

---

## 🙏 Credits

- Original concept: [tngoman/Store-POS](https://github.com/tngoman/Store-POS)
- Built with ❤️ by PharmaSpot team
- Icons: [Ionicons](https://ionic.io/ionicons)
- Charts: [Chart.js](https://www.chartjs.org/)
- Email: [Nodemailer](https://nodemailer.com/)
- OCR: [Tesseract.js](https://tesseract.projectnaptha.com/)

---

## 📞 Support

### Documentation
- [Email Receipt Setup](EMAIL_RECEIPT_SETUP.md)
- [Chatbot Documentation](CHATBOT_EXPIRY_FEATURE.md)
- [Notification System](NOTIFICATION_SYSTEM_DOCS.md)
- [Backend API](backend/README.md)

### Get Help
- 🐛 [Report bugs](https://github.com/punithsai18/Hack/issues)
- 💡 [Request features](https://github.com/punithsai18/Hack/issues)
- 💬 [Ask questions](https://github.com/punithsai18/Hack/discussions)

---

## 🗺️ Roadmap

### Upcoming Features
- [ ] Mobile application (React Native)
- [ ] Barcode generation
- [ ] Multi-language support
- [ ] Payment gateway integration
- [ ] Voice commands for POS
- [ ] Video consultation
- [ ] Loyalty rewards program
- [ ] Advanced ML forecasting

### Completed
- [x] Real-time notifications
- [x] Email receipt system
- [x] AI chatbot
- [x] OCR for images
- [x] Doctor appointments
- [x] Payment tracking
- [x] Enterprise security features (encryption, signatures, key exchange)
- [x] Secure document management with Base64 encoding
- [x] Password hashing with salt

---

## 🔒 Security Features

PharmaSpot includes enterprise-grade security features to protect sensitive data and ensure secure communication.

### Password Security
- **Dual-layer hashing**: bcrypt + SHA-256 with custom salt
- **16-byte cryptographic salt** for each password
- **Secure storage** of salt and hash in database
- **Terminal logging** of all hashing operations

### Document Security
- **Base64 encoding** for safe document storage
- **Content integrity verification** using SHA-256 hashes
- **Digital signatures** for authenticity verification
- **RSA encryption** (2048-bit) for sensitive documents
- **Secure download** with access control
- **Fixed admin document download functionality**

### Messaging Security
- **Diffie-Hellman key exchange** for secure communication
- **AES-256-CBC encryption** for message content
- **Digital signatures** for message authenticity
- **Shared secret management** for encrypted channels

### Key Management
- **RSA-2048 key pairs** for asymmetric encryption
- **Secure key storage** in dedicated database collection
- **Key expiration** and rotation support
- **Public key distribution** for secure communication

### Security Operations Logging
All security operations are logged to the terminal with:
- Operation type and timestamp
- Hash values and salts
- Key identifiers (truncated for security)
- Verification status

For detailed documentation, see [SECURITY_IMPLEMENTATION.md](./SECURITY_IMPLEMENTATION.md)

---

## 🎉 Thank You!

Thank you for using **PharmaSpot**! We hope this system helps streamline your pharmacy operations and provides excellent service to your customers and patients.

**Happy Managing! 💊🏥**

---

<p align="center">
  Made with ❤️ by PharmaSpot Team
</p>

<p align="center">
  <a href="https://github.com/punithsai18/Hack">⭐ Star us on GitHub</a> •
  <a href="https://github.com/punithsai18/Hack/issues">🐛 Report Bug</a> •
  <a href="https://github.com/punithsai18/Hack/issues">💡 Request Feature</a>
</p>
