import { supabase } from './supabaseClient';
import { executeWithClerkAuth } from './supabaseClerkClient';
import logger from './logger';

// User roles and permissions management
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
  VIEWER: 'viewer'
};

export const PERMISSIONS = {
  // User management
  MANAGE_USERS: 'manage_users',
  VIEW_USERS: 'view_users',
  DELETE_USERS: 'delete_users',
  
  // Settings management
  MANAGE_SECURITY_SETTINGS: 'manage_security_settings',
  VIEW_SECURITY_SETTINGS: 'view_security_settings',
  BACKUP_SETTINGS: 'backup_settings',
  RESTORE_SETTINGS: 'restore_settings',
  
  // Audit logs
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  EXPORT_AUDIT_LOGS: 'export_audit_logs',
  
  // Financial data
  MANAGE_FINANCIAL_DATA: 'manage_financial_data',
  VIEW_FINANCIAL_DATA: 'view_financial_data',
  EXPORT_FINANCIAL_DATA: 'export_financial_data',
  
  // Organization management
  MANAGE_ORGANIZATION: 'manage_organization',
  VIEW_ORGANIZATION: 'view_organization'
};

// Role-permission mapping
const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.ADMIN]: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_SECURITY_SETTINGS,
    PERMISSIONS.VIEW_SECURITY_SETTINGS,
    PERMISSIONS.BACKUP_SETTINGS,
    PERMISSIONS.RESTORE_SETTINGS,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.EXPORT_AUDIT_LOGS,
    PERMISSIONS.MANAGE_FINANCIAL_DATA,
    PERMISSIONS.VIEW_FINANCIAL_DATA,
    PERMISSIONS.EXPORT_FINANCIAL_DATA,
    PERMISSIONS.MANAGE_ORGANIZATION,
    PERMISSIONS.VIEW_ORGANIZATION
  ],
  [ROLES.MANAGER]: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.VIEW_SECURITY_SETTINGS,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.MANAGE_FINANCIAL_DATA,
    PERMISSIONS.VIEW_FINANCIAL_DATA,
    PERMISSIONS.EXPORT_FINANCIAL_DATA,
    PERMISSIONS.VIEW_ORGANIZATION
  ],
  [ROLES.USER]: [
    PERMISSIONS.VIEW_SECURITY_SETTINGS,
    PERMISSIONS.VIEW_FINANCIAL_DATA,
    PERMISSIONS.VIEW_ORGANIZATION
  ],
  [ROLES.VIEWER]: [
    PERMISSIONS.VIEW_FINANCIAL_DATA,
    PERMISSIONS.VIEW_ORGANIZATION
  ]
};

class SecurityService {
  // Role and permission management
  async getUserRole(userId) {
    try {
      // Use Clerk authentication with Supabase
      const { data, error } = await executeWithClerkAuth((supabase) =>
        supabase
          .from('user_roles')
          .select(`
            role_id,
            roles!inner(
              name
            )
          `)
          .eq('user_id', userId)
          .single()
      );

      if (error) {
        if (error.code === 'PGRST116') {
          // No role found, return default
          return ROLES.USER;
        }
        throw error;
      }

      return data?.roles?.name || ROLES.USER;
    } catch (error) {
      logger.error('Error getting user role:', error);
      return ROLES.USER; // Default role
    }
  }

  async updateUserRole(userId, newRole, updatedBy) {
    try {
      // Validate role
      if (!Object.values(ROLES).includes(newRole)) {
        throw new Error('Invalid role specified');
      }

      // First, get the role ID from the role name
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', newRole)
        .single();

      if (roleError) throw roleError;
      if (!roleData) throw new Error(`Role '${newRole}' not found`);

      // Get current role for logging
      const currentRole = await this.getUserRole(userId);

      const { data, error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role_id: roleData.id,
          updated_by: updatedBy,
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) throw error;

      // Log the role change
      await this.logSecurityEvent({
        action: 'ROLE_UPDATED',
        userId: updatedBy,
        targetUserId: userId,
        details: { newRole, previousRole: currentRole },
        severity: 'HIGH'
      });

      return data;
    } catch (error) {
      logger.error('Error updating user role:', error);
      throw error;
    }
  }

