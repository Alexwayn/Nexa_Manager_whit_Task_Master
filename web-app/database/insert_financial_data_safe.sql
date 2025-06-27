-- INSERIMENTO DATI FINANZIARI SICURO

-- UUID FISSO PER DATI FINANZIARI
-- '12345678-1234-5678-9abc-123456789012'

-- 1. PULIZIA DATI DI TEST
DELETE FROM public.income WHERE amount = 99999.99;
DELETE FROM public.expenses WHERE amount = 99999.99;

-- 2. INSERIMENTO CATEGORIE ENTRATE
INSERT INTO public.income_categories (
    id,
    name,
    description,
    is_active,
    created_at,
    updated_at,
    user_id
) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Servizi di Consulenza', 'Entrate da servizi di consulenza IT', true, NOW(), NOW(), '12345678-1234-5678-9abc-123456789012'),
('550e8400-e29b-41d4-a716-446655440002', 'Sviluppo Software', 'Entrate da progetti di sviluppo', true, NOW(), NOW(), '12345678-1234-5678-9abc-123456789012'),
('550e8400-e29b-41d4-a716-446655440003', 'Licenze Software', 'Entrate da vendita licenze', true, NOW(), NOW(), '12345678-1234-5678-9abc-123456789012')
ON CONFLICT (id) DO NOTHING;

-- 3. INSERIMENTO CATEGORIE SPESE
INSERT INTO public.expense_categories (
    id,
    name,
    description,
    is_active,
    created_at,
    updated_at,
    user_id
) VALUES
('550e8400-e29b-41d4-a716-446655440011', 'Ufficio', 'Spese per ufficio e materiali', true, NOW(), NOW(), '12345678-1234-5678-9abc-123456789012'),
('550e8400-e29b-41d4-a716-446655440012', 'Marketing', 'Spese per marketing e pubblicità', true, NOW(), NOW(), '12345678-1234-5678-9abc-123456789012'),
('550e8400-e29b-41d4-a716-446655440013', 'Tecnologia', 'Spese per software e hardware', true, NOW(), NOW(), '12345678-1234-5678-9abc-123456789012')
ON CONFLICT (id) DO NOTHING;

-- 4. INSERIMENTO ENTRATE
INSERT INTO public.income (
    id,
    amount,
    description,
    date,
    category_id,
    is_recurring,
    created_at,
    updated_at,
    user_id
) VALUES
('550e8400-e29b-41d4-a716-446655440101', 5000.00, 'Progetto sviluppo website', '2024-01-15', '550e8400-e29b-41d4-a716-446655440002', false, NOW(), NOW(), '12345678-1234-5678-9abc-123456789012'),
('550e8400-e29b-41d4-a716-446655440102', 3500.00, 'Consulenza IT mensile', '2024-01-10', '550e8400-e29b-41d4-a716-446655440001', true, NOW(), NOW(), '12345678-1234-5678-9abc-123456789012'),
('550e8400-e29b-41d4-a716-446655440103', 2000.00, 'Licenza software annuale', '2024-01-05', '550e8400-e29b-41d4-a716-446655440003', false, NOW(), NOW(), '12345678-1234-5678-9abc-123456789012'),
('550e8400-e29b-41d4-a716-446655440104', 4200.00, 'Progetto e-commerce', '2024-02-01', '550e8400-e29b-41d4-a716-446655440002', false, NOW(), NOW(), '12345678-1234-5678-9abc-123456789012'),
('550e8400-e29b-41d4-a716-446655440105', 3500.00, 'Consulenza IT mensile', '2024-02-10', '550e8400-e29b-41d4-a716-446655440001', true, NOW(), NOW(), '12345678-1234-5678-9abc-123456789012')
ON CONFLICT (id) DO NOTHING;

-- 5. INSERIMENTO SPESE
INSERT INTO public.expenses (
    id,
    amount,
    description,
    date,
    category_id,
    is_recurring,
    created_at,
    updated_at,
    user_id
) VALUES
('550e8400-e29b-41d4-a716-446655440201', 150.00, 'Materiali ufficio', '2024-01-08', '550e8400-e29b-41d4-a716-446655440011', false, NOW(), NOW(), '12345678-1234-5678-9abc-123456789012'),
('550e8400-e29b-41d4-a716-446655440202', 800.00, 'Campagna Google Ads', '2024-01-12', '550e8400-e29b-41d4-a716-446655440012', false, NOW(), NOW(), '12345678-1234-5678-9abc-123456789012'),
('550e8400-e29b-41d4-a716-446655440203', 299.00, 'Abbonamento software design', '2024-01-01', '550e8400-e29b-41d4-a716-446655440013', true, NOW(), NOW(), '12345678-1234-5678-9abc-123456789012'),
('550e8400-e29b-41d4-a716-446655440204', 200.00, 'Affitto spazio co-working', '2024-01-01', '550e8400-e29b-41d4-a716-446655440011', true, NOW(), NOW(), '12345678-1234-5678-9abc-123456789012'),
('550e8400-e29b-41d4-a716-446655440205', 450.00, 'Pubblicità Facebook', '2024-02-05', '550e8400-e29b-41d4-a716-446655440012', false, NOW(), NOW(), '12345678-1234-5678-9abc-123456789012')
ON CONFLICT (id) DO NOTHING;

-- 6. VERIFICA INSERIMENTI
SELECT 'VERIFICA CATEGORIE ENTRATE:' as check;
SELECT COUNT(*) as count_income_categories FROM public.income_categories WHERE user_id = '12345678-1234-5678-9abc-123456789012';

SELECT 'VERIFICA CATEGORIE SPESE:' as check;
SELECT COUNT(*) as count_expense_categories FROM public.expense_categories WHERE user_id = '12345678-1234-5678-9abc-123456789012';

SELECT 'VERIFICA ENTRATE:' as check;
SELECT COUNT(*) as count_income, SUM(amount) as total_income FROM public.income WHERE user_id = '12345678-1234-5678-9abc-123456789012';

SELECT 'VERIFICA SPESE:' as check;
SELECT COUNT(*) as count_expenses, SUM(amount) as total_expenses FROM public.expenses WHERE user_id = '12345678-1234-5678-9abc-123456789012';

-- 7. RIEPILOGO FINALE
SELECT 'RIEPILOGO DATI FINANZIARI:' as summary;
SELECT 
    (SELECT SUM(amount) FROM public.income WHERE user_id = '12345678-1234-5678-9abc-123456789012') as total_income,
    (SELECT SUM(amount) FROM public.expenses WHERE user_id = '12345678-1234-5678-9abc-123456789012') as total_expenses,
    (SELECT SUM(amount) FROM public.income WHERE user_id = '12345678-1234-5678-9abc-123456789012') - 
    (SELECT SUM(amount) FROM public.expenses WHERE user_id = '12345678-1234-5678-9abc-123456789012') as profit; 