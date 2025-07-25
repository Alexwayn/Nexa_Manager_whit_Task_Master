export interface Client {
  id: string;
  full_name: string;
  name?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
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

declare class ClientService {
  tableName: string;
  
  constructor();
  
  getCurrentUser(): { id: string; email?: string } | null;
  
  executeWithUserContext(userId: string, queryFn: () => Promise<any>): Promise<any>;
  
  getClients(options?: ClientQueryOptions): Promise<ClientResult>;
  
  getClientById(clientId: string, userId?: string): Promise<ClientResult>;
  
  createClient(clientData: Partial<Client>, userId?: string): Promise<ClientResult>;
  
  updateClient(clientId: string, clientData: Partial<Client>, userId?: string): Promise<ClientResult>;
  
  deleteClient(clientId: string, userId?: string): Promise<{ success: boolean; error: any }>;
  
  validateClientData(clientData: Partial<Client>): string | null;
  
  getDisplayName(client: Client): string;
  
  exportToCSV(clients: Client[]): string;
  
  importFromCSV(csvContent: string, userId?: string): Promise<ImportResult>;
  
  searchClients(searchParams: Record<string, any>, userId?: string): Promise<ClientResult>;
}

declare const clientService: ClientService;
export default clientService;