-- Migration script to update database schema for Clerk authentication
-- This script changes user_id columns from UUID to TEXT to support Clerk user IDs

-- WARNING: This will delete existing data since we're migrating auth systems
-- Make sure to backup any important data before running this script

BEGIN;

-- 1. Drop existing foreign key constraints and RLS policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own clients" ON clients;
DROP POLICY IF EXISTS "Users can insert their own clients" ON clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON clients;
DROP POLICY IF EXISTS "Users can view their own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can insert their own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can delete their own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can view their own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can insert their own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can update their own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can delete their own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can view their own invoice items" ON invoice_items;
DROP POLICY IF EXISTS "Users can insert their own invoice items" ON invoice_items;
DROP POLICY IF EXISTS "Users can update their own invoice items" ON invoice_items;
DROP POLICY IF EXISTS "Users can view their own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can insert their own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can update their own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can delete their own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can view their own quote items" ON quote_items;
DROP POLICY IF EXISTS "Users can insert their own quote items" ON quote_items;
DROP POLICY IF EXISTS "Users can update their own quote items" ON quote_items;
DROP POLICY IF EXISTS "Users can view their own incomes" ON incomes;
DROP POLICY IF EXISTS "Users can insert their own incomes" ON incomes;
DROP POLICY IF EXISTS "Users can update their own incomes" ON incomes;
DROP POLICY IF EXISTS "Users can delete their own incomes" ON incomes;
DROP POLICY IF EXISTS "Users can view own income" ON income;
DROP POLICY IF EXISTS "Users can insert own income" ON income;
DROP POLICY IF EXISTS "Users can update own income" ON income;
DROP POLICY IF EXISTS "Users can delete own income" ON income;
DROP POLICY IF EXISTS "Users can view their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can view own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;

-- 2. Temporarily disable RLS to modify tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE quotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE incomes DISABLE ROW LEVEL SECURITY;
ALTER TABLE income DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE income_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories DISABLE ROW LEVEL SECURITY;

-- 3. Clear existing data (since we're migrating auth systems)
TRUNCATE TABLE invoice_items CASCADE;
TRUNCATE TABLE quote_items CASCADE;
TRUNCATE TABLE invoices CASCADE;
TRUNCATE TABLE quotes CASCADE;
TRUNCATE TABLE appointments CASCADE;
TRUNCATE TABLE incomes CASCADE;
TRUNCATE TABLE income CASCADE;
TRUNCATE TABLE expenses CASCADE;
TRUNCATE TABLE clients CASCADE;
TRUNCATE TABLE profiles CASCADE;
TRUNCATE TABLE income_categories CASCADE;
TRUNCATE TABLE expense_categories CASCADE;

-- 4. Drop foreign key constraints to auth.users
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_user_id_fkey;
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_user_id_fkey;
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_user_id_fkey;
ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_user_id_fkey;
ALTER TABLE incomes DROP CONSTRAINT IF EXISTS incomes_user_id_fkey;
ALTER TABLE income DROP CONSTRAINT IF EXISTS income_user_id_fkey;
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_user_id_fkey;
ALTER TABLE income_categories DROP CONSTRAINT IF EXISTS income_categories_user_id_fkey;
ALTER TABLE expense_categories DROP CONSTRAINT IF EXISTS expense_categories_user_id_fkey;

-- 5. Modify user_id columns to TEXT for Clerk IDs
ALTER TABLE profiles ALTER COLUMN id TYPE TEXT;
ALTER TABLE clients ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE appointments ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE invoices ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE quotes ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE incomes ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE income ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE expenses ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE income_categories ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE expense_categories ALTER COLUMN user_id TYPE TEXT;

-- 6. Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;

-- 7. Create new RLS policies that work with Clerk user IDs
-- Note: We'll need to create a custom function to get the current Clerk user ID
-- For now, we'll disable RLS and handle authorization in the application layer

-- Create a function to set the current user context for RLS
CREATE OR REPLACE FUNCTION set_current_user_id(user_id TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id, TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get the current user ID
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.current_user_id', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policies using the custom user context
-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (id = get_current_user_id());
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (id = get_current_user_id());
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (id = get_current_user_id());

-- Clients policies
CREATE POLICY "Users can view their own clients" ON clients
  FOR SELECT USING (user_id = get_current_user_id());
CREATE POLICY "Users can insert their own clients" ON clients
  FOR INSERT WITH CHECK (user_id = get_current_user_id());
CREATE POLICY "Users can update their own clients" ON clients
  FOR UPDATE USING (user_id = get_current_user_id());
CREATE POLICY "Users can delete their own clients" ON clients
  FOR DELETE USING (user_id = get_current_user_id());

-- Appointments policies
CREATE POLICY "Users can view their own appointments" ON appointments
  FOR SELECT USING (user_id = get_current_user_id());
CREATE POLICY "Users can insert their own appointments" ON appointments
  FOR INSERT WITH CHECK (user_id = get_current_user_id());
CREATE POLICY "Users can update their own appointments" ON appointments
  FOR UPDATE USING (user_id = get_current_user_id());
CREATE POLICY "Users can delete their own appointments" ON appointments
  FOR DELETE USING (user_id = get_current_user_id());

-- Invoices policies
CREATE POLICY "Users can view their own invoices" ON invoices
  FOR SELECT USING (user_id = get_current_user_id());
CREATE POLICY "Users can insert their own invoices" ON invoices
  FOR INSERT WITH CHECK (user_id = get_current_user_id());
CREATE POLICY "Users can update their own invoices" ON invoices
  FOR UPDATE USING (user_id = get_current_user_id());
CREATE POLICY "Users can delete their own invoices" ON invoices
  FOR DELETE USING (user_id = get_current_user_id());

-- Invoice items policies
CREATE POLICY "Users can view their own invoice items" ON invoice_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = get_current_user_id()
    )
  );
