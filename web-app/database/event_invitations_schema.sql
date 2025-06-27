-- Event Invitations and RSVP System Schema
-- This script adds tables for event invitations, RSVP tracking, and guest management

-- Create event_invitations table for tracking event invites
CREATE TABLE IF NOT EXISTS public.event_invitations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    
    -- Invitee information
    invitee_email TEXT NOT NULL,
    invitee_name TEXT,
    invitee_phone TEXT,
    invitee_type TEXT CHECK (invitee_type IN ('client', 'staff', 'external', 'vendor')) DEFAULT 'external',
    
    -- Client reference (if invitee is a client)
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    
    -- Invitation details
    invitation_message TEXT,
    invitation_sent_at TIMESTAMPTZ,
    invitation_method TEXT CHECK (invitation_method IN ('email', 'sms', 'whatsapp', 'manual')) DEFAULT 'email',
    
    -- RSVP status and response
    rsvp_status TEXT CHECK (rsvp_status IN ('pending', 'accepted', 'declined', 'maybe', 'no_response')) DEFAULT 'pending',
    rsvp_responded_at TIMESTAMPTZ,
    rsvp_response_message TEXT,
    
    -- Guest count (for events that allow plus ones)
    guest_count INTEGER DEFAULT 1,
    dietary_restrictions TEXT,
    special_requests TEXT,
    
    -- Reminder settings
    send_reminders BOOLEAN DEFAULT TRUE,
    reminder_sent_count INTEGER DEFAULT 0,
    last_reminder_sent_at TIMESTAMPTZ,
    
    -- Access control
    invitation_token UUID DEFAULT uuid_generate_v4() UNIQUE, -- For secure RSVP links
    token_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT -- Clerk user ID
);

-- Create event_attendees table for confirmed attendees (post-RSVP)
CREATE TABLE IF NOT EXISTS public.event_attendees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    invitation_id UUID REFERENCES public.event_invitations(id) ON DELETE SET NULL,
    
    -- Attendee information
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    attendee_type TEXT CHECK (attendee_type IN ('host', 'client', 'staff', 'external', 'vendor')) DEFAULT 'external',
    
    -- Client reference
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    
    -- Attendance tracking
    attendance_status TEXT CHECK (attendance_status IN ('confirmed', 'checked_in', 'checked_out', 'no_show', 'cancelled')) DEFAULT 'confirmed',
    checked_in_at TIMESTAMPTZ,
    checked_out_at TIMESTAMPTZ,
    
    -- Additional info
    guest_count INTEGER DEFAULT 1,
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create event_comments table for event discussions
CREATE TABLE IF NOT EXISTS public.event_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    
    -- Comment details
    comment_text TEXT NOT NULL,
    comment_type TEXT CHECK (comment_type IN ('general', 'question', 'update', 'reminder', 'system')) DEFAULT 'general',
    
    -- Author information
    author_id TEXT, -- Clerk user ID
    author_name TEXT NOT NULL,
    author_email TEXT,
    
    -- Visibility and permissions
    is_public BOOLEAN DEFAULT FALSE, -- Can clients/external attendees see this?
    is_pinned BOOLEAN DEFAULT FALSE,
    
    -- Threading (for replies)
    parent_comment_id UUID REFERENCES public.event_comments(id) ON DELETE CASCADE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create event_attachments table for file attachments
CREATE TABLE IF NOT EXISTS public.event_attachments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    
    -- File information
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Path in storage bucket
    file_size INTEGER, -- Size in bytes
    file_type TEXT, -- MIME type
    
    -- Attachment metadata
    title TEXT,
    description TEXT,
    attachment_type TEXT CHECK (attachment_type IN ('document', 'image', 'agenda', 'contract', 'invoice', 'other')) DEFAULT 'document',
    
    -- Access control
    is_public BOOLEAN DEFAULT FALSE, -- Can attendees access this file?
    uploaded_by TEXT, -- Clerk user ID
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_invitations_event_id ON public.event_invitations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_invitations_client_id ON public.event_invitations(client_id);
CREATE INDEX IF NOT EXISTS idx_event_invitations_rsvp_status ON public.event_invitations(rsvp_status);
CREATE INDEX IF NOT EXISTS idx_event_invitations_token ON public.event_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON public.event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_comments_event_id ON public.event_comments(event_id);
CREATE INDEX IF NOT EXISTS idx_event_comments_parent ON public.event_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_event_attachments_event_id ON public.event_attachments(event_id);

