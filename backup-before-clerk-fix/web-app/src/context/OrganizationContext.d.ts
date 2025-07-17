import { ReactNode } from 'react';

export interface OrganizationContextType {
  // Organization data
  organization: any;
  organizationList: any[];
  isLoaded: boolean;
  isInitialized: boolean;

  // Organization management
  switchOrganization: (organizationId: string) => Promise<void>;
  createOrganization: (name: string, slug: string) => Promise<void>;
  getCurrentOrganizationId: () => string | null;

  // Role management
  hasRole: (role: string) => boolean;
  isAdmin: () => boolean;
  isMember: () => boolean;
  getUserRole: () => string | null;

  // Helper flags
  hasMultipleOrganizations: boolean;
  needsOrganizationSelection: boolean;
  needsOrganizationCreation: boolean;
}

export const useOrganizationContext: () => OrganizationContextType;

export interface OrganizationProviderProps {
  children: ReactNode;
}

export const OrganizationProvider: React.FC<OrganizationProviderProps>;
