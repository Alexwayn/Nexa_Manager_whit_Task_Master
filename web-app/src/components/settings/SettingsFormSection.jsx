import React from 'react';

const SettingsFormSection = ({
  title,
  description,
  children,
  onSubmit,
  className = '',
  headerClassName = '',
  contentClassName = '',
}) => {
  const handleSubmit = (e) => {
    if (onSubmit) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  const content = (
    <div className={`p-6 ${contentClassName}`}>
      {title && (
        <div className={`mb-6 ${headerClassName}`}>
          <h2 className="text-lg font-medium text-gray-900">{title}</h2>
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );

  if (onSubmit) {
    return (
      <div className={`bg-white rounded-lg shadow ${className}`}>
        <form onSubmit={handleSubmit}>{content}</form>
      </div>
    );
  }

  return <div className={`bg-white rounded-lg shadow ${className}`}>{content}</div>;
};

export default SettingsFormSection;
