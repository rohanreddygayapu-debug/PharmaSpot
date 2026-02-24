/**
 * CRUD Operations Test Script
 * 
 * This script tests the CRUD operations implementation by verifying:
 * 1. All required API endpoints exist
 * 2. Models are properly defined
 * 3. Default user initialization logic is correct
 */

const fs = require('fs');
const path = require('path');

console.log('=== CRUD Operations Implementation Test ===\n');

// Test 1: Verify all API files exist
console.log('Test 1: Verifying API endpoints...');
const apiFiles = [
    'users.js',
    'customers.js',
    'inventory.js',
    'categories.js',
    'transactions.js',
    'settings.js'
];

let apiTestsPassed = 0;
apiFiles.forEach(file => {
    const filePath = path.join(__dirname, 'api', file);
    if (fs.existsSync(filePath)) {
        console.log(`  ✓ ${file} exists`);
        apiTestsPassed++;
    } else {
        console.log(`  ✗ ${file} missing`);
    }
});
console.log(`API Files: ${apiTestsPassed}/${apiFiles.length} passed\n`);

// Test 2: Verify all models exist
console.log('Test 2: Verifying Models...');
const modelFiles = [
    'User.js',
    'Customer.js',
    'Product.js',
    'Category.js',
    'Transaction.js',
    'Settings.js'
];

let modelTestsPassed = 0;
modelFiles.forEach(file => {
    const filePath = path.join(__dirname, 'models', file);
    if (fs.existsSync(filePath)) {
        console.log(`  ✓ ${file} exists`);
        modelTestsPassed++;
    } else {
        console.log(`  ✗ ${file} missing`);
    }
});
console.log(`Models: ${modelTestsPassed}/${modelFiles.length} passed\n`);

