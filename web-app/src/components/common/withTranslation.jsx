import React from 'react';
import { useTranslation } from 'react-i18next';

export const withTranslation = (Component) => {
  const WrappedComponent = (props) => {
    const { t } = useTranslation('common');
    return <Component {...props} t={t} />;
  };

  WrappedComponent.displayName = `withTranslation(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
};
