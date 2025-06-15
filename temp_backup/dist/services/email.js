import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
export class EmailService {
    config;
    transporter;
    constructor() {
        this.config = {
            provider: process.env.EMAIL_PROVIDER || 'sendgrid',
            sendgridApiKey: process.env.SENDGRID_API_KEY,
            fromEmail: process.env.FROM_EMAIL || 'noreply@vibetribe.com',
            fromName: process.env.FROM_NAME || 'VibeTribe',
            smtpConfig: {
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER || '',
                    pass: process.env.SMTP_PASS || ''
                }
            }
        };
        this.initialize();
    }
    initialize() {
        if (this.config.provider === 'sendgrid' && this.config.sendgridApiKey) {
            sgMail.setApiKey(this.config.sendgridApiKey);
            console.log('✅ SendGrid email service initialized');
        }
        else if (this.config.provider === 'nodemailer') {
            this.transporter = nodemailer.createTransporter(this.config.smtpConfig);
            console.log('✅ Nodemailer email service initialized');
        }
        else {
            console.warn('⚠️ Email service not configured properly');
        }
    }
    // Send email using configured provider
    async sendEmail(options) {
        try {
            if (this.config.provider === 'sendgrid' && this.config.sendgridApiKey) {
                return await this.sendWithSendGrid(options);
            }
            else if (this.config.provider === 'nodemailer' && this.transporter) {
                return await this.sendWithNodemailer(options);
            }
            else {
                // Fallback: log email to console in development
                console.log('📧 Email would be sent:', {
                    to: options.to,
                    subject: options.subject,
                    html: options.html.substring(0, 100) + '...'
                });
                return { success: true, messageId: 'dev-mode-' + Date.now() };
            }
        }
        catch (error) {
            console.error('❌ Email sending error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown email error'
            };
        }
    }
    // Send email using SendGrid
    async sendWithSendGrid(options) {
        const msg = {
            to: options.to,
            from: {
                email: this.config.fromEmail,
                name: this.config.fromName
            },
            subject: options.subject,
            html: options.html,
            text: options.text || this.stripHtml(options.html)
        };
        const [response] = await sgMail.send(msg);
        return {
            success: true,
            messageId: response.headers['x-message-id']
        };
    }
    // Send email using Nodemailer
    async sendWithNodemailer(options) {
        const mailOptions = {
            from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text || this.stripHtml(options.html)
        };
        const info = await this.transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId };
    }
    // Email verification
    async sendVerificationEmail(email, verificationToken, userName) {
        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
        const template = this.getVerificationEmailTemplate(userName, verificationUrl);
        const result = await this.sendEmail({
            to: email,
            subject: template.subject,
            html: template.html,
            text: template.text
        });
        return { success: result.success, error: result.error };
    }
    // Password reset email
    async sendPasswordResetEmail(email, resetToken, userName) {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
        const template = this.getPasswordResetEmailTemplate(userName, resetUrl);
        const result = await this.sendEmail({
            to: email,
            subject: template.subject,
            html: template.html,
            text: template.text
        });
        return { success: result.success, error: result.error };
    }
    // Organization invitation email
    async sendInvitationEmail(email, inviterName, organizationName, invitationToken) {
        const invitationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/accept-invitation?token=${invitationToken}`;
        const template = this.getInvitationEmailTemplate(inviterName, organizationName, invitationUrl);
        const result = await this.sendEmail({
            to: email,
            subject: template.subject,
            html: template.html,
            text: template.text
        });
        return { success: result.success, error: result.error };
    }
    // Email templates
    getVerificationEmailTemplate(userName, verificationUrl) {
        return {
            subject: 'Verify your VibeTribe account',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to VibeTribe, ${userName}!</h2>
          <p>Thank you for signing up. Please verify your email address to complete your registration.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            If you didn't create this account, you can safely ignore this email.
          </p>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 24 hours.
          </p>
        </div>
      `,
            text: `Welcome to VibeTribe, ${userName}! Please verify your email address by visiting: ${verificationUrl}`
        };
    }
    getPasswordResetEmailTemplate(userName, resetUrl) {
        return {
            subject: 'Reset your VibeTribe password',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hi ${userName},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            If you didn't request this password reset, you can safely ignore this email.
          </p>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 1 hour.
          </p>
        </div>
      `,
            text: `Hi ${userName}, reset your password by visiting: ${resetUrl}`
        };
    }
    getInvitationEmailTemplate(inviterName, organizationName, invitationUrl) {
        return {
            subject: `You're invited to join ${organizationName} on VibeTribe`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">You're Invited!</h2>
          <p>${inviterName} has invited you to join <strong>${organizationName}</strong> on VibeTribe.</p>
          <p>VibeTribe helps teams manage their social media presence across multiple platforms.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationUrl}" 
               style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            This invitation will expire in 7 days.
          </p>
        </div>
      `,
            text: `${inviterName} has invited you to join ${organizationName} on VibeTribe. Accept the invitation: ${invitationUrl}`
        };
    }
    // Utility function to strip HTML tags
    stripHtml(html) {
        return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }
}
// Export singleton instance
export const emailService = new EmailService();
//# sourceMappingURL=email.js.map