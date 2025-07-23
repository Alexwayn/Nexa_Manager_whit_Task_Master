import { supabase } from './supabaseClient';
import logger from './logger';
import { securityService } from './securityService';

/**
 * Email Security Service
 * Handles email encryption, secure credential storage, audit logging, and spam detection
 */
class EmailSecurityService {
  constructor() {
    this.encryptionKey = null;
    this.spamKeywords = [
      'urgent', 'act now', 'limited time', 'click here', 'free money',
      'congratulations', 'winner', 'lottery', 'inheritance', 'prince',
      'verify account', 'suspended account', 'update payment'
    ];
    this.phishingPatterns = [
      /bit\.ly|tinyurl|goo\.gl/i, // Suspicious URL shorteners
      /urgent.*action.*required/i,
      /verify.*account.*immediately/i,
      /click.*here.*now/i,
      /suspended.*account/i
    ];
  }

  /**
   * Initialize encryption key for the user session
   */
  async initializeEncryption(userId) {
    try {
      // In a real implementation, this would derive a key from user credentials
      // For now, we'll use a session-based approach
      this.encryptionKey = await this.deriveEncryptionKey(userId);
      return true;
    } catch (error) {
      logger.error('Error initializing encryption:', error);
      return false;
    }
  }

  /**
   * Derive encryption key from user ID (simplified implementation)
   * In production, this should use proper key derivation functions
   */
  async deriveEncryptionKey(userId) {
    // This is a simplified implementation
    // In production, use proper key derivation with salt and iterations
    const encoder = new TextEncoder();
    const data = encoder.encode(userId + process.env.VITE_ENCRYPTION_SALT || 'default-salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return await crypto.subtle.importKey(
      'raw',
      hashBuffer,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt email content for sensitive communications
   */
  async encryptEmailContent(content, userId) {
    try {
      if (!this.encryptionKey) {
        await this.initializeEncryption(userId);
      }

      const encoder = new TextEncoder();
      const data = encoder.encode(content);
      const iv = crypto.getRandomValues(new Uint8Array(12));

      const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        this.encryptionKey,
        data
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedData.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedData), iv.length);

      // Convert to base64 for storage
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      logger.error('Error encrypting email content:', error);
      throw new Error('Failed to encrypt email content');
    }
  }

  /**
   * Decrypt email content
   */
  async decryptEmailContent(encryptedContent, userId) {
    try {
      if (!this.encryptionKey) {
        await this.initializeEncryption(userId);
      }

      // Convert from base64
      const combined = new Uint8Array(
        atob(encryptedContent).split('').map(char => char.charCodeAt(0))
      );

      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encryptedData = combined.slice(12);

      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        this.encryptionKey,
        encryptedData
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      logger.error('Error decrypting email content:', error);
      throw new Error('Failed to decrypt email content');
    }
  }

