// Mock for shared utils index - comprehensive mock to handle all import.meta issues

// Re-export all mocked utilities
export * from './performance.js';
export * from './websocket.js';
export * from './scanner.js';
export * from './middleware.js';
export * from './stores.js';

// Mock slices (no import.meta usage but included for completeness)
export const sliceConfig = {
  domains: {
    auth: {
      slices: ['user', 'session', 'permissions'],
      dependencies: [],
    },
    theme: {
      slices: ['theme', 'accessibility'],
      dependencies: ['auth'],
    },
    email: {
      slices: ['emails', 'folders', 'templates', 'notifications'],
      dependencies: ['auth', 'organization'],
    },
    organization: {
      slices: ['organization', 'members', 'roles'],
      dependencies: ['auth'],
    },
  },
  relationships: {
    userToOrganization: 'one-to-many',
    organizationToEmails: 'one-to-many',
    userToTheme: 'one-to-one',
  },
};