-- Enable RLS on new tables
ALTER TABLE public.event_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for event_invitations
CREATE POLICY "Users can view invitations for their events" 
ON public.event_invitations FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = event_invitations.event_id 
    AND events.user_id = auth.uid()::text
));

CREATE POLICY "Users can create invitations for their events" 
ON public.event_invitations FOR INSERT 
WITH CHECK (EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = event_invitations.event_id 
    AND events.user_id = auth.uid()::text
));

CREATE POLICY "Users can update invitations for their events" 
ON public.event_invitations FOR UPDATE 
USING (EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = event_invitations.event_id 
    AND events.user_id = auth.uid()::text
));

CREATE POLICY "Users can delete invitations for their events" 
ON public.event_invitations FOR DELETE 
USING (EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = event_invitations.event_id 
    AND events.user_id = auth.uid()::text
));

-- Allow invitees to view and update their own invitations (for RSVP)
CREATE POLICY "Invitees can view their own invitations" 
ON public.event_invitations FOR SELECT 
USING (invitee_email = auth.email() OR invitation_token IS NOT NULL);

CREATE POLICY "Invitees can update their RSVP status" 
ON public.event_invitations FOR UPDATE 
USING (invitee_email = auth.email() OR invitation_token IS NOT NULL)
WITH CHECK (invitee_email = auth.email() OR invitation_token IS NOT NULL);

-- RLS policies for event_attendees
CREATE POLICY "Users can manage attendees for their events" 
ON public.event_attendees FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = event_attendees.event_id 
    AND events.user_id = auth.uid()::text
));

-- RLS policies for event_comments
CREATE POLICY "Users can manage comments for their events" 
ON public.event_comments FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = event_comments.event_id 
    AND events.user_id = auth.uid()::text
));

-- Allow public comments to be viewed by attendees
CREATE POLICY "Attendees can view public comments" 
ON public.event_comments FOR SELECT 
USING (
    is_public = true 
    AND EXISTS (
        SELECT 1 FROM public.event_invitations 
        WHERE event_invitations.event_id = event_comments.event_id 
        AND event_invitations.invitee_email = auth.email()
    )
);

-- RLS policies for event_attachments
CREATE POLICY "Users can manage attachments for their events" 
ON public.event_attachments FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = event_attachments.event_id 
    AND events.user_id = auth.uid()::text
));

-- Allow public attachments to be viewed by attendees
CREATE POLICY "Attendees can view public attachments" 
ON public.event_attachments FOR SELECT 
USING (
    is_public = true 
    AND EXISTS (
        SELECT 1 FROM public.event_invitations 
        WHERE event_invitations.event_id = event_attachments.event_id 
        AND event_invitations.invitee_email = auth.email()
    )
);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_event_invitations
BEFORE UPDATE ON public.event_invitations
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_event_attendees ON public.event_attendees;
CREATE TRIGGER set_timestamp_event_attendees
BEFORE UPDATE ON public.event_attendees
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_event_comments
BEFORE UPDATE ON public.event_comments
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_event_attachments
BEFORE UPDATE ON public.event_attachments
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Function to automatically create attendee record when RSVP is accepted
CREATE OR REPLACE FUNCTION create_attendee_from_rsvp()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create attendee if RSVP was just changed to 'accepted'
    IF NEW.rsvp_status = 'accepted' AND (OLD.rsvp_status IS NULL OR OLD.rsvp_status != 'accepted') THEN
        INSERT INTO public.event_attendees (
            event_id,
            invitation_id,
            name,
            email,
            phone,
            attendee_type,
            client_id,
            guest_count
        ) VALUES (
            NEW.event_id,
            NEW.id,
            COALESCE(NEW.invitee_name, 'Guest'),
            NEW.invitee_email,
            NEW.invitee_phone,
            NEW.invitee_type,
            NEW.client_id,
            NEW.guest_count
        )
        ON CONFLICT DO NOTHING; -- Prevent duplicates
    END IF;
    
    -- Remove attendee record if RSVP is declined or changed from accepted
    IF NEW.rsvp_status != 'accepted' AND OLD.rsvp_status = 'accepted' THEN
        DELETE FROM public.event_attendees 
        WHERE invitation_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_attendee_from_rsvp_trigger
AFTER UPDATE ON public.event_invitations
FOR EACH ROW
EXECUTE FUNCTION create_attendee_from_rsvp();