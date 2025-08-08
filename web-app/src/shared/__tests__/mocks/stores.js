// Mock stores for tests

/**
 * Store Configuration - Mock version for tests
 */
export const storeConfig = {
  persistence: {
    auth: ['userPreferences', 'sessionSettings'],
    theme: ['themePreference', 'accessibilitySettings'],
    email: ['draftEmails', 'emailFilters'],
    organization: ['selectedOrganization', 'organizationSettings'],
  },
  middleware: {
    logging: false, // Disabled in tests
    persistence: true,
    devtools: false, // Disabled in tests
  },
};

// Export placeholder for future store implementations
export default {};
