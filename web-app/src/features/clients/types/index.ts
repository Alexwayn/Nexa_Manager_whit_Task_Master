// Client Management Types

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  company?: string;
  website?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'prospect';
  tags: string[];
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface ClientFilters {
  search: string;
  status: string[];
  tags: string[];
  sortBy: 'name' | 'email' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
}

export interface ClientFormData {
  name: string;
  email: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  company?: string;
  website?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'prospect';
  tags: string[];
}

export interface ClientStats {
  total: number;
  active: number;
  inactive: number;
  prospects: number;
  recentlyAdded: number;
}

export interface ClientHistory {
  id: string;
  clientId: string;
  type: 'invoice' | 'quote' | 'payment' | 'email' | 'note';
  title: string;
  description?: string;
  amount?: number;
  status?: string;
  createdAt: string;
}