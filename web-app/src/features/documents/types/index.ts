// Document Management Types

export interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'text' | 'spreadsheet' | 'other';
  size: number;
  url: string;
  thumbnailUrl?: string;
  category: string;
  tags: string[];
  description?: string;
  clientId?: string;
  invoiceId?: string;
  quoteId?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface DocumentCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
}

export interface DocumentUpload {
  file: File;
  category: string;
  tags: string[];
  description?: string;
  clientId?: string;
  invoiceId?: string;
  quoteId?: string;
}

export interface DocumentSearchFilters {
  query: string;
  category: string[];
  tags: string[];
  type: string[];
  dateRange: {
    start?: string;
    end?: string;
  };
  clientId?: string;
}
