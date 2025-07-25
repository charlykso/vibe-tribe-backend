import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';

// Email service configuration
interface EmailConfig {
  provider: 'sendgrid' | 'nodemailer';
  sendgridApiKey?: string;
  smtpConfig?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  fromEmail: string;
  fromName: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  templateData?: Record<string, any>;
}

export class EmailService {
  private config: EmailConfig;
  private transporter?: nodemailer.Transporter;

  constructor() {
    // Use EMAIL_PROVIDER environment variable if set, otherwise auto-detect
    let provider: 'sendgrid' | 'nodemailer' | 'console' = 'console'; // Default to console

    if (process.env.EMAIL_PROVIDER) {
      provider = process.env.EMAIL_PROVIDER as 'sendgrid' | 'nodemailer' | 'console';
    } else {
      // Auto-detect provider based on available configuration
      const hasValidSendGrid = process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.startsWith('SG.');
      const hasValidSMTP = process.env.SMTP_USER && process.env.SMTP_PASS;

      if (hasValidSendGrid) {
        provider = 'sendgrid';
      } else if (hasValidSMTP) {
        provider = 'nodemailer';
      }
    }

    this.config = {
      provider: provider,
      sendgridApiKey: process.env.SENDGRID_API_KEY,
      fromEmail: process.env.FROM_EMAIL || 'noreply@tribe.com',
      fromName: process.env.FROM_NAME || 'Tribe',
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

  private initialize() {
    console.log(`🔧 Initializing email service with provider: ${this.config.provider}`);
    console.log(`🔧 From Email: ${this.config.fromEmail}`);
    console.log(`🔧 From Name: ${this.config.fromName}`);

    if (this.config.provider === 'sendgrid' && this.config.sendgridApiKey) {
      sgMail.setApiKey(this.config.sendgridApiKey);
      console.log(`✅ SendGrid email service initialized`);
    } else if (this.config.provider === 'nodemailer' && this.config.smtpConfig?.auth?.user) {
      this.transporter = nodemailer.createTransport(this.config.smtpConfig!);
      console.log(`✅ SMTP email service initialized`);
      console.log(`   Host: ${this.config.smtpConfig.host}`);
      console.log(`   Port: ${this.config.smtpConfig.port}`);
      console.log(`   User: ${this.config.smtpConfig.auth.user}`);
    } else if (this.config.provider === 'console') {
      console.log(`✅ Console email service initialized - emails will be logged to console`);
    } else {
      console.warn('⚠️ Email service not configured properly - emails will be logged to console');
      console.warn(`   Provider: ${this.config.provider}`);
      console.warn(`   SendGrid API Key: ${this.config.sendgridApiKey ? 'Present' : 'Missing'}`);
      console.warn(`   SMTP User: ${this.config.smtpConfig?.auth?.user ? 'Present' : 'Missing'}`);
    }
  }

  // Send email using configured provider
  async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (this.config.provider === 'console') {
        // Console mode: log email to console
        console.log('📧 EMAIL SENT (Console Mode):', {
          to: options.to,
          subject: options.subject,
          from: `${this.config.fromName} <${this.config.fromEmail}>`,
          html: options.html.substring(0, 200) + '...',
          text: options.text?.substring(0, 200) + '...'
        });
        return { success: true, messageId: 'console-mode-' + Date.now() };
      } else if (this.config.provider === 'sendgrid' && this.config.sendgridApiKey) {
        return await this.sendWithSendGrid(options);
      } else if (this.config.provider === 'nodemailer' && this.transporter) {
        return await this.sendWithNodemailer(options);
      } else {
        // Fallback: log email to console
        console.log('📧 EMAIL SENT (Fallback Mode):', {
          to: options.to,
          subject: options.subject,
          from: `${this.config.fromName} <${this.config.fromEmail}>`,
          html: options.html.substring(0, 200) + '...',
          text: options.text?.substring(0, 200) + '...'
        });
        return { success: true, messageId: 'fallback-mode-' + Date.now() };
      }
    } catch (error) {
      console.error('❌ Email sending error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown email error' 
      };
    }
  }

  // Send email using SendGrid
  private async sendWithSendGrid(options: SendEmailOptions) {
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
      messageId: response.headers['x-message-id'] as string 
    };
  }

  // Send email using Nodemailer
  private async sendWithNodemailer(options: SendEmailOptions) {
    const mailOptions = {
      from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || this.stripHtml(options.html)
    };

    const info = await this.transporter!.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  }

  // Email verification
  async sendVerificationEmail(email: string, verificationToken: string, userName: string): Promise<{ success: boolean; error?: string }> {
    // Use FRONTEND_URL from environment variables
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

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
  async sendPasswordResetEmail(email: string, resetToken: string, userName: string): Promise<{ success: boolean; error?: string }> {
    // Use FRONTEND_URL from environment variables
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

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
  async sendInvitationEmail(
    email: string,
    inviterName: string,
    organizationName: string,
    invitationToken: string
  ): Promise<{ success: boolean; error?: string }> {
    // Use FRONTEND_URL from environment variables
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
    const invitationUrl = `${frontendUrl}/accept-invitation?token=${invitationToken}`;

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
  private getVerificationEmailTemplate(userName: string, verificationUrl: string): EmailTemplate {
    return {
      subject: 'Verify your Tribe account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Tribe, ${userName}!</h2>
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

  private getPasswordResetEmailTemplate(userName: string, resetUrl: string): EmailTemplate {
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

  private getInvitationEmailTemplate(inviterName: string, organizationName: string, invitationUrl: string): EmailTemplate {
    return {
      subject: `You're invited to join ${organizationName} on Tribe`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">You're Invited!</h2>
          <p>${inviterName} has invited you to join <strong>${organizationName}</strong> on Tribe.</p>
          <p>Tribe helps teams manage their social media presence across multiple platforms.</p>
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
      text: `${inviterName} has invited you to join ${organizationName} on Tribe. Accept the invitation: ${invitationUrl}`
    };
  }

  // Utility function to strip HTML tags
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

// Export singleton instance
export const emailService = new EmailService();
