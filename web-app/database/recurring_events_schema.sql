-- Enhanced schema for recurring events and notification system
-- This script adds tables and columns needed for advanced recurring events and notifications

-- Create recurrence_rules table for storing recurring patterns
CREATE TABLE IF NOT EXISTS public.recurrence_rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
    
    -- Basic recurrence pattern
    frequency TEXT NOT NULL CHECK (frequency IN ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY')),
    interval_value INTEGER DEFAULT 1, -- Every N days/weeks/months/years
    
    -- Weekly specific options
    by_day TEXT[], -- ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
    
    -- Monthly/Yearly specific options
    by_month_day INTEGER[], -- [1, 15, 31] - days of month
    by_month INTEGER[], -- [1, 3, 6, 12] - months of year
    by_set_pos INTEGER[], -- [-1, 1, 2] - nth occurrence (e.g., last Friday)
    
    -- End conditions
    end_type TEXT CHECK (end_type IN ('NEVER', 'COUNT', 'DATE')) DEFAULT 'NEVER',
    end_count INTEGER, -- Stop after N occurrences
    end_date DATE, -- Stop after this date
    
    -- Exception dates (dates to skip)
    exception_dates DATE[],
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create event_reminders table for multiple reminders per event
CREATE TABLE IF NOT EXISTS public.event_reminders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    
    -- Reminder timing
    reminder_minutes INTEGER NOT NULL, -- Minutes before event (e.g., 15, 60, 1440 for 1 day)
    
    -- Notification methods
    notification_type TEXT NOT NULL CHECK (notification_type IN ('EMAIL', 'PUSH', 'IN_APP', 'SMS')),
    
    -- Custom message (optional)
    custom_message TEXT,
    
    -- Status tracking
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ,
    delivery_status TEXT CHECK (delivery_status IN ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED')),
    error_message TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notification_queue table for processing notifications
CREATE TABLE IF NOT EXISTS public.notification_queue (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    reminder_id UUID NOT NULL REFERENCES public.event_reminders(id) ON DELETE CASCADE,
    
    -- Notification details
    notification_type TEXT NOT NULL,
    recipient TEXT NOT NULL, -- email address, phone number, or user ID
    subject TEXT,
    message TEXT NOT NULL,
    
    -- Scheduling
    scheduled_for TIMESTAMPTZ NOT NULL,
    
    -- Processing status
    status TEXT CHECK (status IN ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED')) DEFAULT 'PENDING',
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_attempt_at TIMESTAMPTZ,
    error_message TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_notification_preferences table for user settings
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    
    -- Default reminder settings
    default_reminder_minutes INTEGER[] DEFAULT '{15, 60}', -- Default reminders: 15 min and 1 hour before
    
    -- Notification channel preferences
    email_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    
    -- Contact information
    notification_email TEXT,
    phone_number TEXT,
    
    -- Timezone preference
    timezone TEXT DEFAULT 'UTC',
    
    -- Quiet hours (no notifications during this time)
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    quiet_hours_timezone TEXT DEFAULT 'UTC',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create in_app_notifications table for storing in-app notifications
CREATE TABLE IF NOT EXISTS public.in_app_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    
    -- Notification content
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- Status
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    -- Priority and category
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    category TEXT DEFAULT 'reminder', -- reminder, update, alert, etc.
    
    -- Actions (optional JSON for action buttons)
    actions JSONB,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOW add new columns to existing events table for recurring events
-- (doing this after creating the referenced tables)
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS recurrence_rule_id UUID REFERENCES public.recurrence_rules(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS parent_event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS instance_date DATE, -- For recurring instances, the specific date this instance represents
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS all_day BOOLEAN DEFAULT FALSE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_recurrence_rules_user_id ON public.recurrence_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_event_reminders_event_id ON public.event_reminders(event_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled_for ON public.notification_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON public.notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_events_parent_event_id ON public.events(parent_event_id);
CREATE INDEX IF NOT EXISTS idx_events_recurrence_rule_id ON public.events(recurrence_rule_id);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_user_id ON public.in_app_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_read ON public.in_app_notifications(read);

-- Enable RLS on new tables
ALTER TABLE public.recurrence_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.in_app_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for recurrence_rules
CREATE POLICY "Users can view their own recurrence rules" 
ON public.recurrence_rules FOR SELECT 
USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert their own recurrence rules" 
ON public.recurrence_rules FOR INSERT 
WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update their own recurrence rules" 
ON public.recurrence_rules FOR UPDATE 
USING (auth.jwt() ->> 'sub' = user_id)
WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete their own recurrence rules" 
ON public.recurrence_rules FOR DELETE 
USING (auth.jwt() ->> 'sub' = user_id);

-- RLS policies for event_reminders
CREATE POLICY "Users can view reminders for their events" 
ON public.event_reminders FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = event_reminders.event_id 
    AND events.user_id = auth.jwt() ->> 'sub'
));

CREATE POLICY "Users can update reminders for their events" 
ON public.event_reminders FOR UPDATE 
USING (EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = event_reminders.event_id 
    AND events.user_id = auth.jwt() ->> 'sub'
));

CREATE POLICY "Users can delete reminders for their events" 
ON public.event_reminders FOR DELETE 
USING (EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = event_reminders.event_id 
    AND events.user_id = auth.jwt() ->> 'sub'
));

-- RLS policies for notification_queue
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notification_queue;
CREATE POLICY "Users can view their own notifications" 
ON public.notification_queue FOR SELECT 
USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert their own notifications" 
ON public.notification_queue FOR INSERT 
WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notification_queue FOR UPDATE 
USING (auth.jwt() ->> 'sub' = user_id) 
WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete their own notifications" 
ON public.notification_queue FOR DELETE 
USING (auth.jwt() ->> 'sub' = user_id);

-- RLS policies for user_notification_preferences
DROP POLICY IF EXISTS "Users can view their own notification preferences" ON public.user_notification_preferences;
CREATE POLICY "Users can view their own notification preferences" 
ON public.user_notification_preferences FOR SELECT 
USING (auth.jwt() ->> 'sub' = user_id);

DROP POLICY IF EXISTS "Users can insert their own notification preferences" ON public.user_notification_preferences;
CREATE POLICY "Users can insert their own notification preferences" 
ON public.user_notification_preferences FOR INSERT 
WITH CHECK (auth.jwt() ->> 'sub' = user_id);

DROP POLICY IF EXISTS "Users can update their own notification preferences" ON public.user_notification_preferences;
CREATE POLICY "Users can update their own notification preferences" 
ON public.user_notification_preferences FOR UPDATE 
USING (auth.jwt() ->> 'sub' = user_id)
WITH CHECK (auth.jwt() ->> 'sub' = user_id);

DROP POLICY IF EXISTS "Users can delete their own notification preferences" ON public.user_notification_preferences;
CREATE POLICY "Users can delete their own notification preferences" 
ON public.user_notification_preferences FOR DELETE 
USING (auth.jwt() ->> 'sub' = user_id);

-- RLS policies for in_app_notifications
CREATE POLICY "Users can view their own in-app notifications" 
ON public.in_app_notifications FOR SELECT 
USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert their own in-app notifications" 
ON public.in_app_notifications FOR INSERT 
WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update their own in-app notifications" 
ON public.in_app_notifications FOR UPDATE 
USING (auth.jwt() ->> 'sub' = user_id)
WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete their own in-app notifications" 
ON public.in_app_notifications FOR DELETE 
USING (auth.jwt() ->> 'sub' = user_id);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_recurrence_rules ON public.recurrence_rules;
CREATE TRIGGER set_timestamp_recurrence_rules
BEFORE UPDATE ON public.recurrence_rules
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_event_reminders ON public.event_reminders;
CREATE TRIGGER set_timestamp_event_reminders
BEFORE UPDATE ON public.event_reminders
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_notification_queue ON public.notification_queue;
CREATE TRIGGER set_timestamp_notification_queue
BEFORE UPDATE ON public.notification_queue
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_user_notification_preferences ON public.user_notification_preferences;
CREATE TRIGGER set_timestamp_user_notification_preferences
BEFORE UPDATE ON public.user_notification_preferences
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_in_app_notifications ON public.in_app_notifications;
CREATE TRIGGER set_timestamp_in_app_notifications
BEFORE UPDATE ON public.in_app_notifications
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Function to automatically create default notification preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_notification_preferences (user_id, notification_email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default preferences when a user is created
DROP TRIGGER IF EXISTS create_user_notification_preferences ON auth.users;
CREATE TRIGGER create_user_notification_preferences
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_default_notification_preferences();