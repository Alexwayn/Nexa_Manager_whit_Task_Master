// Email Management Types

export interface Email {
  id: string;
  subject: string;
  body: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  attachments?: EmailAttachment[];
  status: 'draft' | 'sent' | 'delivered' | 'failed' | 'bounced';
  priority: 'low' | 'normal' | 'high';
  scheduledAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface EmailAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  templateId: string;
  recipients: string[];
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused';
  scheduledAt?: string;
  sentAt?: string;
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
  };
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface EmailSettings {
  signature: string;
  autoReply: {
    enabled: boolean;
    subject: string;
    body: string;
  };
  notifications: {
    newEmail: boolean;
    emailSent: boolean;
    emailFailed: boolean;
  };
  provider: {
    type: 'smtp' | 'sendgrid' | 'mailgun' | 'ses';
    config: Record<string, any>;
  };
}

export interface EmailAnalytics {
  period: {
    start: string;
    end: string;
  };
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}
