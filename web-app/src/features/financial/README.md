# Financial Feature

## Overview

The Financial feature provides comprehensive financial management functionality for Nexa Manager, including invoice generation, quote management, expense tracking, payment processing, tax calculations, and financial reporting. It serves as the core business logic for all monetary transactions and financial analytics.

## Architecture

This feature follows a layered architecture:
- **Components**: React components for financial management UI
- **Hooks**: Custom hooks for financial data management and analytics
- **Services**: Business logic for financial operations and calculations
- **Utils**: Utility functions for financial calculations and formatting

## Public API

### Components

#### `InvoiceFormNew`
Form component for creating and editing invoices.

```tsx
import { InvoiceFormNew } from '@/features/financial';

<InvoiceFormNew 
  invoice={invoiceData}
  onSave={handleSave}
  onCancel={handleCancel}
  clientId={selectedClientId}
/>
```

#### `InvoiceModal`
Modal for invoice creation and editing.

```tsx
import { InvoiceModal } from '@/features/financial';

<InvoiceModal 
  isOpen={isModalOpen}
  invoice={selectedInvoice}
  onSave={handleSave}
  onClose={handleClose}
/>
```

#### `QuoteForm`
Form component for creating and editing quotes.

```tsx
import { QuoteForm } from '@/features/financial';

<QuoteForm 
  quote={quoteData}
  onSave={handleSave}
  onCancel={handleCancel}
  clientId={selectedClientId}
/>
```

#### `QuoteModal`
Modal for quote management.

```tsx
import { QuoteModal } from '@/features/financial';

<QuoteModal 
  isOpen={isModalOpen}
  quote={selectedQuote}
  onSave={handleSave}
  onClose={handleClose}
/>
```

#### `PaymentDashboard`
Dashboard for payment tracking and management.

```tsx
import { PaymentDashboard } from '@/features/financial';

<PaymentDashboard 
  dateRange={dateRange}
  onPaymentSelect={handlePaymentSelect}
/>
```

#### `TaxCalculator`
Component for tax calculations and display.

```tsx
import { TaxCalculator } from '@/features/financial';

<TaxCalculator 
  amount={invoiceAmount}
  taxRate={taxRate}
  onCalculationChange={handleTaxChange}
/>
```

#### `FinancialForecast`
Component for displaying financial forecasts and projections.

```tsx
import { FinancialForecast } from '@/features/financial';

<FinancialForecast 
  period="quarterly"
  data={forecastData}
  onPeriodChange={handlePeriodChange}
/>
```

### Hooks

#### `useReports`
Hook for financial reporting functionality.

```tsx
import { useReports } from '@/features/financial';

const {
  reports,
  loading,
  generateReport,
  exportReport,
  deleteReport
} = useReports();
```

#### `useChartData`
Hook for financial chart data management.

```tsx
import { useChartData } from '@/features/financial';

const {
  chartData,
  loading,
  refreshData,
  setDateRange,
  setChartType
} = useChartData();
```

#### `useReportData`
Hook for report data management and generation.

```tsx
import { useReportData } from '@/features/financial';

const {
  reportData,
  isGenerating,
  generateReport,
  exportToPDF,
  exportToExcel
} = useReportData();
```

### Services

#### `invoiceService`
Core invoice management service.

```tsx
import { invoiceService } from '@/features/financial';

// CRUD operations
const invoice = await invoiceService.getById(invoiceId);
const invoices = await invoiceService.getAll();
const newInvoice = await invoiceService.create(invoiceData);
const updated = await invoiceService.update(invoiceId, updates);
await invoiceService.delete(invoiceId);

// Business operations
const pdfBuffer = await invoiceService.generatePDF(invoiceId);
await invoiceService.sendInvoice(invoiceId, emailOptions);
await invoiceService.markAsPaid(invoiceId, paymentData);
```

#### `quoteService`
Quote management service.

```tsx
import { quoteService } from '@/features/financial';

// Quote operations
const quote = await quoteService.getById(quoteId);
const newQuote = await quoteService.create(quoteData);
await quoteService.convertToInvoice(quoteId);
await quoteService.sendQuote(quoteId, emailOptions);

// Quote lifecycle
await quoteService.approve(quoteId);
await quoteService.reject(quoteId, reason);
await quoteService.expire(quoteId);
```

