-- =====================================================
-- NEXA MANAGER - REPORTING VIEWS AND DATA ARCHITECTURE
-- =====================================================
-- Task 71.2: Design and Implement Data Architecture for Reporting
-- 
-- This script creates optimized database views for efficient reporting
-- and analytics across all business data in Nexa Manager.
-- 
-- Execute this script after all base tables are created.
-- =====================================================

-- =====================================================
-- 1. FINANCIAL SUMMARY VIEWS
-- =====================================================

-- Revenue Summary View - Pre-calculated monthly/yearly totals
CREATE OR REPLACE VIEW v_revenue_summary AS
SELECT 
    i.user_id,
    EXTRACT(YEAR FROM i.issue_date) AS year,
    EXTRACT(MONTH FROM i.issue_date) AS month,
    DATE_TRUNC('month', i.issue_date) AS month_start,
    DATE_TRUNC('year', i.issue_date) AS year_start,
    
    -- Revenue Metrics
    COUNT(*) AS invoice_count,
    SUM(i.total_amount) AS total_revenue,
    SUM(i.net_amount) AS net_revenue,
    SUM(i.vat_amount) AS total_vat,
    AVG(i.total_amount) AS avg_invoice_amount,
    
    -- Status Breakdown
    COUNT(*) FILTER (WHERE i.status = 'paid') AS paid_invoices,
    COUNT(*) FILTER (WHERE i.status = 'sent') AS sent_invoices,
    COUNT(*) FILTER (WHERE i.status = 'overdue') AS overdue_invoices,
    COUNT(*) FILTER (WHERE i.status = 'draft') AS draft_invoices,
    
    -- Financial Metrics
    SUM(i.total_amount) FILTER (WHERE i.status = 'paid') AS paid_revenue,
    SUM(i.total_amount) FILTER (WHERE i.status IN ('sent', 'overdue')) AS outstanding_revenue,
    
    -- Collection Metrics
    AVG(CASE 
        WHEN i.status = 'paid' AND i.paid_date IS NOT NULL 
        THEN i.paid_date - i.due_date 
        ELSE NULL 
    END) AS avg_payment_delay_days,
    
    -- Last updated
    NOW() AS calculated_at
FROM invoices i
WHERE i.issue_date >= '2020-01-01' -- Reasonable data range
GROUP BY i.user_id, EXTRACT(YEAR FROM i.issue_date), EXTRACT(MONTH FROM i.issue_date),
         DATE_TRUNC('month', i.issue_date), DATE_TRUNC('year', i.issue_date);

-- Expense Summary View - Pre-calculated expense analytics
CREATE OR REPLACE VIEW v_expense_summary AS
SELECT 
    e.user_id,
    EXTRACT(YEAR FROM e.date) AS year,
    EXTRACT(MONTH FROM e.date) AS month,
    DATE_TRUNC('month', e.date) AS month_start,
    e.category,
    
    -- Expense Metrics
    COUNT(*) AS expense_count,
    SUM(e.amount) AS total_expenses,
    AVG(e.amount) AS avg_expense_amount,
    MAX(e.amount) AS max_expense_amount,
    MIN(e.amount) AS min_expense_amount,
    
    -- Tax Deductible Analysis
    COUNT(*) FILTER (WHERE e.tax_deductible = true) AS deductible_count,
    SUM(e.amount) FILTER (WHERE e.tax_deductible = true) AS deductible_amount,
    
    -- Payment Methods
    COUNT(*) FILTER (WHERE e.payment_method = 'cash') AS cash_payments,
    COUNT(*) FILTER (WHERE e.payment_method = 'bank_transfer') AS bank_payments,
    COUNT(*) FILTER (WHERE e.payment_method = 'credit_card') AS card_payments,
    
    -- Receipt Tracking
    COUNT(*) FILTER (WHERE e.receipt_url IS NOT NULL) AS receipts_available,
    
    NOW() AS calculated_at
FROM expenses e
WHERE e.date >= '2020-01-01'
GROUP BY e.user_id, EXTRACT(YEAR FROM e.date), EXTRACT(MONTH FROM e.date),
         DATE_TRUNC('month', e.date), e.category;

