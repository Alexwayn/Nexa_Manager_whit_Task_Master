/**
 * State Slices
 * 
 * This module will contain state slices organized by domain.
 * Slices represent specific portions of application state that can be
 * managed independently while maintaining relationships with other slices.
 */

// Auth Domain Slices
// TODO: Add auth-specific slices (e.g., userSlice, sessionSlice, permissionsSlice)

// Theme Domain Slices
// TODO: Add theme-specific slices (e.g., themeSlice, accessibilitySlice)

// Email Domain Slices  
// TODO: Add email-specific slices (e.g., emailsSlice, foldersSlice, templatesSlice)

// Organization Domain Slices
// TODO: Add organization-specific slices (e.g., organizationSlice, membersSlice, rolesSlice)

/**
 * Slice Configuration
 * 
 * Configuration for state slices and their relationships.
 */
export const sliceConfig = {
  domains: {
    auth: {
      slices: ['user', 'session', 'permissions'],
      dependencies: [],
    },
    theme: {
      slices: ['theme', 'accessibility'],
      dependencies: ['auth'], // Theme preferences may depend on user settings
    },
    email: {
      slices: ['emails', 'folders', 'templates', 'notifications'],
      dependencies: ['auth', 'organization'], // Email data depends on user and organization
    },
    organization: {
      slices: ['organization', 'members', 'roles'],
      dependencies: ['auth'], // Organization data depends on user authentication
    },
  },
  relationships: {
    // Define cross-slice relationships and dependencies
    userToOrganization: 'one-to-many',
    organizationToEmails: 'one-to-many',
    userToTheme: 'one-to-one',
  },
};

// Export placeholder for future slice implementations
export default {};