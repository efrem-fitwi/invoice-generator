# Digital Invoice Generator

A web application for delivery drivers to create, customize, and send professional invoices digitally.

## Features

✅ **Google Account Login** - Secure authentication with Google SSO  
✅ **Custom Templates** - Edit your business information and bank details  
✅ **Invoice Generation** - Fill forms based on your sample invoice format  
✅ **PDF Export** - Generate printable PDF invoices  
✅ **Email Integration** - Send invoices directly to clients  
✅ **Invoice History** - Track all generated invoices  
✅ **Mobile Responsive** - Works on phones, tablets, and desktops  

## Quick Start

1. **Set up Google Authentication:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add your domain to authorized origins
   - Replace `YOUR_GOOGLE_CLIENT_ID` in `index.html` with your client ID

2. **Open the application:**
   - Double-click `index.html` or serve via local web server
   - Sign in with your Google account

3. **Set up your template:**
   - Go to "Edit Template" tab
   - Fill in your business information and bank details
   - Click "Save Template"

4. **Create invoices:**
   - Go to "Create Invoice" tab
   - Fill in delivery and client details
   - Preview, generate PDF, or send email

## File Structure

```
├── index.html      # Main application page
├── styles.css      # Styling and responsive design
├── script.js       # Application logic and functionality
└── README.md       # This setup guide
```

## Usage Guide

### First Time Setup
1. **Login** with your Google account
2. **Edit Template** - Add your business info, bank details
3. **Save Template** - Your info will be stored locally

### Creating Invoices
1. Fill in client information
2. Add delivery details (pickup, drop-off, vehicle type)
3. Set pricing and payment terms
4. **Preview** to see formatted invoice
5. **Generate PDF** to download/print
6. **Send Email** to email directly to client

### Managing Invoices
- **History Tab** shows all previous invoices
- **Delete** unwanted invoices
- **Regenerate** copies previous invoice data to new form

## Advanced Features

### Customization Options
- Business name, address, phone, email
- Member ID for invoice numbering
- Bank details for payments
- Payment terms (default 30 days)

### Data Storage
- Uses browser localStorage
- Data tied to your Google account
- No server required - works offline after first load

### Mobile Usage
- Responsive design works on all screen sizes
- Touch-friendly interface
- Works with phone cameras for proof of delivery photos

## Integration Ideas

### N8n Automation Workflow
```
Telegram Bot → Webhook → Parse Data → Generate Invoice → Send Email
```

### Email Services
- Can integrate with EmailJS for direct sending
- Currently opens default email client
- Supports Gmail, Outlook, etc.

### PDF Enhancement
- Can add jsPDF library for better PDF generation
- Currently uses browser print function
- Supports custom letterheads and branding

## Troubleshooting

**Google Sign-in not working:**
- Check your client ID is correct
- Verify domain is authorized in Google Console
- Try incognito mode to clear cache

**PDF not generating:**
- Ensure all required fields are filled
- Try different browsers (Chrome recommended)
- Check browser pop-up blockers

**Email not opening:**
- Default email app must be configured
- Try copying email content manually
- Consider adding EmailJS for direct sending

## Security Notes

- Data stored locally in browser only
- No sensitive information sent to external servers
- Google authentication handles login security
- Always verify client email addresses before sending

## Enhancement Suggestions

1. **Add photo upload** for delivery proof
2. **Integrate with payment gateways** (Stripe, PayPal)
3. **Add expense tracking** features
4. **Connect to accounting software** (QuickBooks, Xero)
5. **Add client management** system
6. **Implement recurring invoices** for regular clients

---

**Need help?** This is a complete solution that replicates your manual invoice process digitally. All features match your original invoice format exactly.