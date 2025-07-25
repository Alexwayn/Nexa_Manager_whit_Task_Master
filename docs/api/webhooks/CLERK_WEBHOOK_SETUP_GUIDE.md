# Clerk Webhook Setup Guide

This guide walks you through setting up Clerk webhooks for real-time user and organization data synchronization with Supabase.

## Table of Contents

1. [Overview](#overview)
2. [Database Setup](#database-setup)
3. [Environment Configuration](#environment-configuration)
4. [Webhook Endpoint Deployment](#webhook-endpoint-deployment)
5. [Clerk Dashboard Configuration](#clerk-dashboard-configuration)
6. [Testing Webhooks](#testing-webhooks)
7. [Monitoring and Troubleshooting](#monitoring-and-troubleshooting)
8. [Security Considerations](#security-considerations)

## Overview

The Clerk webhook integration provides real-time synchronization of:

- **User Events**: user.created, user.updated, user.deleted
- **Organization Events**: organization.created, organization.updated, organization.deleted  
- **Membership Events**: organizationMembership.created, organizationMembership.updated, organizationMembership.deleted

### Architecture

```
Clerk → Webhook Endpoint → Supabase Database
                ↓
        Frontend Application
```

## Database Setup

### 1. Run Database Migrations

Execute the database schema in your Supabase SQL editor:

```sql
-- Run the contents of web-app/database/clerk_webhook_schema.sql
```

This creates:
- `users` table with Clerk user data
- `organizations` table with Clerk organization data
- `organization_memberships` table for user-organization relationships
- `webhook_logs` table for monitoring
- Necessary indexes, policies, and helper functions

### 2. Verify Tables

Check that all tables are created:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'organizations', 'organization_memberships', 'webhook_logs');
```

## Environment Configuration

### Required Environment Variables

Create these environment variables in your deployment platform:

#### Frontend (Vite) Variables
```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Backend (Webhook) Variables
```bash
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_from_clerk
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Platform-Specific Setup

#### Vercel
1. Add environment variables in Vercel dashboard
2. Deploy with `vercel.json` configuration included

#### Netlify
1. Add environment variables in Netlify dashboard
2. Deploy with `netlify.toml` configuration included

#### Other Platforms
- Ensure webhook endpoint is accessible at `/api/webhooks/clerk`
- Configure environment variables as needed

## Webhook Endpoint Deployment

### Deployment Options

#### Option 1: Vercel (Recommended)
```bash
# Deploy to Vercel
npm install -g vercel
vercel --prod
```

#### Option 2: Netlify
```bash
# Deploy to Netlify
npm install -g netlify-cli
netlify deploy --prod
```

#### Option 3: Custom Server
Deploy the webhook handler to any Node.js environment that supports Express.js or serverless functions.

### Webhook Endpoint URL

Your webhook endpoint will be available at:
- Vercel: `https://your-app.vercel.app/api/webhooks/clerk`
- Netlify: `https://your-app.netlify.app/api/webhooks/clerk`
- Custom: `https://your-domain.com/api/webhooks/clerk`

## Clerk Dashboard Configuration

### 1. Access Webhooks Section

1. Log in to [Clerk Dashboard](https://dashboard.clerk.dev)
2. Select your application
3. Navigate to **Webhooks** in the sidebar

### 2. Create New Webhook

1. Click **Add Endpoint**
2. Enter your webhook URL: `https://your-app.vercel.app/api/webhooks/clerk`
3. Select the following events:

#### User Events
- ✅ `user.created`
- ✅ `user.updated`
- ✅ `user.deleted`

#### Organization Events (if using organizations)
- ✅ `organization.created`
- ✅ `organization.updated`
- ✅ `organization.deleted`

#### Organization Membership Events
- ✅ `organizationMembership.created`
- ✅ `organizationMembership.updated`
- ✅ `organizationMembership.deleted`

### 3. Configure Webhook Secret

1. Copy the **Webhook Secret** from Clerk dashboard
2. Add it to your environment variables as `CLERK_WEBHOOK_SECRET`
3. Redeploy your application

### 4. Test the Webhook

1. Use the **Send test event** button in Clerk dashboard
2. Check webhook logs in your application
3. Verify data appears in Supabase

## Testing Webhooks

### 1. Manual Testing

#### Test User Creation
1. Create a new user in your application
2. Check the `users` table in Supabase
3. Verify webhook log entry

#### Test Organization Creation
1. Create an organization in your app
2. Check the `organizations` table
3. Verify membership in `organization_memberships` table

### 2. Automated Testing

```javascript
// Example test for webhook service
import WebhookService from '@lib/webhookService';

// Test user retrieval
const user = await WebhookService.getUserByClerkId('user_123');
console.log('User:', user);

// Test organization retrieval
const orgs = await WebhookService.getUserOrganizations('user_123');
console.log('Organizations:', orgs);
```

### 3. Webhook Logs Monitoring

```javascript
// Check webhook processing stats
const stats = await WebhookService.getWebhookStats();
console.log('Webhook Stats:', stats);

// Get recent webhook logs
const logs = await WebhookService.getWebhookLogs({ limit: 10 });
console.log('Recent Logs:', logs);
```

## Monitoring and Troubleshooting

### Webhook Health Monitoring

#### Check Webhook Status
```sql
-- Check recent webhook activity
SELECT 
  webhook_type,
  processed_successfully,
  COUNT(*) as count,
  AVG(processing_time_ms) as avg_time_ms
FROM webhook_logs 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY webhook_type, processed_successfully
ORDER BY webhook_type, processed_successfully;
```

#### Failed Webhooks
```sql
-- Check failed webhooks
SELECT *
FROM webhook_logs 
WHERE processed_successfully = false
ORDER BY created_at DESC
LIMIT 10;
```

### Common Issues and Solutions

#### Issue: Webhook signature verification failed
**Solution**: 
- Verify `CLERK_WEBHOOK_SECRET` is correctly set
- Check that the secret matches the one in Clerk dashboard
- Ensure webhook endpoint receives raw body content

#### Issue: Database connection errors
**Solution**:
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correctly set
- Check Supabase project URL and database accessibility
- Ensure RLS policies allow service role access

#### Issue: Missing webhook events
**Solution**:
- Check Clerk dashboard webhook configuration
- Verify selected events match your requirements
- Test with manual events from Clerk dashboard

#### Issue: Duplicate data entries
**Solution**:
- Webhook handler uses `upsert` operations to handle duplicates
- Check for retry mechanisms causing multiple deliveries
- Verify unique constraints in database schema

### Debugging Tools

#### Webhook Logs Dashboard
Create a simple dashboard to monitor webhooks:

```javascript
// Example monitoring component
import { useState, useEffect } from 'react';
import WebhookService from '@lib/webhookService';

function WebhookMonitor() {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Load webhook statistics and logs
    WebhookService.getWebhookStats().then(result => {
      if (result.success) setStats(result.data);
    });

    WebhookService.getWebhookLogs({ limit: 50 }).then(result => {
      if (result.success) setLogs(result.data);
    });
  }, []);

  return (
    <div>
      <h2>Webhook Monitoring</h2>
      {stats && (
        <div>
          <p>Total: {stats.total}</p>
          <p>Successful: {stats.successful}</p>
          <p>Failed: {stats.failed}</p>
          <p>Last 24h: {stats.recent24h}</p>
        </div>
      )}
      
      <h3>Recent Logs</h3>
      {logs.map(log => (
        <div key={log.id}>
          <strong>{log.webhook_type}</strong> - 
          {log.processed_successfully ? '✅' : '❌'} - 
          {new Date(log.created_at).toLocaleString()}
        </div>
      ))}
    </div>
  );
}
```

## Security Considerations

### 1. Webhook Secret Verification
- Always verify webhook signatures
- Use constant-time comparison for security
- Rotate webhook secrets periodically

### 2. Environment Variables
- Never commit secrets to version control
- Use secure environment variable management
- Restrict access to production secrets

### 3. Database Security
- Use service role key only for webhook operations
- Implement proper RLS policies
- Monitor database access logs

### 4. Network Security
- Use HTTPS for all webhook endpoints
- Implement rate limiting if needed
- Consider IP whitelisting for webhook sources

### 5. Error Handling
- Don't expose sensitive information in error messages
- Log security events appropriately
- Implement proper error monitoring

## Integration with Frontend

### Using Webhook-Synced Data

```javascript
// Example: Get current user's organizations
import { useUser } from '@clerk/clerk-react';
import WebhookService from '@lib/webhookService';

function UserOrganizations() {
  const { user } = useUser();
  const [organizations, setOrganizations] = useState([]);

  useEffect(() => {
    if (user) {
      WebhookService.getUserOrganizations(user.id)
        .then(result => {
          if (result.success) {
            setOrganizations(result.data);
          }
        });
    }
  }, [user]);

  return (
    <div>
      {organizations.map(org => (
        <div key={org.clerk_organization_id}>
          <h3>{org.name}</h3>
          <p>Role: {org.role}</p>
          <p>Members: {org.members_count}</p>
        </div>
      ))}
    </div>
  );
}
```

### Real-time Updates

```javascript
// Example: Subscribe to organization changes
import { useEffect } from 'react';
import { useOrganization } from '@clerk/clerk-react';
import WebhookService from '@lib/webhookService';

function OrganizationData() {
  const { organization } = useOrganization();

  useEffect(() => {
    if (organization) {
      // Subscribe to real-time changes
      const subscription = WebhookService.subscribeToOrganizationChanges(
        organization.id,
        (payload) => {
          console.log('Organization updated:', payload);
          // Update UI with new data
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [organization]);

  return <div>Organization component</div>;
}
```

## Performance Optimization

### 1. Database Indexing
- Ensure proper indexes on Clerk ID columns
- Monitor query performance
- Use database query optimization tools

### 2. Webhook Processing
- Implement async processing for large operations
- Use database transactions for data consistency
- Monitor webhook processing times

### 3. Caching Strategy
- Cache frequently accessed organization data
- Implement cache invalidation on webhook updates
- Use Redis or similar for distributed caching

### 4. Rate Limiting
- Implement rate limiting on webhook endpoints
- Handle webhook retry mechanisms appropriately
- Monitor webhook delivery frequency

## Conclusion

This webhook integration provides a robust foundation for real-time user and organization data synchronization. The implementation includes:

- ✅ Secure webhook signature verification
- ✅ Comprehensive database schema with RLS
- ✅ Multi-platform deployment support
- ✅ Monitoring and logging capabilities
- ✅ Frontend integration utilities
- ✅ Error handling and troubleshooting guides

For additional support or advanced configurations, refer to the [Clerk documentation](https://clerk.dev/docs/webhooks) and [Supabase documentation](https://supabase.com/docs). 