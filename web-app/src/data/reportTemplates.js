// Core Report Templates for Nexa Manager
// Standard templates for common business reporting needs

export const CORE_REPORT_TEMPLATES = [
  // 1. FINANCIAL REPORTS
  {
    id: 'financial-monthly-summary',
    name: 'Monthly Financial Summary',
    description: 'Comprehensive monthly overview of revenue, expenses, and profit/loss',
    category: 'financial',
    type: 'summary',
    format: 'mixed',
    icon: 'ChartBarIcon',
    color: 'blue',
    tags: ['monthly', 'financial', 'summary'],
    
    dataSource: {
      primaryView: 'v_monthly_performance',
      supportingViews: ['v_revenue_summary', 'v_expense_summary', 'v_profit_loss']
    },
    
    defaultFilters: [
      {
        field: 'month',
        operator: 'equals',
        value: new Date().toISOString().slice(0, 7), // Current month
        type: 'date'
      }
    ],
    
    layout: {
      header: {
        title: 'Monthly Financial Summary',
        subtitle: 'Comprehensive financial overview',
        companyInfo: true,
        logo: true
      },
      sections: [
        {
          id: 'kpis',
          title: 'Key Performance Indicators',
          type: 'kpi',
          order: 1,
          config: {
            metrics: ['total_revenue', 'total_expenses', 'net_profit', 'profit_margin']
          }
        },
        {
          id: 'revenue-chart',
          title: 'Revenue Trend',
          type: 'chart',
          order: 2,
          config: {
            chartType: 'line',
            xField: 'month',
            yField: 'total_revenue',
            title: 'Monthly Revenue Trend'
          }
        },
        {
          id: 'expense-breakdown',
          title: 'Expense Categories',
          type: 'chart',
          order: 3,
          config: {
            chartType: 'doughnut',
            categoryField: 'category',
            valueField: 'amount',
            title: 'Expense Distribution'
          }
        },
        {
          id: 'profit-loss-table',
          title: 'Detailed Profit & Loss',
          type: 'table',
          order: 4,
          config: {
            columns: ['category', 'current_month', 'previous_month', 'variance', 'variance_percent']
          }
        }
      ],
      footer: {
        pageNumbers: true,
        timestamp: true,
        disclaimer: 'This report is generated automatically from Nexa Manager financial data.'
      }
    },
    
    permissions: {
      can_view: ['admin', 'financial_manager', 'owner'],
      can_edit: ['admin', 'owner'],
      can_delete: ['admin', 'owner']
    }
  },

  // 2. CLIENT REPORTS
  {
    id: 'client-portfolio-analysis',
    name: 'Client Portfolio Analysis',
    description: 'Detailed analysis of client relationships, revenue, and project history',
    category: 'client',
    type: 'detailed',
    format: 'mixed',
    icon: 'UsersIcon',
    color: 'green',
    tags: ['client', 'portfolio', 'analysis'],
    
    dataSource: {
      primaryView: 'v_client_portfolio',
      supportingViews: ['v_client_revenue']
    },
    
    defaultFilters: [
      {
        field: 'status',
        operator: 'equals',
        value: 'active',
        type: 'string'
      }
    ],
    
    layout: {
      header: {
        title: 'Client Portfolio Analysis',
        subtitle: 'Client relationship and revenue analysis',
        companyInfo: true
      },
      sections: [
        {
          id: 'client-overview',
          title: 'Portfolio Overview',
          type: 'kpi',
          order: 1,
          config: {
            metrics: ['total_clients', 'active_projects', 'total_revenue', 'avg_project_value']
          }
        },
        {
          id: 'top-clients',
          title: 'Top Revenue Clients',
          type: 'table',
          order: 2,
          config: {
            columns: ['client_name', 'total_revenue', 'project_count', 'last_invoice', 'status'],
            sortBy: 'total_revenue',
            sortDirection: 'desc',
            limit: 10
          }
        },
        {
          id: 'revenue-distribution',
          title: 'Revenue Distribution by Client',
          type: 'chart',
          order: 3,
          config: {
            chartType: 'bar',
            xField: 'client_name',
            yField: 'total_revenue',
            title: 'Client Revenue Contribution'
          }
        },
        {
          id: 'project-timeline',
          title: 'Project Activity Timeline',
          type: 'chart',
          order: 4,
          config: {
            chartType: 'line',
            xField: 'month',
            yField: 'project_count',
            seriesField: 'status',
            title: 'Projects by Status Over Time'
          }
        }
      ]
    }
  },

  // 3. TAX & COMPLIANCE REPORTS (Italian IVA)
  {
    id: 'iva-compliance-report',
    name: 'IVA Compliance Report',
    description: 'Italian VAT compliance report with deductible expenses and IVA summary',
    category: 'tax',
    type: 'detailed',
    format: 'table',
    icon: 'DocumentTextIcon',
    color: 'red',
    tags: ['iva', 'tax', 'compliance', 'italy'],
    
    dataSource: {
      primaryView: 'v_iva_summary',
      supportingViews: ['v_tax_deductible_summary']
    },
    
    defaultFilters: [
      {
        field: 'period',
        operator: 'equals',
        value: new Date().toISOString().slice(0, 7), // Current month
        type: 'date'
      }
    ],
    
    layout: {
      header: {
        title: 'Rapporto di Conformità IVA',
        subtitle: 'Analisi dettagliata IVA e spese detraibili',
        companyInfo: true
      },
      sections: [
        {
          id: 'iva-summary',
          title: 'Riepilogo IVA',
          type: 'kpi',
          order: 1,
          config: {
            metrics: ['iva_vendite', 'iva_acquisti', 'iva_dovuta', 'credito_iva']
          }
        },
        {
          id: 'deductible-expenses',
          title: 'Spese Detraibili',
          type: 'table',
          order: 2,
          config: {
            columns: ['date', 'description', 'category', 'amount', 'iva_rate', 'iva_amount', 'receipt_status'],
            filters: [{ field: 'tax_deductible', operator: 'equals', value: true }]
          }
        },
        {
          id: 'iva-by-rate',
          title: 'IVA per Aliquota',
          type: 'chart',
          order: 3,
          config: {
            chartType: 'pie',
            categoryField: 'iva_rate',
            valueField: 'total_amount',
            title: 'Distribuzione IVA per Aliquota'
          }
        },
        {
          id: 'monthly-trend',
          title: 'Trend IVA Mensile',
          type: 'chart',
          order: 4,
          config: {
            chartType: 'line',
            xField: 'month',
            yField: 'iva_dovuta',
            title: 'Andamento IVA Dovuta'
          }
        }
      ],
      footer: {
        disclaimer: 'Questo rapporto è conforme alle normative fiscali italiane vigenti.'
      }
    }
  },

  // 4. BUSINESS HEALTH DASHBOARD
  {
    id: 'business-health-dashboard',
    name: 'Business Health Dashboard',
    description: 'Comprehensive business health indicators and performance metrics',
    category: 'operational',
    type: 'dashboard',
    format: 'mixed',
    icon: 'HeartIcon',
    color: 'purple',
    tags: ['health', 'kpi', 'performance', 'dashboard'],
    
    dataSource: {
      primaryView: 'v_business_health',
      supportingViews: ['v_monthly_performance', 'v_client_portfolio']
    },
    
    layout: {
      header: {
        title: 'Business Health Dashboard',
        subtitle: 'Real-time business performance indicators',
        companyInfo: true
      },
      sections: [
        {
          id: 'health-score',
          title: 'Business Health Score',
          type: 'kpi',
          order: 1,
          config: {
            metrics: ['health_score', 'revenue_growth', 'profit_margin', 'client_satisfaction']
          }
        },
        {
          id: 'financial-health',
          title: 'Financial Health Indicators',
          type: 'chart',
          order: 2,
          config: {
            chartType: 'gauge',
            metrics: ['cash_flow_ratio', 'debt_to_equity', 'quick_ratio'],
            title: 'Financial Stability Metrics'
          }
        },
        {
          id: 'operational-metrics',
          title: 'Operational Performance',
          type: 'chart',
          order: 3,
          config: {
            chartType: 'radar',
            metrics: ['efficiency_score', 'project_completion_rate', 'client_retention', 'invoice_collection_rate'],
            title: 'Operational Excellence'
          }
        },
        {
          id: 'trend-analysis',
          title: 'Performance Trends',
          type: 'chart',
          order: 4,
          config: {
            chartType: 'line',
            xField: 'month',
            series: ['revenue', 'expenses', 'profit', 'health_score'],
            title: '12-Month Performance Trend'
          }
        }
      ]
    }
  },

  // 5. EXPENSE ANALYSIS REPORT
  {
    id: 'expense-analysis-detailed',
    name: 'Detailed Expense Analysis',
    description: 'In-depth analysis of business expenses with category breakdown and trends',
    category: 'financial',
    type: 'detailed',
    format: 'mixed',
    icon: 'CreditCardIcon',
    color: 'orange',
    tags: ['expenses', 'analysis', 'categories'],
    
    dataSource: {
      primaryView: 'v_expense_summary',
      supportingViews: ['v_tax_deductible_summary']
    },
    
    layout: {
      header: {
        title: 'Detailed Expense Analysis',
        subtitle: 'Comprehensive expense breakdown and analysis'
      },
      sections: [
        {
          id: 'expense-overview',
          title: 'Expense Overview',
          type: 'kpi',
          order: 1,
          config: {
            metrics: ['total_expenses', 'deductible_expenses', 'recurring_expenses', 'avg_monthly_expense']
          }
        },
        {
          id: 'category-breakdown',
          title: 'Expenses by Category',
          type: 'chart',
          order: 2,
          config: {
            chartType: 'doughnut',
            categoryField: 'category',
            valueField: 'total_amount',
            title: 'Expense Distribution by Category'
          }
        },
        {
          id: 'monthly-trend',
          title: 'Monthly Expense Trend',
          type: 'chart',
          order: 3,
          config: {
            chartType: 'line',
            xField: 'month',
            yField: 'total_amount',
            seriesField: 'category',
            title: 'Expense Trends by Category'
          }
        },
        {
          id: 'detailed-table',
          title: 'Detailed Expense List',
          type: 'table',
          order: 4,
          config: {
            columns: ['date', 'description', 'category', 'amount', 'tax_deductible', 'receipt_status', 'vendor']
          }
        }
      ]
    }
  }
];