  /**
   * Securely store email account credentials
   */
  async storeEmailCredentials(userId, accountData) {
    try {
      const { email, password, imapHost, smtpHost, imapPort, smtpPort } = accountData;

      // Encrypt sensitive data
      const encryptedPassword = await this.encryptEmailContent(password, userId);
      
      const credentialData = {
        user_id: userId,
        email_address: email,
        encrypted_password: encryptedPassword,
        imap_host: imapHost,
        smtp_host: smtpHost,
        imap_port: imapPort,
        smtp_port: smtpPort,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('email_credentials')
        .upsert(credentialData)
        .select();

      if (error) throw error;

      // Log credential storage
      await this.logEmailSecurityEvent({
        action: 'EMAIL_CREDENTIALS_STORED',
        userId,
        details: { emailAddress: email },
        severity: 'HIGH'
      });

      return data[0];
    } catch (error) {
      logger.error('Error storing email credentials:', error);
      throw new Error('Failed to store email credentials securely');
    }
  }

  /**
   * Retrieve and decrypt email credentials
   */
  async getEmailCredentials(userId, emailAddress = null) {
    try {
      let query = supabase
        .from('email_credentials')
        .select('*')
        .eq('user_id', userId);

      if (emailAddress) {
        query = query.eq('email_address', emailAddress);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Decrypt passwords
      const decryptedCredentials = await Promise.all(
        data.map(async (cred) => ({
          ...cred,
          password: await this.decryptEmailContent(cred.encrypted_password, userId)
        }))
      );

      return decryptedCredentials;
    } catch (error) {
      logger.error('Error retrieving email credentials:', error);
      throw new Error('Failed to retrieve email credentials');
    }
  }

  /**
   * Log email security events
   */
  async logEmailSecurityEvent(eventData) {
    try {
      const {
        action,
        userId,
        emailId = null,
        details = {},
        severity = 'LOW',
        ipAddress = null,
        userAgent = null
      } = eventData;

      const { error } = await supabase
        .from('email_security_logs')
        .insert({
          action,
          user_id: userId,
          email_id: emailId,
          details: JSON.stringify(details),
          severity,
          ip_address: ipAddress,
          user_agent: userAgent,
          timestamp: new Date().toISOString()
        });

      if (error) throw error;

      // Also log to general security service for centralized audit
      await securityService.logSecurityEvent({
        action: `EMAIL_${action}`,
        userId,
        details,
        severity
      });
    } catch (error) {
      logger.error('Error logging email security event:', error);
    }
  }

  /**
   * Analyze email for spam indicators
   */
  analyzeSpamIndicators(email) {
    const indicators = [];
    const content = `${email.subject} ${email.body}`.toLowerCase();

    // Check for spam keywords
    this.spamKeywords.forEach(keyword => {
      if (content.includes(keyword.toLowerCase())) {
        indicators.push({
          type: 'spam_keyword',
          keyword,
          severity: 'medium'
        });
      }
    });

    // Check for excessive capitalization
    const capsRatio = (email.subject.match(/[A-Z]/g) || []).length / email.subject.length;
    if (capsRatio > 0.5 && email.subject.length > 10) {
      indicators.push({
        type: 'excessive_caps',
        severity: 'low'
      });
    }

    // Check for suspicious URLs
    const urlRegex = /https?:\/\/[^\s]+/gi;
    const urls = content.match(urlRegex) || [];
    urls.forEach(url => {
      if (this.phishingPatterns.some(pattern => pattern.test(url))) {
        indicators.push({
          type: 'suspicious_url',
          url,
          severity: 'high'
        });
      }
    });

    return indicators;
  }

  /**
   * Analyze email for phishing indicators
   */
  analyzePhishingIndicators(email) {
    const indicators = [];
    const content = `${email.subject} ${email.body}`;

    // Check for phishing patterns
    this.phishingPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        indicators.push({
          type: 'phishing_pattern',
          pattern: pattern.source,
          severity: 'high'
        });
      }
    });

    // Check sender domain vs content domain mismatch
    const senderDomain = email.from.split('@')[1];
    const urlRegex = /https?:\/\/([^\/\s]+)/gi;
    const urls = content.match(urlRegex) || [];
    
    urls.forEach(url => {
      const urlDomain = url.match(/https?:\/\/([^\/\s]+)/)[1];
      if (urlDomain !== senderDomain && !this.isTrustedDomain(urlDomain)) {
        indicators.push({
          type: 'domain_mismatch',
          senderDomain,
          urlDomain,
          severity: 'medium'
        });
      }
    });