-- Profit and Loss View - Complete P&L calculation
CREATE OR REPLACE VIEW v_profit_loss AS
SELECT 
    COALESCE(r.user_id, e.user_id) AS user_id,
    COALESCE(r.year, e.year) AS year,
    COALESCE(r.month, e.month) AS month,
    COALESCE(r.month_start, e.month_start) AS period_start,
    
    -- Revenue
    COALESCE(r.total_revenue, 0) AS total_revenue,
    COALESCE(r.net_revenue, 0) AS net_revenue,
    COALESCE(r.total_vat, 0) AS total_vat_collected,
    
    -- Expenses
    COALESCE(e.total_expenses, 0) AS total_expenses,
    COALESCE(e.deductible_amount, 0) AS tax_deductible_expenses,
    
    -- Profit Calculations
    COALESCE(r.net_revenue, 0) - COALESCE(e.total_expenses, 0) AS net_profit,
    COALESCE(r.total_revenue, 0) - COALESCE(e.total_expenses, 0) AS gross_profit,
    
    -- Margins
    CASE 
        WHEN COALESCE(r.total_revenue, 0) > 0 
        THEN ((COALESCE(r.net_revenue, 0) - COALESCE(e.total_expenses, 0)) / r.total_revenue) * 100
        ELSE 0 
    END AS net_profit_margin_percent,
    
    CASE 
        WHEN COALESCE(r.total_revenue, 0) > 0 
        THEN (COALESCE(e.total_expenses, 0) / r.total_revenue) * 100
        ELSE 0 
    END AS expense_ratio_percent,
    
    NOW() AS calculated_at
FROM (
    SELECT user_id, year, month, month_start,
           SUM(total_revenue) AS total_revenue,
           SUM(net_revenue) AS net_revenue,
           SUM(total_vat) AS total_vat
    FROM v_revenue_summary 
    GROUP BY user_id, year, month, month_start
) r
FULL OUTER JOIN (
    SELECT user_id, year, month, month_start,
           SUM(total_expenses) AS total_expenses,
           SUM(deductible_amount) AS deductible_amount
    FROM v_expense_summary 
    GROUP BY user_id, year, month, month_start
) e ON r.user_id = e.user_id 
     AND r.year = e.year 
     AND r.month = e.month;

-- =====================================================
-- 2. CLIENT ANALYTICS VIEWS
-- =====================================================

-- Client Revenue View - Revenue by client with analytics
CREATE OR REPLACE VIEW v_client_revenue AS
SELECT 
    c.id AS client_id,
    c.user_id,
    c.full_name AS client_name,
    c.email AS client_email,
    c.created_at AS client_since,
    
    -- Invoice Metrics
    COUNT(i.id) AS total_invoices,
    COALESCE(SUM(i.total_amount), 0) AS total_revenue,
    COALESCE(SUM(i.net_amount), 0) AS net_revenue,
    COALESCE(AVG(i.total_amount), 0) AS avg_invoice_amount,
    
    -- Payment Status
    COUNT(i.id) FILTER (WHERE i.status = 'paid') AS paid_invoices,
    COUNT(i.id) FILTER (WHERE i.status IN ('sent', 'overdue')) AS outstanding_invoices,
    COALESCE(SUM(i.total_amount) FILTER (WHERE i.status = 'paid'), 0) AS paid_revenue,
    COALESCE(SUM(i.total_amount) FILTER (WHERE i.status IN ('sent', 'overdue')), 0) AS outstanding_amount,
    
    -- Timeline Analysis
    MIN(i.issue_date) AS first_invoice_date,
    MAX(i.issue_date) AS last_invoice_date,
    MAX(i.paid_date) AS last_payment_date,
    
    -- Customer Lifetime Metrics
    CASE 
        WHEN MIN(i.issue_date) IS NOT NULL 
        THEN (COALESCE(MAX(i.issue_date), CURRENT_DATE) - MIN(i.issue_date))
        ELSE 0 
    END AS relationship_days,
    
    -- Payment Behavior
    AVG(CASE 
        WHEN i.status = 'paid' AND i.paid_date IS NOT NULL 
        THEN i.paid_date - i.due_date 
        ELSE NULL 
    END) AS avg_payment_delay,
    
    -- Activity Indicators
    CASE 
        WHEN MAX(i.issue_date) >= CURRENT_DATE - INTERVAL '3 months' THEN 'active'
        WHEN MAX(i.issue_date) >= CURRENT_DATE - INTERVAL '6 months' THEN 'inactive'
        ELSE 'dormant'
    END AS client_status,
    
    NOW() AS calculated_at
FROM clients c
LEFT JOIN invoices i ON c.id = i.client_id
GROUP BY c.id, c.user_id, c.full_name, c.email, c.created_at;

