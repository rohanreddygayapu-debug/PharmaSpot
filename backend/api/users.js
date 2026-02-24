const app = require("express")();
const bcrypt = require("bcrypt");
const saltRounds = 10;
const validator = require("validator");
const User = require("../models/User");
const SecurityKeys = require("../models/SecurityKeys");
const { 
    generateOTP, 
    generateOTPExpiry, 
    validateOTP, 
    isUserBlocked, 
    getRemainingBlockTime, 
    generateBlockTime 
} = require("../services/otpService");
const { sendOTPEmail } = require("../services/emailService");
const {
    generateSalt,
    hashWithSalt,
    verifyHash,
    generateRSAKeyPair,
    logSecurityOperation
} = require("../services/securityService");

module.exports = app;

/**
 * GET endpoint: Get the welcome message for the Users API.
 *
 * @param {Object} req request object.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/", function (req, res) {
    res.send("Users API");
});

/**
 * GET endpoint: Get user details by user ID.
 *
 * @param {Object} req request object with user ID as a parameter.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/user/:userId", async function (req, res) {
    try {
        if (!req.params.userId) {
            return res.status(400).send("ID field is required.");
        }
        const user = await User.findById(req.params.userId);
        res.send(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET endpoint: Log out a user by updating the user status.
 *
 * @param {Object} req request object with user ID as a parameter.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/logout/:userId", async function (req, res) {
    try {
        if (!req.params.userId) {
            return res.status(400).send("ID field is required.");
        }
        await User.findByIdAndUpdate(req.params.userId, {
            status: "Logged Out_" + new Date(),
        });
        res.sendStatus(200);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST endpoint: Authenticate user login and send OTP to email.
 *
 * @param {Object} req request object with login credentials in the body.
 * @param {Object} res response object.
 * @returns {void}
 */
app.post("/login", async function (req, res) {
    try {
        const username = validator.escape(req.body.username);
        const password = req.body.password;
        
        try {
            const user = await User.findOne({ username });
            
            if (user) {
                // Verify password
                const result = await bcrypt.compare(password, user.password);
                if (result) {
                    // Check if two-factor authentication is enabled for this user
                    if (user.twoFactorEnabled) {
                        // Password is correct, generate OTP and send to email
                        const otpCode = generateOTP();
                        const otpExpiry = generateOTPExpiry();
                        
                        // Save OTP to user record
                        user.otpCode = otpCode;
                        user.otpExpiry = otpExpiry;
                        user.otpAttempts = 0; // Reset attempts
                        user.otpBlockedUntil = null; // Clear any existing block
                        await user.save();
                        
                        // Send OTP email
                        if (user.email) {
                            await sendOTPEmail(user.email, otpCode, user.username);
                        }
                        
                        // Return success but don't log in yet - OTP verification required
                        res.send({ 
                            auth: false, 
                            otpRequired: true,
                            userId: user._id,
                            email: user.email,
                            message: 'OTP sent to your email'
                        });
                    } else {
                        // Two-factor auth is disabled, log in directly
                        user.status = "Logged In_" + new Date();
                        await user.save();
                        res.send({ ...user.toObject(), auth: true });
                    }
                } else {
                    // Invalid password
                    res.send({ auth: false, message: 'Invalid credentials' });
                }
            } else {
                // No user Account
                res.send({ auth: false, message: 'Invalid credentials' });
            }
        } catch (dbError) {
            // Database not available, use mock authentication
            console.log('Database not available, using mock authentication');
            
            // Mock authentication for testing - uses environment variables or defaults
            // WARNING: Only for development/testing when DB is unavailable
            const mockAdminUser = process.env.MOCK_ADMIN_USERNAME || 'admin';
            const mockAdminPass = process.env.MOCK_ADMIN_PASSWORD || 'admin';
            const mockDemoUser = process.env.MOCK_DEMO_USERNAME || 'demo';
            const mockDemoPass = process.env.MOCK_DEMO_PASSWORD || 'demo';
            const mockDoctorUser = process.env.MOCK_DOCTOR_USERNAME || 'doctor';
            const mockDoctorPass = process.env.MOCK_DOCTOR_PASSWORD || 'doctor';
            
            if ((username === mockAdminUser && password === mockAdminPass) || 
                (username === mockDemoUser && password === mockDemoPass) ||
                (username === mockDoctorUser && password === mockDoctorPass)) {
                const isAdmin = username === mockAdminUser;
                const isDoctor = username === mockDoctorUser;
                const mockUser = {
                    _id: `mock_user_${username}`,
                    username: username,
                    fullname: isAdmin ? 'Administrator' : (isDoctor ? 'Dr. Sarah Johnson' : 'Demo User'),
                    role: isAdmin ? 'admin' : (isDoctor ? 'doctor' : 'worker'),
                    perm_products: 1,
                    perm_categories: 1,
                    perm_transactions: 1,
                    perm_users: isAdmin ? 1 : 0,
                    perm_settings: isAdmin ? 1 : 0,
                    status: "Logged In_" + new Date(),
                    auth: true
                };
                res.send(mockUser);
            } else {
                res.send({ auth: false, message: 'Invalid credentials' });
            }
        }
    } catch (error) {
        res.send({ auth: false, message: error.message });
    }
});

