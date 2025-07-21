-- Create email_activity table for logging business document communications
CREATE TABLE IF NOT EXISTS email_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_id UUID REFERENCES emails(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  type VARCHAR NOT NULL, -- 'invoice_sent', 'quote_sent', 'reminder_sent', 'payment_confirmation', etc.
  status VARCHAR NOT NULL DEFAULT 'sent', -- 'sent', 'failed', 'delivered', 'opened', 'clicked'
  recipient_email VARCHAR NOT NULL,
  subject TEXT,
  template_type VARCHAR,
  details JSONB DEFAULT '{}',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_activity_user_id ON email_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_email_activity_client_id ON email_activity(client_id);
CREATE INDEX IF NOT EXISTS idx_email_activity_invoice_id ON email_activity(invoice_id);
CREATE INDEX IF NOT EXISTS idx_email_activity_quote_id ON email_activity(quote_id);
CREATE INDEX IF NOT EXISTS idx_email_activity_type ON email_activity(type);
CREATE INDEX IF NOT EXISTS idx_email_activity_sent_at ON email_activity(sent_at);

-- Enable RLS
ALTER TABLE email_activity ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own email activity" ON email_activity
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email activity" ON email_activity
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email activity" ON email_activity
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email activity" ON email_activity
  FOR DELETE USING (auth.uid() = user_id);