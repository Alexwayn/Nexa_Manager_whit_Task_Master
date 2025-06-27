import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@lib/supabaseClient';
import { PlusIcon, PencilIcon, TrashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import UserRoleManager from './UserRoleManager';

const RolesAndPermissionsSettings = ({ showNotification }) => {
  const { t } = useTranslation('settings');
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: rolesData, error: rolesError } = await supabase.from('roles').select('*, permissions(*)');
      if (rolesError) throw rolesError;
      setRoles(rolesData);

      const { data: permissionsData, error: permissionsError } = await supabase.from('permissions').select('*');
      if (permissionsError) throw permissionsError;
      setPermissions(permissionsData);

    } catch (error) {
      console.error('Error fetching roles and permissions:', error);
      showNotification(t('rolesAndPermissions.alerts.loadError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
  };

  const handleDeleteRole = async (roleId) => {
    if (window.confirm(t('rolesAndPermissions.alerts.confirmDelete'))) {
      try {
        const { error } = await supabase.from('roles').delete().match({ id: roleId });
        if (error) throw error;
        showNotification(t('rolesAndPermissions.alerts.deleteSuccess'), 'success');
        fetchData();
      } catch (error) {
        console.error('Error deleting role:', error);
        showNotification(t('rolesAndPermissions.alerts.deleteFailure'), 'error');
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('rolesAndPermissions.title')}</h2>
          <p className="mt-1 text-sm text-gray-600">{t('rolesAndPermissions.description')}</p>
        </div>
        <button onClick={() => setEditingRole({ name: '', description: '', permissions: [] })} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          {t('rolesAndPermissions.addRole')}
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('rolesAndPermissions.table.role')}</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('rolesAndPermissions.table.permissions')}</th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">{t('common.actions')}</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {roles.map((role) => (
              <tr key={role.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{role.name}</div>
                  <div className="text-sm text-gray-500">{role.description}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.map(p => <span key={p.id} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">{p.name}</span>)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleEditRole(role)} className="text-blue-600 hover:text-blue-900 mr-4"><PencilIcon className="h-5 w-5" /></button>
                  <button onClick={() => handleDeleteRole(role.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="h-5 w-5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingRole && 
        <RoleEditor 
          role={editingRole} 
          permissions={permissions} 
          onClose={() => setEditingRole(null)} 
          onSave={() => { fetchData(); setEditingRole(null); }} 
          showNotification={showNotification} 
        />
      }

      <div className="pt-8">
        <UserRoleManager showNotification={showNotification} />
      </div>
    </div>
  );
};

const RoleEditor = ({ role, permissions, onClose, onSave, showNotification }) => {
  const { t } = useTranslation('settings');
  const [formData, setFormData] = useState(role);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData(role);
  }, [role]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (permissionId) => {
    setFormData(prev => {
      const existingPermissions = prev.permissions.map(p => p.id);
      if (existingPermissions.includes(permissionId)) {
        return { ...prev, permissions: prev.permissions.filter(p => p.id !== permissionId) };
      } else {
        const permissionToAdd = permissions.find(p => p.id === permissionId);
        return { ...prev, permissions: [...prev.permissions, permissionToAdd] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let savedRole;
      const { permissions: rolePermissions, ...roleData } = formData;
      
      if (roleData.id) { // Update existing role
        const { data, error } = await supabase.from('roles').update(roleData).match({ id: roleData.id }).select();
        if (error) throw error;
        savedRole = data[0];
      } else { // Create new role
        const { data, error } = await supabase.from('roles').insert(roleData).select();
        if (error) throw error;
        savedRole = data[0];
      }

      // Sync permissions
      const { error: deleteError } = await supabase.from('role_permissions').delete().match({ role_id: savedRole.id });
      if (deleteError) throw deleteError;

      const newPermissions = rolePermissions.map(p => ({ role_id: savedRole.id, permission_id: p.id }));
      const { error: insertError } = await supabase.from('role_permissions').insert(newPermissions);
      if (insertError) throw insertError;

      showNotification(t('rolesAndPermissions.alerts.saveSuccess'), 'success');
      onSave();
    } catch (error) {
      console.error('Error saving role:', error);
      showNotification(t('rolesAndPermissions.alerts.saveFailure'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{formData.id ? t('rolesAndPermissions.editRole') : t('rolesAndPermissions.addRole')}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">{t('rolesAndPermissions.roleName.label')}</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} className="mt-1 block w-full" required />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">{t('rolesAndPermissions.roleDescription.label')}</label>
            <textarea name="description" id="description" value={formData.description} onChange={handleInputChange} rows="3" className="mt-1 block w-full"></textarea>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">{t('rolesAndPermissions.permissions')}</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {permissions.map(p => (
                <div key={p.id} className="flex items-center">
                  <input 
                    type="checkbox" 
                    id={`perm-${p.id}`} 
                    checked={formData.permissions.some(fp => fp.id === p.id)} 
                    onChange={() => handlePermissionChange(p.id)} 
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor={`perm-${p.id}`} className="ml-2 block text-sm text-gray-900">{p.name}</label>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">{t('common.cancel')}</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300">
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RolesAndPermissionsSettings;