/**
 * POST endpoint: Verify OTP and complete login.
 *
 * @param {Object} req request object with userId and otp in the body.
 * @param {Object} res response object.
 * @returns {void}
 */
app.post("/verify-otp", async function (req, res) {
    try {
        const { userId, otp } = req.body;

        if (!userId || !otp) {
            return res.status(400).send({ 
                auth: false, 
                message: 'User ID and OTP are required' 
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send({ 
                auth: false, 
                message: 'User not found' 
            });
        }

        // Check if user is blocked
        if (isUserBlocked(user)) {
            const remainingTime = getRemainingBlockTime(user);
            return res.send({ 
                auth: false, 
                blocked: true,
                remainingTime,
                message: `Too many failed attempts. Please wait ${remainingTime} seconds before trying again.`
            });
        }

        // Validate OTP
        const validation = validateOTP(otp, user.otpCode, user.otpExpiry);
        
        if (validation.success) {
            // OTP is valid, complete login
            user.status = "Logged In_" + new Date();
            user.otpCode = null; // Clear OTP
            user.otpExpiry = null;
            user.otpAttempts = 0;
            user.otpBlockedUntil = null;
            await user.save();
            
            res.send({ ...user.toObject(), auth: true });
        } else {
            // OTP is invalid, increment attempts
            user.otpAttempts += 1;
            
            if (user.otpAttempts >= 3) {
                // Block user for 30 seconds after 3 failed attempts
                user.otpBlockedUntil = generateBlockTime();
                await user.save();
                
                return res.send({ 
                    auth: false, 
                    blocked: true,
                    remainingTime: 30,
                    message: 'Too many failed attempts. Please wait 30 seconds before trying again.'
                });
            }
            
            await user.save();
            
            const attemptsLeft = 3 - user.otpAttempts;
            res.send({ 
                auth: false, 
                message: validation.message,
                attemptsLeft
            });
        }
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).send({ 
            auth: false, 
            message: error.message 
        });
    }
});

/**
 * POST endpoint: Resend OTP to user's email.
 *
 * @param {Object} req request object with userId in the body.
 * @param {Object} res response object.
 * @returns {void}
 */
app.post("/resend-otp", async function (req, res) {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).send({ 
                success: false, 
                message: 'User ID is required' 
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Check if user has email
        if (!user.email) {
            return res.status(400).send({ 
                success: false, 
                message: 'No email associated with this account' 
            });
        }

        // Generate new OTP
        const otpCode = generateOTP();
        const otpExpiry = generateOTPExpiry();
        
        // Save new OTP to user record
        user.otpCode = otpCode;
        user.otpExpiry = otpExpiry;
        user.otpAttempts = 0; // Reset attempts when resending
        user.otpBlockedUntil = null; // Clear any existing block
        await user.save();
        
        // Send OTP email
        await sendOTPEmail(user.email, otpCode, user.username);
        
        res.send({ 
            success: true, 
            message: 'New OTP sent to your email'
        });
    } catch (error) {
        console.error('OTP resend error:', error);
        res.status(500).send({ 
            success: false, 
            message: error.message 
        });
    }
});

/**
 * GET endpoint: Get details of all users.
 *
 * @param {Object} req request object.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/all", async function (req, res) {
    try {
        const users = await User.find({});
        res.send(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE endpoint: Delete a user by user ID.
 *
 * @param {Object} req request object with user ID as a parameter.
 * @param {Object} res response object.
 * @returns {void}
 */
app.delete("/user/:userId", async function (req, res) {
    try {
        await User.findByIdAndDelete(req.params.userId);
        res.sendStatus(200);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Internal Server Error",
            message: `An unexpected error occurred. ${error}`,
        });
    }
});

