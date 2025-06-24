import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@lib/supabaseClient';
import Logger from '@utils/Logger';

// Translation function
const t = (key: string, params?: Record<string, any>): string => {
  const translations: Record<string, string> = {
    'auth.error.fetchingSession': 'Error fetching session',
    'auth.error.sessionFetch': 'Exception during session fetch',
    'auth.error.signOut': 'Error during sign out',
    'auth.error.signOutException': 'Exception during sign out',
    'auth.error.recoverSession': 'Unable to recover session',
    'auth.error.sessionRecovery': 'Exception during session recovery',
    'auth.error.mustUseProvider': 'useAuth must be used within an AuthProvider',
    'auth.error.fetchingAvatar': 'Error fetching user avatar',
    'auth.error.avatarException': 'Exception fetching user avatar',
    'auth.log.authStateChanged': 'Auth state changed',
    'auth.log.tokenRefreshed': 'Token refreshed successfully',
    'auth.log.userSignedOut': 'User signed out',
  };

  let translation = translations[key] || key;
  if (params) {
    Object.keys(params).forEach((param) => {
      translation = translation.replace(`{{${param}}}`, params[param]);
    });
  }
  return translation;
};

// Split Context Types for Optimization
// 1. User Data Context (changes rarely)
interface UserContextType {
  user: User | null;
  userAvatar: string | null;
}

// 2. Auth State Context (changes occasionally)
interface AuthStateContextType {
  loading: boolean;
  authError: AuthError | Error | null;
}

// 3. Auth Actions Context (never changes - only functions)
interface AuthActionsContextType {
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  recoverSession: () => Promise<boolean>;
  updateUserAvatar: (forceRefresh?: boolean) => Promise<string | null>;
}

// Combined type for compatibility
interface AuthContextType extends UserContextType, AuthStateContextType, AuthActionsContextType {}

interface AuthProviderProps {
  children: ReactNode;
}

// Create separate contexts for optimization
const UserContext = createContext<UserContextType | undefined>(undefined);
const AuthStateContext = createContext<AuthStateContextType | undefined>(undefined);
const AuthActionsContext = createContext<AuthActionsContextType | undefined>(undefined);

/**
 * Optimized AuthProvider Component
 * 
 * Performance Optimizations:
 * 1. Context Splitting: Separates user data, auth state, and actions
 * 2. Memoized Values: Prevents unnecessary re-renders
 * 3. Callback Memoization: Stable function references
 * 4. Efficient State Updates: Batched where possible
 */
export function OptimizedAuthProvider({ children }: AuthProviderProps) {
  // State management
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<AuthError | Error | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  // Memoized user avatar update function with useCallback
  const updateUserAvatar = useCallback(async (forceRefresh: boolean = false): Promise<string | null> => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();

      if (error) {
        Logger.error(t('auth.error.fetchingAvatar'), error);
        return null;
      }

      if (data && data.avatar_url) {
        const avatarUrl = forceRefresh
          ? `${data.avatar_url}?t=${new Date().getTime()}`
          : data.avatar_url;

        setUserAvatar(avatarUrl);
        return avatarUrl;
      }

      return null;
    } catch (err) {
      Logger.error(t('auth.error.avatarException'), err);
      return null;
    }
  }, [user?.id]);

  // Memoized logout function
  const logout = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        Logger.error(t('auth.error.signOut'), error.message);
        setAuthError(error);
      }
      setUserAvatar(null);
    } catch (err) {
      Logger.error(t('auth.error.signOutException'), err);
      setAuthError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Memoized session recovery function
  const recoverSession = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      setAuthError(null);

      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        Logger.error(t('auth.error.recoverSession'), error.message);
        await supabase.auth.signOut();
        setUser(null);
        setUserAvatar(null);
        return false;
      }

      setUser(data.session?.user ?? null);

      if (data.session?.user) {
        updateUserAvatar();
      }

      return true;
    } catch (err) {
      Logger.error(t('auth.error.sessionRecovery'), err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [updateUserAvatar]);

  // Initialize auth state
  useEffect(() => {
    const fetchSession = async (): Promise<void> => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          Logger.error(t('auth.error.fetchingSession'), error.message);
          setAuthError(error);
        } else {
          setUser(data.session?.user ?? null);

          if (data.session?.user) {
            updateUserAvatar();
          }
        }
      } catch (err) {
        Logger.error(t('auth.error.sessionFetch'), err);
        setAuthError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      Logger.info(t('auth.log.authStateChanged'), event);
      
      // Batch state updates to prevent multiple re-renders
      setUser(session?.user ?? null);

      if (session?.user) {
        updateUserAvatar();
      } else {
        setUserAvatar(null);
      }

      if (event === 'TOKEN_REFRESHED') {
        Logger.info(t('auth.log.tokenRefreshed'));
      } else if (event === 'SIGNED_OUT') {
        Logger.info(t('auth.log.userSignedOut'));
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [updateUserAvatar]);

  // Memoized context values to prevent unnecessary re-renders
  const userContextValue = useMemo<UserContextType>(() => ({
    user,
    userAvatar,
  }), [user, userAvatar]);

  const authStateContextValue = useMemo<AuthStateContextType>(() => ({
    loading,
    authError,
  }), [loading, authError]);

  const authActionsContextValue = useMemo<AuthActionsContextType>(() => ({
    setUser,
    logout,
    recoverSession,
    updateUserAvatar,
  }), [logout, recoverSession, updateUserAvatar]);

  return (
    <UserContext.Provider value={userContextValue}>
      <AuthStateContext.Provider value={authStateContextValue}>
        <AuthActionsContext.Provider value={authActionsContextValue}>
          {children}
        </AuthActionsContext.Provider>
      </AuthStateContext.Provider>
    </UserContext.Provider>
  );
}

// Optimized hooks for specific use cases
export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error(t('auth.error.mustUseProvider'));
  }
  return context;
}

export function useAuthState(): AuthStateContextType {
  const context = useContext(AuthStateContext);
  if (context === undefined) {
    throw new Error(t('auth.error.mustUseProvider'));
  }
  return context;
}

export function useAuthActions(): AuthActionsContextType {
  const context = useContext(AuthActionsContext);
  if (context === undefined) {
    throw new Error(t('auth.error.mustUseProvider'));
  }
  return context;
}

// Combined hook for backward compatibility
export function useOptimizedAuth(): AuthContextType {
  const user = useUser();
  const authState = useAuthState();
  const authActions = useAuthActions();

  return useMemo(() => ({
    ...user,
    ...authState,
    ...authActions,
  }), [user, authState, authActions]);
}

export default OptimizedAuthProvider; 