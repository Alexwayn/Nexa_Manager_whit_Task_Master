import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ExclamationTriangleIcon, 
  HomeIcon, 
  ArrowLeftIcon,
  ShieldExclamationIcon 
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

interface UnauthorizedAccessProps {
  reason?: string;
  title?: string;
  description?: string;
  showReturnButton?: boolean;
  showHomeButton?: boolean;
  customActions?: React.ReactNode;
}

/**
 * UnauthorizedAccess Component
 * 
 * Displays a user-friendly message when access is denied due to
 * insufficient permissions, roles, or organization membership.
 */
export default function UnauthorizedAccess({
  reason,
  title,
  description,
  showReturnButton = true,
  showHomeButton = true,
  customActions
}: UnauthorizedAccessProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('auth');

  // Get error details from navigation state if available
  const stateError = location.state?.error;
  const returnTo = location.state?.returnTo;

  const displayReason = reason || stateError || t('unauthorized.defaultReason', 'Access denied');
  const displayTitle = title || t('unauthorized.title', 'Access Denied');
  const displayDescription = description || t('unauthorized.description', 
    'You do not have permission to access this page. Please contact your administrator if you believe this is an error.'
  );

  const handleGoBack = () => {
    if (returnTo) {
      navigate(returnTo);
    } else {
      navigate(-1);
    }
  };

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-xl rounded-xl sm:px-10 border border-gray-200 dark:border-gray-700">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <ShieldExclamationIcon className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {displayTitle}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {displayDescription}
            </p>
          </div>

          {/* Error Reason */}
          {displayReason && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 dark:text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-red-800 dark:text-red-200">
                  {displayReason}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {customActions ? (
              customActions
            ) : (
              <>
                {showReturnButton && (
                  <button
                    onClick={handleGoBack}
                    className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                    {t('unauthorized.goBack', 'Go Back')}
                  </button>
                )}

                {showHomeButton && (
                  <button
                    onClick={handleGoHome}
                    className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <HomeIcon className="w-4 h-4 mr-2" />
                    {t('unauthorized.goHome', 'Go to Dashboard')}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('unauthorized.helpText', 'If you believe you should have access to this page, please contact your system administrator.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Specific unauthorized components for different scenarios
 */

export const AdminRequired = () => (
  <UnauthorizedAccess
    title="Administrator Access Required"
    reason="This page is restricted to administrators only."
    description="You need administrator privileges to access this page. Contact your system administrator to request access."
  />
);

export const OrganizationRequired = () => (
  <UnauthorizedAccess
    title="Organization Access Required"
    reason="You need to be a member of an organization to access this page."
    description="Please join an organization or contact your administrator to gain access."
  />
);

export const RoleRequired = ({ requiredRole }: { requiredRole: string }) => (
  <UnauthorizedAccess
    title="Insufficient Role"
    reason={`This page requires ${requiredRole} role or higher.`}
    description="You don't have the required role to access this page. Contact your administrator to request a role upgrade."
  />
);

export const PermissionRequired = ({ missingPermissions }: { missingPermissions: string[] }) => (
  <UnauthorizedAccess
    title="Missing Permissions"
    reason={`Missing required permissions: ${missingPermissions.join(', ')}`}
    description="You don't have the necessary permissions to access this page. Contact your administrator to request additional permissions."
  />
); 