import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserBypass as useUser } from '@hooks/useClerkBypass';
import { securityService, ROLES, PERMISSIONS } from '../../lib/securityService';
import {
  UserGroupIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  UserIcon,
  CogIcon
} from '@heroicons/react/24/outline';

export default function UserRoleManagement({ showNotification }) {
  const { t } = useTranslation('settings');
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (user) {
      loadUserRole();
      loadUsers();
    }
  }, [user]);

  const loadUserRole = async () => {
    try {
      const role = await securityService.getUserRole(user.id);
      setCurrentUserRole(role);
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch from your user management system
      // For now, we'll use mock data
      const mockUsers = [
        {
          id: 'user_1',
          name: 'Alice Johnson',
          email: 'alice@example.com',
          role: ROLES.ADMIN,
          lastActive: new Date(Date.now() - 1000 * 60 * 30),
          status: 'active'
        },
        {
          id: 'user_2',
          name: 'Bob Smith',
          email: 'bob@example.com',
          role: ROLES.MANAGER,
          lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2),
          status: 'active'
        },
        {
          id: 'user_3',
          name: 'Carol Davis',
          email: 'carol@example.com',
          role: ROLES.USER,
          lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24),
          status: 'active'
        }
      ];
      setUsers(mockUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      showNotification?.('Error loading users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !selectedRole) return;

    setLoading(true);
    try {
      await securityService.updateUserRole(selectedUser.id, selectedRole, user.id);
      
      // Update local state
      setUsers(users.map(u => 
        u.id === selectedUser.id 
          ? { ...u, role: selectedRole }
          : u
      ));

      showNotification?.(`Role updated successfully for ${selectedUser.name}`, 'success');
      setShowRoleModal(false);
      setSelectedUser(null);
      setSelectedRole('');
    } catch (error) {
      console.error('Error updating role:', error);
      showNotification?.('Error updating user role', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openRoleModal = (userToEdit) => {
    setSelectedUser(userToEdit);
    setSelectedRole(userToEdit.role);
    setShowRoleModal(true);
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleDisplayName = (role) => {
    const roleNames = {
      [ROLES.SUPER_ADMIN]: 'Super Admin',
      [ROLES.ADMIN]: 'Administrator',
      [ROLES.MANAGER]: 'Manager',
      [ROLES.USER]: 'User',
      [ROLES.VIEWER]: 'Viewer'
    };
    return roleNames[role] || role;
  };

  const getRoleColor = (role) => {
    const colors = {
      [ROLES.SUPER_ADMIN]: 'bg-purple-100 text-purple-800',
      [ROLES.ADMIN]: 'bg-red-100 text-red-800',
      [ROLES.MANAGER]: 'bg-yellow-100 text-yellow-800',
      [ROLES.USER]: 'bg-blue-100 text-blue-800',
      [ROLES.VIEWER]: 'bg-gray-100 text-gray-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const canManageUsers = currentUserRole && 
    securityService.hasPermission(currentUserRole, PERMISSIONS.MANAGE_USERS);

  if (!canManageUsers) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
          <div>
            <h4 className="text-sm font-medium text-gray-900">
              {t('security.roles.noPermission', 'Insufficient Permissions')}
            </h4>
            <p className="text-sm text-gray-600">
              {t('security.roles.noPermissionDesc', 'You do not have permission to manage user roles.')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <UserGroupIcon className="w-6 h-6 text-blue-600" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">
                {t('security.roles.title', 'User Role Management')}
              </h4>
              <p className="text-sm text-gray-600">
                {t('security.roles.description', 'Manage user roles and permissions')}
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Your role: <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(currentUserRole)}`}>
              {getRoleDisplayName(currentUserRole)}
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t('security.roles.searchUsers', 'Search users...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('security.roles.table.user', 'User')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('security.roles.table.role', 'Role')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('security.roles.table.lastActive', 'Last Active')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('security.roles.table.status', 'Status')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('security.roles.table.actions', 'Actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{userItem.name}</div>
                          <div className="text-sm text-gray-500">{userItem.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(userItem.role)}`}>
                        {getRoleDisplayName(userItem.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Intl.DateTimeFormat('en-US', {
                        dateStyle: 'short',
                        timeStyle: 'short'
                      }).format(userItem.lastActive)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {userItem.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openRoleModal(userItem)}
                        className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                      >
                        <CogIcon className="w-4 h-4" />
                        <span>{t('security.roles.editRole', 'Edit Role')}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Assignment Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {t('security.roles.editRoleFor', 'Edit Role for')} {selectedUser.name}
                </h3>
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('security.roles.selectRole', 'Select Role')}
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Object.values(ROLES).map((role) => (
                      <option key={role} value={role}>
                        {getRoleDisplayName(role)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Role Permissions Preview */}
                <div className="bg-gray-50 p-3 rounded-md">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    {t('security.roles.permissions', 'Permissions')}
                  </h4>
                  <div className="space-y-1">
                    {securityService.getUserPermissions(selectedRole).slice(0, 5).map((permission) => (
                      <div key={permission} className="flex items-center space-x-2">
                        <CheckCircleIcon className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-gray-600">{permission.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                    {securityService.getUserPermissions(selectedRole).length > 5 && (
                      <div className="text-xs text-gray-500">
                        +{securityService.getUserPermissions(selectedRole).length - 5} more permissions
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleRoleChange}
                    disabled={loading || selectedRole === selectedUser.role}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
                  </button>
                  <button
                    onClick={() => setShowRoleModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    {t('common.cancel', 'Cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 