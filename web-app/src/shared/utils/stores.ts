/**
 * State Stores
 * 
 * This module will contain state stores organized by domain.
 * Currently using React Context for state management, but this
 * structure allows for future integration with Zustand, Redux, or other
 * state management solutions.
 */

// Auth Domain Stores
// TODO: Add auth-specific stores if needed (e.g., user preferences, session state)

// Theme Domain Stores  
// TODO: Add theme-specific stores if needed (e.g., theme preferences, accessibility settings)

// Email Domain Stores
// TODO: Add email-specific stores if needed (e.g., email cache, draft management)

// Organization Domain Stores
// TODO: Add organization-specific stores if needed (e.g., organization settings, member cache)

/**
 * Store Configuration
 * 
 * Configuration for state stores and their persistence settings.
 */
export const storeConfig = {
  persistence: {
    auth: ['userPreferences', 'sessionSettings'],
    theme: ['themePreference', 'accessibilitySettings'],
    email: ['draftEmails', 'emailFilters'],
    organization: ['selectedOrganization', 'organizationSettings'],
  },
  middleware: {
    logging: import.meta.env.DEV,
    persistence: true,
    devtools: import.meta.env.DEV,
  },
};

// Export placeholder for future store implementations
export default {};