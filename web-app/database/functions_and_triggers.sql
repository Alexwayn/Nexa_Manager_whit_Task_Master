-- Database functions and triggers for Nexa Manager
-- Execute this script in Supabase SQL Editor

-- 1. Updated_at timestamp trigger function (already exists but ensuring it's complete)
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Function to calculate invoice totals
CREATE OR REPLACE FUNCTION calculate_invoice_totals(invoice_uuid UUID)
RETURNS VOID AS $$
DECLARE
  subtotal_amount DECIMAL(10,2);
  tax_amount DECIMAL(10,2);
  total_amount DECIMAL(10,2);
BEGIN
  -- Calculate subtotal from invoice items
  SELECT COALESCE(SUM(amount), 0)
  INTO subtotal_amount
  FROM invoice_items
  WHERE invoice_id = invoice_uuid;
  
  -- Calculate total tax
  SELECT COALESCE(SUM(amount * tax_rate / 100), 0)
  INTO tax_amount
  FROM invoice_items
  WHERE invoice_id = invoice_uuid;
  
  -- Calculate total
  total_amount := subtotal_amount + tax_amount;
  
  -- Update invoice with calculated totals
  UPDATE invoices
  SET 
    subtotal = subtotal_amount,
    tax_amount = tax_amount,
    total_amount = total_amount,
    updated_at = NOW()
  WHERE id = invoice_uuid;
END;
$$ LANGUAGE plpgsql;

-- 3. Function to calculate quote totals
CREATE OR REPLACE FUNCTION calculate_quote_totals(quote_uuid UUID)
RETURNS VOID AS $$
DECLARE
  subtotal_amount DECIMAL(10,2);
  tax_amount DECIMAL(10,2);
  total_amount DECIMAL(10,2);
BEGIN
  -- Calculate subtotal from quote items
  SELECT COALESCE(SUM(amount), 0)
  INTO subtotal_amount
  FROM quote_items
  WHERE quote_id = quote_uuid;
  
  -- Calculate total tax
  SELECT COALESCE(SUM(amount * tax_rate / 100), 0)
  INTO tax_amount
  FROM quote_items
  WHERE quote_id = quote_uuid;
  
  -- Calculate total
  total_amount := subtotal_amount + tax_amount;
  
  -- Update quote with calculated totals
  UPDATE quotes
  SET 
    subtotal = subtotal_amount,
    tax_amount = tax_amount,
    total_amount = total_amount,
    updated_at = NOW()
  WHERE id = quote_uuid;
END;
$$ LANGUAGE plpgsql;

-- 4. Function to update invoice item amounts
CREATE OR REPLACE FUNCTION update_invoice_item_amount()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate amount based on quantity, unit_price, and tax_rate
  NEW.amount = NEW.quantity * NEW.unit_price;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Function to update quote item amounts
CREATE OR REPLACE FUNCTION update_quote_item_amount()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate amount based on quantity, unit_price, and tax_rate
  NEW.amount = NEW.quantity * NEW.unit_price;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Function to update parent totals when items change
CREATE OR REPLACE FUNCTION update_parent_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- For invoice items
  IF TG_TABLE_NAME = 'invoice_items' THEN
    IF TG_OP = 'DELETE' THEN
      PERFORM calculate_invoice_totals(OLD.invoice_id);
    ELSE
      PERFORM calculate_invoice_totals(NEW.invoice_id);
    END IF;
  END IF;
  
  -- For quote items
  IF TG_TABLE_NAME = 'quote_items' THEN
    IF TG_OP = 'DELETE' THEN
      PERFORM calculate_quote_totals(OLD.quote_id);
    ELSE
      PERFORM calculate_quote_totals(NEW.quote_id);
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 7. Function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  invoice_number TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- Get the next sequence number for this user and year
  SELECT COALESCE(MAX(CAST(SPLIT_PART(invoice_number, '-', 2) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM invoices
  WHERE user_id = user_uuid 
    AND invoice_number LIKE year_part || '-%';
  
  -- Format: YYYY-0001
  invoice_number := year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN invoice_number;
END;
$$ LANGUAGE plpgsql;

-- 8. Function to generate quote numbers
CREATE OR REPLACE FUNCTION generate_quote_number(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  quote_number TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- Get the next sequence number for this user and year
  SELECT COALESCE(MAX(CAST(SPLIT_PART(quote_number, '-', 2) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM quotes
  WHERE user_id = user_uuid 
    AND quote_number LIKE year_part || '-%';
  
  -- Format: Q-YYYY-0001
  quote_number := 'Q-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN quote_number;
END;
$$ LANGUAGE plpgsql;

-- 9. Function to auto-generate invoice numbers
CREATE OR REPLACE FUNCTION auto_generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := generate_invoice_number(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Function to auto-generate quote numbers
CREATE OR REPLACE FUNCTION auto_generate_quote_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quote_number IS NULL OR NEW.quote_number = '' THEN
    NEW.quote_number := generate_quote_number(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Function to get financial summary for a user
CREATE OR REPLACE FUNCTION get_financial_summary(
  user_uuid UUID,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE(
  total_income DECIMAL(10,2),
  total_expenses DECIMAL(10,2),
  net_profit DECIMAL(10,2),
  pending_invoices DECIMAL(10,2),
  overdue_invoices DECIMAL(10,2)
) AS $$
BEGIN
  -- Set default dates if not provided
  IF start_date IS NULL THEN
    start_date := DATE_TRUNC('month', CURRENT_DATE);
  END IF;
  
  IF end_date IS NULL THEN
    end_date := CURRENT_DATE;
  END IF;

  RETURN QUERY
  SELECT 
    COALESCE(
      (SELECT SUM(amount) FROM incomes 
       WHERE user_id = user_uuid 
         AND date BETWEEN start_date AND end_date), 0
    ) as total_income,
    
    COALESCE(
      (SELECT SUM(amount) FROM expenses 
       WHERE user_id = user_uuid 
         AND date BETWEEN start_date AND end_date), 0
    ) as total_expenses,
    
    COALESCE(
      (SELECT SUM(amount) FROM incomes 
       WHERE user_id = user_uuid 
         AND date BETWEEN start_date AND end_date), 0
    ) - COALESCE(
      (SELECT SUM(amount) FROM expenses 
       WHERE user_id = user_uuid 
         AND date BETWEEN start_date AND end_date), 0
    ) as net_profit,
    
    COALESCE(
      (SELECT SUM(total_amount) FROM invoices 
       WHERE user_id = user_uuid 
         AND status IN ('draft', 'sent')
         AND issue_date BETWEEN start_date AND end_date), 0
    ) as pending_invoices,
    
    COALESCE(
      (SELECT SUM(total_amount) FROM invoices 
       WHERE user_id = user_uuid 
         AND status = 'sent'
         AND due_date < CURRENT_DATE
         AND issue_date BETWEEN start_date AND end_date), 0
    ) as overdue_invoices;
END;
$$ LANGUAGE plpgsql;

-- 12. Audit log function
CREATE OR REPLACE FUNCTION audit_log()
RETURNS TRIGGER AS $$
DECLARE
  audit_table TEXT;
  audit_data JSONB;
BEGIN
  audit_table := TG_TABLE_NAME || '_audit';
  
  IF TG_OP = 'DELETE' THEN
    audit_data := row_to_json(OLD)::JSONB;
  ELSE
    audit_data := row_to_json(NEW)::JSONB;
  END IF;
  
  -- Log to a generic audit table (create if needed)
  INSERT INTO audit_log (
    table_name,
    operation,
    user_id,
    old_data,
    new_data,
    changed_at
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.user_id
      ELSE NEW.user_id
    END,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)::JSONB ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::JSONB ELSE NULL END,
    NOW()
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  user_id UUID,
  old_data JSONB,
  new_data JSONB,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_at ON audit_log(changed_at);

-- CREATE TRIGGERS

-- Updated_at triggers for all tables
CREATE TRIGGER set_timestamp_profiles BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_clients BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_appointments BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_invoices BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_invoice_items BEFORE UPDATE ON invoice_items FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_quotes BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_quote_items BEFORE UPDATE ON quote_items FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_incomes BEFORE UPDATE ON incomes FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_expenses BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Item amount calculation triggers
CREATE TRIGGER calculate_invoice_item_amount BEFORE INSERT OR UPDATE ON invoice_items FOR EACH ROW EXECUTE FUNCTION update_invoice_item_amount();
CREATE TRIGGER calculate_quote_item_amount BEFORE INSERT OR UPDATE ON quote_items FOR EACH ROW EXECUTE FUNCTION update_quote_item_amount();

-- Parent totals update triggers
CREATE TRIGGER update_invoice_totals AFTER INSERT OR UPDATE OR DELETE ON invoice_items FOR EACH ROW EXECUTE FUNCTION update_parent_totals();
CREATE TRIGGER update_quote_totals AFTER INSERT OR UPDATE OR DELETE ON quote_items FOR EACH ROW EXECUTE FUNCTION update_parent_totals();

-- Auto-number generation triggers
CREATE TRIGGER auto_invoice_number BEFORE INSERT ON invoices FOR EACH ROW EXECUTE FUNCTION auto_generate_invoice_number();
CREATE TRIGGER auto_quote_number BEFORE INSERT ON quotes FOR EACH ROW EXECUTE FUNCTION auto_generate_quote_number();

-- Audit triggers (optional - enable if needed)
-- CREATE TRIGGER audit_clients AFTER INSERT OR UPDATE OR DELETE ON clients FOR EACH ROW EXECUTE FUNCTION audit_log();
-- CREATE TRIGGER audit_invoices AFTER INSERT OR UPDATE OR DELETE ON invoices FOR EACH ROW EXECUTE FUNCTION audit_log();
-- CREATE TRIGGER audit_quotes AFTER INSERT OR UPDATE OR DELETE ON quotes FOR EACH ROW EXECUTE FUNCTION audit_log();

-- Comments for documentation
COMMENT ON FUNCTION calculate_invoice_totals(UUID) IS 'Calculates and updates invoice subtotal, tax, and total amounts based on invoice items';
COMMENT ON FUNCTION calculate_quote_totals(UUID) IS 'Calculates and updates quote subtotal, tax, and total amounts based on quote items';
COMMENT ON FUNCTION generate_invoice_number(UUID) IS 'Generates sequential invoice numbers in format YYYY-0001 for each user';
COMMENT ON FUNCTION generate_quote_number(UUID) IS 'Generates sequential quote numbers in format Q-YYYY-0001 for each user';
COMMENT ON FUNCTION get_financial_summary(UUID, DATE, DATE) IS 'Returns financial summary including income, expenses, profit, and pending invoices for a user and date range'; 