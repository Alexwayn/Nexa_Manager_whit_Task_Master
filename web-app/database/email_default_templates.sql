-- Default Email Templates for Business Communications
-- This script inserts system email templates that will be available to all users

-- Insert default system email templates
INSERT INTO email_templates (name, category, subject, content_text, content_html, variables, is_system, user_id) VALUES

-- Invoice Templates
('Invoice Notification', 'invoice', 'Invoice {{invoice_number}} - {{company_name}}', 
'Dear {{client_name}},

We hope this email finds you well. Please find attached invoice {{invoice_number}} for the services provided.

Invoice Details:
- Invoice Number: {{invoice_number}}
- Issue Date: {{issue_date}}
- Due Date: {{due_date}}
- Total Amount: {{total_amount}} {{currency}}

Payment can be made via:
{{payment_methods}}

If you have any questions regarding this invoice, please don''t hesitate to contact us.

Thank you for your business!

Best regards,
{{sender_name}}
{{company_name}}
{{contact_info}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">Invoice {{invoice_number}}</h2>
  <p>Dear {{client_name}},</p>
  <p>We hope this email finds you well. Please find attached invoice {{invoice_number}} for the services provided.</p>
  
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #495057;">Invoice Details</h3>
    <ul style="list-style: none; padding: 0;">
      <li><strong>Invoice Number:</strong> {{invoice_number}}</li>
      <li><strong>Issue Date:</strong> {{issue_date}}</li>
      <li><strong>Due Date:</strong> {{due_date}}</li>
      <li><strong>Total Amount:</strong> {{total_amount}} {{currency}}</li>
    </ul>
  </div>
  
  <p><strong>Payment can be made via:</strong><br>{{payment_methods}}</p>
  
  <p>If you have any questions regarding this invoice, please don''t hesitate to contact us.</p>
  
  <p>Thank you for your business!</p>
  
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
    <p>Best regards,<br>
    <strong>{{sender_name}}</strong><br>
    {{company_name}}<br>
    {{contact_info}}</p>
  </div>
</div>',
'[
  {"name": "client_name", "label": "Client Name", "type": "text", "required": true, "description": "Name of the client"},
  {"name": "invoice_number", "label": "Invoice Number", "type": "text", "required": true, "description": "Invoice number"},
  {"name": "issue_date", "label": "Issue Date", "type": "date", "required": true, "description": "Invoice issue date"},
  {"name": "due_date", "label": "Due Date", "type": "date", "required": true, "description": "Payment due date"},
  {"name": "total_amount", "label": "Total Amount", "type": "number", "required": true, "description": "Invoice total amount"},
  {"name": "currency", "label": "Currency", "type": "text", "default_value": "EUR", "required": true, "description": "Currency code"},
  {"name": "payment_methods", "label": "Payment Methods", "type": "text", "required": true, "description": "Available payment methods"},
  {"name": "sender_name", "label": "Sender Name", "type": "text", "required": true, "description": "Name of the sender"},
  {"name": "company_name", "label": "Company Name", "type": "text", "required": true, "description": "Company name"},
  {"name": "contact_info", "label": "Contact Information", "type": "text", "required": true, "description": "Contact information"}
]'::jsonb, true, '00000000-0000-0000-0000-000000000000'),

-- Quote Templates
('Quote Proposal', 'quote', 'Quote {{quote_number}} - {{company_name}}',
'Dear {{client_name}},

Thank you for your interest in our services. Please find attached our detailed quote {{quote_number}} for your project.

Quote Details:
- Quote Number: {{quote_number}}
- Issue Date: {{issue_date}}
- Valid Until: {{valid_until}}
- Total Amount: {{total_amount}} {{currency}}

This quote includes:
{{quote_items}}

Terms and Conditions:
{{terms_conditions}}

We look forward to working with you on this project. Please let us know if you have any questions or need any clarifications.

Best regards,
{{sender_name}}
{{company_name}}
{{contact_info}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">Quote {{quote_number}}</h2>
  <p>Dear {{client_name}},</p>
  <p>Thank you for your interest in our services. Please find attached our detailed quote {{quote_number}} for your project.</p>
  
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #495057;">Quote Details</h3>
    <ul style="list-style: none; padding: 0;">
      <li><strong>Quote Number:</strong> {{quote_number}}</li>
      <li><strong>Issue Date:</strong> {{issue_date}}</li>
      <li><strong>Valid Until:</strong> {{valid_until}}</li>
      <li><strong>Total Amount:</strong> {{total_amount}} {{currency}}</li>
    </ul>
  </div>
  
  <div style="margin: 20px 0;">
    <h3 style="color: #495057;">This quote includes:</h3>
    <div>{{quote_items}}</div>
  </div>
  
  <div style="margin: 20px 0;">
    <h3 style="color: #495057;">Terms and Conditions:</h3>
    <div>{{terms_conditions}}</div>
  </div>
  
  <p>We look forward to working with you on this project. Please let us know if you have any questions or need any clarifications.</p>
  
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
    <p>Best regards,<br>
    <strong>{{sender_name}}</strong><br>
    {{company_name}}<br>
    {{contact_info}}</p>
  </div>
</div>',
'[
  {"name": "client_name", "label": "Client Name", "type": "text", "required": true, "description": "Name of the client"},
  {"name": "quote_number", "label": "Quote Number", "type": "text", "required": true, "description": "Quote number"},
  {"name": "issue_date", "label": "Issue Date", "type": "date", "required": true, "description": "Quote issue date"},
  {"name": "valid_until", "label": "Valid Until", "type": "date", "required": true, "description": "Quote validity date"},
  {"name": "total_amount", "label": "Total Amount", "type": "number", "required": true, "description": "Quote total amount"},
  {"name": "currency", "label": "Currency", "type": "text", "default_value": "EUR", "required": true, "description": "Currency code"},
  {"name": "quote_items", "label": "Quote Items", "type": "text", "required": true, "description": "List of quoted items/services"},
  {"name": "terms_conditions", "label": "Terms & Conditions", "type": "text", "required": true, "description": "Terms and conditions"},
  {"name": "sender_name", "label": "Sender Name", "type": "text", "required": true, "description": "Name of the sender"},
  {"name": "company_name", "label": "Company Name", "type": "text", "required": true, "description": "Company name"},
  {"name": "contact_info", "label": "Contact Information", "type": "text", "required": true, "description": "Contact information"}
]'::jsonb, true, '00000000-0000-0000-0000-000000000000'),

-- Payment Reminder Templates
('Payment Reminder', 'reminder', 'Payment Reminder - Invoice {{invoice_number}}',
'Dear {{client_name}},

We hope you are doing well. This is a friendly reminder that invoice {{invoice_number}} is now due for payment.

Invoice Details:
- Invoice Number: {{invoice_number}}
- Original Due Date: {{due_date}}
- Amount Due: {{amount_due}} {{currency}}
- Days Overdue: {{days_overdue}}

We understand that sometimes invoices can be overlooked, so we wanted to bring this to your attention.

Payment can be made via:
{{payment_methods}}

If you have already made this payment, please disregard this reminder. If you have any questions or concerns regarding this invoice, please contact us immediately.

Thank you for your prompt attention to this matter.

Best regards,
{{sender_name}}
{{company_name}}
{{contact_info}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #d73527;">Payment Reminder</h2>
  <p>Dear {{client_name}},</p>
  <p>We hope you are doing well. This is a friendly reminder that invoice {{invoice_number}} is now due for payment.</p>
  
  <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
    <h3 style="margin-top: 0; color: #856404;">Invoice Details</h3>
    <ul style="list-style: none; padding: 0;">
      <li><strong>Invoice Number:</strong> {{invoice_number}}</li>
      <li><strong>Original Due Date:</strong> {{due_date}}</li>
      <li><strong>Amount Due:</strong> {{amount_due}} {{currency}}</li>
      <li><strong>Days Overdue:</strong> {{days_overdue}}</li>
    </ul>
  </div>
  
  <p>We understand that sometimes invoices can be overlooked, so we wanted to bring this to your attention.</p>
  
  <p><strong>Payment can be made via:</strong><br>{{payment_methods}}</p>
  
  <p>If you have already made this payment, please disregard this reminder. If you have any questions or concerns regarding this invoice, please contact us immediately.</p>
  
  <p>Thank you for your prompt attention to this matter.</p>
  
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
    <p>Best regards,<br>
    <strong>{{sender_name}}</strong><br>
    {{company_name}}<br>
    {{contact_info}}</p>
  </div>
</div>',
'[
  {"name": "client_name", "label": "Client Name", "type": "text", "required": true, "description": "Name of the client"},
  {"name": "invoice_number", "label": "Invoice Number", "type": "text", "required": true, "description": "Invoice number"},
  {"name": "due_date", "label": "Due Date", "type": "date", "required": true, "description": "Original payment due date"},
  {"name": "amount_due", "label": "Amount Due", "type": "number", "required": true, "description": "Outstanding amount"},
  {"name": "currency", "label": "Currency", "type": "text", "default_value": "EUR", "required": true, "description": "Currency code"},
  {"name": "days_overdue", "label": "Days Overdue", "type": "number", "required": true, "description": "Number of days overdue"},
  {"name": "payment_methods", "label": "Payment Methods", "type": "text", "required": true, "description": "Available payment methods"},
  {"name": "sender_name", "label": "Sender Name", "type": "text", "required": true, "description": "Name of the sender"},
  {"name": "company_name", "label": "Company Name", "type": "text", "required": true, "description": "Company name"},
  {"name": "contact_info", "label": "Contact Information", "type": "text", "required": true, "description": "Contact information"}
]'::jsonb, true, '00000000-0000-0000-0000-000000000000'),

-- Thank You Templates
('Payment Confirmation', 'confirmation', 'Payment Received - Thank You!',
'Dear {{client_name}},

Thank you for your payment! We have successfully received your payment for invoice {{invoice_number}}.

Payment Details:
- Invoice Number: {{invoice_number}}
- Payment Amount: {{payment_amount}} {{currency}}
- Payment Date: {{payment_date}}
- Payment Method: {{payment_method}}

Your account is now up to date. We appreciate your business and look forward to continuing our partnership.

If you need a receipt or have any questions about this payment, please don''t hesitate to contact us.

Thank you for choosing {{company_name}}!

Best regards,
{{sender_name}}
{{company_name}}
{{contact_info}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #28a745;">Payment Received - Thank You!</h2>
  <p>Dear {{client_name}},</p>
  <p>Thank you for your payment! We have successfully received your payment for invoice {{invoice_number}}.</p>
  
  <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
    <h3 style="margin-top: 0; color: #155724;">Payment Details</h3>
    <ul style="list-style: none; padding: 0;">
      <li><strong>Invoice Number:</strong> {{invoice_number}}</li>
      <li><strong>Payment Amount:</strong> {{payment_amount}} {{currency}}</li>
      <li><strong>Payment Date:</strong> {{payment_date}}</li>
      <li><strong>Payment Method:</strong> {{payment_method}}</li>
    </ul>
  </div>
  
  <p>Your account is now up to date. We appreciate your business and look forward to continuing our partnership.</p>
  
  <p>If you need a receipt or have any questions about this payment, please don''t hesitate to contact us.</p>
  
  <p><strong>Thank you for choosing {{company_name}}!</strong></p>
  
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
    <p>Best regards,<br>
    <strong>{{sender_name}}</strong><br>
    {{company_name}}<br>
    {{contact_info}}</p>
  </div>
</div>',
'[
  {"name": "client_name", "label": "Client Name", "type": "text", "required": true, "description": "Name of the client"},
  {"name": "invoice_number", "label": "Invoice Number", "type": "text", "required": true, "description": "Invoice number"},
  {"name": "payment_amount", "label": "Payment Amount", "type": "number", "required": true, "description": "Payment amount received"},
  {"name": "currency", "label": "Currency", "type": "text", "default_value": "EUR", "required": true, "description": "Currency code"},
  {"name": "payment_date", "label": "Payment Date", "type": "date", "required": true, "description": "Date payment was received"},
  {"name": "payment_method", "label": "Payment Method", "type": "text", "required": true, "description": "Method of payment"},
  {"name": "sender_name", "label": "Sender Name", "type": "text", "required": true, "description": "Name of the sender"},
  {"name": "company_name", "label": "Company Name", "type": "text", "required": true, "description": "Company name"},
  {"name": "contact_info", "label": "Contact Information", "type": "text", "required": true, "description": "Contact information"}
]'::jsonb, true, '00000000-0000-0000-0000-000000000000'),

-- General Business Templates
('Meeting Follow-up', 'general', 'Follow-up from our meeting - {{meeting_date}}',
'Dear {{client_name}},

Thank you for taking the time to meet with us {{meeting_date}}. It was a pleasure discussing {{meeting_topic}} with you.

As discussed, here are the key points from our meeting:
{{meeting_summary}}

Next Steps:
{{next_steps}}

Timeline:
{{timeline}}

If you have any questions or need clarification on any of the points discussed, please don''t hesitate to reach out.

We look forward to moving forward with this project and will keep you updated on our progress.

Best regards,
{{sender_name}}
{{company_name}}
{{contact_info}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">Follow-up from our meeting</h2>
  <p>Dear {{client_name}},</p>
  <p>Thank you for taking the time to meet with us {{meeting_date}}. It was a pleasure discussing {{meeting_topic}} with you.</p>
  
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #495057;">Key Points from Our Meeting</h3>
    <div>{{meeting_summary}}</div>
  </div>
  
  <div style="background-color: #e3f2fd; padding: 20px; border-radius: 5px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #1565c0;">Next Steps</h3>
    <div>{{next_steps}}</div>
  </div>
  
  <div style="background-color: #fff3e0; padding: 20px; border-radius: 5px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #ef6c00;">Timeline</h3>
    <div>{{timeline}}</div>
  </div>
  
  <p>If you have any questions or need clarification on any of the points discussed, please don''t hesitate to reach out.</p>
  
  <p>We look forward to moving forward with this project and will keep you updated on our progress.</p>
  
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
    <p>Best regards,<br>
    <strong>{{sender_name}}</strong><br>
    {{company_name}}<br>
    {{contact_info}}</p>
  </div>
</div>',
'[
  {"name": "client_name", "label": "Client Name", "type": "text", "required": true, "description": "Name of the client"},
  {"name": "meeting_date", "label": "Meeting Date", "type": "date", "required": true, "description": "Date of the meeting"},
  {"name": "meeting_topic", "label": "Meeting Topic", "type": "text", "required": true, "description": "Main topic discussed"},
  {"name": "meeting_summary", "label": "Meeting Summary", "type": "text", "required": true, "description": "Key points from the meeting"},
  {"name": "next_steps", "label": "Next Steps", "type": "text", "required": true, "description": "Agreed next steps"},
  {"name": "timeline", "label": "Timeline", "type": "text", "required": true, "description": "Project timeline"},
  {"name": "sender_name", "label": "Sender Name", "type": "text", "required": true, "description": "Name of the sender"},
  {"name": "company_name", "label": "Company Name", "type": "text", "required": true, "description": "Company name"},
  {"name": "contact_info", "label": "Contact Information", "type": "text", "required": true, "description": "Contact information"}
]'::jsonb, true, '00000000-0000-0000-0000-000000000000');

-- Note: The user_id '00000000-0000-0000-0000-000000000000' is used for system templates
-- These templates will be available to all users but cannot be modified by them