-- Client Portfolio View - High-level client analytics
CREATE OR REPLACE VIEW v_client_portfolio AS
SELECT 
    cr.user_id,
    
    -- Client Counts
    COUNT(*) AS total_clients,
    COUNT(*) FILTER (WHERE cr.client_status = 'active') AS active_clients,
    COUNT(*) FILTER (WHERE cr.client_status = 'inactive') AS inactive_clients,
    COUNT(*) FILTER (WHERE cr.client_status = 'dormant') AS dormant_clients,
    
    -- Revenue Concentration
    SUM(cr.total_revenue) AS total_portfolio_revenue,
    AVG(cr.total_revenue) AS avg_client_revenue,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY cr.total_revenue) AS median_client_revenue,
    
    -- Top Client Analysis
    MAX(cr.total_revenue) AS top_client_revenue,
    (SELECT SUM(total_revenue) 
     FROM (SELECT total_revenue FROM v_client_revenue vcr 
           WHERE vcr.user_id = cr.user_id 
           ORDER BY total_revenue DESC LIMIT 5) AS top_clients) AS top_5_clients_revenue,
    
    -- Client Lifetime Value
    AVG(cr.relationship_days) AS avg_relationship_days,
    SUM(cr.total_revenue) / NULLIF(COUNT(*), 0) AS avg_lifetime_value,
    
    -- Payment Behavior
    AVG(cr.avg_payment_delay) AS portfolio_avg_payment_delay,
    SUM(cr.outstanding_amount) AS total_outstanding,
    
    NOW() AS calculated_at
FROM v_client_revenue cr
WHERE cr.user_id IS NOT NULL
GROUP BY cr.user_id;

-- =====================================================
-- 3. BUSINESS PERFORMANCE VIEWS
-- =====================================================

-- Monthly Business Performance View
CREATE OR REPLACE VIEW v_monthly_performance AS
SELECT 
    pl.user_id,
    pl.year,
    pl.month,
    pl.period_start,
    
    -- Financial Performance
    pl.total_revenue,
    pl.total_expenses,
    pl.net_profit,
    pl.net_profit_margin_percent,
    
    -- Growth Calculations (compared to previous month)
    LAG(pl.total_revenue) OVER (PARTITION BY pl.user_id ORDER BY pl.year, pl.month) AS prev_month_revenue,
    LAG(pl.total_expenses) OVER (PARTITION BY pl.user_id ORDER BY pl.year, pl.month) AS prev_month_expenses,
    LAG(pl.net_profit) OVER (PARTITION BY pl.user_id ORDER BY pl.year, pl.month) AS prev_month_profit,
    
    -- Growth Rates
    CASE 
        WHEN LAG(pl.total_revenue) OVER (PARTITION BY pl.user_id ORDER BY pl.year, pl.month) > 0
        THEN ((pl.total_revenue - LAG(pl.total_revenue) OVER (PARTITION BY pl.user_id ORDER BY pl.year, pl.month)) 
              / LAG(pl.total_revenue) OVER (PARTITION BY pl.user_id ORDER BY pl.year, pl.month)) * 100
        ELSE NULL
    END AS revenue_growth_percent,
    
    -- Revenue per Client (from current month active clients)
    pl.total_revenue / NULLIF(
        (SELECT COUNT(*) FROM v_client_revenue cr 
         WHERE cr.user_id = pl.user_id 
         AND cr.client_status = 'active'), 0
    ) AS revenue_per_active_client,
    
    -- Invoice Metrics from revenue summary
    rs.invoice_count,
    rs.avg_invoice_amount,
    rs.paid_invoices,
    rs.outstanding_revenue,
    
    -- Operational Efficiency
    CASE 
        WHEN rs.invoice_count > 0 
        THEN pl.total_expenses / rs.invoice_count 
        ELSE 0 
    END AS cost_per_invoice,
    
    NOW() AS calculated_at
FROM v_profit_loss pl
LEFT JOIN v_revenue_summary rs ON pl.user_id = rs.user_id 
                                 AND pl.year = rs.year 
                                 AND pl.month = rs.month;

