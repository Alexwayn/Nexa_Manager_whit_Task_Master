import React from 'react';
import { render } from '@testing-library/react';
import OrganizationProtectedRoute from '@/features/auth/components/OrganizationProtectedRoute';
import { __getMockNavigate, __resetMocks, __setMockLocation } from 'react-router-dom';

jest.mock('@clerk/clerk-react', () => ({
  useAuth: jest.fn(),
  useUser: jest.fn(),
}));

jest.mock('@/shared/hooks', () => ({
  useOrganizationContext: jest.fn(),
}));

jest.mock('@/utils/env', () => ({
  shouldBypassAuth: jest.fn(() => false),
}));

jest.mock('@/utils/Logger', () => ({
  __esModule: true,
  default: {
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

const { useAuth, useUser } = jest.requireMock('@clerk/clerk-react');
const { useOrganizationContext } = jest.requireMock('@/shared/hooks');
const { shouldBypassAuth } = jest.requireMock('@/utils/env');

describe('OrganizationProtectedRoute', () => {
  beforeEach(() => {
    __resetMocks();
    jest.clearAllMocks();
    __setMockLocation({ pathname: '/', search: '' });
  });

  function setupAuth({ loaded = true, signedIn = true, userOverrides = {} } = {}) {
    useAuth.mockReturnValue({ isLoaded: loaded, isSignedIn: signedIn });
    useUser.mockReturnValue({ user: { id: 'user_1', unsafeMetadata: { onboardingComplete: true }, ...userOverrides } });
  }

  function setupOrg(overrides = {}) {
    useOrganizationContext.mockReturnValue({
      organization: { id: 'org_1' },
      isLoaded: true,
      isInitialized: true,
      hasRole: jest.fn((role) => role === 'basic_member'),
      isAdmin: jest.fn(() => false),
      isMember: jest.fn(() => true),
      getUserRole: jest.fn(() => 'basic_member'),
      needsOrganizationSelection: false,
      needsOrganizationCreation: false,
      ...overrides,
    });
  }

  it('renders children when bypass is enabled', () => {
    shouldBypassAuth.mockReturnValue(true);
    const { getByTestId } = render(
      <OrganizationProtectedRoute>
        <div data-testid="content">Org Secret</div>
      </OrganizationProtectedRoute>
    );
    expect(getByTestId('content')).toBeInTheDocument();
  });

  it('redirects to /login if not authenticated', () => {
    shouldBypassAuth.mockReturnValue(false);
    setupAuth({ loaded: true, signedIn: false });
    setupOrg();

    render(
      <OrganizationProtectedRoute>
        <div>Org Secret</div>
      </OrganizationProtectedRoute>
    );

    const navigate = __getMockNavigate();
    expect(navigate).toHaveBeenCalledWith(
      '/login',
      expect.objectContaining({ replace: true })
    );
  });

  it('redirects to onboarding if onboarding not complete', () => {
    shouldBypassAuth.mockReturnValue(false);
    setupAuth({ loaded: true, signedIn: true, userOverrides: { unsafeMetadata: { onboardingComplete: false } } });
    setupOrg();
    __setMockLocation({ pathname: '/dashboard', search: '' });

    render(
      <OrganizationProtectedRoute>
        <div>Org Secret</div>
      </OrganizationProtectedRoute>
    );

    const navigate = __getMockNavigate();
    expect(navigate).toHaveBeenCalledWith('/onboarding', expect.objectContaining({ replace: true }));
  });

  it('redirects to organization create when needed', () => {
    shouldBypassAuth.mockReturnValue(false);
    setupAuth();
    setupOrg({ needsOrganizationCreation: true });

    render(
      <OrganizationProtectedRoute>
        <div>Org Secret</div>
      </OrganizationProtectedRoute>
    );

    const navigate = __getMockNavigate();
    expect(navigate).toHaveBeenCalledWith('/organization', expect.objectContaining({ replace: true, state: expect.objectContaining({ action: 'create' }) }));
  });

  it('redirects to organization select when needed', () => {
    shouldBypassAuth.mockReturnValue(false);
    setupAuth();
    setupOrg({ needsOrganizationSelection: true });

    render(
      <OrganizationProtectedRoute>
        <div>Org Secret</div>
      </OrganizationProtectedRoute>
    );

    const navigate = __getMockNavigate();
    expect(navigate).toHaveBeenCalledWith('/organization', expect.objectContaining({ replace: true, state: expect.objectContaining({ action: 'select' }) }));
  });

  it('redirects to fallback when not member of org', () => {
    shouldBypassAuth.mockReturnValue(false);
    setupAuth();
    setupOrg({ isMember: jest.fn(() => false) });
    __setMockLocation({ pathname: '/org/secret', search: '' });

    render(
      <OrganizationProtectedRoute fallbackUrl="/dashboard">
        <div>Org Secret</div>
      </OrganizationProtectedRoute>
    );

    const navigate = __getMockNavigate();
    expect(navigate).toHaveBeenCalledWith(
      '/dashboard',
      expect.objectContaining({ replace: true, state: expect.objectContaining({ error: expect.any(String) }) })
    );
  });

  it('redirects when adminOnly and user is not admin', () => {
    shouldBypassAuth.mockReturnValue(false);
    setupAuth();
    setupOrg({ isAdmin: jest.fn(() => false) });

    render(
      <OrganizationProtectedRoute adminOnly>
        <div>Org Secret</div>
      </OrganizationProtectedRoute>
    );

    const navigate = __getMockNavigate();
    expect(navigate).toHaveBeenCalled();
  });

  it('redirects when requiredRole not satisfied', () => {
    shouldBypassAuth.mockReturnValue(false);
    setupAuth();
    setupOrg({ hasRole: jest.fn(() => false), getUserRole: jest.fn(() => 'basic_member') });

    render(
      <OrganizationProtectedRoute requiredRole="admin">
        <div>Org Secret</div>
      </OrganizationProtectedRoute>
    );

    const navigate = __getMockNavigate();
    expect(navigate).toHaveBeenCalled();
  });

  it('redirects when missing permissions', () => {
    shouldBypassAuth.mockReturnValue(false);
    setupAuth();
    // getUserRole returns basic_member, which lacks manage_users
    setupOrg({ getUserRole: jest.fn(() => 'basic_member') });

    render(
      <OrganizationProtectedRoute requiredPermissions={["manage_users"]}>
        <div>Org Secret</div>
      </OrganizationProtectedRoute>
    );

    const navigate = __getMockNavigate();
    expect(navigate).toHaveBeenCalled();
  });

  it('renders children when all checks pass', () => {
    shouldBypassAuth.mockReturnValue(false);
    setupAuth();
    // Admin with full permissions
    setupOrg({ 
      isAdmin: jest.fn(() => true),
      hasRole: jest.fn(() => true),
      getUserRole: jest.fn(() => 'admin')
    });

    const { getByTestId } = render(
      <OrganizationProtectedRoute requiredPermissions={["manage_users"]}>
        <div data-testid="content">Org Secret</div>
      </OrganizationProtectedRoute>
    );

    expect(getByTestId('content')).toBeInTheDocument();
    const navigate = __getMockNavigate();
    expect(navigate).not.toHaveBeenCalled();
  });
});