  getUserPermissions(role) {
    return ROLE_PERMISSIONS[role] || [];
  }

  hasPermission(userRole, permission) {
    const permissions = this.getUserPermissions(userRole);
    return permissions.includes(permission);
  }

  // Enhanced audit logging
  async logSecurityEvent(eventData) {
    try {
      const {
        action,
        userId,
        targetUserId = null,
        details = {},
        severity = 'LOW',
        ipAddress = null,
        userAgent = null
      } = eventData;

      const { error } = await supabase
        .from('security_audit_logs')
        .insert({
          action,
          user_id: userId,
          target_user_id: targetUserId,
          details: JSON.stringify(details),
          severity,
          ip_address: ipAddress,
          user_agent: userAgent,
          timestamp: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      logger.error('Error logging security event:', error);
    }
  }

  async getAuditLogs(filters = {}) {
    try {
      // Use Clerk authentication with Supabase
      const { data, error } = await executeWithClerkAuth((supabase) => {
        let query = supabase
          .from('security_audit_logs')
          .select('*')
          .order('timestamp', { ascending: false });

        // Apply filters
        if (filters.userId) {
          query = query.eq('user_id', filters.userId);
        }

        if (filters.action) {
          query = query.eq('action', filters.action);
        }

        if (filters.severity) {
          query = query.eq('severity', filters.severity);
        }

        if (filters.startDate) {
          query = query.gte('timestamp', filters.startDate);
        }

        if (filters.endDate) {
          query = query.lte('timestamp', filters.endDate);
        }

        if (filters.limit) {
          query = query.limit(filters.limit);
        }

        return query;
      });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error getting audit logs:', error);
      throw error;
    }
  }

  // 2FA Management
  async enable2FA(userId, secret, verificationCode) {
    try {
      // Verify the code first
      const isValid = await this.verify2FACode(secret, verificationCode);
      if (!isValid) {
        throw new Error('Invalid verification code');
      }

      const { error } = await supabase
        .from('user_2fa_settings')
        .upsert({
          user_id: userId,
          secret: secret,
          enabled: true,
          enabled_at: new Date().toISOString()
        });

      if (error) throw error;

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();
      await this.saveBackupCodes(userId, backupCodes);

      // Log the event
      await this.logSecurityEvent({
        action: '2FA_ENABLED',
        userId,
        severity: 'HIGH'
      });

      return { success: true, backupCodes };
    } catch (error) {
      logger.error('Error enabling 2FA:', error);
      throw error;
    }
  }

  async disable2FA(userId) {
    try {
      const { error } = await supabase
        .from('user_2fa_settings')
        .update({ enabled: false, disabled_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;

      // Clear backup codes
      await this.clearBackupCodes(userId);

      // Log the event
      await this.logSecurityEvent({
        action: '2FA_DISABLED',
        userId,
        severity: 'HIGH'
      });

      return { success: true };
    } catch (error) {
      logger.error('Error disabling 2FA:', error);
      throw error;
    }
  }

  async verify2FACode(secret, code) {
    // Implementation for TOTP verification
    // This would typically use a library like 'speakeasy'
    try {
      // Mock implementation - replace with actual TOTP verification
      return code === '123456'; // For demo purposes
    } catch (error) {
      logger.error('Error verifying 2FA code:', error);
      return false;
    }
  }

  generateBackupCodes(count = 8) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      codes.push(Math.random().toString(36).substring(2, 8).toUpperCase());
    }
    return codes;
  }

  async saveBackupCodes(userId, codes) {
    try {
      const { error } = await supabase
        .from('user_backup_codes')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      const backupCodeData = codes.map(code => ({
        user_id: userId,
        code: code,
        used: false,
        created_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from('user_backup_codes')
        .insert(backupCodeData);

      if (insertError) throw insertError;
    } catch (error) {
      logger.error('Error saving backup codes:', error);
      throw error;
    }
  }

  async clearBackupCodes(userId) {
    try {
      const { error } = await supabase
        .from('user_backup_codes')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      logger.error('Error clearing backup codes:', error);
      throw error;
    }
  }

  // Backup and restore functionality
  async backupSecuritySettings(userId) {
    try {
      // Get user's security settings
      const [roleData, twoFAData, sessionData] = await Promise.all([
        supabase.from('user_roles').select('*').eq('user_id', userId),
        supabase.from('user_2fa_settings').select('*').eq('user_id', userId),
        supabase.from('user_sessions').select('*').eq('user_id', userId)
      ]);

      const backup = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        userId,
        settings: {
          role: roleData.data?.[0] || null,
          twoFA: twoFAData.data?.[0] || null,
          sessions: sessionData.data || []
        }
      };

      // Store backup
      const { data, error } = await supabase
        .from('security_backups')
        .insert({
          user_id: userId,
          backup_data: JSON.stringify(backup),
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      // Log the backup
      await this.logSecurityEvent({
        action: 'SECURITY_BACKUP_CREATED',
        userId,
        severity: 'MEDIUM'
      });

      return { success: true, backupId: data[0]?.id };
    } catch (error) {
      logger.error('Error creating security backup:', error);
      throw error;
    }
  }

  async restoreSecuritySettings(userId, backupId) {
    try {
      // Get backup data
      const { data: backup, error } = await supabase
        .from('security_backups')
        .select('backup_data')
        .eq('id', backupId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      const backupData = JSON.parse(backup.backup_data);

      // Restore settings (carefully)
      if (backupData.settings.role) {
        await this.updateUserRole(userId, backupData.settings.role.role, userId);
      }

      // Note: 2FA and sessions should be handled more carefully in production
      // This is a simplified implementation

      // Log the restore
      await this.logSecurityEvent({
        action: 'SECURITY_BACKUP_RESTORED',
        userId,
        details: { backupId },
        severity: 'HIGH'
      });

      return { success: true };
    } catch (error) {
      logger.error('Error restoring security backup:', error);
      throw error;
    }
  }

  // Session management
  async getUserSessions(userId) {
    try {
      // Use Clerk authentication with Supabase
      const { data, error } = await executeWithClerkAuth((supabase) =>
        supabase
          .from('user_sessions')
          .select('*')
          .eq('user_id', userId)
          .order('last_active', { ascending: false })
      );

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error getting user sessions:', error);
      return [];
    }
  }

  async revokeSession(userId, sessionId) {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ revoked: true, revoked_at: new Date().toISOString() })
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) throw error;

      // Log the session revocation
      await this.logSecurityEvent({
        action: 'SESSION_REVOKED',
        userId,
        details: { sessionId },
        severity: 'MEDIUM'
      });

      return { success: true };
    } catch (error) {
      logger.error('Error revoking session:', error);
      throw error;
    }
  }

  async revokeAllSessions(userId, exceptCurrentSession = null) {
    try {
      let query = supabase
        .from('user_sessions')
        .update({ revoked: true, revoked_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (exceptCurrentSession) {
        query = query.neq('id', exceptCurrentSession);
      }

      const { error } = await query;
      if (error) throw error;

      // Log the mass session revocation
      await this.logSecurityEvent({
        action: 'ALL_SESSIONS_REVOKED',
        userId,
        severity: 'HIGH'
      });

      return { success: true };
    } catch (error) {
      logger.error('Error revoking all sessions:', error);
      throw error;
    }
  }
}

export const securityService = new SecurityService();
export default securityService;