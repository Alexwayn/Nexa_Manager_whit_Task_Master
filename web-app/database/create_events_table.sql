-- Script per la creazione della tabella events per il calendario
CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL, -- Clerk user ID
    title TEXT NOT NULL,
    type TEXT NOT NULL, -- 'appuntamento', 'preventivo', 'fattura', 'entrata', 'spesa'
    date DATE NOT NULL,
    start_time TEXT,
    end_time TEXT,
    client TEXT,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    note TEXT,
    location TEXT,
    priority TEXT DEFAULT 'media', -- 'bassa', 'media', 'alta'
    reminder BOOLEAN DEFAULT FALSE,
    color TEXT,
    
    -- Campi per fatture e preventivi
    due_date DATE,
    document_number TEXT,
    status TEXT,
    items JSONB, -- Array di voci come JSON
    subtotal NUMERIC(10, 2),
    tax NUMERIC(10, 2),
    total NUMERIC(10, 2),
    
    -- Campi per entrate e spese
    payment_method TEXT,
    category TEXT,
    amount NUMERIC(10, 2),
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici per migliorare le prestazioni delle query
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_events_client_id ON public.events(client_id);

-- Policy RLS per consentire agli utenti di vedere solo i propri eventi
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own events" 
ON public.events FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own events" 
ON public.events FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own events" 
ON public.events FOR UPDATE 
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own events" 
ON public.events FOR DELETE 
USING (auth.uid()::text = user_id);

-- Trigger per aggiornare l'updated_at automaticamente
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_events ON public.events;
CREATE TRIGGER set_timestamp_events
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();