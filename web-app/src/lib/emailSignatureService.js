import { supabase } from '@lib/supabaseClient';
import Logger from '@utils/Logger';

class EmailSignatureService {
  constructor() {
    this.defaultTemplates = {
      simple: {
        name: 'Simple',
        html: `<div style="font-family: Arial, sans-serif; color: #333;">
  <div style="font-weight: bold;">{name}</div>
  <div>{title}</div>
  <div>{company}</div>
  <div style="margin-top: 10px;">
    <div>📧 {email}</div>
    <div>📞 {phone}</div>
  </div>
</div>`,
        variables: ['name', 'title', 'company', 'email', 'phone']
      },
      professional: {
        name: 'Professional',
        html: `<table style="font-family: Arial, sans-serif; font-size: 14px;">
  <tr>
    <td style="vertical-align: top; border-left: 3px solid #007bff; padding-left: 15px;">
      <div style="font-weight: bold; font-size: 16px; color: #333;">{name}</div>
      <div style="color: #666;">{title}</div>
      <div style="color: #666;">{company}</div>
      <div style="margin-top: 10px;">
        <div>Email: <a href="mailto:{email}" style="color: #007bff;">{email}</a></div>
        <div>Phone: {phone}</div>
      </div>
    </td>
  </tr>
</table>`,
        variables: ['name', 'title', 'company', 'email', 'phone']
      }
    };
  }

  async getSignatures(userId = null) {
    try {
      // For demo purposes, return mock data
      const mockSignatures = [
        {
          id: 1,
          name: 'Default Signature',
          html_content: this.defaultTemplates.professional.html,
          variables: {
            name: 'John Doe',
            title: 'Developer',
            company: 'Tech Corp',
            email: 'john@techcorp.com',
            phone: '+1 234 567 8900'
          },
          is_default: true,
          template_type: 'professional',
          created_at: new Date().toISOString()
        }
      ];

      return {
        success: true,
        data: mockSignatures
      };
    } catch (error) {
      Logger.error('Failed to get signatures', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createSignature(signatureData) {
    try {
      const signature = {
        id: Date.now(),
        ...signatureData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      Logger.info('Signature created successfully', { 
        signatureId: signature.id, 
        name: signature.name 
      });

      return {
        success: true,
        data: signature
      };
    } catch (error) {
      Logger.error('Failed to create signature', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  generateSignatureHtml(signature, variables = {}) {
    try {
      let html = signature.html_content;
      const allVariables = { ...signature.variables, ...variables };

      for (const [key, value] of Object.entries(allVariables)) {
        if (value) {
          const regex = new RegExp(`{${key}}`, 'g');
          html = html.replace(regex, value);
        }
      }

      // Clean up any remaining variable placeholders
      html = html.replace(/{[\w_]+}/g, '');

      return html;
    } catch (error) {
      Logger.error('Failed to generate signature HTML', { error: error.message });
      return signature.html_content;
    }
  }

  getTemplates() {
    return {
      success: true,
      data: Object.entries(this.defaultTemplates).map(([key, template]) => ({
        id: key,
        name: template.name,
        variables: template.variables,
        html: template.html
      }))
    };
  }
}

export default new EmailSignatureService(); 