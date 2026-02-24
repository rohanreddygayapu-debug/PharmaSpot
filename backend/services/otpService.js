const crypto = require('crypto');

/**
 * OTP Service for generating and validating One-Time Passwords
 * Used for two-factor authentication during login
 */

/**
 * Generate a 6-digit OTP code
 * @returns {String} 6-digit OTP code
 */
function generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
}

/**
 * Generate OTP expiry time (5 minutes from now)
 * @returns {Date} Expiry date
 */
function generateOTPExpiry() {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 5); // OTP valid for 5 minutes
    return expiry;
}

/**
 * Generate block time (30 seconds from now)
 * @returns {Date} Block until date
 */
function generateBlockTime() {
    const blockTime = new Date();
    blockTime.setSeconds(blockTime.getSeconds() + 30); // Block for 30 seconds
    return blockTime;
}

/**
 * Check if user is currently blocked from OTP verification
 * @param {Object} user - User object with otpBlockedUntil field
 * @returns {Boolean} True if user is blocked, false otherwise
 */
function isUserBlocked(user) {
    if (!user.otpBlockedUntil) return false;
    return new Date() < user.otpBlockedUntil;
}

/**
 * Get remaining block time in seconds
 * @param {Object} user - User object with otpBlockedUntil field
 * @returns {Number} Remaining seconds until unblocked
 */
function getRemainingBlockTime(user) {
    if (!user.otpBlockedUntil) return 0;
    const now = new Date();
    if (now >= user.otpBlockedUntil) return 0;
    return Math.ceil((user.otpBlockedUntil - now) / 1000);
}

/**
 * Validate OTP code
 * @param {String} providedOTP - OTP provided by user
 * @param {String} storedOTP - OTP stored in database
 * @param {Date} otpExpiry - OTP expiry date
 * @returns {Object} Validation result with success status and message
 */
function validateOTP(providedOTP, storedOTP, otpExpiry) {
    // Check if OTP exists
    if (!storedOTP || !otpExpiry) {
        return {
            success: false,
            message: 'No OTP found. Please request a new OTP.'
        };
    }

    // Check if OTP is expired
    if (new Date() > otpExpiry) {
        return {
            success: false,
            message: 'OTP has expired. Please request a new OTP.'
        };
    }

    // Check if OTP matches
    if (providedOTP !== storedOTP) {
        return {
            success: false,
            message: 'Invalid OTP. Please try again.'
        };
    }

    return {
        success: true,
        message: 'OTP verified successfully.'
    };
}

module.exports = {
    generateOTP,
    generateOTPExpiry,
    generateBlockTime,
    isUserBlocked,
    getRemainingBlockTime,
    validateOTP
};
