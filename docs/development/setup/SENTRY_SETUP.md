# Sentry Error Monitoring Setup

This document provides comprehensive instructions for setting up Sentry error monitoring in the TaskMaster application.

## Overview

Sentry has been integrated into the TaskMaster application to provide:

- **Real-time error tracking** with detailed stack traces
- **Performance monitoring** for React components and API calls
- **User context tracking** integrated with Clerk authentication
- **Organization-aware error reporting** for multi-tenant support
- **Release tracking** with source maps for production debugging

## Environment Variables

### Required Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Sentry Configuration (Required for production)
VITE_SENTRY_DSN=https://your-dsn@o0000000.ingest.sentry.io/0000000
SENTRY_ORG=your-organization-slug
SENTRY_PROJECT=your-project-slug
SENTRY_AUTH_TOKEN=your-auth-token

# Optional Sentry Configuration
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=1.0.0
VITE_APP_VERSION=1.0.0
```

### Environment Variable Details

- `VITE_SENTRY_DSN`: Your Sentry project DSN (Data Source Name)
- `SENTRY_ORG`: Your Sentry organization slug
- `SENTRY_PROJECT`: Your Sentry project slug  
- `SENTRY_AUTH_TOKEN`: Auth token for uploading source maps
- `SENTRY_ENVIRONMENT`: Environment name (development/staging/production)
- `SENTRY_RELEASE`: Release version for tracking deployments

## Sentry Project Setup

### 1. Create Sentry Account and Project

1. Go to [sentry.io](https://sentry.io) and create an account
2. Create a new project and select "React" as the platform
3. Copy the DSN from the project settings

### 2. Configure Organization and Project

1. Set up your organization slug in Sentry settings
2. Create or configure your project slug
3. Generate an auth token for build-time integrations:
   - Go to Settings → Auth Tokens
   - Create a new token with `project:releases` and `org:read` scopes

### 3. Source Maps Configuration

The Vite build is configured to automatically upload source maps to Sentry in production builds when the required environment variables are set.

## Integration Features

### Error Boundary Integration

All React components are wrapped with Sentry-enhanced error boundaries:

```jsx
import { ErrorBoundary, SentryErrorBoundary } from '@components/common/ErrorBoundary';

// Standard error boundary with Sentry integration
<ErrorBoundary component="MyComponent">
  <MyComponent />
</ErrorBoundary>

// Direct Sentry error boundary
<SentryErrorBoundary>
  <MyComponent />
</SentryErrorBoundary>
```

### User Context Tracking

User information is automatically sent to Sentry when users authenticate:

```javascript
// Automatically called when user logs in via Clerk
setSentryUser({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  organizationId: organization.id,
  role: userRole
});
```

### Organization Context

Multi-tenant organization information is tracked:

```javascript
// Automatically called when organization context changes
setSentryOrganization({
  id: organization.id,
  name: organization.name,
  plan: organization.plan
});
```

### Manual Error Reporting

For custom error reporting throughout the application:

```javascript
import { captureError, captureMessage, addBreadcrumb } from '@lib/sentry';

// Capture an error with context
captureError(error, {
  component: 'InvoiceGenerator',
  action: 'pdf_generation',
  userId: user.id,
  organizationId: org.id,
  extra: { invoiceId: 'INV-001' }
});

// Capture a message
captureMessage('User completed onboarding', 'info', {
  userId: user.id,
  organizationId: org.id
});

// Add breadcrumb for user actions
addBreadcrumb(
  'Invoice generated',
  'user_action',
  { invoiceId: 'INV-001', amount: 1000 },
  'info'
);
```

### Performance Monitoring

React components and functions can be monitored for performance:

```javascript
import { performance } from '@lib/sentry';

// Monitor a function
const monitoredFunction = performance.measureFunction(
  myFunction,
  'invoice_calculation'
);

// Start a transaction
const transaction = performance.startTransaction('pdf_generation', 'task');
// ... perform work ...
transaction.finish();
```

## Error Filtering

The Sentry configuration includes intelligent error filtering to reduce noise:

- **Development errors** like ResizeObserver warnings are filtered out
- **Sensitive data** is scrubbed from error reports
- **File paths** are redacted to protect privacy
- **Non-critical promise rejections** are filtered in development

## Production Deployment

### AWS Amplify Configuration

Add the following environment variables in your AWS Amplify console:

1. Go to App Settings → Environment Variables
2. Add the Sentry environment variables listed above
3. Redeploy your application

### Build Process

The production build process will:

1. Generate source maps for error tracking
2. Upload source maps to Sentry (if auth token is configured)
3. Create a new release in Sentry
4. Associate commits with the release for better debugging

## Development Usage

### Local Development

In development mode:
- Sentry operates with full debug logging
- All errors are captured but with higher sampling rates
- Console logs are preserved for debugging
- Source maps are generated but not uploaded

### Testing Error Boundaries

You can test error boundaries using the development tools:

```javascript
// Trigger a test error
throw new Error('Test error for boundary testing');

// Use the error handler hook
const handleError = useErrorHandler();
handleError(new Error('Test error'), { component: 'TestComponent' });
```

## Monitoring and Alerts

### Dashboard Configuration

Set up Sentry alerts for:
- High error rates
- New error types
- Performance degradation
- User-affecting errors

### Custom Tags

The integration automatically adds these tags:
- `component`: React component name
- `action`: User action or function name
- `errorBoundary`: Whether caught by error boundary
- `userId`: Authenticated user ID
- `organizationId`: Current organization ID

## Troubleshooting

### Common Issues

1. **DSN not working**: Verify the DSN format and project configuration
2. **Source maps not uploading**: Check auth token permissions and network access
3. **Too many events**: Adjust sample rates in `sentry.ts` configuration
4. **Missing user context**: Verify Clerk authentication integration

### Debug Mode

Enable debug mode by setting `__SENTRY_DEBUG__` to `true` in your environment.

### Performance Impact

The Sentry integration is optimized for minimal performance impact:
- Lazy loading of Sentry modules
- Efficient error sampling
- Minimal bundle size increase
- Production-optimized builds

## Security Considerations

- **PII Protection**: User emails and sensitive data are handled carefully
- **Source Map Security**: Source maps are uploaded securely and can be deleted after upload
- **Access Control**: Use proper Sentry project permissions
- **Data Retention**: Configure appropriate data retention policies in Sentry

## Support

For issues with Sentry integration:
1. Check the Sentry documentation: https://docs.sentry.io/platforms/javascript/guides/react/
2. Review the implementation in `src/lib/sentry.ts`
3. Check error boundary implementations in `src/components/common/ErrorBoundary.jsx`
4. Verify environment variable configuration 