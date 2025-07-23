-- Email Analytics and Tracking Database Schema
-- This script creates tables for email analytics, tracking, and reporting

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Email Tracking Events Table
CREATE TABLE IF NOT EXISTS email_tracking_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_id UUID REFERENCES emails(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'spam', 'unsubscribed')),
  event_data JSONB DEFAULT '{}'::jsonb, -- Additional event-specific data
  ip_address INET,
  user_agent TEXT,
  location JSONB, -- {country, city, region}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Email Performance Metrics Table
CREATE TABLE IF NOT EXISTS email_performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_id UUID REFERENCES emails(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  -- Timing metrics
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  first_opened_at TIMESTAMP WITH TIME ZONE,
  last_opened_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  
  -- Count metrics
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  
  -- Response time metrics (in minutes)
  response_time_minutes INTEGER,
  
  -- Status flags
  is_delivered BOOLEAN DEFAULT FALSE,
  is_opened BOOLEAN DEFAULT FALSE,
  is_clicked BOOLEAN DEFAULT FALSE,
  is_replied BOOLEAN DEFAULT FALSE,
  is_bounced BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Email Campaign Analytics Table
CREATE TABLE IF NOT EXISTS email_campaign_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_name VARCHAR(255) NOT NULL,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Campaign metrics
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_replied INTEGER DEFAULT 0,
  total_bounced INTEGER DEFAULT 0,
  total_unsubscribed INTEGER DEFAULT 0,
  
  -- Calculated rates (stored for performance)
  delivery_rate DECIMAL(5,2) DEFAULT 0.00,
  open_rate DECIMAL(5,2) DEFAULT 0.00,
  click_rate DECIMAL(5,2) DEFAULT 0.00,
  reply_rate DECIMAL(5,2) DEFAULT 0.00,
  bounce_rate DECIMAL(5,2) DEFAULT 0.00,
  
  -- Campaign period
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Client Communication Analytics Table
CREATE TABLE IF NOT EXISTS client_communication_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Communication volume
  total_emails_sent INTEGER DEFAULT 0,
  total_emails_received INTEGER DEFAULT 0,
  total_emails_replied INTEGER DEFAULT 0,
  
  -- Response metrics
  avg_response_time_hours DECIMAL(8,2) DEFAULT 0.00,
  fastest_response_time_minutes INTEGER,
  slowest_response_time_hours INTEGER,
  
  -- Engagement metrics
  total_opens INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  engagement_score DECIMAL(5,2) DEFAULT 0.00, -- Calculated engagement score
  
  -- Communication patterns
  preferred_contact_time JSONB, -- {hour: 14, day_of_week: 2}
  communication_frequency DECIMAL(5,2) DEFAULT 0.00, -- emails per week
  
  -- Last activity
  last_email_sent_at TIMESTAMP WITH TIME ZONE,
  last_email_received_at TIMESTAMP WITH TIME ZONE,
  last_response_at TIMESTAMP WITH TIME ZONE,
  
  -- Period for analytics (monthly aggregation)
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(client_id, user_id, period_start, period_end)
);

-- 5. Email Usage Reports Table
CREATE TABLE IF NOT EXISTS email_usage_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  
  -- Usage metrics
  emails_sent INTEGER DEFAULT 0,
  emails_received INTEGER DEFAULT 0,
  emails_read INTEGER DEFAULT 0,
  emails_starred INTEGER DEFAULT 0,
  emails_deleted INTEGER DEFAULT 0,
  
  -- Template usage
  templates_used INTEGER DEFAULT 0,
  most_used_template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  
  -- Storage metrics
  total_storage_bytes BIGINT DEFAULT 0,
  attachment_storage_bytes BIGINT DEFAULT 0,
  
  -- Performance metrics
  avg_response_time_hours DECIMAL(8,2) DEFAULT 0.00,
  total_opens_received INTEGER DEFAULT 0,
  total_clicks_received INTEGER DEFAULT 0,
  
  -- Report period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, report_type, period_start, period_end)
);

