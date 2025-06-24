-- Ispeziona tabelle esistenti
SELECT 
    tablename 
FROM 
    pg_catalog.pg_tables
WHERE 
    schemaname = 'public';

-- Ispeziona struttura della tabella quotes
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'quotes';

-- Crea la tabella quote_items se non esiste
CREATE TABLE IF NOT EXISTS public.quote_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 0,
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aggiungi le colonne mancanti a quotes se necessarie
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS issue_date DATE,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS client_id UUID,
ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(10, 2) DEFAULT 0;

-- Aggiungi indice per velocizzare le query per quote_id
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON public.quote_items(quote_id);

-- Aggiungi trigger per aggiornare il timestamp updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_quote_items ON public.quote_items;
CREATE TRIGGER set_timestamp_quote_items
BEFORE UPDATE ON public.quote_items
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp(); 