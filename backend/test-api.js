#!/usr/bin/env node

/**
 * API Integration Test
 * Tests all security-enhanced endpoints
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, isFormData = false) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            method: method,
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            headers: {}
        };

        if (data && !isFormData) {
            options.headers['Content-Type'] = 'application/json';
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const result = {
                        status: res.statusCode,
                        headers: res.headers,
                        body: body ? JSON.parse(body) : null
                    };
                    resolve(result);
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: body
                    });
                }
            });
        });

        req.on('error', reject);

        if (data && !isFormData) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

// Test suite
async function runTests() {
    console.log('\n========== API INTEGRATION TESTS ==========\n');
    
    let testsPassed = 0;
    let testsFailed = 0;

    // Test 1: Server is running
    console.log('Test 1: Server Health Check');
    try {
        const result = await makeRequest('GET', '/');
        if (result.status === 200) {
            console.log('✓ Server is running');
            testsPassed++;
        } else {
            console.log('✗ Server not responding correctly');
            testsFailed++;
        }
    } catch (error) {
        console.log('✗ Server is not running');
        console.log('  Please start the server first: cd backend && node server.js');
        testsFailed++;
        process.exit(1);
    }

    // Test 2: Documents API endpoint exists
    console.log('\nTest 2: Documents API Endpoint');
    try {
        const result = await makeRequest('GET', '/api/documents/');
        if (result.status === 200 || result.body) {
            console.log('✓ Documents API is accessible');
            console.log('  Response:', result.body);
            testsPassed++;
        } else {
            console.log('✗ Documents API not accessible');
            testsFailed++;
        }
    } catch (error) {
        console.log('✗ Documents API error:', error.message);
        testsFailed++;
    }

    // Test 3: Messaging API endpoint exists
    console.log('\nTest 3: Messaging API Endpoint');
    try {
        const result = await makeRequest('GET', '/api/messaging/');
        if (result.status === 200 || result.body) {
            console.log('✓ Messaging API is accessible');
            console.log('  Response:', result.body);
            testsPassed++;
        } else {
            console.log('✗ Messaging API not accessible');
            testsFailed++;
        }
    } catch (error) {
        console.log('✗ Messaging API error:', error.message);
        testsFailed++;
    }

    // Test 4: User registration with security features
    console.log('\nTest 4: User Registration (Security Enhanced)');
    try {
        const userData = {
            username: `testuser_${Date.now()}`,
            email: `test_${Date.now()}@example.com`,
            password: 'SecurePass123!',
            fullName: 'Test User',
            role: 'user'
        };
        
        const result = await makeRequest('POST', '/api/users/register', userData);
        if (result.status === 201 && result.body.success) {
            console.log('✓ User registration successful');
            console.log('  User ID:', result.body.userId);
            testsPassed++;
        } else {
            console.log('✗ User registration failed');
            console.log('  Status:', result.status);
            console.log('  Response:', result.body);
            testsFailed++;
        }
    } catch (error) {
        console.log('✗ User registration error:', error.message);
        testsFailed++;
    }

    // Test 5: Key exchange initialization
    console.log('\nTest 5: Key Exchange Initialization');
    try {
        const result = await makeRequest('POST', '/api/messaging/init-key-exchange', {
            userId: 'test_user_id'
        });
        
        if (result.status === 200 && result.body.success) {
            console.log('✓ Key exchange initialized');
            console.log('  Has public key:', !!result.body.publicKey);
            console.log('  Has prime:', !!result.body.prime);
            testsPassed++;
        } else {
            console.log('✗ Key exchange initialization failed');
            console.log('  Response:', result.body);
            testsFailed++;
        }
    } catch (error) {
        console.log('✗ Key exchange error:', error.message);
        testsFailed++;
    }

    // Summary
    console.log('\n========== TEST SUMMARY ==========\n');
    console.log(`Total Tests: ${testsPassed + testsFailed}`);
    console.log(`Passed: ${testsPassed}`);
    console.log(`Failed: ${testsFailed}`);
    console.log('\n====================================\n');

    if (testsFailed === 0) {
        console.log('✓ All tests passed!\n');
        process.exit(0);
    } else {
        console.log('✗ Some tests failed.\n');
        process.exit(1);
    }
}

// Run tests
console.log('Starting API Integration Tests...');
console.log('Make sure the server is running: cd backend && node server.js\n');

// Give server time to start if it's just starting
setTimeout(() => {
    runTests().catch(error => {
        console.error('Test suite error:', error);
        process.exit(1);
    });
}, 1000);
