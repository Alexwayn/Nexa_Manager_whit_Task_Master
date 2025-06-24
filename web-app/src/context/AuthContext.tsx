import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@lib/supabaseClient';
import Logger from '@utils/Logger';

// Translation function - to be integrated with i18n system
const t = (key: string, params?: Record<string, any>): string => {
  // This is a placeholder function that will be replaced with actual i18n implementation
  const translations: Record<string, string> = {
    // Error Messages
    'auth.error.fetchingSession': 'Error fetching session',
    'auth.error.sessionFetch': 'Exception during session fetch',
    'auth.error.signOut': 'Error during sign out',
    'auth.error.signOutException': 'Exception during sign out',
    'auth.error.recoverSession': 'Unable to recover session',
    'auth.error.sessionRecovery': 'Exception during session recovery',
    'auth.error.mustUseProvider': 'useAuth must be used within an AuthProvider',
    'auth.error.fetchingAvatar': 'Error fetching user avatar',
    'auth.error.avatarException': 'Exception fetching user avatar',

    // Log Messages
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

// Define the shape of the AuthContext
interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  logout: () => Promise<void>;
  authError: AuthError | Error | null;
  recoverSession: () => Promise<boolean>;
  userAvatar: string | null;
  updateUserAvatar: (forceRefresh?: boolean) => Promise<string | null>;
}

// Define props for AuthProvider
interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<AuthError | Error | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  // Function to update user avatar
  const updateUserAvatar = async (forceRefresh: boolean = false): Promise<string | null> => {
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
        // Add timestamp to force refresh if requested
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
  };

  useEffect(() => {
    const fetchSession = async (): Promise<void> => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          Logger.error(t('auth.error.fetchingSession'), error.message);
          setAuthError(error);
        } else {
          setUser(data.session?.user ?? null);

          // Load avatar if user is authenticated
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
      setUser(session?.user ?? null);

      // Update avatar when authentication state changes
      if (session?.user) {
        updateUserAvatar();
      } else {
        setUserAvatar(null);
      }

      // Handle token refresh errors
      if (event === 'TOKEN_REFRESHED') {
        Logger.info(t('auth.log.tokenRefreshed'));
      } else if (event === 'SIGNED_OUT') {
        Logger.info(t('auth.log.userSignedOut'));
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const logout = async (): Promise<void> => {
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
  };

  // Function to handle auth errors and recovery attempts
  const recoverSession = async (): Promise<boolean> => {
    try {
      setLoading(true);
      setAuthError(null);

      // Try to force a refresh
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        Logger.error(t('auth.error.recoverSession'), error.message);
        // If refresh fails, we need to sign out and redirect to login
        await supabase.auth.signOut();
        setUser(null);
        setUserAvatar(null);
        return false;
      }

      setUser(data.session?.user ?? null);

      // Update avatar if user is authenticated
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
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        logout,
        authError,
        recoverSession,
        userAvatar,
        updateUserAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error(t('auth.error.mustUseProvider'));
  }
  return context;
}