/**
 * POST endpoint: Create or update a user.
 *
 * @param {Object} req request object with user data in the body.
 * @param {Object} res response object.
 * @returns {void}
 */
app.post("/post", async function (req, res) {
    try {
        // Enhanced password hashing with custom salt
        const customSalt = generateSalt(16);
        const { hash: customHash } = hashWithSalt(req.body.password, customSalt);
        
        // Also use bcrypt for backward compatibility
        const bcryptHash = await bcrypt.hash(req.body.password, saltRounds);
        req.body.password = bcryptHash;
        
        // Store custom salt and hash
        req.body.passwordSalt = customSalt;
        req.body.passwordHash = customHash;
        
        // Log security operation (only in development)
        if (process.env.NODE_ENV !== 'production') {
            console.log("\n========== USER PASSWORD HASHING ==========");
            console.log(`Username: ${req.body.username}`);
            console.log(`Custom Salt: ${customSalt}`);
            console.log(`Custom Hash: ${customHash.substring(0, 32)}...`);
            console.log(`Bcrypt Hash: ${bcryptHash.substring(0, 32)}...`);
            console.log("===========================================\n");
        }
        
        const perms = [
            "perm_products",
            "perm_categories",
            "perm_transactions",
            "perm_users",
            "perm_settings",
        ];

        for (const perm of perms) {
            if (!!req.body[perm]) {
                req.body[perm] = req.body[perm] === "on" ? 1 : 0;
            } else {
                // Create missing permission only with new users
                if (req.body.id === "") {
                    req.body[perm] = 0;
                }
            }
        }

        let userData = {
            ...req.body,
            status: "",
        };
        delete userData.id;
        delete userData.pass;
        
        if (req.body.id === "") {
            // Create new user
            const newUser = new User(userData);
            const savedUser = await newUser.save();
            
            // Generate RSA keys for the user
            const { publicKey, privateKey } = generateRSAKeyPair();
            const securityKeys = new SecurityKeys({
                entityType: 'user',
                entityId: savedUser._id.toString(),
                publicKey: publicKey,
                privateKey: privateKey,
                salt: customSalt,
                hash: customHash,
                keyPurpose: 'user_authentication'
            });
            await securityKeys.save();
            
            // Update user with security keys reference
            savedUser.securityKeysId = securityKeys._id;
            await savedUser.save();
            
            if (process.env.NODE_ENV !== 'production') {
                console.log(`✓ Generated RSA-2048 keys for user ${savedUser.username}`);
            }
            
            // Log security operation
            logSecurityOperation('USER_CREATION', {
                userId: savedUser._id,
                username: savedUser.username,
                passwordSalt: customSalt,
                passwordHash: customHash.substring(0, 32) + '...',
                securityKeysId: securityKeys._id
            });
            
            res.send(savedUser);
        } else {
            // Update existing user
            await User.findByIdAndUpdate(req.body.id, userData);
            res.sendStatus(200);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Internal Server Error",
            message: `An unexpected error occurred. ${error}`,
        });
    }
});

