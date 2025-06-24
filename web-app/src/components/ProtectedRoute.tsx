import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import { useEffect, useState, ReactNode } from 'react';
import Logger from '@utils/Logger';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, authError, recoverSession } = useAuth();
  const [isRecovering, setIsRecovering] = useState<boolean>(false);
  const [recoveryAttempted, setRecoveryAttempted] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Se c'è un errore di autenticazione con token di refresh non valido,
    // e non abbiamo ancora tentato di recuperare la sessione, proviamo a farlo
    if (
      authError &&
      authError.message &&
      authError.message.includes('Invalid Refresh Token') &&
      !recoveryAttempted &&
      !isRecovering
    ) {
      const attemptSessionRecovery = async (): Promise<void> => {
        try {
          setIsRecovering(true);
          Logger.info('Attempting to recover session in ProtectedRoute...');
          const recovered = await recoverSession();

          if (!recovered) {
            console.warn('Session recovery failed in ProtectedRoute, redirecting to login...');
            // Memorizza la posizione corrente per poter reindirizzare l'utente al login
            // e poi tornare dopo il login
            navigate('/login', {
              state: {
                returnTo: location.pathname + location.search,
              },
            });
          } else {
            Logger.info('Session recovered successfully in ProtectedRoute');
          }
        } catch (err) {
          console.error('Error during session recovery:', err);
        } finally {
          setIsRecovering(false);
          setRecoveryAttempted(true);
        }
      };

      attemptSessionRecovery();
    }
  }, [authError, recoverSession, navigate, recoveryAttempted, isRecovering, location]);

  if (loading || isRecovering) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-blue-600">Caricamento...</p>
      </div>
    );
  }

  return user ? (
    children
  ) : (
    <Navigate to="/login" state={{ returnTo: location.pathname + location.search }} />
  );
}
