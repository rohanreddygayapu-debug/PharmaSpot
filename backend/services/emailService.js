const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Email Service for sending transaction receipts and appointment notifications
 * Uses nodemailer for reliable email delivery from Node.js server
 */

/**
 * Create email transporter
 * @returns {Object|null} Nodemailer transporter or null if not configured
 */
function createEmailTransporter() {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const emailService = process.env.EMAIL_SERVICE || 'gmail';

    if (!emailUser || !emailPass) {
        console.warn('Email not configured. Please configure EMAIL_USER and EMAIL_PASS in .env file.');
        return null;
    }

    return nodemailer.createTransport({
        service: emailService,
        auth: {
            user: emailUser,
            pass: emailPass
        }
    });
}

/**
 * Generate email receipt HTML for a transaction
 * @param {Object} transaction - Transaction object with items, customer info, etc.
 * @returns {String} HTML formatted receipt
 */
function generateReceiptHTML(transaction) {
    const items = transaction.items || [];
    const customerInfo = transaction.customerInfo || {};
    
    const itemsHTML = items.map(item => `
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${(item.price || 0).toFixed(2)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${(item.total || 0).toFixed(2)}</td>
        </tr>
    `).join('');

    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">Payment Receipt</h1>
                <p style="margin: 5px 0;">Thank you for your purchase!</p>
            </div>
            
            <div style="background-color: #f9f9f9; padding: 20px; margin-top: 20px;">
                <h2 style="color: #333; margin-top: 0;">Transaction Details</h2>
                <p><strong>Invoice:</strong> #${transaction.transactionId || transaction._id?.toString().slice(-6) || 'N/A'}</p>
                <p><strong>Date:</strong> ${new Date(transaction.createdAt || transaction.date || Date.now()).toLocaleString()}</p>
                <p><strong>Payment Method:</strong> ${(transaction.paymentMethod || 'cash').toUpperCase()}</p>
            </div>
            
            <div style="margin-top: 20px;">
                <h2 style="color: #333;">Customer Information</h2>
                <p><strong>Name:</strong> ${customerInfo.name || 'N/A'}</p>
                ${customerInfo.phone ? `<p><strong>Phone:</strong> ${customerInfo.phone}</p>` : ''}
                ${customerInfo.email ? `<p><strong>Email:</strong> ${customerInfo.email}</p>` : ''}
            </div>
            
            <div style="margin-top: 20px;">
                <h2 style="color: #333;">Items Purchased</h2>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
                            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
                            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
                            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>
            </div>
            
            <div style="margin-top: 30px; padding: 20px; background-color: #f9f9f9; border-top: 2px solid #4CAF50;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 5px 0;"><strong>Subtotal:</strong></td>
                        <td style="padding: 5px 0; text-align: right;">$${(transaction.subtotal || transaction.total || 0).toFixed(2)}</td>
                    </tr>
                    ${transaction.discount ? `
                    <tr>
                        <td style="padding: 5px 0; color: #4CAF50;"><strong>Discount:</strong></td>
                        <td style="padding: 5px 0; text-align: right; color: #4CAF50;">-$${(transaction.discount || 0).toFixed(2)}</td>
                    </tr>` : ''}
                    ${transaction.tax ? `
                    <tr>
                        <td style="padding: 5px 0;"><strong>Tax:</strong></td>
                        <td style="padding: 5px 0; text-align: right;">$${(transaction.tax || 0).toFixed(2)}</td>
                    </tr>` : ''}
                    <tr style="border-top: 2px solid #ddd;">
                        <td style="padding: 15px 0 10px 0; font-size: 1.2em;"><strong>Total Amount:</strong></td>
                        <td style="padding: 15px 0 10px 0; font-size: 1.2em; text-align: right;"><strong>$${(transaction.total || 0).toFixed(2)}</strong></td>
                    </tr>
                    ${transaction.payment ? `
                    <tr>
                        <td style="padding: 5px 0;">Amount Paid:</td>
                        <td style="padding: 5px 0; text-align: right;">$${(transaction.payment || 0).toFixed(2)}</td>
                    </tr>` : ''}
                    ${transaction.change ? `
                    <tr>
                        <td style="padding: 5px 0;">Change:</td>
                        <td style="padding: 5px 0; text-align: right;">$${(transaction.change || 0).toFixed(2)}</td>
                    </tr>` : ''}
                </table>
            </div>
            
            <div style="margin-top: 30px; padding: 20px; background-color: #f0f0f0; text-align: center;">
                <p style="margin: 0; color: #666;">Thank you for shopping with us!</p>
                <p style="margin: 5px 0; color: #666; font-size: 0.9em;">If you have any questions, please contact us.</p>
            </div>
        </div>
    `;
}

/**
 * Send transaction receipt email to customer
 * @param {Object} transaction - Transaction object with customer email and transaction details
 * @returns {Promise<Object>} Result of email sending operation
 */
async function sendTransactionReceipt(transaction) {
    try {
        // Create transporter
        const transporter = createEmailTransporter();
        if (!transporter) {
            return {
                success: false,
                error: 'Email not configured',
                skipped: true
            };
        }

        // Check if customer has email
        const customerEmail = transaction.customerInfo?.email;
        if (!customerEmail) {
            console.log('No customer email provided. Skipping email send.');
            return {
                success: false,
                error: 'No customer email provided',
                skipped: true
            };
        }

        // Generate receipt HTML
        const receiptHTML = generateReceiptHTML(transaction);

        // Prepare email options
        const mailOptions = {
            from: `"PharmaSpot" <${process.env.EMAIL_USER}>`,
            to: customerEmail,
            subject: `Payment Receipt - Invoice #${transaction.transactionId || transaction._id?.toString().slice(-6) || 'N/A'}`,
            html: receiptHTML
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);

        console.log('✓ Email receipt sent successfully to:', customerEmail);
        return {
            success: true,
            messageId: info.messageId,
            email: customerEmail
        };

    } catch (error) {
        console.error('Error sending email receipt:', error);
        return {
            success: false,
            error: error.message || 'Unknown error occurred',
            skipped: false
        };
    }
}