/**
 * GET endpoint: Check and initialize the default admin user if not exists.
 *
 * @param {Object} req request object.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/check", async function (req, res) {
    try {
        const adminUser = await User.findOne({ username: "admin" });
        
        if (!adminUser) {
            const hash = await bcrypt.hash("admin", saltRounds);
            const user = new User({
                username: "admin",
                fullname: "Administrator",
                role: "admin",
                perm_products: 1,
                perm_categories: 1,
                perm_transactions: 1,
                perm_users: 1,
                perm_settings: 1,
                status: "",
                password: hash,
            });
            await user.save();
        }
        res.sendStatus(200);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Internal Server Error",
            message: `An unexpected error occurred. ${error}`,
        });
    }
});

/**
 * POST endpoint: Register a new user (customer or doctor).
 *
 * @param {Object} req request object with user data in the body.
 * @param {Object} res response object.
 * @returns {void}
 */
app.post("/register", async function (req, res) {
    try {
        const { username, email, password, fullName, role } = req.body;

        // Validate required fields
        if (!username || !email || !password || !fullName) {
            return res.status(400).json({ 
                success: false, 
                message: "All fields are required" 
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ username }, { email }] 
        });
        
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: "Username or email already exists" 
            });
        }

        // Enhanced password hashing with custom salt
        const customSalt = generateSalt(16);
        const { hash: customHash } = hashWithSalt(password, customSalt);
        
        // Hash password with bcrypt
        const hash = await bcrypt.hash(password, saltRounds);

        // Create new user
        const newUser = new User({
            username: validator.escape(username),
            email: validator.normalizeEmail(email),
            password: hash,
            passwordSalt: customSalt,
            passwordHash: customHash,
            fullname: fullName,
            role: role || 'user',
            status: "Logged Out"
        });

        await newUser.save();
        
        // Generate RSA keys for the user
        const { publicKey, privateKey } = generateRSAKeyPair();
        const securityKeys = new SecurityKeys({
            entityType: 'user',
            entityId: newUser._id.toString(),
            publicKey: publicKey,
            privateKey: privateKey,
            salt: customSalt,
            hash: customHash,
            keyPurpose: 'user_authentication'
        });
        await securityKeys.save();
        
        // Update user with security keys reference
        newUser.securityKeysId = securityKeys._id;
        await newUser.save();
        
        // Log security operation (only in development)
        if (process.env.NODE_ENV !== 'production') {
            console.log("\n========== USER REGISTRATION ==========");
            console.log(`Username: ${newUser.username}`);
            console.log(`Custom Salt: ${customSalt}`);
            console.log(`Custom Hash: ${customHash.substring(0, 32)}...`);
            console.log(`Security Keys ID: ${securityKeys._id}`);
            console.log("========================================\n");
        }
        
        // Log security operation
        logSecurityOperation('USER_REGISTRATION', {
            userId: newUser._id,
            username: newUser.username,
            passwordSalt: customSalt,
            passwordHash: customHash.substring(0, 32) + '...',
            securityKeysId: securityKeys._id
        });

        res.status(201).json({ 
            success: true, 
            message: "User registered successfully",
            userId: newUser._id,
            role: newUser.role
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

/**
 * POST endpoint: Enable or disable two-factor authentication for a user.
 *
 * @param {Object} req request object with userId and enabled flag in the body.
 * @param {Object} res response object.
 * @returns {void}
 */
app.post("/toggle-2fa", async function (req, res) {
    try {
        const { userId, enabled } = req.body;

        if (!userId) {
            return res.status(400).json({ 
                success: false, 
                message: 'User ID is required' 
            });
        }

        if (typeof enabled !== 'boolean') {
            return res.status(400).json({ 
                success: false, 
                message: 'Enabled flag must be a boolean' 
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Check if user has email for 2FA
        if (enabled && !user.email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email is required to enable two-factor authentication' 
            });
        }

        // Update two-factor authentication setting
        user.twoFactorEnabled = enabled;
        await user.save();

        res.json({ 
            success: true, 
            message: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'} successfully`,
            twoFactorEnabled: user.twoFactorEnabled
        });
    } catch (error) {
        console.error('Toggle 2FA error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});