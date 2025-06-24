-- Script per risolvere i problemi di schema del database
-- Eseguire questo script nella console SQL di Supabase

-- 1. Aggiungere la colonna 'name' alla tabella clients (per compatibilità)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS name TEXT;

-- 2. Popolare la colonna 'name' con i valori di 'full_name' esistenti
UPDATE clients SET name = full_name WHERE name IS NULL;

-- 3. Aggiungere la colonna 'business_type' alla tabella clients se non esiste
ALTER TABLE clients ADD COLUMN IF NOT EXISTS business_type TEXT DEFAULT 'individual';

-- 4. Aggiungere la colonna 'paid_date' alla tabella invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_date DATE;

-- 5. Aggiungere colonne VAT per conformità alle query
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS vat_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS net_amount DECIMAL(10,2) DEFAULT 0;

-- 6. Aggiornare i valori esistenti delle fatture
UPDATE invoices 
SET 
  vat_amount = COALESCE(tax_amount, 0),
  net_amount = COALESCE(subtotal, 0)
WHERE vat_amount IS NULL OR net_amount IS NULL;

-- 7. Aggiornare paid_date per le fatture già pagate
UPDATE invoices 
SET paid_date = updated_at::date 
WHERE status = 'paid' AND paid_date IS NULL;

-- 8. Aggiungere indici per migliorare le performance delle query analytics
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_paid_date ON invoices(paid_date);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);

-- 9. Aggiungere trigger per aggiornare automaticamente paid_date quando status diventa 'paid'
CREATE OR REPLACE FUNCTION update_paid_date()
RETURNS TRIGGER AS $$
BEGIN
    -- Se lo status diventa 'paid' e paid_date è NULL, imposta la data corrente
    IF NEW.status = 'paid' AND OLD.status != 'paid' AND NEW.paid_date IS NULL THEN
        NEW.paid_date = CURRENT_DATE;
    END IF;
    
    -- Se lo status non è più 'paid', rimuovi paid_date
    IF NEW.status != 'paid' AND OLD.status = 'paid' THEN
        NEW.paid_date = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Creare il trigger
DROP TRIGGER IF EXISTS trigger_update_paid_date ON invoices;
CREATE TRIGGER trigger_update_paid_date
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_paid_date();

-- 10. GESTIRE LE TABELLE FINANZIARIE IN MODO SICURO

-- Controllare se le tabelle esistono e gestirle di conseguenza
DO $$
BEGIN
    -- Gestire tabella income_categories
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'income_categories') THEN
        CREATE TABLE income_categories (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            color TEXT DEFAULT '#10B981',
            icon TEXT DEFAULT 'dollar-sign',
            description TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, name)
        );
        
        ALTER TABLE income_categories ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can view own income categories" ON income_categories FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert own income categories" ON income_categories FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update own income categories" ON income_categories FOR UPDATE USING (auth.uid() = user_id);
        CREATE POLICY "Users can delete own income categories" ON income_categories FOR DELETE USING (auth.uid() = user_id);
    END IF;

    -- Gestire tabella income
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'income') THEN
        CREATE TABLE income (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
            invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
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
        
        ALTER TABLE income ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can view own income" ON income FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert own income" ON income FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update own income" ON income FOR UPDATE USING (auth.uid() = user_id);
        CREATE POLICY "Users can delete own income" ON income FOR DELETE USING (auth.uid() = user_id);
    END IF;

    -- Gestire tabella expense_categories
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'expense_categories') THEN
        CREATE TABLE expense_categories (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
        
        ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can view own expense categories" ON expense_categories FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert own expense categories" ON expense_categories FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update own expense categories" ON expense_categories FOR UPDATE USING (auth.uid() = user_id);
        CREATE POLICY "Users can delete own expense categories" ON expense_categories FOR DELETE USING (auth.uid() = user_id);
    END IF;

    -- Gestire tabella expenses (la più problematica)
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'expenses') THEN
        -- Creare nuova tabella expenses
        CREATE TABLE expenses (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
        
        ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can view own expenses" ON expenses FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert own expenses" ON expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update own expenses" ON expenses FOR UPDATE USING (auth.uid() = user_id);
        CREATE POLICY "Users can delete own expenses" ON expenses FOR DELETE USING (auth.uid() = user_id);
    ELSE
        -- La tabella expenses esiste già, aggiungiamo le colonne mancanti
        ALTER TABLE expenses ADD COLUMN IF NOT EXISTS vendor TEXT;
        ALTER TABLE expenses ADD COLUMN IF NOT EXISTS tax_deductible BOOLEAN DEFAULT false;
        ALTER TABLE expenses ADD COLUMN IF NOT EXISTS tax_deductible_amount DECIMAL(12,2) DEFAULT 0;
        ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_url TEXT;
        ALTER TABLE expenses ADD COLUMN IF NOT EXISTS invoice_number TEXT;
        ALTER TABLE expenses ADD COLUMN IF NOT EXISTS reference_number TEXT;
        ALTER TABLE expenses ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
        ALTER TABLE expenses ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
        ALTER TABLE expenses ADD COLUMN IF NOT EXISTS notes TEXT;
    END IF;
END $$;

-- 11. Creare indici per tutte le tabelle finanziarie
CREATE INDEX IF NOT EXISTS idx_income_user_id ON income(user_id);
CREATE INDEX IF NOT EXISTS idx_income_date ON income(date);
CREATE INDEX IF NOT EXISTS idx_income_category ON income(category);
CREATE INDEX IF NOT EXISTS idx_income_client_id ON income(client_id);
CREATE INDEX IF NOT EXISTS idx_income_invoice_id ON income(invoice_id);

CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_vendor ON expenses(vendor);
CREATE INDEX IF NOT EXISTS idx_expenses_tax_deductible ON expenses(tax_deductible);

CREATE INDEX IF NOT EXISTS idx_income_categories_user_id ON income_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_user_id ON expense_categories(user_id);

-- 12. Inserire categorie predefinite solo se non esistono
DO $$
BEGIN
    -- Categorie income
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'income_categories') THEN
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
    END IF;

    -- Categorie expenses
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'expense_categories') THEN
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
    END IF;