/**
 * Send appointment confirmation email to doctor when patient books appointment
 * @param {Object} appointment - Appointment object with patient and doctor details
 * @param {Object} doctor - Doctor user object with email
 * @returns {Promise<Object>} Result of email sending operation
 */
async function sendAppointmentNotificationToDoctor(appointment, doctor) {
    try {
        // Create transporter
        const transporter = createEmailTransporter();
        if (!transporter) {
            return {
                success: false,
                error: 'Email not configured',
                skipped: true
            };
        }

        // Check if doctor has email
        const doctorEmail = doctor.email;
        if (!doctorEmail) {
            console.log('No doctor email provided. Skipping email send.');
            return {
                success: false,
                error: 'No doctor email provided',
                skipped: true
            };
        }

        // Prepare email HTML
        const emailHTML = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background-color: #2196F3; color: white; padding: 20px; text-align: center;">
                        <h1 style="margin: 0;">New Appointment Request</h1>
                    </div>
                    
                    <div style="background-color: #f9f9f9; padding: 20px; margin-top: 20px;">
                        <h2 style="color: #333; margin-top: 0;">Appointment Details</h2>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0;"><strong>Patient Name:</strong></td>
                                <td style="padding: 8px 0;">${appointment.patientName}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0;"><strong>Phone:</strong></td>
                                <td style="padding: 8px 0;">${appointment.patientPhone || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0;"><strong>Email:</strong></td>
                                <td style="padding: 8px 0;">${appointment.patientEmail || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0;"><strong>Date:</strong></td>
                                <td style="padding: 8px 0;">${new Date(appointment.appointmentDate).toLocaleDateString()}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0;"><strong>Time:</strong></td>
                                <td style="padding: 8px 0;">${appointment.appointmentTime}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0;"><strong>Reason:</strong></td>
                                <td style="padding: 8px 0;">${appointment.reason || 'General consultation'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0;"><strong>Status:</strong></td>
                                <td style="padding: 8px 0;"><span style="background-color: #FFA726; color: white; padding: 4px 8px; border-radius: 4px;">${appointment.status || 'pending'}</span></td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="margin-top: 20px; padding: 20px; background-color: #f0f0f0; text-align: center;">
                        <p style="margin: 0; color: #666;">Please review and confirm the appointment in your dashboard.</p>
                    </div>
                </div>
            `;

        // Prepare email options
        const mailOptions = {
            from: `"PharmaSpot" <${process.env.EMAIL_USER}>`,
            to: doctorEmail,
            subject: `New Appointment Request - ${appointment.patientName}`,
            html: emailHTML
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);

        console.log('✓ Appointment notification email sent to doctor:', doctorEmail);
        return {
            success: true,
            messageId: info.messageId,
            email: doctorEmail
        };

    } catch (error) {
        console.error('Error sending appointment notification to doctor:', error);
        return {
            success: false,
            error: error.message || 'Unknown error occurred',
            skipped: false
        };
    }
}

/**
 * Send appointment acceptance email to patient when doctor accepts/confirms the appointment
 * @param {Object} appointment - Appointment object with patient and doctor details
 * @param {Object} doctor - Doctor user object with name/email
 * @returns {Promise<Object>} Result of email sending operation
 */
async function sendAppointmentAcceptanceToPatient(appointment, doctor) {
    try {
        // Create transporter
        const transporter = createEmailTransporter();
        if (!transporter) {
            return {
                success: false,
                error: 'Email not configured',
                skipped: true
            };
        }

        // Check if patient has email
        const patientEmail = appointment.patientEmail;
        if (!patientEmail) {
            console.log('No patient email provided. Skipping email send.');
            return {
                success: false,
                error: 'No patient email provided',
                skipped: true
            };
        }

        // Prepare email HTML
        const emailHTML = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
                        <h1 style="margin: 0;">Appointment Confirmed!</h1>
                        <p style="margin: 5px 0;">Your appointment has been accepted</p>
                    </div>
                    
                    <div style="background-color: #f9f9f9; padding: 20px; margin-top: 20px;">
                        <h2 style="color: #333; margin-top: 0;">Appointment Details</h2>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0;"><strong>Doctor:</strong></td>
                                <td style="padding: 8px 0;">Dr. ${doctor.fullname || doctor.name || 'Doctor'}</td>
                            </tr>
                            ${doctor.specialization ? `
                            <tr>
                                <td style="padding: 8px 0;"><strong>Specialization:</strong></td>
                                <td style="padding: 8px 0;">${doctor.specialization}</td>
                            </tr>` : ''}
                            <tr>
                                <td style="padding: 8px 0;"><strong>Date:</strong></td>
                                <td style="padding: 8px 0;">${new Date(appointment.appointmentDate).toLocaleDateString()}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0;"><strong>Time:</strong></td>
                                <td style="padding: 8px 0;">${appointment.appointmentTime}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0;"><strong>Reason:</strong></td>
                                <td style="padding: 8px 0;">${appointment.reason || 'General consultation'}</td>
                            </tr>
                            ${appointment.consultationFee ? `
                            <tr>
                                <td style="padding: 8px 0;"><strong>Consultation Fee:</strong></td>
                                <td style="padding: 8px 0;">$${appointment.consultationFee.toFixed(2)}</td>
                            </tr>` : ''}
                            ${appointment.notes ? `
                            <tr>
                                <td style="padding: 8px 0;"><strong>Notes:</strong></td>
                                <td style="padding: 8px 0;">${appointment.notes}</td>
                            </tr>` : ''}
                        </table>
                    </div>
                    
                    <div style="margin-top: 20px; padding: 20px; background-color: #e8f5e9; text-align: center; border-left: 4px solid #4CAF50;">
                        <p style="margin: 0; color: #2e7d32; font-weight: bold;">Please arrive 10 minutes before your scheduled time.</p>
                    </div>
                    
                    <div style="margin-top: 20px; padding: 20px; background-color: #f0f0f0; text-align: center;">
                        <p style="margin: 0; color: #666;">If you need to reschedule or cancel, please contact us in advance.</p>
                        ${doctor.phone ? `<p style="margin: 5px 0; color: #666;">Contact: ${doctor.phone}</p>` : ''}
                    </div>
                </div>
            `;

        // Prepare email options
        const mailOptions = {
            from: `"PharmaSpot" <${process.env.EMAIL_USER}>`,
            to: patientEmail,
            subject: `Appointment Confirmed with Dr. ${doctor.fullname || doctor.name || 'Doctor'}`,
            html: emailHTML
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);

        console.log('✓ Appointment acceptance email sent to patient:', patientEmail);
        return {
            success: true,
            messageId: info.messageId,
            email: patientEmail
        };

    } catch (error) {
        console.error('Error sending appointment acceptance to patient:', error);
        return {
            success: false,
            error: error.message || 'Unknown error occurred',
            skipped: false
        };
    }
}

/**
 * Send OTP verification email to user
 * @param {String} email - User's email address
 * @param {String} otpCode - 6-digit OTP code
 * @param {String} username - User's username
 * @returns {Promise<Object>} Result of email sending operation
 */
async function sendOTPEmail(email, otpCode, username) {
    try {
        // Create transporter
        const transporter = createEmailTransporter();
        if (!transporter) {
            return {
                success: false,
                error: 'Email not configured',
                skipped: true
            };
        }

        // Check if email is provided
        if (!email) {
            console.log('No email provided. Skipping OTP email send.');
            return {
                success: false,
                error: 'No email provided',
                skipped: true
            };
        }

        // Prepare email HTML
        const emailHTML = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0;">PharmaAI Login Verification</h1>
                    <p style="margin: 5px 0;">One-Time Password</p>
                </div>
                
                <div style="background-color: #f9f9f9; padding: 30px; margin-top: 20px; text-align: center;">
                    <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Hello ${username},</p>
                    <p style="color: #666; font-size: 14px; margin-bottom: 30px;">
                        You are attempting to log in to your PharmaAI account. Please use the following OTP to complete your login:
                    </p>
                    
                    <div style="background-color: #fff; border: 2px dashed #4CAF50; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="color: #333; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 0;">
                            ${otpCode}
                        </p>
                    </div>
                    
                    <p style="color: #666; font-size: 14px; margin-top: 30px;">
                        This OTP is valid for <strong>5 minutes</strong>.
                    </p>
                    <p style="color: #666; font-size: 14px;">
                        If you didn't attempt to log in, please ignore this email and ensure your account is secure.
                    </p>
                </div>
                
                <div style="margin-top: 20px; padding: 20px; background-color: #f0f0f0; text-align: center;">
                    <p style="margin: 0; color: #666; font-size: 12px;">
                        <strong>Security Tip:</strong> Never share your OTP with anyone. PharmaAI will never ask for your OTP via phone or email.
                    </p>
                </div>
                
                <div style="margin-top: 20px; text-align: center; color: #999; font-size: 12px;">
                    <p>© 2024 PharmaAI Systems. All rights reserved.</p>
                </div>
            </div>
        `;

        // Prepare email options
        const mailOptions = {
            from: `"PharmaAI" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your PharmaAI Login OTP',
            html: emailHTML
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);

        console.log('✓ OTP email sent successfully to:', email);
        return {
            success: true,
            messageId: info.messageId,
            email: email
        };

    } catch (error) {
        console.error('Error sending OTP email:', error);
        return {
            success: false,
            error: error.message || 'Unknown error occurred',
            skipped: false
        };
    }
}

module.exports = {
    sendTransactionReceipt,
    generateReceiptHTML,
    sendAppointmentNotificationToDoctor,
    sendAppointmentAcceptanceToPatient,
    sendOTPEmail
};
