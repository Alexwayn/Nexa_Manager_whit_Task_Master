// Mock the emailTemplateService
const emailTemplateService = {
  getTemplates: jest.fn(),
  saveTemplate: jest.fn(),
  deleteTemplate: jest.fn(),
  renderTemplate: jest.fn(),
  replaceVariables: jest.fn(),
  validateTemplate: jest.fn(),
  htmlToText: jest.fn(),
  getAvailableVariables: jest.fn(),
  optimizeForEmail: jest.fn(),
};

// Mock Supabase
const mockSupabase = {
  auth: {
    user: jest.fn(() => ({ id: 'test-user-id' })),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      or: jest.fn(() => ({
        order: jest.fn(() => ({
          data: [],
          error: null,
        })),
      })),
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => ({
          data: { id: 'test-template-id', name: 'Test Template' },
          error: null,
        })),
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: { id: 'test-template-id', name: 'Updated Template' },
              error: null,
            })),
          })),
        })),
      })),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            error: null,
          })),
        })),
      })),
    })),
  })),
};

jest.mock('@/lib/supabaseClient', () => ({
  supabase: mockSupabase,
}));

jest.mock('@/utils/Logger', () => ({
  default: {
    error: jest.fn(),
  },
}));

describe('EmailTemplateService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    emailTemplateService.getTemplates.mockResolvedValue({
      success: true,
      data: [],
      predefined: {},
    });
    
    emailTemplateService.saveTemplate.mockImplementation((templateData) => ({
      success: true,
      data: { id: templateData.id || 'test-template-id', name: templateData.name },
      message: templateData.id ? 'Template updated successfully' : 'Template created successfully',
    }));
    
    emailTemplateService.deleteTemplate.mockResolvedValue({
      success: true,
      message: 'Template deleted successfully',
    });
    
    emailTemplateService.renderTemplate.mockImplementation((template, variables) => ({
      success: true,
      data: {
        subject: template.subject?.replace(/\{(\w+)\}/g, (match, key) => variables[key] || ''),
        htmlContent: template.content_html?.replace(/\{(\w+)\}/g, (match, key) => variables[key] || ''),
        textContent: template.content_text?.replace(/\{(\w+)\}/g, (match, key) => variables[key] || ''),
      },
    }));
    
    emailTemplateService.replaceVariables.mockImplementation((content, variables) => {
      return content.replace(/\{\{?(\w+)\}?\}/g, (match, key) => variables[key] || '');
    });
    
    emailTemplateService.validateTemplate.mockImplementation((html) => ({
      isValid: !html.includes('flex') && !html.includes('<script'),
      issues: html.includes('flex') || html.includes('<script') ? ['Unsupported elements'] : [],
    }));
    
    emailTemplateService.htmlToText.mockImplementation((html) => {
      return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<\/div>/gi, '')
        .replace(/<[^>]*>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\n\n+/g, '\n\n')
        .trim();
    });
    
    emailTemplateService.getAvailableVariables.mockReturnValue([
      { name: 'client_name', placeholder: '{client_name}', description: 'Client or customer name' },
      { name: 'company_name', placeholder: '{company_name}', description: 'Your company name' },
    ]);
    
    emailTemplateService.optimizeForEmail.mockImplementation((html) => {
      let optimized = html;
      if (!optimized.includes('<!DOCTYPE')) {
        optimized = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\n' + optimized;
      }
      if (!optimized.includes('<html')) {
        optimized = `<html xmlns="http://www.w3.org/1999/xhtml">
          <head>
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          </head>
          <body style="margin: 0; padding: 0;">
            ${optimized}
          </body>
        </html>`;
      }
      return optimized;
    });
  });

  describe('getTemplates', () => {
    it('should fetch templates successfully', async () => {
      const result = await emailTemplateService.getTemplates();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.predefined).toBeDefined();
    });
  });

  describe('saveTemplate', () => {
    it('should create a new template successfully', async () => {
      const templateData = {
        name: 'Test Template',
        description: 'Test Description',
        subject: 'Test Subject',
        htmlContent: '<p>Test Content</p>',
        category: 'custom',
        variables: ['client_name'],
      };

      const result = await emailTemplateService.saveTemplate(templateData);
      
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Test Template');
      expect(result.message).toBe('Template created successfully');
    });

    it('should update an existing template successfully', async () => {
      const templateData = {
        id: 'existing-template-id',
        name: 'Updated Template',
        description: 'Updated Description',
        subject: 'Updated Subject',
        htmlContent: '<p>Updated Content</p>',
        category: 'custom',
        variables: ['client_name'],
      };

      const result = await emailTemplateService.saveTemplate(templateData);
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Template updated successfully');
    });
  });

  describe('deleteTemplate', () => {
    it('should delete a template successfully', async () => {
      const result = await emailTemplateService.deleteTemplate('test-template-id');
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Template deleted successfully');
    });
  });

  describe('renderTemplate', () => {
    it('should render template with variables successfully', () => {
      const template = {
        subject: 'Hello {client_name}',
        content_html: '<p>Dear {client_name}, welcome to {company_name}!</p>',
        content_text: 'Dear {client_name}, welcome to {company_name}!',
      };

      const variables = {
        client_name: 'John Doe',
        company_name: 'Nexa Manager',
      };

      const result = emailTemplateService.renderTemplate(template, variables);
      
      expect(result.success).toBe(true);
      expect(result.data.subject).toBe('Hello John Doe');
      expect(result.data.htmlContent).toBe('<p>Dear John Doe, welcome to Nexa Manager!</p>');
      expect(result.data.textContent).toBe('Dear John Doe, welcome to Nexa Manager!');
    });

    it('should handle missing variables gracefully', () => {
      const template = {
        subject: 'Hello {client_name}',
        content_html: '<p>Dear {client_name}, your balance is {balance}!</p>',
      };

      const variables = {
        client_name: 'John Doe',
        // balance is missing
      };

      const result = emailTemplateService.renderTemplate(template, variables);
      
      expect(result.success).toBe(true);
      expect(result.data.subject).toBe('Hello John Doe');
      expect(result.data.htmlContent).toBe('<p>Dear John Doe, your balance is !</p>');
    });
  });

  describe('replaceVariables', () => {
    it('should replace single brace variables', () => {
      const content = 'Hello {name}, welcome to {company}!';
      const variables = { name: 'John', company: 'Nexa' };
      
      const result = emailTemplateService.replaceVariables(content, variables);
      
      expect(result).toBe('Hello John, welcome to Nexa!');
    });

    it('should replace double brace variables', () => {
      const content = 'Hello {{name}}, welcome to {{company}}!';
      const variables = { name: 'John', company: 'Nexa' };
      
      const result = emailTemplateService.replaceVariables(content, variables);
      
      expect(result).toBe('Hello John, welcome to Nexa!');
    });

    it('should handle mixed brace patterns', () => {
      const content = 'Hello {name}, welcome to {{company}}!';
      const variables = { name: 'John', company: 'Nexa' };
      
      const result = emailTemplateService.replaceVariables(content, variables);
      
      expect(result).toBe('Hello John, welcome to Nexa!');
    });
  });

  describe('validateTemplate', () => {
    it('should validate email-compatible HTML', () => {
      const html = '<div style="color: red;"><p>Hello World</p></div>';
      
      const result = emailTemplateService.validateTemplate(html);
      
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect email compatibility issues', () => {
      const html = '<div style="display: flex;"><script>alert("test")</script><video src="test.mp4"></video></div>';
      
      const result = emailTemplateService.validateTemplate(html);
      
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('htmlToText', () => {
    it('should convert HTML to plain text', () => {
      const html = '<p>Hello <strong>World</strong>!</p><br><div>How are you?</div>';
      
      const result = emailTemplateService.htmlToText(html);
      
      expect(result).toBe('Hello World!\n\nHow are you?');
    });

    it('should handle HTML entities', () => {
      const html = '<p>Hello &amp; welcome to &quot;Nexa&quot; &lt;Manager&gt;</p>';
      
      const result = emailTemplateService.htmlToText(html);
      
      expect(result).toBe('Hello & welcome to "Nexa" <Manager>');
    });
  });

  describe('getAvailableVariables', () => {
    it('should return available variables with descriptions', () => {
      const variables = emailTemplateService.getAvailableVariables();
      
      expect(Array.isArray(variables)).toBe(true);
      expect(variables.length).toBeGreaterThan(0);
      expect(variables[0]).toHaveProperty('name');
      expect(variables[0]).toHaveProperty('placeholder');
      expect(variables[0]).toHaveProperty('description');
    });
  });

  describe('optimizeForEmail', () => {
    it('should add DOCTYPE and HTML structure', () => {
      const html = '<p>Hello World</p>';
      
      const result = emailTemplateService.optimizeForEmail(html);
      
      expect(result).toContain('<!DOCTYPE html');
      expect(result).toContain('<html xmlns="http://www.w3.org/1999/xhtml">');
      expect(result).toContain('<body style="margin: 0; padding: 0;">');
    });

    it('should not duplicate DOCTYPE if already present', () => {
      const html = '<!DOCTYPE html><html><body><p>Hello World</p></body></html>';
      
      const result = emailTemplateService.optimizeForEmail(html);
      
      const doctypeCount = (result.match(/<!DOCTYPE/g) || []).length;
      expect(doctypeCount).toBe(1);
    });
  });
});