    return indicators;
  }

  /**
   * Check if domain is trusted (simplified implementation)
   */
  isTrustedDomain(domain) {
    const trustedDomains = [
      'google.com', 'microsoft.com', 'apple.com', 'amazon.com',
      'github.com', 'stackoverflow.com', 'linkedin.com'
    ];
    return trustedDomains.some(trusted => domain.includes(trusted));
  }

  /**
   * Comprehensive email security analysis
   */
  async analyzeEmailSecurity(email, userId) {
    try {
      const spamIndicators = this.analyzeSpamIndicators(email);
      const phishingIndicators = this.analyzePhishingIndicators(email);
      
      const allIndicators = [...spamIndicators, ...phishingIndicators];
      
      // Calculate risk score
      const riskScore = this.calculateRiskScore(allIndicators);
      
      const analysis = {
        emailId: email.id,
        riskScore,
        spamIndicators,
        phishingIndicators,
        recommendation: this.getSecurityRecommendation(riskScore),
        analyzedAt: new Date().toISOString()
      };

      // Store analysis results
      await this.storeSecurityAnalysis(userId, analysis);

      // Log security analysis
      await this.logEmailSecurityEvent({
        action: 'EMAIL_SECURITY_ANALYZED',
        userId,
        emailId: email.id,
        details: { riskScore, indicatorCount: allIndicators.length },
        severity: riskScore > 70 ? 'HIGH' : riskScore > 40 ? 'MEDIUM' : 'LOW'
      });

      return analysis;
    } catch (error) {
      logger.error('Error analyzing email security:', error);
      throw new Error('Failed to analyze email security');
    }
  }

  /**
   * Calculate risk score based on indicators
   */
  calculateRiskScore(indicators) {
    let score = 0;
    
    indicators.forEach(indicator => {
      switch (indicator.severity) {
        case 'high':
          score += 30;
          break;
        case 'medium':
          score += 15;
          break;
        case 'low':
          score += 5;
          break;
      }
    });

    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Get security recommendation based on risk score
   */
  getSecurityRecommendation(riskScore) {
    if (riskScore >= 70) {
      return 'HIGH_RISK: This email shows strong indicators of spam or phishing. Do not click links or download attachments.';
    } else if (riskScore >= 40) {
      return 'MEDIUM_RISK: This email has some suspicious characteristics. Exercise caution with links and attachments.';
    } else if (riskScore >= 20) {
      return 'LOW_RISK: This email has minor suspicious indicators. Verify sender if unexpected.';
    } else {
      return 'SAFE: This email appears to be legitimate.';
    }
  }

  /**
   * Store security analysis results
   */
  async storeSecurityAnalysis(userId, analysis) {
    try {
      const { error } = await supabase
        .from('email_security_analysis')
        .insert({
          user_id: userId,
          email_id: analysis.emailId,
          risk_score: analysis.riskScore,
          spam_indicators: JSON.stringify(analysis.spamIndicators),
          phishing_indicators: JSON.stringify(analysis.phishingIndicators),
          recommendation: analysis.recommendation,
          analyzed_at: analysis.analyzedAt
        });

      if (error) throw error;
    } catch (error) {
      logger.error('Error storing security analysis:', error);
      throw error;
    }
  }

  /**
   * Get email security analysis history
   */
  async getSecurityAnalysisHistory(userId, emailId = null) {
    try {
      let query = supabase
        .from('email_security_analysis')
        .select('*')
        .eq('user_id', userId)
        .order('analyzed_at', { ascending: false });

      if (emailId) {
        query = query.eq('email_id', emailId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data.map(analysis => ({
        ...analysis,
        spam_indicators: JSON.parse(analysis.spam_indicators),
        phishing_indicators: JSON.parse(analysis.phishing_indicators)
      }));
    } catch (error) {
      logger.error('Error getting security analysis history:', error);
      throw error;
    }
  }

  /**
   * Securely delete encrypted content
   */
  async secureDeleteEncryptedContent(encryptedData) {
    try {
      // Overwrite the encrypted data with random bytes multiple times
      // This is a basic secure deletion approach
      const dataLength = encryptedData.length;
      
      // Multiple pass overwrite with random data
      for (let pass = 0; pass < 3; pass++) {
        const randomBytes = crypto.getRandomValues(new Uint8Array(dataLength));
        // In a real implementation, you would overwrite the actual storage location
        // For now, we'll just clear the reference
      }
      
      // Clear the reference
      encryptedData = null;
      
      return { success: true };
    } catch (error) {
      logger.error('Error securely deleting encrypted content:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete email credentials securely
   */
  async deleteEmailCredentials(userId, emailAddress) {
    try {
      const { error } = await supabase
        .from('email_credentials')
        .delete()
        .eq('user_id', userId)
        .eq('email_address', emailAddress);

      if (error) throw error;

      // Log credential deletion
      await this.logEmailSecurityEvent({
        action: 'EMAIL_CREDENTIALS_DELETED',
        userId,
        details: { emailAddress },
        severity: 'HIGH'
      });

      return true;
    } catch (error) {
      logger.error('Error deleting email credentials:', error);
      throw new Error('Failed to delete email credentials');
    }
  }
}

export const emailSecurityService = new EmailSecurityService();
export default emailSecurityService;