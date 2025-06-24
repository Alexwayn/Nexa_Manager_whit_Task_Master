import React from 'react';
import { useTranslation } from 'react-i18next';

const SettingsLoadingSpinner = ({
  size = 'medium',
  message,
  className = '',
  showMessage = true,
}) => {
  const { t } = useTranslation('settings');

  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
  };

  const containerClasses = {
    small: 'py-4',
    medium: 'py-8',
    large: 'py-12',
  };

  const loadingMessage = message || t('buttons.loading', 'Loading...');

  return (
    <div
      className={`flex flex-col items-center justify-center ${containerClasses[size]} ${className}`}
    >
      <div
        className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}
      ></div>
      {showMessage && loadingMessage && (
        <p className="mt-2 text-sm text-gray-500">{loadingMessage}</p>
      )}
    </div>
  );
};

export default SettingsLoadingSpinner;
