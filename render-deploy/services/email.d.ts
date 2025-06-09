interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
    templateData?: Record<string, any>;
}
export declare class EmailService {
    private config;
    private transporter?;
    constructor();
    private initialize;
    sendEmail(options: SendEmailOptions): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }>;
    private sendWithSendGrid;
    private sendWithNodemailer;
    sendVerificationEmail(email: string, verificationToken: string, userName: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    sendPasswordResetEmail(email: string, resetToken: string, userName: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    sendInvitationEmail(email: string, inviterName: string, organizationName: string, invitationToken: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    private getVerificationEmailTemplate;
    private getPasswordResetEmailTemplate;
    private getInvitationEmailTemplate;
    private stripHtml;
}
export declare const emailService: EmailService;
export {};
//# sourceMappingURL=email.d.ts.map