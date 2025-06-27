-- Create missing invoices table for Nexa Manager
-- This script creates the invoices table that the application is trying to access

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    paid_date DATE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    
    -- Financial amounts
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    vat_rate DECIMAL(5,2) NOT NULL DEFAULT 22.00,
    vat_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    net_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Additional fields
    currency TEXT NOT NULL DEFAULT 'EUR',
    payment_terms TEXT,
    notes TEXT,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    withholding_tax_rate DECIMAL(5,2) DEFAULT 0,
    withholding_tax_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, invoice_number),
    CHECK (total_amount >= 0),
    CHECK (vat_amount >= 0),
    CHECK (subtotal >= 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_paid_date ON invoices(paid_date);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);

-- Enable Row Level Security
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy for users to see only their own invoices
CREATE POLICY "Users can view own invoices" ON invoices
    FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Policy for users to insert their own invoices
CREATE POLICY "Users can insert own invoices" ON invoices
    FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Policy for users to update their own invoices
CREATE POLICY "Users can update own invoices" ON invoices
    FOR UPDATE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub')
    WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Policy for users to delete their own invoices
CREATE POLICY "Users can delete own invoices" ON invoices
    FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_invoices_updated_at 
    BEFORE UPDATE ON invoices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate amounts automatically
CREATE OR REPLACE FUNCTION calculate_invoice_amounts()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate VAT amount
    NEW.vat_amount = (NEW.subtotal - NEW.discount_amount) * (NEW.vat_rate / 100);
    
    -- Calculate net amount (subtotal - discount)
    NEW.net_amount = NEW.subtotal - NEW.discount_amount;
    
    -- Calculate withholding tax amount
    NEW.withholding_tax_amount = NEW.net_amount * (NEW.withholding_tax_rate / 100);
    
    -- Calculate total amount (net + vat - withholding tax)
    NEW.total_amount = NEW.net_amount + NEW.vat_amount - NEW.withholding_tax_amount;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_invoice_amounts_trigger
    BEFORE INSERT OR UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION calculate_invoice_amounts();

-- Insert some default invoice categories/statuses for reference
COMMENT ON TABLE invoices IS 'Invoices table for managing client billing and payments';
COMMENT ON COLUMN invoices.status IS 'Invoice status: draft, sent, paid, overdue, cancelled';
COMMENT ON COLUMN invoices.vat_rate IS 'VAT rate as percentage (e.g., 22.00 for 22%)';
COMMENT ON COLUMN invoices.withholding_tax_rate IS 'Withholding tax rate as percentage'; 