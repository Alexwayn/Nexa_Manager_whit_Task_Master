-- Create missing financial tables for Nexa Manager
-- This script only creates the tables that don't exist
-- Safe to run - won't affect existing tables

-- 1. Create income_categories table
CREATE TABLE IF NOT EXISTS income_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, -- Clerk user ID
    name TEXT NOT NULL,
    color TEXT DEFAULT '#10B981',
    icon TEXT DEFAULT 'dollar-sign',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- 2. Create income table
CREATE TABLE IF NOT EXISTS income (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, -- Clerk user ID
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    category TEXT NOT NULL DEFAULT 'other',
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT DEFAULT 'bank_transfer',
    reference_number TEXT,
    is_recurring BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create expense_categories table
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, -- Clerk user ID
    name TEXT NOT NULL,
    color TEXT DEFAULT '#EF4444',
    icon TEXT DEFAULT 'credit-card',
    description TEXT,
    tax_deductible_default BOOLEAN DEFAULT false,
    percentage_limit DECIMAL(5,2) DEFAULT 100.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- 4. Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, -- Clerk user ID
    category TEXT NOT NULL DEFAULT 'other',
    vendor TEXT,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT DEFAULT 'credit_card',
    tax_deductible BOOLEAN DEFAULT false,
    tax_deductible_amount DECIMAL(12,2) DEFAULT 0,
    receipt_url TEXT,
    invoice_number TEXT,
    reference_number TEXT,
    is_recurring BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE income_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies for income_categories
CREATE POLICY "Users can view own income categories" ON income_categories 
    FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own income categories" ON income_categories 
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own income categories" ON income_categories 
    FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "Users can delete own income categories" ON income_categories 
    FOR DELETE USING (auth.uid()::text = user_id);

-- 7. Create RLS Policies for income
CREATE POLICY "Users can view own income" ON income 
    FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own income" ON income 
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own income" ON income 
    FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "Users can delete own income" ON income 
    FOR DELETE USING (auth.uid()::text = user_id);

-- 8. Create RLS Policies for expense_categories
CREATE POLICY "Users can view own expense categories" ON expense_categories 
    FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own expense categories" ON expense_categories 
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own expense categories" ON expense_categories 
    FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "Users can delete own expense categories" ON expense_categories 
    FOR DELETE USING (auth.uid()::text = user_id);

-- 9. Create RLS Policies for expenses
CREATE POLICY "Users can view own expenses" ON expenses 
    FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own expenses" ON expenses 
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own expenses" ON expenses 
    FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "Users can delete own expenses" ON expenses 
    FOR DELETE USING (auth.uid()::text = user_id);

-- 10. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_income_user_id ON income(user_id);
CREATE INDEX IF NOT EXISTS idx_income_date ON income(date);
CREATE INDEX IF NOT EXISTS idx_income_category ON income(category);
CREATE INDEX IF NOT EXISTS idx_income_client_id ON income(client_id);

CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_vendor ON expenses(vendor);
CREATE INDEX IF NOT EXISTS idx_expenses_tax_deductible ON expenses(tax_deductible);

CREATE INDEX IF NOT EXISTS idx_income_categories_user_id ON income_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_user_id ON expense_categories(user_id);

-- 11. Insert default categories (only if user is authenticated)
-- Note: This will only work when executed by an authenticated user

-- Default income categories
INSERT INTO income_categories (user_id, name, color, icon, description) 
SELECT 
    auth.uid(),
    category.name,
    category.color,
    category.icon,
    category.description
FROM (
    VALUES
    ('Fatturazione', '#10B981', 'file-text', 'Entrate da fatture emesse'),
    ('Consulenza', '#3B82F6', 'briefcase', 'Servizi di consulenza'),
    ('Vendite', '#8B5CF6', 'shopping-cart', 'Vendita prodotti o servizi'),
    ('Rimborsi', '#F59E0B', 'refresh-cw', 'Rimborsi e restituzioni'),
    ('Investimenti', '#EF4444', 'trending-up', 'Rendimenti da investimenti'),
    ('Altro', '#6B7280', 'plus-circle', 'Altre entrate')
) AS category(name, color, icon, description)
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id, name) DO NOTHING;

-- Default expense categories
INSERT INTO expense_categories (user_id, name, color, icon, description, tax_deductible_default) 
SELECT 
    auth.uid(),
    category.name,
    category.color,
    category.icon,
    category.description,
    category.tax_deductible_default
FROM (
    VALUES
    ('Ufficio', '#3B82F6', 'briefcase', 'Spese per ufficio e attrezzature', true),
    ('Marketing', '#8B5CF6', 'megaphone', 'Pubblicità e marketing', true),
    ('Trasporti', '#10B981', 'car', 'Auto, benzina, trasporti', true),
    ('Comunicazioni', '#F59E0B', 'phone', 'Telefono, internet, comunicazioni', true),
    ('Formazione', '#EF4444', 'book-open', 'Corsi, libri, formazione', true),
    ('Software', '#6366F1', 'monitor', 'Abbonamenti software e servizi', true),
    ('Consulenze', '#EC4899', 'users', 'Consulenti esterni e professionisti', true),
    ('Personale', '#14B8A6', 'user-check', 'Spese per dipendenti e collaboratori', false),
    ('Altro', '#6B7280', 'more-horizontal', 'Altre spese aziendali', false)
) AS category(name, color, icon, description, tax_deductible_default)
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id, name) DO NOTHING;

-- 12. Verification query
SELECT 
    'Financial tables created successfully!' as status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('income', 'expenses', 'income_categories', 'expense_categories') AND table_schema = 'public') as tables_created;