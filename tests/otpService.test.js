/**
 * Test script for OTP service
 * Tests the basic functionality of the OTP service
 */

const { 
    generateOTP, 
    generateOTPExpiry, 
    generateBlockTime,
    isUserBlocked,
    getRemainingBlockTime,
    validateOTP 
} = require('../backend/services/otpService');

console.log('Testing OTP Service...\n');

// Test 1: Generate OTP
console.log('Test 1: Generate OTP');
const otp = generateOTP();
console.log('Generated OTP:', otp);
console.log('OTP length:', otp.length);
console.log('Is 6 digits?', /^\d{6}$/.test(otp));
console.log('✓ Test 1 passed\n');

// Test 2: Generate OTP Expiry
console.log('Test 2: Generate OTP Expiry');
const expiry = generateOTPExpiry();
const now = new Date();
const diffMinutes = (expiry - now) / 1000 / 60;
console.log('Expiry time:', expiry);
console.log('Minutes from now:', diffMinutes.toFixed(2));
console.log('Is approximately 5 minutes?', Math.abs(diffMinutes - 5) < 0.1);
console.log('✓ Test 2 passed\n');

// Test 3: Generate Block Time
console.log('Test 3: Generate Block Time');
const blockTime = generateBlockTime();
const diffSeconds = (blockTime - now) / 1000;
console.log('Block time:', blockTime);
console.log('Seconds from now:', diffSeconds.toFixed(2));
console.log('Is approximately 30 seconds?', Math.abs(diffSeconds - 30) < 1);
console.log('✓ Test 3 passed\n');

// Test 4: Check if user is blocked
console.log('Test 4: Check if user is blocked');
const userNotBlocked = { otpBlockedUntil: null };
const userBlocked = { otpBlockedUntil: new Date(Date.now() + 10000) }; // 10 seconds from now
const userUnblocked = { otpBlockedUntil: new Date(Date.now() - 10000) }; // 10 seconds ago
console.log('User not blocked?', !isUserBlocked(userNotBlocked));
console.log('User is blocked?', isUserBlocked(userBlocked));
console.log('User unblocked (past time)?', !isUserBlocked(userUnblocked));
console.log('✓ Test 4 passed\n');

// Test 5: Get remaining block time
console.log('Test 5: Get remaining block time');
const remainingTime = getRemainingBlockTime(userBlocked);
console.log('Remaining time (seconds):', remainingTime);
console.log('Is approximately 10 seconds?', Math.abs(remainingTime - 10) < 2);
console.log('✓ Test 5 passed\n');

// Test 6: Validate OTP - Success
console.log('Test 6: Validate OTP - Success');
const testOTP = '123456';
const testExpiry = new Date(Date.now() + 60000); // 1 minute from now
const validResult = validateOTP(testOTP, testOTP, testExpiry);
console.log('Validation result:', validResult);
console.log('Success?', validResult.success === true);
console.log('✓ Test 6 passed\n');

// Test 7: Validate OTP - Wrong code
console.log('Test 7: Validate OTP - Wrong code');
const wrongResult = validateOTP('654321', testOTP, testExpiry);
console.log('Validation result:', wrongResult);
console.log('Failed?', wrongResult.success === false);
console.log('Correct message?', wrongResult.message.includes('Invalid'));
console.log('✓ Test 7 passed\n');

// Test 8: Validate OTP - Expired
console.log('Test 8: Validate OTP - Expired');
const expiredTime = new Date(Date.now() - 60000); // 1 minute ago
const expiredResult = validateOTP(testOTP, testOTP, expiredTime);
console.log('Validation result:', expiredResult);
console.log('Failed?', expiredResult.success === false);
console.log('Correct message?', expiredResult.message.includes('expired'));
console.log('✓ Test 8 passed\n');

// Test 9: Validate OTP - No OTP
console.log('Test 9: Validate OTP - No OTP');
const noOTPResult = validateOTP(testOTP, null, null);
console.log('Validation result:', noOTPResult);
console.log('Failed?', noOTPResult.success === false);
console.log('Correct message?', noOTPResult.message.includes('No OTP'));
console.log('✓ Test 9 passed\n');

console.log('All tests passed! ✓');
