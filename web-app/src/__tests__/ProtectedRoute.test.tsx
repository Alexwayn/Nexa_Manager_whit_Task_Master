import React from 'react';
import { render } from '@testing-library/react';
import ProtectedRoute from '@/features/auth/components/ProtectedRoute';
import { __getMockNavigate, __resetMocks, __setMockLocation } from 'react-router-dom';

jest.mock('@clerk/clerk-react', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/utils/env', () => ({
  shouldBypassAuth: jest.fn(() => false),
}));

const { useAuth } = jest.requireMock('@clerk/clerk-react');
const { shouldBypassAuth } = jest.requireMock('@/utils/env');

describe('ProtectedRoute', () => {
  beforeEach(() => {
    __resetMocks();
    jest.clearAllMocks();
    // default location
    __setMockLocation({ pathname: '/', search: '' });
  });

  it('renders children when auth is bypassed in development', () => {
    shouldBypassAuth.mockReturnValue(true);
    const { getByTestId } = render(
      <ProtectedRoute>
        <div data-testid="content">Secret</div>
      </ProtectedRoute>
    );
    expect(getByTestId('content')).toBeInTheDocument();
    const navigate = __getMockNavigate();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('shows loading spinner while auth is loading', () => {
    shouldBypassAuth.mockReturnValue(false);
    useAuth.mockReturnValue({ isLoaded: false, isSignedIn: false });

    const { container } = render(
      <ProtectedRoute>
        <div data-testid="content">Secret</div>
      </ProtectedRoute>
    );

    // Spinner uses class "animate-spin"
    expect(container.querySelector('.animate-spin')).toBeTruthy();
  });

  it('redirects to /login when not signed in', async () => {
    shouldBypassAuth.mockReturnValue(false);
    useAuth.mockReturnValue({ isLoaded: true, isSignedIn: false });
    __setMockLocation({ pathname: '/protected', search: '?a=1' });

    render(
      <ProtectedRoute>
        <div data-testid="content">Secret</div>
      </ProtectedRoute>
    );

    const navigate = __getMockNavigate();
    expect(navigate).toHaveBeenCalledWith(
      '/login',
      expect.objectContaining({
        replace: true,
        state: expect.objectContaining({ from: expect.objectContaining({ pathname: '/protected' }) }),
      })
    );
  });

  it('renders children when signed in', () => {
    shouldBypassAuth.mockReturnValue(false);
    useAuth.mockReturnValue({ isLoaded: true, isSignedIn: true });

    const { getByTestId } = render(
      <ProtectedRoute>
        <div data-testid="content">Secret</div>
      </ProtectedRoute>
    );

    expect(getByTestId('content')).toBeInTheDocument();
    const navigate = __getMockNavigate();
    expect(navigate).not.toHaveBeenCalled();
  });
});