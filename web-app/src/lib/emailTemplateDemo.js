/**
 * Email Template System Demo
 * Demonstrates the functionality of the email template system
 */

import emailTemplateService from './emailTemplateService.js';
import { DEFAULT_VARIABLES, SAMPLE_VARIABLES, replaceVariables, extractVariables } from '../utils/templateVariables.js';

/**
 * Demo function to showcase email template functionality
 */
export const runEmailTemplateDemo = async () => {
  console.log('🚀 Email Template System Demo');
  console.log('=====================================\n');

  // 1. Show available variables
  console.log('📋 Available Template Variables:');
  const variables = emailTemplateService.getAvailableVariables();
  variables.slice(0, 5).forEach(variable => {
    console.log(`  • ${variable.placeholder} - ${variable.description}`);
  });
  console.log(`  ... and ${variables.length - 5} more variables\n`);

  // 2. Demonstrate variable replacement
  console.log('🔄 Variable Replacement Demo:');
  const templateContent = 'Hello {client_name}, your invoice {invoice_number} for {total_amount} is due on {due_date}.';
  const sampleVars = {
    client_name: 'John Smith',
    invoice_number: 'INV-2024-001',
    total_amount: '€1,250.00',
    due_date: '2024-02-15'
  };
  
  console.log('Template:', templateContent);
  console.log('Variables:', JSON.stringify(sampleVars, null, 2));
  console.log('Result:', replaceVariables(templateContent, sampleVars));
  console.log();

  // 3. Extract variables from template
  console.log('🔍 Variable Extraction Demo:');
  const complexTemplate = 'Dear {client_name}, your {invoice_number} for {{total_amount}} is {days_overdue} days overdue.';
  const extractedVars = extractVariables(complexTemplate);
  console.log('Template:', complexTemplate);
  console.log('Extracted variables:', extractedVars);
  console.log();

  // 4. Show predefined templates
  console.log('📄 Predefined Templates:');
  Object.entries(emailTemplateService.predefinedTemplates).forEach(([key, template]) => {
    console.log(`  • ${template.name}: ${template.description}`);
  });
  console.log();

  // 5. Render a predefined template
  console.log('🎨 Template Rendering Demo:');
  const invoiceTemplate = emailTemplateService.predefinedTemplates.invoice;
  const renderedTemplate = emailTemplateService.renderTemplate(invoiceTemplate, SAMPLE_VARIABLES);
  
  if (renderedTemplate.success) {
    console.log('Template: Invoice Template');
    console.log('Subject:', renderedTemplate.data.subject);
    console.log('HTML Content (first 200 chars):', 
      renderedTemplate.data.htmlContent.substring(0, 200) + '...');
  }
  console.log();

  // 6. Validate template for email compatibility
  console.log('✅ Template Validation Demo:');
  const goodHtml = '<div style="color: red;"><p>Hello World</p></div>';
  const badHtml = '<div style="display: flex;"><script>alert("test")</script></div>';
  
  const goodValidation = emailTemplateService.validateTemplate(goodHtml);
  const badValidation = emailTemplateService.validateTemplate(badHtml);
  
  console.log('Good HTML validation:', goodValidation.isValid ? '✅ Valid' : '❌ Invalid');
  console.log('Bad HTML validation:', badValidation.isValid ? '✅ Valid' : '❌ Invalid');
  if (badValidation.issues.length > 0) {
    console.log('Issues found:', badValidation.issues);
  }
  console.log();

  // 7. HTML to text conversion
  console.log('📝 HTML to Text Conversion:');
  const htmlContent = '<p>Hello <strong>World</strong>!</p><br><div>How are you today?</div>';
  const textContent = emailTemplateService.htmlToText(htmlContent);
  console.log('HTML:', htmlContent);
  console.log('Text:', textContent);
  console.log();

  console.log('✨ Demo completed successfully!');
  console.log('=====================================');

  return {
    success: true,
    message: 'Email template system demo completed',
    features: [
      'Variable replacement',
      'Template rendering',
      'Email validation',
      'HTML to text conversion',
      'Predefined templates',
      'Variable extraction'
    ]
  };
};

// Export for use in other modules
export default {
  runEmailTemplateDemo,
  emailTemplateService,
  DEFAULT_VARIABLES,
  SAMPLE_VARIABLES,
  replaceVariables,
  extractVariables,
};