CREATE POLICY "Users can insert their own invoice items" ON invoice_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = get_current_user_id()
    )
  );
CREATE POLICY "Users can update their own invoice items" ON invoice_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = get_current_user_id()
    )
  );
CREATE POLICY "Users can delete their own invoice items" ON invoice_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = get_current_user_id()
    )
  );

-- Quotes policies
CREATE POLICY "Users can view their own quotes" ON quotes
  FOR SELECT USING (user_id = get_current_user_id());
CREATE POLICY "Users can insert their own quotes" ON quotes
  FOR INSERT WITH CHECK (user_id = get_current_user_id());
CREATE POLICY "Users can update their own quotes" ON quotes
  FOR UPDATE USING (user_id = get_current_user_id());
CREATE POLICY "Users can delete their own quotes" ON quotes
  FOR DELETE USING (user_id = get_current_user_id());

-- Quote items policies
CREATE POLICY "Users can view their own quote items" ON quote_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND quotes.user_id = get_current_user_id()
    )
  );
CREATE POLICY "Users can insert their own quote items" ON quote_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND quotes.user_id = get_current_user_id()
    )
  );
CREATE POLICY "Users can update their own quote items" ON quote_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND quotes.user_id = get_current_user_id()
    )
  );
CREATE POLICY "Users can delete their own quote items" ON quote_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND quotes.user_id = get_current_user_id()
    )
  );

-- Income policies (both incomes and income tables)
CREATE POLICY "Users can view their own incomes" ON incomes
  FOR SELECT USING (user_id = get_current_user_id());
CREATE POLICY "Users can insert their own incomes" ON incomes
  FOR INSERT WITH CHECK (user_id = get_current_user_id());
CREATE POLICY "Users can update their own incomes" ON incomes
  FOR UPDATE USING (user_id = get_current_user_id());
CREATE POLICY "Users can delete their own incomes" ON incomes
  FOR DELETE USING (user_id = get_current_user_id());

CREATE POLICY "Users can view own income" ON income
  FOR SELECT USING (user_id = get_current_user_id());
CREATE POLICY "Users can insert own income" ON income
  FOR INSERT WITH CHECK (user_id = get_current_user_id());
CREATE POLICY "Users can update own income" ON income
  FOR UPDATE USING (user_id = get_current_user_id());
CREATE POLICY "Users can delete own income" ON income
  FOR DELETE USING (user_id = get_current_user_id());

-- Expenses policies
CREATE POLICY "Users can view their own expenses" ON expenses
  FOR SELECT USING (user_id = get_current_user_id());
CREATE POLICY "Users can insert their own expenses" ON expenses
  FOR INSERT WITH CHECK (user_id = get_current_user_id());
CREATE POLICY "Users can update their own expenses" ON expenses
  FOR UPDATE USING (user_id = get_current_user_id());
CREATE POLICY "Users can delete their own expenses" ON expenses
  FOR DELETE USING (user_id = get_current_user_id());

-- Categories policies
CREATE POLICY "Users can view own income categories" ON income_categories
  FOR SELECT USING (user_id = get_current_user_id());
CREATE POLICY "Users can insert own income categories" ON income_categories
  FOR INSERT WITH CHECK (user_id = get_current_user_id());
CREATE POLICY "Users can update own income categories" ON income_categories
  FOR UPDATE USING (user_id = get_current_user_id());
CREATE POLICY "Users can delete own income categories" ON income_categories
  FOR DELETE USING (user_id = get_current_user_id());

CREATE POLICY "Users can view own expense categories" ON expense_categories
  FOR SELECT USING (user_id = get_current_user_id());
CREATE POLICY "Users can insert own expense categories" ON expense_categories
  FOR INSERT WITH CHECK (user_id = get_current_user_id());
CREATE POLICY "Users can update own expense categories" ON expense_categories
  FOR UPDATE USING (user_id = get_current_user_id());
CREATE POLICY "Users can delete own expense categories" ON expense_categories
  FOR DELETE USING (user_id = get_current_user_id());

COMMIT; 