# Clients Feature

## Overview

The Clients feature provides comprehensive Customer Relationship Management (CRM) functionality for Nexa Manager. It handles client data management, contact information, business relationships, communication history, and integration with other business features like invoicing and email campaigns.

## Architecture

This feature follows a layered architecture:
- **Components**: React components for client management UI
- **Hooks**: Custom hooks for client data management and business logic
- **Services**: Business logic for client operations and external integrations
- **Utils**: Utility functions for client-related operations

## Public API

### Components

#### `ClientCard`
Displays client information in a card format.

```tsx
import { ClientCard } from '@/features/clients';

<ClientCard 
  client={clientData}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

#### `ClientTable`
Displays clients in a table format with sorting and filtering.

```tsx
import { ClientTable } from '@/features/clients';

<ClientTable 
  clients={clientsData}
  onClientSelect={handleSelect}
  sortBy="name"
  filterBy={filterCriteria}
/>
```

#### `ClientModal`
Modal for creating and editing client information.

```tsx
import { ClientModal } from '@/features/clients';

<ClientModal 
  isOpen={isModalOpen}
  client={selectedClient}
  onSave={handleSave}
  onClose={handleClose}
/>
```

#### `ClientFilters`
Filter controls for client list views.

```tsx
import { ClientFilters } from '@/features/clients';

<ClientFilters 
  onFilterChange={handleFilterChange}
  activeFilters={currentFilters}
/>
```

#### `ClientSearchFilter`
Search and filter component for client discovery.

```tsx
import { ClientSearchFilter } from '@/features/clients';

<ClientSearchFilter 
  onSearch={handleSearch}
  onFilterApply={handleFilter}
  placeholder="Search clients..."
/>
```

### Hooks

#### `useClients`
Main hook for client data management.

```tsx
import { useClients } from '@/features/clients';

const {
  clients,
  loading,
  error,
  createClient,
  updateClient,
  deleteClient,
  refreshClients
} = useClients();
```

#### `useClientSearch`
Hook for client search functionality.

```tsx
import { useClientSearch } from '@/features/clients';

const {
  searchResults,
  searchTerm,
  setSearchTerm,
  isSearching,
  clearSearch
} = useClientSearch();
```

#### `useClientFilters`
Hook for managing client filters and sorting.

```tsx
import { useClientFilters } from '@/features/clients';

const {
  filters,
  sortBy,
  sortOrder,
  applyFilter,
  clearFilters,
  setSorting
} = useClientFilters();
```

#### `useClientModals`
Hook for managing client-related modal states.

```tsx
import { useClientModals } from '@/features/clients';

const {
  isCreateModalOpen,
  isEditModalOpen,
  isDeleteModalOpen,
  selectedClient,
  openCreateModal,
  openEditModal,
  openDeleteModal,
  closeModals
} = useClientModals();
```

### Services

#### `clientService`
Core client management service.

```tsx
import { clientService } from '@/features/clients';

// CRUD operations
const client = await clientService.getById(clientId);
const clients = await clientService.getAll();
const newClient = await clientService.create(clientData);
const updated = await clientService.update(clientId, updates);
await clientService.delete(clientId);

// Business operations
const clientHistory = await clientService.getClientHistory(clientId);
const clientStats = await clientService.getClientStatistics(clientId);
```

#### `clientEmailService`
Email integration service for client communications.

```tsx
import { clientEmailService } from '@/features/clients';

// Send emails to clients
await clientEmailService.sendWelcomeEmail(clientId);
await clientEmailService.sendInvoiceEmail(clientId, invoiceId);
await clientEmailService.sendCustomEmail(clientId, emailData);

// Email history
const emailHistory = await clientEmailService.getEmailHistory(clientId);
```

#### `businessService`
Business relationship and contact management.

```tsx
import { businessService } from '@/features/clients';

// Business relationships
const businesses = await businessService.getClientBusinesses(clientId);
await businessService.linkBusiness(clientId, businessData);
await businessService.updateBusinessInfo(businessId, updates);
```

## Dependencies

### Internal Dependencies
- `@/features/auth` - Authentication and authorization
- `@/features/email` - Email functionality
- `@/shared/components` - Shared UI components
- `@/shared/hooks` - Shared custom hooks
- `@/shared/types` - Shared type definitions
- `@/shared/utils` - Shared utility functions

### External Dependencies
- `@tanstack/react-query` - Data fetching and caching
- `react-hook-form` - Form management
- `@supabase/supabase-js` - Database operations
- `date-fns` - Date manipulation

## Integration Patterns

### Cross-Feature Communication

#### With Financial Feature
```tsx
// Creating invoice for client
import { useClients } from '@/features/clients';
import { invoiceService } from '@/features/financial';