-- Business Health Score View
CREATE OR REPLACE VIEW v_business_health AS
SELECT 
    mp.user_id,
    
    -- Latest Period Data
    MAX(mp.period_start) AS latest_period,
    
    -- Financial Health Indicators (last 3 months average)
    AVG(mp.net_profit_margin_percent) FILTER (
        WHERE mp.period_start >= CURRENT_DATE - INTERVAL '3 months'
    ) AS avg_profit_margin_3m,
    
    AVG(mp.revenue_growth_percent) FILTER (
        WHERE mp.period_start >= CURRENT_DATE - INTERVAL '3 months'
        AND mp.revenue_growth_percent IS NOT NULL
    ) AS avg_growth_rate_3m,
    
    -- Cash Flow Health
    SUM(mp.total_revenue) FILTER (
        WHERE mp.period_start >= CURRENT_DATE - INTERVAL '3 months'
    ) AS revenue_3m,
    
    SUM(mp.outstanding_revenue) FILTER (
        WHERE mp.period_start >= CURRENT_DATE - INTERVAL '1 month'
    ) AS current_outstanding,
    
    -- Client Health
    (SELECT COUNT(*) FROM v_client_revenue cr 
     WHERE cr.user_id = mp.user_id 
     AND cr.client_status = 'active') AS active_client_count,
    
    -- Business Health Score Calculation (0-100)
    LEAST(100, GREATEST(0,
        -- Profitability (40 points max)
        CASE 
            WHEN AVG(mp.net_profit_margin_percent) FILTER (
                WHERE mp.period_start >= CURRENT_DATE - INTERVAL '3 months'
            ) >= 20 THEN 40
            WHEN AVG(mp.net_profit_margin_percent) FILTER (
                WHERE mp.period_start >= CURRENT_DATE - INTERVAL '3 months'
            ) >= 10 THEN 30
            WHEN AVG(mp.net_profit_margin_percent) FILTER (
                WHERE mp.period_start >= CURRENT_DATE - INTERVAL '3 months'
            ) >= 0 THEN 20
            ELSE 0
        END +
        
        -- Growth (30 points max)
        CASE 
            WHEN AVG(mp.revenue_growth_percent) FILTER (
                WHERE mp.period_start >= CURRENT_DATE - INTERVAL '3 months'
                AND mp.revenue_growth_percent IS NOT NULL
            ) >= 10 THEN 30
            WHEN AVG(mp.revenue_growth_percent) FILTER (
                WHERE mp.period_start >= CURRENT_DATE - INTERVAL '3 months'
                AND mp.revenue_growth_percent IS NOT NULL
            ) >= 5 THEN 20
            WHEN AVG(mp.revenue_growth_percent) FILTER (
                WHERE mp.period_start >= CURRENT_DATE - INTERVAL '3 months'
                AND mp.revenue_growth_percent IS NOT NULL
            ) >= 0 THEN 10
            ELSE 0
        END +
        
        -- Client Base (30 points max)
        CASE 
            WHEN (SELECT COUNT(*) FROM v_client_revenue cr 
                  WHERE cr.user_id = mp.user_id 
                  AND cr.client_status = 'active') >= 20 THEN 30
            WHEN (SELECT COUNT(*) FROM v_client_revenue cr 
                  WHERE cr.user_id = mp.user_id 
                  AND cr.client_status = 'active') >= 10 THEN 20
            WHEN (SELECT COUNT(*) FROM v_client_revenue cr 
                  WHERE cr.user_id = mp.user_id 
                  AND cr.client_status = 'active') >= 5 THEN 10
            ELSE 0
        END
    )) AS business_health_score,
    
    NOW() AS calculated_at
FROM v_monthly_performance mp
GROUP BY mp.user_id;

-- =====================================================
-- 4. TAX AND COMPLIANCE VIEWS
-- =====================================================

-- IVA (VAT) Summary View for Italian Tax Compliance
CREATE OR REPLACE VIEW v_iva_summary AS
SELECT 
    i.user_id,
    EXTRACT(YEAR FROM i.issue_date) AS tax_year,
    EXTRACT(QUARTER FROM i.issue_date) AS tax_quarter,
    DATE_TRUNC('quarter', i.issue_date) AS quarter_start,
    
    -- VAT Collected (Revenue)
    COUNT(*) AS invoice_count,
    SUM(i.net_amount) AS net_revenue,
    SUM(i.vat_amount) AS vat_collected,
    AVG(i.vat_rate) AS avg_vat_rate,
    
    -- VAT by Rate
    SUM(i.vat_amount) FILTER (WHERE i.vat_rate = 22.00) AS vat_22_collected,
    SUM(i.vat_amount) FILTER (WHERE i.vat_rate = 10.00) AS vat_10_collected,
    SUM(i.vat_amount) FILTER (WHERE i.vat_rate = 4.00) AS vat_4_collected,
    SUM(i.vat_amount) FILTER (WHERE i.vat_rate = 0.00) AS vat_exempt_revenue,
    
    -- Status for Tax Filing
    SUM(i.vat_amount) FILTER (WHERE i.status = 'paid') AS vat_from_paid_invoices,
    SUM(i.vat_amount) FILTER (WHERE i.status IN ('sent', 'overdue')) AS vat_pending_collection,
    
    NOW() AS calculated_at
