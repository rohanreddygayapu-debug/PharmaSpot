# OTP Verification Feature

## Overview
This document describes the OTP (One-Time Password) verification feature that has been added to the login flow. After entering their username and password, users must verify their identity by entering a 6-digit OTP sent to their registered email address.

## Features

### 1. Two-Factor Authentication
- After successful credential validation, an OTP is generated and sent to the user's email
- Users must enter the 6-digit OTP to complete login
- OTP is valid for 5 minutes

### 2. Security Features
- **3 Attempt Limit**: Users can attempt OTP verification up to 3 times
- **30-Second Cooldown**: After 3 failed attempts, users are blocked for 30 seconds
- **OTP Expiry**: Each OTP expires after 5 minutes
- **Secure Storage**: OTPs are stored temporarily in the database and cleared after successful verification

### 3. User Experience
- **Visual Feedback**: Clear error messages and attempt counters
- **Resend OTP**: Users can request a new OTP if needed
- **Resend Cooldown**: 60-second cooldown between resend requests
- **Auto-focus**: Automatic focus management in OTP input fields
- **Paste Support**: Users can paste 6-digit OTP codes
- **Back Navigation**: Option to return to login page

## Technical Implementation

### Backend Components

#### 1. User Model Updates
Added OTP-related fields to the User schema:
- `otpCode`: Stores the current OTP (String)
- `otpExpiry`: Stores OTP expiration time (Date)
- `otpAttempts`: Tracks failed verification attempts (Number)
- `otpBlockedUntil`: Stores block expiration time (Date)

#### 2. OTP Service (`backend/services/otpService.js`)
Provides utility functions for OTP management:
- `generateOTP()`: Generates a random 6-digit OTP
- `generateOTPExpiry()`: Creates expiry time (5 minutes)
- `generateBlockTime()`: Creates block time (30 seconds)
- `isUserBlocked()`: Checks if user is currently blocked
- `getRemainingBlockTime()`: Calculates remaining block time
- `validateOTP()`: Validates OTP against stored value and expiry

#### 3. Email Service Updates (`backend/services/emailService.js`)
Added `sendOTPEmail()` function that:
- Sends professionally formatted OTP emails
- Includes security tips and warnings
- Uses the existing nodemailer configuration

#### 4. API Endpoints (`backend/api/users.js`)

**POST /users/login**
- Validates username and password
- Generates OTP and sends to user's email
- Returns `otpRequired: true` with userId and email
- Resets attempts and clears any existing blocks

**POST /users/verify-otp**
- Validates the provided OTP
- Checks for blocks and expired OTPs
- Increments attempt counter on failure
- Blocks user after 3 failed attempts
- Completes login on success

**POST /users/resend-otp**
- Generates new OTP
- Sends to user's email
- Resets attempts and blocks
- 60-second cooldown enforced by frontend

### Frontend Components

#### 1. OTPVerification Component (`src/pages/OTPVerification.jsx`)
A dedicated component for OTP entry featuring:
- 6 separate input fields for each digit
- Auto-advance to next field on input
- Backspace navigation
- Paste support for full OTP codes
- Real-time validation
- Attempt counter display
- Block timer display
- Resend functionality with countdown

#### 2. Login Component Updates (`src/pages/Login.jsx`)
- Added OTP flow state management
- Redirects to OTP verification after credential validation
- Handles OTP success callback
- Provides back navigation

#### 3. AuthContext Updates (`src/contexts/AuthContext.jsx`)
- Modified login function to handle OTP flow
- Returns `otpRequired` flag with user info
- Maintains existing direct login for mock users

#### 4. CSS Styles (`src/pages/Login.css`)
Added comprehensive styles for:
- OTP input fields with focus states
- Warning and error messages
- Block timer display
- Resend button with disabled states
- Responsive mobile layouts

## Configuration

### Environment Variables
Add to `backend/.env`:

```env
# Email Configuration for OTP
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### Gmail Setup
1. Enable 2-factor authentication in your Google account
2. Generate an app-specific password
3. Use the app password in `EMAIL_PASS`

### Other Email Providers
Check [nodemailer documentation](https://nodemailer.com/) for configuration options.

## User Flow

1. **Login Page**: User enters username and password
2. **Credential Validation**: Backend verifies credentials
3. **OTP Generation**: System generates 6-digit OTP
4. **Email Sent**: OTP sent to user's registered email
5. **OTP Page**: User redirected to OTP verification page
6. **OTP Entry**: User enters 6-digit code
7. **Verification**: System validates OTP
8. **Success**: User logged in and redirected to dashboard

### Failed Attempt Flow
1. User enters wrong OTP
2. Attempt counter decrements
3. After 3 failed attempts:
   - User is blocked for 30 seconds
   - Timer displayed showing remaining time
   - OTP input disabled
4. After 30 seconds, user can try again

### Resend OTP Flow
1. User clicks "Resend OTP"
2. New OTP generated and sent
3. Attempts reset to 3
4. 60-second cooldown before next resend
5. Timer displayed on button

## Security Considerations

### Implemented Protections
- ✓ OTP expires after 5 minutes
- ✓ Limited to 3 attempts before cooldown
- ✓ 30-second cooldown after failed attempts
- ✓ OTPs are single-use (cleared after verification)
- ✓ Email masking in UI (shows partial email only)
- ✓ Secure OTP generation using crypto module
- ✓ Rate limiting on API endpoints (existing)

### Best Practices
1. Always use HTTPS in production
2. Keep email credentials secure
3. Monitor failed login attempts
4. Consider adding IP-based rate limiting
5. Log suspicious activities

## Testing

### Manual Testing Steps
1. Register a user with a valid email address
2. Attempt to log in with valid credentials
3. Check email for OTP
4. Enter OTP in verification page
5. Verify successful login

### Testing Edge Cases
1. **Expired OTP**: Wait 5 minutes before entering OTP
2. **Wrong OTP**: Enter incorrect code 3 times
3. **Cooldown**: Verify 30-second block works
4. **Resend**: Test resend functionality
5. **Back Navigation**: Test returning to login page

### Automated Tests
Run OTP service tests:
```bash
cd /home/runner/work/Hack/Hack
node tests/otpService.test.js
```

## Future Enhancements

Potential improvements for future iterations:
1. SMS-based OTP as alternative to email
2. Configurable OTP length and expiry time
3. Remember device functionality
4. Admin dashboard for OTP monitoring
5. Backup codes for account recovery
6. Progressive attempt penalties (increasing cooldown)
7. IP-based suspicious activity detection
8. Notification on new login from unknown device

## Troubleshooting

### Email Not Received
1. Check spam/junk folder
2. Verify EMAIL_USER and EMAIL_PASS in .env
3. Check Gmail app password is correct
4. Verify user has valid email in database
5. Check backend logs for email errors

### OTP Invalid Even When Correct
1. Check server time is synchronized
2. Verify OTP hasn't expired (5 minutes)
3. Ensure no extra spaces in OTP entry
4. Check database connection is stable

### User Blocked Forever
1. Check otpBlockedUntil field in database
2. Manually clear the field if needed
3. Verify server time is correct
4. Check for client-side time issues

## API Reference

### POST /users/login
Request:
```json
{
  "username": "john_doe",
  "password": "secure_password"
}
```

Response (OTP Required):
```json
{
  "auth": false,
  "otpRequired": true,
  "userId": "507f1f77bcf86cd799439011",
  "email": "jo**@example.com",
  "message": "OTP sent to your email"
}
```

### POST /users/verify-otp
Request:
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "otp": "123456"
}
```

Response (Success):
```json
{
  "auth": true,
  "_id": "507f1f77bcf86cd799439011",
  "username": "john_doe",
  "fullname": "John Doe",
  "role": "user",
  ...
}
```

Response (Failed):
```json
{
  "auth": false,
  "message": "Invalid OTP. Please try again.",
  "attemptsLeft": 2
}
```

Response (Blocked):
```json
{
  "auth": false,
  "blocked": true,
  "remainingTime": 28,
  "message": "Too many failed attempts. Please wait 28 seconds before trying again."
}
```

### POST /users/resend-otp
Request:
```json
{
  "userId": "507f1f77bcf86cd799439011"
}
```

Response:
```json
{
  "success": true,
  "message": "New OTP sent to your email"
}
```

## Support

For issues or questions about the OTP feature:
1. Check this documentation first
2. Review backend logs for errors
3. Verify email configuration
4. Test with a different email provider if needed
5. Contact system administrator

## License
This feature is part of the PharmaAI system and follows the same MIT license as the main project.
