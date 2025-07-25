# 📧 Zoho Mail Setup Guide for Tribe Platform

## 🎯 Overview

This guide will help you set up Zoho Mail SMTP for sending invitation emails and other notifications from the Tribe platform.

## 📋 Prerequisites

1. **Zoho Mail Account** - You need a Zoho Mail account (free or paid)
2. **Custom Domain** (recommended) - For professional emails like `noreply@yourdomain.com`
3. **App Password** (recommended) - For enhanced security

## 🔧 Step-by-Step Setup

### **Step 1: Create Zoho Mail Account**

1. Go to [Zoho Mail](https://www.zoho.com/mail/)
2. Sign up for a free account or use existing account
3. If you have a custom domain, add it to Zoho Mail

### **Step 2: Generate App Password (Recommended)**

1. Go to [Zoho Account Security](https://accounts.zoho.com/security)
2. Navigate to **App Passwords**
3. Click **Generate New Password**
4. Enter app name: `Tribe Platform`
5. Copy the generated password (you'll need this for SMTP_PASS)

### **Step 3: Configure Environment Variables**

Update your `backend/.env` file with these settings:

```env
# Email Configuration
EMAIL_PROVIDER=nodemailer
FROM_EMAIL=your-email@yourdomain.com
FROM_NAME=Tribe

# Zoho Mail SMTP Configuration
SMTP_HOST=smtp.zoho.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your_app_password_or_regular_password
```

### **Step 4: Zoho SMTP Settings**

| Setting | Value |
|---------|-------|
| **SMTP Server** | `smtp.zoho.com` |
| **Port** | `587` (TLS) or `465` (SSL) |
| **Security** | TLS/STARTTLS |
| **Authentication** | Required |
| **Username** | Your full Zoho email address |
| **Password** | Your Zoho password or app password |

## 🌍 Regional SMTP Servers

Zoho has different SMTP servers for different regions:

- **Global**: `smtp.zoho.com`
- **Europe**: `smtp.zoho.eu`
- **India**: `smtp.zoho.in`
- **Australia**: `smtp.zoho.com.au`
- **Japan**: `smtp.zoho.jp`

## ✅ Testing Your Setup

1. **Update your .env file** with your Zoho credentials
2. **Restart the backend server**:
   ```bash
   cd backend && npm run dev
   ```
3. **Test email sending** by creating a team invitation
4. **Check server logs** for email sending confirmation

## 🔒 Security Best Practices

1. **Use App Passwords** instead of your main password
2. **Enable 2FA** on your Zoho account
3. **Use environment variables** - never commit credentials to code
4. **Use a dedicated email** for system notifications (e.g., `noreply@yourdomain.com`)

## 🎨 Custom Domain Setup (Optional)

For professional emails like `noreply@yourdomain.com`:

1. **Add your domain** to Zoho Mail
2. **Verify domain ownership** via DNS records
3. **Create email accounts** for your domain
4. **Update FROM_EMAIL** in your .env file

## 🐛 Troubleshooting

### **Common Issues:**

1. **Authentication Failed (535)**
   - Check username/password
   - Use app password instead of regular password
   - Ensure 2FA is properly configured

2. **Connection Timeout**
   - Check SMTP server and port
   - Verify firewall settings
   - Try different port (465 for SSL)

3. **TLS/SSL Errors**
   - Set `SMTP_SECURE=true` for port 465
   - Set `SMTP_SECURE=false` for port 587

### **Debug Steps:**

1. **Check server logs** for detailed error messages
2. **Test with Zoho webmail** to ensure account works
3. **Verify DNS settings** if using custom domain
4. **Try different SMTP settings** (port, security)

## 📞 Support

- **Zoho Mail Support**: https://help.zoho.com/portal/en/community/zoho-mail
- **SMTP Documentation**: https://www.zoho.com/mail/help/zoho-smtp.html

## 🎉 Success!

Once configured, your Tribe platform will send professional emails through Zoho Mail for:
- Team invitations
- Password resets
- Email verifications
- System notifications