const { clients } = useClients();
const selectedClient = clients.find(c => c.id === clientId);

await invoiceService.createInvoice({
  clientId: selectedClient.id,
  clientName: selectedClient.name,
  clientEmail: selectedClient.email,
  // ... other invoice data
});
```

#### With Email Feature
```tsx
// Sending email campaign to clients
import { useClients } from '@/features/clients';
import { emailService } from '@/features/email';

const { clients } = useClients();
const activeClients = clients.filter(c => c.status === 'active');

await emailService.sendBulkEmail({
  recipients: activeClients.map(c => c.email),
  template: 'newsletter',
  data: campaignData
});
```

#### With Calendar Feature
```tsx
// Scheduling appointment with client
import { clientService } from '@/features/clients';
import { calendarService } from '@/features/calendar';

const client = await clientService.getById(clientId);

await calendarService.createEvent({
  title: `Meeting with ${client.name}`,
  attendees: [client.email],
  // ... other event data
});
```

## Data Models

### Client Type
```typescript
interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: Address;
  status: 'active' | 'inactive' | 'prospect';
  tags: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  lastContactDate?: Date;
  totalInvoiced: number;
  outstandingBalance: number;
}

interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}
```

### Business Relationship Type
```typescript
interface BusinessRelationship {
  id: string;
  clientId: string;
  businessName: string;
  contactPerson: string;
  relationship: 'primary' | 'secondary' | 'billing';
  isActive: boolean;
}
```

## Testing Approach

### Unit Tests
```tsx
// Test client service operations
describe('clientService', () => {
  test('should create client successfully', async () => {
    const clientData = { name: 'Test Client', email: 'test@example.com' };
    const result = await clientService.create(clientData);
    expect(result).toHaveProperty('id');
    expect(result.name).toBe(clientData.name);
  });
});

// Test client hooks
describe('useClients', () => {
  test('should load clients on mount', async () => {
    const { result } = renderHook(() => useClients());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.clients).toHaveLength(0);
    });
  });
});
```

### Integration Tests
```tsx
// Test client creation flow
test('should create client through UI', async () => {
  render(<ClientManagement />);
  
  fireEvent.click(screen.getByText('Add Client'));
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'New Client' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.com' } });
  fireEvent.click(screen.getByText('Save'));
  
  await waitFor(() => {
    expect(screen.getByText('New Client')).toBeInTheDocument();
  });
});
```

### Test Utilities
```tsx
// Mock client data
export const mockClient = {
  id: '1',
  name: 'Test Client',
  email: 'test@example.com',
  status: 'active',
  tags: ['vip'],
  createdAt: new Date(),
  updatedAt: new Date(),
  totalInvoiced: 5000,
  outstandingBalance: 1000
};

// Test helper for rendering with client context
export const renderWithClientContext = (component, initialClients = []) => {
  // Render with mocked client data
};
```

## Performance Considerations

### Data Loading
- Use React Query for efficient data caching
- Implement pagination for large client lists
- Use virtual scrolling for performance with many clients

### Search Optimization
- Debounce search input to reduce API calls
- Implement client-side filtering for small datasets
- Use server-side search for large datasets

### Memory Management
- Clean up subscriptions in useEffect cleanup
- Optimize re-renders with React.memo and useMemo
- Use lazy loading for client details

## Configuration

### Database Schema
```sql
-- Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  phone VARCHAR,
  company VARCHAR,
  address JSONB,
  status VARCHAR DEFAULT 'active',
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_contact_date TIMESTAMP,
  total_invoiced DECIMAL DEFAULT 0,
  outstanding_balance DECIMAL DEFAULT 0
);
```

### Environment Variables
```env
# Client-specific configurations
VITE_CLIENT_PAGINATION_SIZE=50
VITE_CLIENT_SEARCH_DEBOUNCE=300
VITE_CLIENT_EXPORT_LIMIT=1000
```

## Troubleshooting

### Common Issues

1. **Client data not loading**
   - Check authentication status
   - Verify database connection
   - Check RLS policies

2. **Search not working**
   - Verify search index exists
   - Check search term formatting
   - Validate API endpoint

3. **Email integration failing**
   - Check email service configuration
   - Verify client email addresses
   - Check email template existence

### Debug Tools
```tsx
// Enable client service debugging
import { clientService } from '@/features/clients';

clientService.enableDebugMode();
```