// Helper function to get template by ID
export const getTemplateById = (id) => {
  return CORE_REPORT_TEMPLATES.find(template => template.id === id);
};

// Helper function to get templates by category
export const getTemplatesByCategory = (category) => {
  return CORE_REPORT_TEMPLATES.filter(template => template.category === category);
};

// Helper function to get all available categories
export const getAvailableCategories = () => {
  return [...new Set(CORE_REPORT_TEMPLATES.map(template => template.category))];
};

// Report field definitions for custom builder
export const AVAILABLE_FIELDS = {
  // Financial fields
  financial: [
    { id: 'revenue', name: 'Revenue', type: 'currency', table: 'invoices', aggregatable: true },
    { id: 'expenses', name: 'Expenses', type: 'currency', table: 'expenses', aggregatable: true },
    { id: 'profit', name: 'Profit', type: 'currency', calculated: true, aggregatable: true },
    { id: 'profit_margin', name: 'Profit Margin', type: 'percentage', calculated: true },
    { id: 'tax_amount', name: 'Tax Amount', type: 'currency', table: 'expenses', aggregatable: true },
    { id: 'payment_date', name: 'Payment Date', type: 'date', table: 'invoices' },
    { id: 'due_date', name: 'Due Date', type: 'date', table: 'invoices' }
  ],
  
  // Client fields
  client: [
    { id: 'client_name', name: 'Client Name', type: 'string', table: 'clients' },
    { id: 'client_email', name: 'Client Email', type: 'string', table: 'clients' },
    { id: 'client_phone', name: 'Client Phone', type: 'string', table: 'clients' },
    { id: 'client_status', name: 'Client Status', type: 'string', table: 'clients' },
    { id: 'total_billed', name: 'Total Billed', type: 'currency', calculated: true, aggregatable: true },
    { id: 'project_count', name: 'Project Count', type: 'number', calculated: true, aggregatable: true },
    { id: 'last_invoice_date', name: 'Last Invoice Date', type: 'date', calculated: true }
  ],
  
  // Project fields
  project: [
    { id: 'project_name', name: 'Project Name', type: 'string', table: 'projects' },
    { id: 'project_status', name: 'Project Status', type: 'string', table: 'projects' },
    { id: 'start_date', name: 'Start Date', type: 'date', table: 'projects' },
    { id: 'end_date', name: 'End Date', type: 'date', table: 'projects' },
    { id: 'project_value', name: 'Project Value', type: 'currency', table: 'projects', aggregatable: true },
    { id: 'completion_rate', name: 'Completion Rate', type: 'percentage', calculated: true }
  ],
  
  // Tax & Compliance fields
  tax: [
    { id: 'tax_deductible', name: 'Tax Deductible', type: 'boolean', table: 'expenses' },
    { id: 'iva_rate', name: 'IVA Rate', type: 'percentage', table: 'invoices' },
    { id: 'iva_amount', name: 'IVA Amount', type: 'currency', calculated: true, aggregatable: true },
    { id: 'receipt_url', name: 'Receipt Available', type: 'boolean', table: 'expenses' },
    { id: 'fiscal_year', name: 'Fiscal Year', type: 'string', calculated: true }
  ]
};

// Pre-built chart configurations
export const CHART_PRESETS = {
  revenue_trend: {
    type: 'line',
    title: 'Revenue Trend',
    xAxis: { field: 'date', label: 'Date', type: 'time' },
    yAxis: { field: 'revenue', label: 'Revenue', type: 'numeric', format: 'currency' }
  },
  
  expense_breakdown: {
    type: 'doughnut',
    title: 'Expense Breakdown',
    categoryField: 'category',
    valueField: 'amount'
  },
  
  client_revenue: {
    type: 'bar',
    title: 'Revenue by Client',
    xAxis: { field: 'client_name', label: 'Client', type: 'category' },
    yAxis: { field: 'total_revenue', label: 'Revenue', type: 'numeric', format: 'currency' }
  },
  
  monthly_performance: {
    type: 'line',
    title: 'Monthly Performance',
    xAxis: { field: 'month', label: 'Month', type: 'time' },
    yAxis: { field: 'value', label: 'Amount', type: 'numeric', format: 'currency' },
    series: [
      { field: 'revenue', label: 'Revenue', color: '#10B981' },
      { field: 'expenses', label: 'Expenses', color: '#EF4444' },
      { field: 'profit', label: 'Profit', color: '#3B82F6' }
    ]
  }
}; 