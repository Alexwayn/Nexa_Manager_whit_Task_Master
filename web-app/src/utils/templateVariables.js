/**
 * Template variable utilities for email templates
 * Provides functions for variable substitution and validation
 */

/**
 * Default template variables available in the system
 */
export const DEFAULT_VARIABLES = [
  {
    name: 'client_name',
    placeholder: '{client_name}',
    description: 'Client or customer name',
    category: 'client',
  },
  {
    name: 'company_name',
    placeholder: '{company_name}',
    description: 'Your company name',
    category: 'company',
  },
  {
    name: 'company_email',
    placeholder: '{company_email}',
    description: 'Your company email address',
    category: 'company',
  },
  {
    name: 'company_phone',
    placeholder: '{company_phone}',
    description: 'Your company phone number',
    category: 'company',
  },
  {
    name: 'invoice_number',
    placeholder: '{invoice_number}',
    description: 'Invoice number',
    category: 'invoice',
  },
  {
    name: 'invoice_date',
    placeholder: '{invoice_date}',
    description: 'Invoice issue date',
    category: 'invoice',
  },
  {
    name: 'due_date',
    placeholder: '{due_date}',
    description: 'Payment due date',
    category: 'invoice',
  },
  {
    name: 'total_amount',
    placeholder: '{total_amount}',
    description: 'Total invoice amount',
    category: 'invoice',
  },
  {
    name: 'payment_amount',
    placeholder: '{payment_amount}',
    description: 'Payment amount received',
    category: 'payment',
  },
  {
    name: 'payment_date',
    placeholder: '{payment_date}',
    description: 'Date payment was received',
    category: 'payment',
  },
  {
    name: 'payment_method',
    placeholder: '{payment_method}',
    description: 'Method of payment',
    category: 'payment',
  },
  {
    name: 'days_overdue',
    placeholder: '{days_overdue}',
    description: 'Number of days payment is overdue',
    category: 'payment',
  },
  {
    name: 'quote_number',
    placeholder: '{quote_number}',
    description: 'Quote number',
    category: 'quote',
  },
  {
    name: 'issue_date',
    placeholder: '{issue_date}',
    description: 'Date document was issued',
    category: 'quote',
  },
  {
    name: 'expiry_date',
    placeholder: '{expiry_date}',
    description: 'Quote expiration date',
    category: 'quote',
  },
  {
    name: 'content',
    placeholder: '{content}',
    description: 'Main email content',
    category: 'general',
  },
];

/**
 * Sample data for template previews
 */
export const SAMPLE_VARIABLES = {
  client_name: 'John Smith',
  company_name: 'Nexa Manager',
  company_email: 'info@nexamanager.com',
  company_phone: '+1 (555) 123-4567',
  invoice_number: 'INV-2024-001',
  invoice_date: '2024-01-15',
  due_date: '2024-02-15',
  total_amount: '€1,250.00',
  payment_amount: '€1,250.00',
  payment_date: '2024-01-20',
  payment_method: 'Bank Transfer',
  days_overdue: '5',
  quote_number: 'QUO-2024-001',
  issue_date: '2024-01-15',
  expiry_date: '2024-02-15',
  content: 'This is sample content for your email template preview.',
  subscriber_name: 'Jane Doe',
  unsubscribe_link: 'https://nexamanager.com/unsubscribe',
};

/**
 * Replace template variables in content
 * @param {string} content - Content with variables to replace
 * @param {object} variables - Object with variable values
 * @returns {string} Content with variables replaced
 */
export const replaceVariables = (content, variables = {}) => {
  if (!content || typeof content !== 'string') {
    return content;
  }

  let result = content;

  // Replace {variable_name} patterns
  Object.keys(variables).forEach(key => {
    const pattern = new RegExp(`{${key}}`, 'g');
    result = result.replace(pattern, variables[key] || '');
  });

  // Replace {{variable_name}} patterns (double braces)
  Object.keys(variables).forEach(key => {
    const pattern = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(pattern, variables[key] || '');
  });

  return result;
};

/**
 * Extract variables from template content
 * @param {string} content - Template content
 * @returns {string[]} Array of variable names found in content
 */
export const extractVariables = (content) => {
  if (!content || typeof content !== 'string') {
    return [];
  }

  const variables = new Set();
  
  // Match {variable_name} patterns
  const singleBraceMatches = content.match(/{([^}]+)}/g);
  if (singleBraceMatches) {
    singleBraceMatches.forEach(match => {
      const variable = match.slice(1, -1); // Remove braces
      variables.add(variable);
    });
  }

  // Match {{variable_name}} patterns
  const doubleBraceMatches = content.match(/{{([^}]+)}}/g);
  if (doubleBraceMatches) {
    doubleBraceMatches.forEach(match => {
      const variable = match.slice(2, -2); // Remove double braces
      variables.add(variable);
    });
  }

  return Array.from(variables);
};

/**
 * Validate template variables
 * @param {string[]} templateVariables - Variables used in template
 * @param {string[]} availableVariables - Variables available in system
 * @returns {object} Validation result with valid/invalid variables
 */
export const validateTemplateVariables = (templateVariables, availableVariables = null) => {
  const available = availableVariables || DEFAULT_VARIABLES.map(v => v.name);
  const valid = [];
  const invalid = [];

  templateVariables.forEach(variable => {
    if (available.includes(variable)) {
      valid.push(variable);
    } else {
      invalid.push(variable);
    }
  });

  return {
    valid,
    invalid,
    isValid: invalid.length === 0,
  };
};

/**
 * Get variables by category
 * @param {string} category - Category to filter by
 * @returns {object[]} Variables in the specified category
 */
export const getVariablesByCategory = (category) => {
  return DEFAULT_VARIABLES.filter(variable => variable.category === category);
};

/**
 * Get all variable categories
 * @returns {string[]} Array of unique categories
 */
export const getVariableCategories = () => {
  const categories = new Set(DEFAULT_VARIABLES.map(v => v.category));
  return Array.from(categories);
};

/**
 * Format variable for display
 * @param {string} variableName - Variable name
 * @returns {string} Formatted variable name
 */
export const formatVariableName = (variableName) => {
  return variableName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Generate template preview with sample data
 * @param {object} template - Template object
 * @param {object} customVariables - Custom variable values (optional)
 * @returns {object} Rendered template with sample data
 */
export const generateTemplatePreview = (template, customVariables = {}) => {
  const variables = { ...SAMPLE_VARIABLES, ...customVariables };
  
  return {
    subject: replaceVariables(template.subject || '', variables),
    htmlContent: replaceVariables(template.content_html || template.html_content || '', variables),
    textContent: replaceVariables(template.content_text || template.text_content || '', variables),
  };
};

export default {
  DEFAULT_VARIABLES,
  SAMPLE_VARIABLES,
  replaceVariables,
  extractVariables,
  validateTemplateVariables,
  getVariablesByCategory,
  getVariableCategories,
  formatVariableName,
  generateTemplatePreview,
};
