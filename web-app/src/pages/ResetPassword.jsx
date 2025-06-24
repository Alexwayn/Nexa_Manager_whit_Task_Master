import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@lib/supabaseClient';
import Logger from '@utils/Logger';
import {
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import nexaLogo from '@assets/logo_nexa.png';

export default function ResetPassword() {
  const { t } = useTranslation('login');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if user has a valid session for password reset
    const checkResetSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          Logger.error('Session check error:', error);
          setError(t('setNewPassword.errors.invalidSession'));
          setCheckingSession(false);
          return;
        }

        // Check if this is coming from an email reset link
        const urlParams = new URLSearchParams(location.hash.substring(1));
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        const type = urlParams.get('type');

        if (type === 'recovery' && accessToken && refreshToken) {
          // Set the session with the tokens from the URL
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            Logger.error('Session set error:', sessionError);
            setError(t('setNewPassword.errors.invalidOrExpiredLink'));
          } else {
            setIsValidSession(true);
          }
        } else if (session) {
          // User already has a session
          setIsValidSession(true);
        } else {
          setError(t('setNewPassword.errors.invalidOrExpiredLink'));
        }
      } catch (err) {
        Logger.error('Reset session check error:', err);
        setError(t('setNewPassword.errors.sessionCheckError'));
      } finally {
        setCheckingSession(false);
      }
    };

    checkResetSession();
  }, [location]);

  const handlePasswordReset = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError(t('setNewPassword.errors.passwordsDoNotMatch'));
      return;
    }

    if (newPassword.length < 8) {
      setError(t('setNewPassword.errors.passwordTooShort'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', {
          state: {
            message: t('setNewPassword.success.redirectMessage'),
          },
        });
      }, 3000);
    } catch (err) {
      Logger.error('Password update error:', err);
      setError(err.message || t('setNewPassword.errors.updateError'));
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('setNewPassword.checkingLink.message')}</p>
        </div>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {t('setNewPassword.invalidLink.title')}
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {t('setNewPassword.invalidLink.backToLogin')}
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <CheckCircleIcon className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {t('setNewPassword.success.title')}
          </h2>
          <p className="text-gray-600 mb-6">{t('setNewPassword.success.message')}</p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <img src={nexaLogo} alt="Nexa Manager" className="h-12 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {t('setNewPassword.pageTitle')}
          </h2>
          <p className="text-gray-600">{t('setNewPassword.pageSubtitle')}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-100 border border-red-200">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handlePasswordReset} className="space-y-4">
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
              {t('setNewPassword.newPasswordLabel')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockClosedIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength="8"
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder={t('setNewPassword.newPasswordPlaceholder')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">{t('setNewPassword.passwordMinLength')}</p>
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t('setNewPassword.confirmPasswordLabel')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockClosedIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder={t('setNewPassword.confirmPasswordPlaceholder')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? t('setNewPassword.updatingButton') : t('setNewPassword.submitButton')}
            </button>
          </div>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Torna al Login
          </button>
        </div>
      </div>
    </div>
  );
}