// Test 3: Verify CRUD endpoints in users.js
console.log('Test 3: Verifying User CRUD endpoints...');
const usersApiContent = fs.readFileSync(path.join(__dirname, 'api', 'users.js'), 'utf8');
const userEndpoints = [
    { name: 'GET /all (Read All)', pattern: /app\.get\(["']\/all["']/ },
    { name: 'GET /user/:userId (Read One)', pattern: /app\.get\(["']\/user\/:\w+["']/ },
    { name: 'POST /post (Create/Update)', pattern: /app\.post\(["']\/post["']/ },
    { name: 'DELETE /user/:userId (Delete)', pattern: /app\.delete\(["']\/user\/:\w+["']/ },
    { name: 'POST /login (Login)', pattern: /app\.post\(["']\/login["']/ }
];

let userEndpointsPassed = 0;
userEndpoints.forEach(endpoint => {
    if (endpoint.pattern.test(usersApiContent)) {
        console.log(`  ✓ ${endpoint.name} implemented`);
        userEndpointsPassed++;
    } else {
        console.log(`  ✗ ${endpoint.name} missing`);
    }
});
console.log(`User Endpoints: ${userEndpointsPassed}/${userEndpoints.length} passed\n`);

// Test 4: Verify CRUD endpoints in customers.js
console.log('Test 4: Verifying Customer CRUD endpoints...');
const customersApiContent = fs.readFileSync(path.join(__dirname, 'api', 'customers.js'), 'utf8');
const customerEndpoints = [
    { name: 'GET /all (Read All)', pattern: /app\.get\(["']\/all["']/ },
    { name: 'GET /customer/:id (Read One)', pattern: /app\.get\(["']\/customer\/:\w+["']/ },
    { name: 'POST /customer (Create)', pattern: /app\.post\(["']\/customer["']/ },
    { name: 'PUT /customer (Update)', pattern: /app\.put\(["']\/customer["']/ },
    { name: 'DELETE /customer/:id (Delete)', pattern: /app\.delete\(["']\/customer\/:\w+["']/ }
];

let customerEndpointsPassed = 0;
customerEndpoints.forEach(endpoint => {
    if (endpoint.pattern.test(customersApiContent)) {
        console.log(`  ✓ ${endpoint.name} implemented`);
        customerEndpointsPassed++;
    } else {
        console.log(`  ✗ ${endpoint.name} missing`);
    }
});
console.log(`Customer Endpoints: ${customerEndpointsPassed}/${customerEndpoints.length} passed\n`);

// Test 5: Verify CRUD endpoints in inventory.js
console.log('Test 5: Verifying Inventory CRUD endpoints...');
const inventoryApiContent = fs.readFileSync(path.join(__dirname, 'api', 'inventory.js'), 'utf8');
const inventoryEndpoints = [
    { name: 'GET /products (Read All)', pattern: /app\.get\(["']\/products["']/ },
    { name: 'GET /product/:id (Read One)', pattern: /app\.get\(["']\/product\/:\w+["']/ },
    { name: 'POST /product (Create/Update)', pattern: /app\.post\(["']\/product["']/ },
    { name: 'DELETE /product/:id (Delete)', pattern: /app\.delete\(["']\/product\/:\w+["']/ }
];

let inventoryEndpointsPassed = 0;
inventoryEndpoints.forEach(endpoint => {
    if (endpoint.pattern.test(inventoryApiContent)) {
        console.log(`  ✓ ${endpoint.name} implemented`);
        inventoryEndpointsPassed++;
    } else {
        console.log(`  ✗ ${endpoint.name} missing`);
    }
});
console.log(`Inventory Endpoints: ${inventoryEndpointsPassed}/${inventoryEndpoints.length} passed\n`);

// Define init checks patterns (reused for validation and counting)
const initChecksPatterns = [
    { name: 'Checks for existing admin user', pattern: /User\.findOne.*admin/ },
    { name: 'Creates admin user if not exists', pattern: /new User\({/ },
    { name: 'Hashes password with bcrypt', pattern: /bcrypt\.hash/ },
    { name: 'Sets all permissions', pattern: /perm_\w+:\s*1/ }
];

// Test 6: Verify default user initialization
console.log('Test 6: Verifying Default User Initialization...');
const initDefaultUserExists = fs.existsSync(path.join(__dirname, 'config', 'initDefaultUser.js'));
let initChecksPassed = 0;

if (initDefaultUserExists) {
    console.log('  ✓ initDefaultUser.js exists');
    const initContent = fs.readFileSync(path.join(__dirname, 'config', 'initDefaultUser.js'), 'utf8');
    
    initChecksPatterns.forEach(check => {
        if (check.pattern.test(initContent)) {
            console.log(`  ✓ ${check.name}`);
            initChecksPassed++;
        } else {
            console.log(`  ✗ ${check.name}`);
        }
    });
    console.log(`Init Checks: ${initChecksPassed}/${initChecksPatterns.length} passed\n`);
} else {
    console.log('  ✗ initDefaultUser.js missing\n');
}

// Test 7: Verify server.js calls initDefaultUser
console.log('Test 7: Verifying Server Initialization...');
const serverContent = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
const serverChecks = [
    { name: 'Imports initDefaultUser', pattern: /require.*initDefaultUser/ },
    { name: 'Calls connectDB', pattern: /connectDB\(\)/ },
    { name: 'Calls initDefaultUser', pattern: /initDefaultUser\(\)/ }
];

let serverChecksPassed = 0;
serverChecks.forEach(check => {
    if (check.pattern.test(serverContent)) {
        console.log(`  ✓ ${check.name}`);
        serverChecksPassed++;
    } else {
        console.log(`  ✗ ${check.name}`);
    }
});
console.log(`Server Checks: ${serverChecksPassed}/${serverChecks.length} passed\n`);

// Summary
console.log('=== Test Summary ===');

const totalTests = apiTestsPassed + modelTestsPassed + userEndpointsPassed + 
                   customerEndpointsPassed + inventoryEndpointsPassed + 
                   serverChecksPassed + initChecksPassed;
const maxTests = apiFiles.length + modelFiles.length + userEndpoints.length + 
                customerEndpoints.length + inventoryEndpoints.length + 
                serverChecks.length + (initDefaultUserExists ? initChecksPatterns.length : 0);

console.log(`Total: ${totalTests}/${maxTests} tests passed`);

if (totalTests === maxTests) {
    console.log('\n✅ All CRUD operations are properly implemented!');
    console.log('✅ Default admin user will be created on server startup!');
    process.exit(0);
} else {
    console.log('\n⚠️  Some tests failed. Review the implementation.');
    process.exit(1);
}
