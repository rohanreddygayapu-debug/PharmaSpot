# PharmaSpot Backend API

This is the backend API server for PharmaSpot Point of Sale system.

## Technology Stack

- Node.js with Express.js
- MongoDB with Mongoose ODM
- bcrypt for password hashing
- Rate limiting and CORS for security

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the MongoDB connection string if needed

3. Start MongoDB:
   - Make sure MongoDB is running on your system
   - Default connection: `mongodb://localhost:27017/pharmaspot`

4. Run the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## API Endpoints

### Users
- `GET /api/users/` - Welcome message
- `GET /api/users/all` - Get all users
- `GET /api/users/user/:userId` - Get user by ID
- `POST /api/users/login` - Login
- `POST /api/users/post` - Create/update user
- `DELETE /api/users/user/:userId` - Delete user
- `GET /api/users/logout/:userId` - Logout user
- `GET /api/users/check` - Initialize default admin user

### Customers
- `GET /api/customers/` - Welcome message
- `GET /api/customers/all` - Get all customers
- `GET /api/customers/customer/:customerId` - Get customer by ID
- `POST /api/customers/customer` - Create customer
- `PUT /api/customers/customer` - Update customer
- `DELETE /api/customers/customer/:customerId` - Delete customer

### Categories
- `GET /api/categories/` - Welcome message
- `GET /api/categories/all` - Get all categories
- `POST /api/categories/category` - Create category
- `PUT /api/categories/category` - Update category
- `DELETE /api/categories/category/:categoryId` - Delete category

### Inventory
- Product management endpoints

### Transactions
- Transaction management endpoints

### Settings
- Application settings endpoints

## Default Admin User

On first run, a default admin user is created:
- Username: `admin`
- Password: `admin`

**Important:** Change this password after first login!

## Environment Variables

- `MONGODB_URI` - MongoDB connection string (default: mongodb://localhost:27017/pharmaspot)
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment mode (development/production)
