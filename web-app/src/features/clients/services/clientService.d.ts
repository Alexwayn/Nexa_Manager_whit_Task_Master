// Type declarations for clientService.js
export interface Client {
  id: string;
  user_id: string;
  full_name: string;
  name?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  vat_number?: string;
  fiscal_code?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientQueryOptions {
  searchQuery?: string;
  sortBy?: string;
  ascending?: boolean;
  limit?: number | null;
  offset?: number;
  filters?: Record<string, any>;
  userId?: string;
}

export interface ClientResult {
  data: Client[] | Client | null;
  count?: number;
  error: any;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
}

export interface ClientMetrics {
  total: number;
  active: number;
  newThisMonth: number;
}

export interface ClientMetricsResult {
  success: boolean;
  data: ClientMetrics;
  error?: any;
}

declare class ClientService {
  constructor();
  getCurrentUser(): { id: string; email: string } | null;
  executeWithUserContext(userId: string, queryFn: () => Promise<any>): Promise<any>;
  getClients(options?: ClientQueryOptions): Promise<ClientResult>;
  getClientById(clientId: string, userId?: string): Promise<ClientResult>;
  createClient(clientData: Partial<Client>, userId?: string): Promise<ClientResult>;
  updateClient(clientId: string, clientData: Partial<Client>, userId?: string): Promise<ClientResult>;
  deleteClient(clientId: string, userId?: string): Promise<ClientResult>;
  prepareClientDataForDB(clientData: any, userId: string, isUpdate?: boolean): any;
  getDisplayName(client: Client): string;
  exportToCSV(clients: Client[]): string;
  importFromCSV(csvContent: string, userId?: string): Promise<ImportResult>;
  getClientMetrics(startDate?: Date, endDate?: Date): Promise<ClientMetricsResult>;
}

declare const clientService: ClientService;
export default clientService;