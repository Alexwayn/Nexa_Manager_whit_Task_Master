import React, { createContext, useContext, useEffect, useState } from 'react';
import { useOrganization, useOrganizationList, useUser } from '@clerk/clerk-react';
import Logger from '@utils/Logger';
import { setSentryUser, setSentryOrganization, clearSentryUser, addBreadcrumb } from '@lib/sentry';

const OrganizationContext = createContext({});



/**
 * Organization Context Provider for Multi-Tenant Support
 *
 * Manages organization state and provides organization-aware data filtering
 * throughout the application. Integrates with Clerk Organizations for
 * enterprise-grade multi-tenancy and Sentry error monitoring.
 */
export const OrganizationProvider = ({ children }) => {
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Use Clerk for organization management
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const { organizationList, isLoaded: listLoaded, setActive } = useOrganizationList();
  const { user } = useUser();

  // Update Sentry context when user changes
  useEffect(() => {
    if (user) {
      // Set Sentry user context
      setSentryUser({
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        organizationId: selectedOrganization?.id,
        role: getUserRole(),
      });

      addBreadcrumb(
        'User context updated',
        'auth',
        {
          userId: user.id,
          hasOrganization: !!selectedOrganization?.id,
          userRole: getUserRole(),
        },
        'info',
      );
    } else {
      // Clear Sentry context when user logs out
      clearSentryUser();
    }
  }, [user, selectedOrganization]);

  // Update Sentry organization context when organization changes
  useEffect(() => {
    if (selectedOrganization) {
      setSentryOrganization({
        id: selectedOrganization.id,
        name: selectedOrganization.name,
        plan: selectedOrganization.publicMetadata?.plan || 'unknown',
      });

      addBreadcrumb(
        'Organization context updated',
        'organization',
        {
          organizationId: selectedOrganization.id,
          organizationName: selectedOrganization.name,
          memberCount: selectedOrganization.membersCount,
        },
        'info',
      );
    }
  }, [selectedOrganization]);

  // Initialize organization context when data is loaded
  useEffect(() => {
    if (!orgLoaded || !listLoaded || !user) {
      return;
    }

    // Set the current organization or handle organization selection
    if (organization) {
      setSelectedOrganization(organization);
      Logger.info('Organization Context: Current organization set', organization.name);
    } else if (organizationList?.length === 1) {
      // Auto-select if user belongs to only one organization
      const singleOrg = organizationList[0].organization;
      setActive({ organization: singleOrg.id });
      setSelectedOrganization(singleOrg);
      Logger.info('Organization Context: Auto-selected single organization', singleOrg.name);
    } else if (organizationList?.length > 1) {
      // Multiple organizations - user needs to select
      Logger.info('Organization Context: Multiple organizations available, user needs to select');
    } else {
      // No organizations - create personal organization or handle onboarding
      Logger.info('Organization Context: No organizations found for user');
    }

    setIsInitialized(true);
  }, [organization, organizationList, orgLoaded, listLoaded, user, setActive]);

  /**
   * Switch to a different organization
   */
  const switchOrganization = async organizationId => {
    try {
      await setActive({ organization: organizationId });

      addBreadcrumb(
        'Organization switched',
        'user_action',
        { organizationId, userId: user?.id },
        'info',
      );

      Logger.info('Organization Context: Switched to organization', organizationId);
    } catch (error) {
      Logger.error('Organization Context: Failed to switch organization', error);
      throw error;
    }
  };

  /**
   * Create a new organization
   */
  const createOrganization = async (name, slug) => {
    try {
      // This would typically be handled by Clerk's OrganizationProfile component
      // or a custom organization creation flow

      addBreadcrumb(
        'Organization creation attempted',
        'user_action',
        { organizationName: name, slug, userId: user?.id },
        'info',
      );

      Logger.info('Organization Context: Creating new organization', { name, slug });
      // The actual creation is handled by Clerk components
    } catch (error) {
      Logger.error('Organization Context: Failed to create organization', error);
      throw error;
    }
  };

  /**
   * Get current organization ID for data filtering
   */
  const getCurrentOrganizationId = () => {
    return selectedOrganization?.id || null;
  };

  /**
   * Check if user has specific role in current organization
   */
  const hasRole = role => {
    if (!selectedOrganization || !user) return false;

    const membership = selectedOrganization.memberships?.find(
      m => m.publicUserData.userId === user.id,
    );

    return membership?.role === role;
  };

  /**
   * Check if user is admin of current organization
   */
  const isAdmin = () => hasRole('admin');

  /**
   * Check if user is member of current organization
   */
  const isMember = () => hasRole('basic_member') || hasRole('admin');

  /**
   * Get user's role in current organization
   */
  const getUserRole = () => {
    if (!selectedOrganization || !user) return null;

    const membership = selectedOrganization.memberships?.find(
      m => m.publicUserData.userId === user.id,
    );

    return membership?.role || null;
  };

  const contextValue = {
    // Organization data
    organization: selectedOrganization,
    organizationList: organizationList || [],
    isLoaded: orgLoaded && listLoaded,
    isInitialized,

    // Organization management
    switchOrganization,
    createOrganization,
    getCurrentOrganizationId,

    // Role management
    hasRole,
    isAdmin,
    isMember,
    getUserRole,

    // Helper flags
    hasMultipleOrganizations: organizationList?.length > 1,
    needsOrganizationSelection:
      isInitialized && !selectedOrganization && organizationList?.length > 1,
    needsOrganizationCreation:
      isInitialized && (!organizationList || organizationList.length === 0),
  };

  return (
    <OrganizationContext.Provider value={contextValue}>{children}</OrganizationContext.Provider>
  );
};

/**
 * Hook to use organization context
 */
export const useOrganizationContext = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganizationContext must be used within an OrganizationProvider');
  }
  return context;
};

/**
 * Hook to get organization-scoped data filtering
 */
export const useOrganizationFilter = () => {
  const { getCurrentOrganizationId } = useOrganizationContext();

  return {
    organizationId: getCurrentOrganizationId(),
    getFilter: () => ({ organizationId: getCurrentOrganizationId() }),
    isValidFilter: () => getCurrentOrganizationId() !== null,
  };
};

export default OrganizationContext;