#### `expenseService`
Expense tracking and management service.

```tsx
import { expenseService } from '@/features/financial';

// Expense operations
const expenses = await expenseService.getAll();
const newExpense = await expenseService.create(expenseData);
await expenseService.categorize(expenseId, category);
await expenseService.attachReceipt(expenseId, receiptFile);

// Expense reporting
const expenseReport = await expenseService.generateReport(dateRange);
```

#### `financialService`
Core financial analytics and reporting service.

```tsx
import { financialService } from '@/features/financial';

// Financial analytics
const metrics = await financialService.getFinancialMetrics(dateRange);
const cashFlow = await financialService.getCashFlowData(period);
const profitLoss = await financialService.getProfitLossStatement(period);

// Forecasting
const forecast = await financialService.generateForecast(parameters);
```

#### `taxCalculationService`
Tax calculation and compliance service.

```tsx
import { taxCalculationService } from '@/features/financial';

// Tax calculations
const taxAmount = await taxCalculationService.calculateTax(amount, taxRate);
const taxBreakdown = await taxCalculationService.getTaxBreakdown(invoiceId);

// Tax reporting
const taxReport = await taxCalculationService.generateTaxReport(period);
```

## Dependencies

### Internal Dependencies
- `@/features/clients` - Client data for invoices and quotes
- `@/features/email` - Email functionality for sending invoices/quotes
- `@/features/auth` - Authentication and authorization
- `@/shared/components` - Shared UI components
- `@/shared/hooks` - Shared custom hooks
- `@/shared/types` - Shared type definitions
- `@/shared/utils` - Shared utility functions

### External Dependencies
- `@tanstack/react-query` - Data fetching and caching
- `react-hook-form` - Form management
- `@supabase/supabase-js` - Database operations
- `jspdf` - PDF generation
- `chart.js` - Chart rendering
- `date-fns` - Date manipulation

## Integration Patterns

### Cross-Feature Communication

#### With Clients Feature
```tsx
// Creating invoice for specific client
import { useClients } from '@/features/clients';
import { invoiceService } from '@/features/financial';

const { clients } = useClients();
const client = clients.find(c => c.id === clientId);

const invoiceData = {
  clientId: client.id,
  clientName: client.name,
  clientEmail: client.email,
  billingAddress: client.address,
  // ... other invoice data
};

await invoiceService.create(invoiceData);
```

#### With Email Feature
```tsx
// Sending invoice via email
import { invoiceService } from '@/features/financial';
import { emailService } from '@/features/email';

const invoice = await invoiceService.getById(invoiceId);
const pdfBuffer = await invoiceService.generatePDF(invoiceId);

await emailService.sendEmail({
  to: invoice.clientEmail,
  subject: `Invoice ${invoice.number}`,
  template: 'invoice',
  attachments: [{
    filename: `invoice-${invoice.number}.pdf`,
    content: pdfBuffer
  }]
});
```

#### With Documents Feature
```tsx
// Storing invoice documents
import { invoiceService } from '@/features/financial';
import { documentService } from '@/features/documents';

const pdfBuffer = await invoiceService.generatePDF(invoiceId);

await documentService.store({
  type: 'invoice',
  referenceId: invoiceId,
  filename: `invoice-${invoiceId}.pdf`,
  content: pdfBuffer
});
```

## Data Models

### Invoice Type
```typescript
interface Invoice {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issueDate: Date;
  dueDate: Date;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  notes?: string;
  terms?: string;
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
  paymentMethod?: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxRate?: number;
}
```

### Quote Type
```typescript
interface Quote {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';
  validUntil: Date;
  items: QuoteItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  notes?: string;
  terms?: string;
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  convertedToInvoiceId?: string;
}
```

### Expense Type
```typescript
interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
  vendor?: string;
  receiptUrl?: string;
  isRecurring: boolean;
  recurringFrequency?: 'monthly' | 'quarterly' | 'yearly';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

## Testing Approach

### Unit Tests
```tsx
// Test financial calculations
describe('taxCalculationService', () => {
  test('should calculate tax correctly', () => {
    const amount = 1000;
    const taxRate = 0.1;
    const result = taxCalculationService.calculateTax(amount, taxRate);
    expect(result).toBe(100);
  });
});