END $$;

-- 13. Inserire dati di esempio solo se le tabelle sono vuote
DO $$
BEGIN
    -- Controlla se ci sono già clienti, altrimenti creane uno
    IF NOT EXISTS (SELECT 1 FROM clients LIMIT 1) THEN
        INSERT INTO clients (user_id, full_name, name, email, business_type, city, phone)
        SELECT 
            auth.uid(),
            'Cliente Esempio SRL',
            'Cliente Esempio SRL',
            'cliente@esempio.com',
            'business',
            'Milano',
            '+39 02 1234567'
        WHERE auth.uid() IS NOT NULL;
    END IF;
    
    -- Controlla se ci sono già fatture, altrimenti creane alcune
    IF NOT EXISTS (SELECT 1 FROM invoices LIMIT 1) THEN
        INSERT INTO invoices (
            user_id, 
            client_id, 
            invoice_number, 
            issue_date, 
            due_date, 
            subtotal, 
            tax_amount, 
            vat_amount,
            net_amount,
            total_amount, 
            status,
            paid_date
        )
        SELECT 
            auth.uid(),
            c.id,
            'FAT-001',
            CURRENT_DATE - INTERVAL '30 days',
            CURRENT_DATE - INTERVAL '0 days',
            1000.00,
            220.00,
            220.00,
            1000.00,
            1220.00,
            'paid',
            CURRENT_DATE - INTERVAL '15 days'
        FROM clients c 
        WHERE c.user_id = auth.uid()
        LIMIT 1;
        
        INSERT INTO invoices (
            user_id, 
            client_id, 
            invoice_number, 
            issue_date, 
            due_date, 
            subtotal, 
            tax_amount,
            vat_amount, 
            net_amount,
            total_amount, 
            status
        )
        SELECT 
            auth.uid(),
            c.id,
            'FAT-002',
            CURRENT_DATE - INTERVAL '15 days',
            CURRENT_DATE + INTERVAL '15 days',
            1500.00,
            330.00,
            330.00,
            1500.00,
            1830.00,
            'sent'
        FROM clients c 
        WHERE c.user_id = auth.uid()
        LIMIT 1;
    END IF;
    
    -- Aggiungi income di esempio solo se non esistono e le tabelle ci sono
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'income') 
       AND NOT EXISTS (SELECT 1 FROM income LIMIT 1) 
       AND auth.uid() IS NOT NULL THEN
        
        INSERT INTO income (user_id, category, amount, description, date, payment_method, invoice_id)
        SELECT 
            auth.uid(),
            'Fatturazione',
            1220.00,
            'Pagamento Fattura FAT-001',
            CURRENT_DATE - INTERVAL '15 days',
            'bank_transfer',
            i.id
        FROM invoices i 
        WHERE i.user_id = auth.uid() AND i.invoice_number = 'FAT-001'
        LIMIT 1;
        
        INSERT INTO income (user_id, category, amount, description, date, payment_method)
        SELECT 
            auth.uid(),
            'Consulenza',
            800.00,
            'Consulenza progetto ABC',
            CURRENT_DATE - INTERVAL '20 days',
            'bank_transfer'
        WHERE auth.uid() IS NOT NULL;
        
        INSERT INTO income (user_id, category, amount, description, date, payment_method)
        SELECT 
            auth.uid(),
            'Vendite',
            350.00,
            'Vendita licenza software',
            CURRENT_DATE - INTERVAL '10 days',
            'credit_card'
        WHERE auth.uid() IS NOT NULL;
    END IF;
    
    -- Aggiungi expenses di esempio solo se non esistono e le tabelle ci sono
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'expenses') 
       AND NOT EXISTS (SELECT 1 FROM expenses LIMIT 1) 
       AND auth.uid() IS NOT NULL THEN
        
        INSERT INTO expenses (user_id, category, vendor, amount, description, date, payment_method, tax_deductible)
        VALUES
        (auth.uid(), 'Ufficio', 'Office Supplies Co.', 250.00, 'Materiale da ufficio', CURRENT_DATE - INTERVAL '25 days', 'credit_card', true),
        (auth.uid(), 'Software', 'Adobe Systems', 59.99, 'Abbonamento Creative Cloud', CURRENT_DATE - INTERVAL '1 month', 'credit_card', true),
        (auth.uid(), 'Trasporti', 'Shell', 65.00, 'Rifornimento carburante', CURRENT_DATE - INTERVAL '5 days', 'credit_card', true),
        (auth.uid(), 'Marketing', 'Google Ads', 150.00, 'Campagna pubblicitaria', CURRENT_DATE - INTERVAL '15 days', 'credit_card', true),
        (auth.uid(), 'Comunicazioni', 'Telecom Italia', 45.00, 'Bolletta telefonica', CURRENT_DATE - INTERVAL '1 month', 'bank_transfer', true);
    END IF;
END $$;

-- 14. Messaggio finale
SELECT 
    'Schema update completed successfully! Financial tables created/updated.' as status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('income', 'expenses', 'income_categories', 'expense_categories')) as tables_created; 