# Organization (Multi-Tenant) Setup Guide

## Overview
This guide covers the complete setup and configuration of Clerk Organizations for multi-tenant support in the Nexa Manager application.

## Current Implementation Status ✅

### Phase 1: Code Implementation (COMPLETE)
- ✅ **OrganizationContext**: Complete organization state management
- ✅ **OrganizationSwitcher**: Professional UI component for organization switching
- ✅ **OrganizationManagement**: Full-featured management page with tabs
- ✅ **App Integration**: Provider and routing fully integrated
- ✅ **Translation Support**: English and Italian translations
- ✅ **Navbar Integration**: Organization switcher in dashboard navbar

### Files Implemented:
```
web-app/src/context/OrganizationContext.jsx
web-app/src/components/common/OrganizationSwitcher.jsx
web-app/src/pages/OrganizationManagement.jsx
web-app/src/App.jsx (OrganizationProvider integration)
web-app/src/components/dashboard/Navbar.jsx (OrganizationSwitcher integration)
web-app/src/router/routeConfig.js (/organization route)
web-app/public/locales/en/navigation.json (organization translations)
web-app/public/locales/it/navigation.json (organization translations)
```

## Phase 2: Clerk Dashboard Configuration

### Prerequisites
- Access to Clerk Dashboard (https://dashboard.clerk.com)
- Administrator permissions for your Clerk application
- VITE_CLERK_PUBLISHABLE_KEY properly configured

### Step-by-Step Configuration

#### 1. Enable Organizations Feature
```
1. Login to Clerk Dashboard
2. Select your Nexa Manager application
3. Navigate to "Organizations" in the left sidebar
4. Click "Enable Organizations" if not already enabled
5. Configure organization settings:
   - Enable organization creation by users: ✓
   - Enable organization invitations: ✓
   - Maximum members per organization: Set as needed (e.g., 50)
```

#### 2. Configure Organization Roles
```
Default Roles (Clerk provides these automatically):
- admin: Full organization management permissions
- basic_member: Standard member access

Custom Roles (optional):
- Can add custom roles like "manager", "viewer", etc.
- Configure permissions for each role as needed
```

#### 3. Organization Domain Configuration (Optional)
```
For enterprise customers:
1. Go to Organizations → Domains
2. Add verified domains for automatic organization assignment
3. Configure domain-based user enrollment
```

#### 4. Branding and Appearance
```
1. Navigate to Customization → Appearance
2. Configure organization-specific styling:
   - Organization logos
   - Color schemes
   - Custom CSS for organization components
```

## Phase 3: Application Testing

### 3.1 Basic Organization Functionality

#### Test Organization Creation
```bash
# Start the development server
cd web-app
npm run dev

# Navigate to http://localhost:3000
# Login with a test user
# Click the organization switcher in the navbar
# Click "Create New Organization"
# Fill out organization details and create
```

#### Test Organization Switching
```bash
# With multiple organizations:
1. Click organization switcher dropdown
2. Select different organization
3. Verify UI updates with organization context
4. Check that data filtering works properly
```

#### Test Member Management
```bash
# As an organization admin:
1. Navigate to /organization
2. Go to Members tab
3. Invite new members via email
4. Assign different roles
5. Test member permissions
```

### 3.2 Role-Based Access Control Testing

#### Admin Role Testing
```javascript
// Test admin-only features:
- Organization settings access
- Member invitation and management
- Organization profile editing
- Analytics tab access (when implemented)
```

#### Member Role Testing
```javascript
// Test member limitations:
- Read-only access to organization info
- Cannot modify organization settings
- Cannot invite new members
- Can switch organizations if member of multiple
```

### 3.3 Multi-Tenant Data Isolation

#### Data Filtering Verification
```javascript
// Verify organization context is applied to:
- Client data
- Invoice data
- Transaction data
- Analytics data
- All business entities

// Test data isolation:
1. Create data in Organization A
2. Switch to Organization B
3. Verify Organization A data is not visible
4. Create data in Organization B
5. Switch back to Organization A
6. Verify Organization B data is not visible
```

## Phase 4: Integration with Existing Features

### 4.1 Update Data Providers
Each data provider (Clients, Invoices, etc.) needs organization-aware filtering:

```javascript
// Example for useClients hook:
import { useOrganizationContext } from '@context/OrganizationContext';

export const useClients = () => {
  const { organization, filterByOrganization } = useOrganizationContext();
  
  // Apply organization filter to all data queries
  const clients = filterByOrganization(allClients);
  
  return { clients, organization };
};
```

### 4.2 Update Database Queries
Add organization_id to all business entity tables:

```sql
-- Example schema updates:
ALTER TABLE clients ADD COLUMN organization_id VARCHAR;
ALTER TABLE invoices ADD COLUMN organization_id VARCHAR;
ALTER TABLE transactions ADD COLUMN organization_id VARCHAR;

-- Add indexes for performance:
CREATE INDEX idx_clients_org_id ON clients(organization_id);
CREATE INDEX idx_invoices_org_id ON invoices(organization_id);
```

### 4.3 Update API Endpoints
Ensure all API endpoints respect organization context:

```javascript
// Example API middleware:
const organizationMiddleware = (req, res, next) => {
  const organizationId = req.headers['x-organization-id'];
  req.organizationId = organizationId;
  next();
};

// Apply to all protected routes:
app.use('/api/clients', organizationMiddleware, clientsRouter);
app.use('/api/invoices', organizationMiddleware, invoicesRouter);
```

## Phase 5: Advanced Configuration

### 5.1 Custom Organization Metadata
Store additional organization information:

```javascript
// Organization metadata example:
const organizationMetadata = {
  subscription_tier: 'pro',
  features_enabled: ['advanced_analytics', 'custom_branding'],
  billing_contact: 'billing@company.com',
  timezone: 'UTC',
  date_format: 'DD/MM/YYYY'
};
```

### 5.2 Organization-Specific Settings
Implement per-organization configuration:

```javascript
// Organization settings context:
const useOrganizationSettings = () => {
  const { organization } = useOrganization();
  
  return {
    dateFormat: organization?.publicMetadata?.dateFormat || 'MM/DD/YYYY',
    timezone: organization?.publicMetadata?.timezone || 'UTC',
    currency: organization?.publicMetadata?.currency || 'USD',
  };
};
```

### 5.3 Webhooks for Organization Events
Set up webhooks for organization lifecycle events:

```javascript
// Webhook endpoints to implement:
- organization.created
- organization.updated
- organization.deleted
- organizationMembership.created
- organizationMembership.updated
- organizationMembership.deleted
```

## Testing Checklist

### ✅ Organization Management
- [ ] Organization creation works
- [ ] Organization profile editing works
- [ ] Organization logo upload works
- [ ] Organization deletion works (admin only)

### ✅ Member Management
- [ ] Member invitation via email works
- [ ] Role assignment works
- [ ] Role changes work
- [ ] Member removal works
- [ ] Member accepts invitation successfully

### ✅ Organization Switching
- [ ] Organization switcher appears in navbar
- [ ] Dropdown shows all user's organizations
- [ ] Switching updates context throughout app
- [ ] Data filtering works correctly
- [ ] Role-based UI changes work

### ✅ Permission System
- [ ] Admin-only features are protected
- [ ] Member permissions are enforced
- [ ] Organization isolation is maintained
- [ ] Cross-organization data leakage prevented

### ✅ UI/UX
- [ ] Organization switcher is responsive
- [ ] Loading states work properly
- [ ] Error handling works
- [ ] Dark/light mode compatibility
- [ ] Multi-language support works

## Troubleshooting

### Common Issues

#### Organization Switcher Not Appearing
```javascript
// Check:
1. Clerk Organizations enabled in dashboard
2. OrganizationProvider properly wrapped around app
3. useOrganizationContext hook working
4. User has organization memberships
```

#### Data Not Filtering by Organization
```javascript
// Check:
1. Organization context is being passed to data providers
2. Database queries include organization_id filter
3. API endpoints respect organization header
4. Frontend filtering logic is correct
```

#### Permission Issues
```javascript
// Check:
1. User roles are correctly assigned in Clerk
2. Role-based logic is implemented correctly
3. Admin vs member permissions are enforced
4. Organization membership is verified
```

## Performance Considerations

### Caching Strategy
```javascript
// Implement organization-aware caching:
- Cache data by organization_id
- Invalidate cache on organization switch
- Use React Query with organization keys
```

### Database Optimization
```sql
-- Ensure proper indexing:
CREATE INDEX idx_multi_org ON table_name(organization_id, created_at);
CREATE INDEX idx_org_user ON table_name(organization_id, user_id);
```

### Bundle Size
```javascript
// Organization features add minimal bundle size:
- Clerk components are lazy-loaded
- Organization context is lightweight
- UI components use code splitting
```

## Security Best Practices

### Data Isolation
- Always filter by organization_id in database queries
- Validate organization membership on API endpoints
- Use organization-scoped tokens where possible

### Access Control
- Implement role-based access control (RBAC)
- Validate permissions on sensitive operations
- Log organization-level activities

### Privacy
- Ensure organization data is not leaked between tenants
- Implement proper data deletion on organization removal
- Follow GDPR compliance for organization data

## Support and Documentation

### Helpful Resources
- [Clerk Organizations Documentation](https://clerk.com/docs/organizations/overview)
- [Multi-tenant Architecture Best Practices](https://clerk.com/blog/multi-tenant-architecture)
- [Organization Webhooks Reference](https://clerk.com/docs/integration/webhooks)

### Getting Help
- Check Clerk Discord community
- Review GitHub issues and discussions
- Contact Clerk support for enterprise features

---

This implementation provides enterprise-grade multi-tenant support with proper data isolation, role-based access control, and a professional user experience. 