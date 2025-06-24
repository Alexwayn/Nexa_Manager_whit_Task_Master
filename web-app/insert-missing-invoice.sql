
-- SQL to directly insert a new invoice into the database
-- Run this in the Supabase SQL Editor

-- 1. Temporarily disable RLS
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;

-- 2. Insert the invoice
INSERT INTO invoices (
  invoice_number,
  issue_date,
  due_date,
  total_amount,
  subtotal,
  tax_amount,
  status,
  notes,
  user_id,
  client_id
) VALUES (
  'FATT-06-05-2025-6091',
  '2025-05-06',
  '2025-05-17',
  1000,
  819.67,
  180.33,
  'bozza',
  'Fattura creata automaticamente per risolvere problema ghost event',
  '68ed1689-e6db-4c16-a1a5-33dc43dca1c4',
  'ca903d91-864d-4c0a-acc2-4fe426a9e4e2'
) RETURNING id;

-- 3. Re-enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- 4. Insert invoice item (replace 'new_invoice_id' with the ID from above)
INSERT INTO invoice_items (
  invoice_id,
  description,
  quantity,
  unit_price,
  tax_rate,
  amount
) VALUES (
  'new_invoice_id', -- Replace this with the actual ID from step 2
  'Servizio fatturato',
  1,
  819.67,
  22,
  819.67
);
