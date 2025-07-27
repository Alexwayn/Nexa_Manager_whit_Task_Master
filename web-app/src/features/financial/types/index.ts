// Financial Management Types

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  client?: {
    id: string;
    name: string;
    email: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  issueDate: string;
  paidDate?: string;
  notes?: string;
  terms?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Quote {
  id: string;
  number: string;
  clientId: string;
  client?: {
    id: string;
    name: string;
    email: string;
  };
  items: QuoteItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  validUntil: string;
  issueDate: string;
  acceptedDate?: string;
  notes?: string;
  terms?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  receipt?: string;
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  outstandingInvoices: number;
  overdueInvoices: number;
  pendingQuotes: number;
  period: {
    start: string;
    end: string;
  };
}

export interface TaxSettings {
  defaultRate: number;
  regions: {
    name: string;
    rate: number;
  }[];
  inclusive: boolean;
}