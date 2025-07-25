# OAuth Social Providers Setup Guide

## Overview
This guide covers the setup of OAuth social providers (Google, Microsoft, Apple) for the Nexa Manager application using Clerk authentication.

## Current Status
✅ **Clerk Integration Completed**
- ClerkProvider configured in App.jsx
- SignIn component implemented in Login.jsx with custom styling
- Environment variable VITE_CLERK_PUBLISHABLE_KEY configured
- Supabase OAuth code removed from AuthService

## Quick Setup (Development Environment)

### Step 1: Access Clerk Dashboard
1. Log in to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Select your Nexa Manager application
3. Navigate to **User & Authentication** → **Social Connections (OAuth)**

### Step 2: Enable Social Providers
For **development environment**, Clerk provides pre-configured OAuth credentials:

**Google:**
1. Click "Add Provider" → Select "Google"
2. Toggle "Enable for development" (uses Clerk's shared credentials)
3. Save configuration

**Microsoft:**
1. Click "Add Provider" → Select "Microsoft"
2. Toggle "Enable for development" (uses Clerk's shared credentials)
3. Save configuration

**Apple:**
1. Click "Add Provider" → Select "Apple"
2. Toggle "Enable for development" (uses Clerk's shared credentials)
3. Save configuration

### Step 3: Verify Configuration
The social login buttons will automatically appear in the login UI after enabling providers in the dashboard. The current `SignIn` component configuration supports:
- Social buttons placed at bottom of form
- Block button variant for better UX
- Custom styling matching app theme

## Production Setup (Future Implementation)

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Navigate to **APIs & Services** → **Credentials**
4. Create **OAuth client ID** (Web application)
5. Add authorized redirect URI from Clerk dashboard
6. Copy Client ID and Client Secret to Clerk dashboard

### Microsoft OAuth Setup
1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Register new application
4. Configure redirect URI from Clerk dashboard
5. Generate client secret
6. Copy Application (client) ID and Client Secret to Clerk dashboard

### Apple OAuth Setup
1. Go to [Apple Developer Portal](https://developer.apple.com/account/resources/identifiers/list/serviceId)
2. Register new Service ID
3. Configure Sign In with Apple capability
4. Set redirect URI from Clerk dashboard
5. Generate private key (.p8 file)
6. Enter Service ID, Key ID, Team ID, and upload private key in Clerk

## Testing

### Development Testing
1. Start the development server: `npm run dev`
2. Navigate to `/login`
3. Verify social login buttons appear for enabled providers
4. Test authentication flow with each provider
5. Confirm redirect to dashboard after successful login

### Expected Behavior
- Social buttons appear below the email/password form
- Clicking a social button opens provider's authentication page
- Successful authentication redirects to `/dashboard`
- User session is managed by Clerk
- Failed authentication shows appropriate error messages

## UI Customization

The current SignIn component includes custom appearance settings:

```jsx
<SignIn
  appearance={{
    elements: {
      socialButtonsBlockButton: 'border border-gray-300 hover:bg-gray-50',
      // ... other styling
    },
    layout: {
      socialButtonsPlacement: 'bottom',
      socialButtonsVariant: 'blockButton',
    },
  }}
/>
```

## Troubleshooting

### Common Issues
1. **Providers not showing**: Check if they're enabled in Clerk dashboard
2. **Redirect URI mismatch**: Ensure URIs in provider console match Clerk's requirements
3. **Authentication errors**: Check browser console and Clerk dashboard logs

### Debug Resources
- Clerk Dashboard → Logs section for authentication events
- Browser developer tools for JavaScript errors
- Clerk documentation for provider-specific issues

## Security Considerations

### Development
- Development credentials are shared across Clerk applications
- Suitable only for testing and development
- Should not be used in production

### Production
- Use dedicated OAuth applications for each provider
- Implement proper redirect URI validation
- Regular review of OAuth application permissions
- Monitor authentication logs for suspicious activity

## References
- [Clerk Social Connections Documentation](https://clerk.com/docs/authentication/social-connections)
- [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
- [Microsoft Azure App Registration](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [Apple Sign In Setup](https://developer.apple.com/documentation/sign_in_with_apple)

## Next Steps
1. Enable desired providers in Clerk dashboard
2. Test authentication flows
3. Plan production OAuth application setup
4. Document any custom provider configurations

---
*Last updated: 2025-06-24*
*Task: 61.2 - Add Social OAuth Providers* 