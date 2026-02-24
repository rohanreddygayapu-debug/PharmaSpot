# Email Receipt Configuration

This application uses EmailJS REST API to send automated emails from the Node.js backend for:
1. **Transaction receipts** - Sent to customers after successful purchases
2. **Appointment notifications** - Sent to doctors when patients book appointments
3. **Appointment confirmations** - Sent to patients when doctors accept/confirm appointments

**Note**: The application uses EmailJS REST API directly (via HTTPS), which is compatible with Node.js server environments. No browser-specific dependencies are required.

## Setup Instructions

### 1. Create an EmailJS Account

1. Go to [EmailJS](https://www.emailjs.com/) and create a free account
2. Once logged in, you'll be redirected to the dashboard

### 2. Add an Email Service

1. In the EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the setup instructions for your chosen provider
5. Note down your **Service ID** (you'll need this later)

### 3. Create an Email Template

1. In the EmailJS dashboard, go to **Email Templates**
2. Click **Create New Template**
3. Set up your template with the following variables:
   - `{{to_email}}` - Customer's email address
   - `{{to_name}}` - Customer's name
   - `{{subject}}` - Email subject line
   - `{{receipt_html}}` - HTML content for the receipt (auto-generated)
   - `{{invoice_number}}` - Invoice/transaction number
   - `{{transaction_date}}` - Date of transaction
   - `{{total_amount}}` - Total amount paid
   - `{{payment_method}}` - Payment method used

#### Sample Template Content:

**Subject:**
```
{{subject}}
```

**Body (HTML):**
```html
<div>
    <p>Dear {{to_name}},</p>
    <p>Thank you for your purchase. Please find your receipt below:</p>
    
    {{{receipt_html}}}
    
    <p>Best regards,<br>
    Your Pharmacy Team</p>
</div>
```

**Important:** Make sure to use triple braces `{{{receipt_html}}}` (not double) to render HTML content properly.

4. Save the template and note down your **Template ID**

### 4. Get Your API Keys

1. In the EmailJS dashboard, go to **Account** > **General**
2. Note down your **Public Key** (also called API Key)
3. Note down your **Private Key** (you may need to generate one if not available)

### 5. Configure Your Backend

1. Copy the `.env.example` file to `.env` in the backend directory:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Edit the `backend/.env` file and add your EmailJS credentials:
   ```
   EMAILJS_SERVICE_ID=your_service_id_here
   EMAILJS_TEMPLATE_ID=your_template_id_here
   EMAILJS_PUBLIC_KEY=your_public_key_here
   EMAILJS_PRIVATE_KEY=your_private_key_here
   ```

3. Replace the placeholder values with your actual EmailJS credentials from steps 2, 3, and 4

### 6. Restart Your Backend Server

After updating the `.env` file, restart your backend server for the changes to take effect:

```bash
cd backend
npm start
```

## How It Works

### Transaction Receipts
1. When a customer completes a purchase at the POS, they provide their name and optionally their email address
2. After the transaction is successfully saved to the database, the system automatically sends an email receipt
3. The email contains:
   - Transaction/Invoice details
   - Customer information
   - List of purchased items with quantities and prices
   - Total amount, payment method, and change (if applicable)
4. The email is sent asynchronously, so it doesn't block the transaction process
5. If email sending fails, the transaction still completes successfully, and an error is logged

### Appointment Notifications

#### When Patient Books Appointment (Email to Doctor)
1. Patient books an appointment through the system
2. System automatically sends notification email to the doctor
3. Email includes:
   - Patient name, phone, and email
   - Appointment date and time
   - Reason for visit
   - Appointment status
4. Doctor receives notification to review and confirm the appointment

#### When Doctor Accepts Appointment (Email to Patient)
1. Doctor reviews pending appointment and changes status to "confirmed"
2. System automatically sends confirmation email to the patient
3. Email includes:
   - Doctor's name and specialization
   - Confirmed appointment date and time
   - Consultation fee (if applicable)
   - Any notes from the doctor
   - Reminder to arrive early
4. Patient receives confirmation and appointment details

**Email Addresses Used:**
- Doctors: Email from User account (login email)
- Patients: Email provided when booking the appointment

## Testing

### Transaction Receipts
To test the email functionality:

1. Ensure EmailJS is properly configured in your `.env` file
2. Go to the POS (Point of Sale) interface
3. Add items to the cart
4. Click "Pay" to open the payment modal
5. Enter customer information including a valid email address
6. Complete the payment
7. Check the email inbox of the provided email address for the receipt

### Appointment Emails

#### Testing Doctor Notification (when patient books)
1. Ensure EmailJS is properly configured in your `.env` file
2. Ensure the doctor account has an email address in the User profile
3. Go to the patient interface and book an appointment with a doctor
4. Check the doctor's email inbox for the appointment notification

#### Testing Patient Confirmation (when doctor accepts)
1. Ensure EmailJS is properly configured in your `.env` file
2. Log in as a doctor
3. Go to the appointments section
4. Find a pending appointment that has a patient email
5. Change the status to "confirmed"
6. Check the patient's email inbox for the appointment confirmation

## Troubleshooting

### Emails not being sent?

- Check the backend console logs for any error messages
- Verify that all EmailJS credentials are correctly set in the `.env` file
- Ensure your EmailJS account is active and within the free tier limits (200 emails/month)
- Check your email service provider settings in EmailJS dashboard
- Verify that the customer email address is valid and was entered during checkout

### "EmailJS not configured" message in logs?

This means one or more EmailJS environment variables are missing or empty in your `.env` file. Double-check that all four variables are set:
- EMAILJS_SERVICE_ID
- EMAILJS_TEMPLATE_ID
- EMAILJS_PUBLIC_KEY
- EMAILJS_PRIVATE_KEY

### Emails going to spam?

- Configure SPF and DKIM records for your email domain (if using a custom domain)
- Use a verified email address in your EmailJS service configuration
- Ask customers to add your sending email to their contacts

## Free Tier Limits

EmailJS free tier includes:
- 200 emails per month
- Basic email templates
- Multiple email service integrations

For higher volume, consider upgrading to a paid plan or using an alternative service like SendGrid or AWS SES.

## Support

For EmailJS-specific issues, visit:
- [EmailJS Documentation](https://www.emailjs.com/docs/)
- [EmailJS Support](https://www.emailjs.com/support/)

For application-specific issues, check the backend logs or contact your development team.