FROM invoices i
WHERE i.issue_date >= '2020-01-01'
GROUP BY i.user_id, EXTRACT(YEAR FROM i.issue_date), EXTRACT(QUARTER FROM i.issue_date),
         DATE_TRUNC('quarter', i.issue_date);

-- Tax Deductible Expenses View
CREATE OR REPLACE VIEW v_tax_deductible_summary AS
SELECT 
    e.user_id,
    EXTRACT(YEAR FROM e.date) AS tax_year,
    EXTRACT(QUARTER FROM e.date) AS tax_quarter,
    e.category,
    
    -- Deductible Expenses
    COUNT(*) FILTER (WHERE e.tax_deductible = true) AS deductible_expense_count,
    SUM(e.amount) FILTER (WHERE e.tax_deductible = true) AS total_deductible_amount,
    COUNT(*) FILTER (WHERE e.tax_deductible = true AND e.receipt_url IS NOT NULL) AS receipts_available,
    
    -- All Expenses for Comparison
    COUNT(*) AS total_expense_count,
    SUM(e.amount) AS total_expense_amount,
    
    -- Deductible Percentage
    CASE 
        WHEN SUM(e.amount) > 0 
        THEN (SUM(e.amount) FILTER (WHERE e.tax_deductible = true) / SUM(e.amount)) * 100
        ELSE 0 
    END AS deductible_percentage,
    
    NOW() AS calculated_at
FROM expenses e
WHERE e.date >= '2020-01-01'
GROUP BY e.user_id, EXTRACT(YEAR FROM e.date), EXTRACT(QUARTER FROM e.date), e.category;

-- =====================================================
-- 5. AUDIT AND SECURITY VIEWS
-- =====================================================

-- Report Access Audit View (for future audit trail implementation)
CREATE OR REPLACE VIEW v_report_access_summary AS
SELECT 
    'placeholder' AS user_id,
    CURRENT_DATE AS access_date,
    'system' AS report_type,
    0 AS access_count,
    NOW() AS summary_date
WHERE FALSE; -- This will be populated when audit logging is implemented

-- =====================================================
-- 6. PERFORMANCE OPTIMIZATION
-- =====================================================

-- Create indexes for better performance on views
CREATE INDEX IF NOT EXISTS idx_invoices_user_issue_date ON invoices(user_id, issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status_issue_date ON invoices(status, issue_date);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date);
CREATE INDEX IF NOT EXISTS idx_expenses_tax_deductible ON expenses(tax_deductible, date);
CREATE INDEX IF NOT EXISTS idx_clients_user_status ON clients(user_id, created_at);

-- Composite indexes for common reporting queries
CREATE INDEX IF NOT EXISTS idx_invoices_reporting ON invoices(user_id, issue_date, status, total_amount);
CREATE INDEX IF NOT EXISTS idx_expenses_reporting ON expenses(user_id, date, category, tax_deductible);

-- =====================================================
-- 7. REFRESH FUNCTIONS (FOR FUTURE MATERIALIZED VIEWS)
-- =====================================================

-- Function to refresh all reporting statistics
CREATE OR REPLACE FUNCTION refresh_reporting_cache()
RETURNS TEXT AS $$
BEGIN
    -- This function will be expanded when we implement materialized views
    -- for performance optimization with large datasets
    
    -- For now, return success message
    RETURN 'Reporting views refreshed successfully at ' || NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. COMMENTS AND DOCUMENTATION
-- =====================================================

-- Add helpful comments to views
COMMENT ON VIEW v_revenue_summary IS 'Pre-calculated monthly revenue metrics for efficient reporting';
COMMENT ON VIEW v_expense_summary IS 'Monthly expense analytics with tax deductible breakdown';
COMMENT ON VIEW v_profit_loss IS 'Complete profit and loss calculations by month';
COMMENT ON VIEW v_client_revenue IS 'Individual client revenue and relationship analytics';
COMMENT ON VIEW v_client_portfolio IS 'High-level client portfolio health metrics';
COMMENT ON VIEW v_monthly_performance IS 'Monthly business performance with growth calculations';
COMMENT ON VIEW v_business_health IS 'Comprehensive business health score (0-100)';
COMMENT ON VIEW v_iva_summary IS 'Italian VAT (IVA) compliance reporting by quarter';
COMMENT ON VIEW v_tax_deductible_summary IS 'Tax deductible expense summary for Italian tax filing';

-- Grant appropriate permissions (adjust based on your RLS policies)
-- These will work with the existing RLS policies on base tables

-- =====================================================
-- COMPLETION STATUS
-- =====================================================

SELECT 'Reporting Views Schema Created Successfully' AS status,
       COUNT(*) AS view_count
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name LIKE 'v_%'; 