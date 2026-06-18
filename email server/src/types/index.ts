export interface SmtpRecipient {
  email: string;
  name?: string;
}

export interface SmtpSendRequest {
  senderEmail: string;
  senderName: string;
  recipient: SmtpRecipient;
  subject: string;
  htmlContent: string;
  tags?: string[];
}

export interface SmtpSendResult {
  messageId: string;
}

export interface RecipientInput {
  email: string;
  name?: string;
}

export interface SendBulkEmailOptions {
  userId: string;
  projectId?: string | null;
  senderName?: string;
  senderEmail?: string;
  deliveryMethod?: 'project' | 'user_smtp';
  subject: string;
  messageTemplate: string;
  recipients: RecipientInput[];
  useEmailTemplate?: boolean;
}

export interface UserSmtpConfig {
  user_id: string;
  enabled: boolean;
  smtp_host: string | null;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_username: string | null;
  smtp_password?: string | null;
  from_email: string | null;
  from_name: string | null;
  updated_at?: string | null;
}