-- 6. Email Activity Timeline Table
CREATE TABLE IF NOT EXISTS email_activity_timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('email_sent', 'email_received', 'email_read', 'email_starred', 'email_deleted', 'template_used', 'folder_created')),
  activity_data JSONB DEFAULT '{}'::jsonb,
  email_id UUID REFERENCES emails(id) ON DELETE CASCADE,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_email_tracking_events_email_id ON email_tracking_events(email_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_events_user_id ON email_tracking_events(user_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_events_type_created ON email_tracking_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_tracking_events_created_at ON email_tracking_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_performance_metrics_email_id ON email_performance_metrics(email_id);
CREATE INDEX IF NOT EXISTS idx_email_performance_metrics_user_id ON email_performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_email_performance_metrics_template_id ON email_performance_metrics(template_id);
CREATE INDEX IF NOT EXISTS idx_email_performance_metrics_client_id ON email_performance_metrics(client_id);
CREATE INDEX IF NOT EXISTS idx_email_performance_metrics_sent_at ON email_performance_metrics(sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_campaign_analytics_user_id ON email_campaign_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_email_campaign_analytics_template_id ON email_campaign_analytics(template_id);
CREATE INDEX IF NOT EXISTS idx_email_campaign_analytics_started_at ON email_campaign_analytics(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_communication_analytics_client_id ON client_communication_analytics(client_id);
CREATE INDEX IF NOT EXISTS idx_client_communication_analytics_user_id ON client_communication_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_client_communication_analytics_period ON client_communication_analytics(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_email_usage_reports_user_id ON email_usage_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_email_usage_reports_type_period ON email_usage_reports(report_type, period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_email_activity_timeline_user_id ON email_activity_timeline(user_id);
CREATE INDEX IF NOT EXISTS idx_email_activity_timeline_type_created ON email_activity_timeline(activity_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_activity_timeline_email_id ON email_activity_timeline(email_id);
CREATE INDEX IF NOT EXISTS idx_email_activity_timeline_client_id ON email_activity_timeline(client_id);

-- Enable Row Level Security (RLS)
ALTER TABLE email_tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaign_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_communication_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_usage_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_activity_timeline ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_tracking_events
CREATE POLICY "Users can view their own email tracking events" ON email_tracking_events
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own email tracking events" ON email_tracking_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for email_performance_metrics
CREATE POLICY "Users can view their own email performance metrics" ON email_performance_metrics
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own email performance metrics" ON email_performance_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own email performance metrics" ON email_performance_metrics
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for email_campaign_analytics
CREATE POLICY "Users can view their own email campaign analytics" ON email_campaign_analytics
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own email campaign analytics" ON email_campaign_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own email campaign analytics" ON email_campaign_analytics
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for client_communication_analytics
CREATE POLICY "Users can view their own client communication analytics" ON client_communication_analytics
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own client communication analytics" ON client_communication_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own client communication analytics" ON client_communication_analytics
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for email_usage_reports
CREATE POLICY "Users can view their own email usage reports" ON email_usage_reports
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own email usage reports" ON email_usage_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own email usage reports" ON email_usage_reports
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for email_activity_timeline
CREATE POLICY "Users can view their own email activity timeline" ON email_activity_timeline
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own email activity timeline" ON email_activity_timeline
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Functions for automatic metric updates
CREATE OR REPLACE FUNCTION update_email_performance_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update performance metrics when tracking events are inserted
  IF NEW.event_type = 'delivered' THEN
    UPDATE email_performance_metrics 
    SET is_delivered = TRUE, delivered_at = NEW.created_at, updated_at = NOW()
    WHERE email_id = NEW.email_id;
  ELSIF NEW.event_type = 'opened' THEN
    UPDATE email_performance_metrics 
    SET is_opened = TRUE, 
        open_count = open_count + 1,
        first_opened_at = COALESCE(first_opened_at, NEW.created_at),
        last_opened_at = NEW.created_at,
        updated_at = NOW()
    WHERE email_id = NEW.email_id;
  ELSIF NEW.event_type = 'clicked' THEN
    UPDATE email_performance_metrics 
    SET is_clicked = TRUE, 
        click_count = click_count + 1,
        updated_at = NOW()
    WHERE email_id = NEW.email_id;
  ELSIF NEW.event_type = 'replied' THEN
    UPDATE email_performance_metrics 
    SET is_replied = TRUE, 
        reply_count = reply_count + 1,
        replied_at = NEW.created_at,
        response_time_minutes = EXTRACT(EPOCH FROM (NEW.created_at - sent_at)) / 60,
        updated_at = NOW()
    WHERE email_id = NEW.email_id;
  ELSIF NEW.event_type = 'bounced' THEN
    UPDATE email_performance_metrics 
    SET is_bounced = TRUE, updated_at = NOW()
    WHERE email_id = NEW.email_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic metric updates
CREATE TRIGGER trigger_update_email_performance_metrics
  AFTER INSERT ON email_tracking_events
  FOR EACH ROW
  EXECUTE FUNCTION update_email_performance_metrics();

-- Function to calculate engagement score
CREATE OR REPLACE FUNCTION calculate_engagement_score(
  p_total_opens INTEGER,
  p_total_clicks INTEGER,
  p_total_emails INTEGER
) RETURNS DECIMAL(5,2) AS $$
BEGIN
  IF p_total_emails = 0 THEN
    RETURN 0.00;
  END IF;
  
  -- Engagement score formula: (opens * 1 + clicks * 2) / total_emails * 100
  RETURN ROUND(
    ((p_total_opens * 1.0 + p_total_clicks * 2.0) / p_total_emails * 100.0)::DECIMAL(5,2), 
    2
  );
END;
$$ LANGUAGE plpgsql;