// Test invoice service
describe('invoiceService', () => {
  test('should create invoice with correct totals', async () => {
    const invoiceData = {
      items: [
        { description: 'Service', quantity: 2, unitPrice: 100 }
      ],
      taxRate: 0.1
    };
    
    const result = await invoiceService.create(invoiceData);
    expect(result.subtotal).toBe(200);
    expect(result.taxAmount).toBe(20);
    expect(result.total).toBe(220);
  });
});
```

### Integration Tests
```tsx
// Test invoice creation flow
test('should create and send invoice', async () => {
  render(<InvoiceManagement />);
  
  fireEvent.click(screen.getByText('Create Invoice'));
  
  // Fill form
  fireEvent.change(screen.getByLabelText('Client'), { target: { value: 'client-1' } });
  fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Test Service' } });
  fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '100' } });
  
  fireEvent.click(screen.getByText('Save & Send'));
  
  await waitFor(() => {
    expect(screen.getByText('Invoice sent successfully')).toBeInTheDocument();
  });
});
```

### Test Utilities
```tsx
// Mock financial data
export const mockInvoice = {
  id: '1',
  number: 'INV-001',
  clientId: 'client-1',
  clientName: 'Test Client',
  status: 'sent',
  total: 220,
  items: [
    { description: 'Service', quantity: 2, unitPrice: 100, total: 200 }
  ]
};

// Test helper for financial calculations
export const calculateInvoiceTotal = (items, taxRate = 0) => {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * taxRate;
  return subtotal + taxAmount;
};
```

## Performance Considerations

### Data Loading
- Use React Query for efficient caching of financial data
- Implement pagination for large invoice/quote lists
- Use virtual scrolling for performance with many transactions

### PDF Generation
- Generate PDFs asynchronously to avoid blocking UI
- Cache generated PDFs for repeated access
- Use web workers for heavy PDF processing

### Chart Rendering
- Debounce chart data updates
- Use canvas-based charts for better performance
- Implement lazy loading for chart components

## Configuration

### Database Schema
```sql
-- Invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number VARCHAR UNIQUE NOT NULL,
  client_id UUID REFERENCES clients(id),
  status VARCHAR DEFAULT 'draft',
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal DECIMAL NOT NULL,
  tax_amount DECIMAL DEFAULT 0,
  total DECIMAL NOT NULL,
  items JSONB NOT NULL,
  notes TEXT,
  terms TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP,
  payment_method VARCHAR
);

-- Quotes table
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number VARCHAR UNIQUE NOT NULL,
  client_id UUID REFERENCES clients(id),
  status VARCHAR DEFAULT 'draft',
  valid_until DATE NOT NULL,
  subtotal DECIMAL NOT NULL,
  tax_amount DECIMAL DEFAULT 0,
  total DECIMAL NOT NULL,
  items JSONB NOT NULL,
  notes TEXT,
  terms TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  converted_to_invoice_id UUID REFERENCES invoices(id)
);
```

### Environment Variables
```env
# Financial configuration
VITE_DEFAULT_TAX_RATE=0.22
VITE_INVOICE_NUMBER_PREFIX=INV
VITE_QUOTE_NUMBER_PREFIX=QUO
VITE_CURRENCY=EUR
VITE_PAYMENT_TERMS_DAYS=30
```

## Troubleshooting

### Common Issues

1. **PDF generation failing**
   - Check jsPDF library version
   - Verify font loading
   - Check memory usage for large documents

2. **Tax calculations incorrect**
   - Verify tax rate configuration
   - Check rounding settings
   - Validate calculation formulas

3. **Invoice numbering conflicts**
   - Check database constraints
   - Verify number generation logic
   - Handle concurrent creation scenarios

### Debug Tools
```tsx
// Enable financial service debugging
import { financialService } from '@/features/financial';

financialService.enableDebugMode();

// Tax calculation debugging
import { taxCalculationService } from '@/features/financial';

const debugTaxCalculation = (amount, rate) => {
  console.log('Tax calculation:', { amount, rate });
  const result = taxCalculationService.calculateTax(amount, rate);
  console.log('Tax result:', result);
  return result;
};
```