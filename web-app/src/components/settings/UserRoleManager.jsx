import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@lib/supabaseClient';
import { useClerk } from '@clerk/clerk-react';

const UserRoleManager = ({ showNotification }) => {
  const { t } = useTranslation('settings');
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { session } = useClerk();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // This is a placeholder for fetching users.
      // In a real app, you would fetch users from your backend/Clerk.
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, full_name, email');
      if (usersError) throw usersError;

      const { data: rolesData, error: rolesError } = await supabase.from('roles').select('*');
      if (rolesError) throw rolesError;
      setRoles(rolesData);

      // Fetch user_roles and map them to users
      const { data: userRolesData, error: userRolesError } = await supabase
        .from('user_roles')
        .select('*');
      if (userRolesError) throw userRolesError;

      const usersWithRoles = usersData.map(user => {
        const userRole = userRolesData.find(ur => ur.user_id === user.id);
        return { ...user, role_id: userRole ? userRole.role_id : null };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching data:', error);
      showNotification(t('userRoleManager.alerts.loadError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRoleId) => {
    setSaving(true);
    try {
      // Upsert user role
      const { error } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role_id: newRoleId }, { onConflict: 'user_id' });
      if (error) throw error;

      // Update local state
      setUsers(users.map(u => (u.id === userId ? { ...u, role_id: newRoleId } : u)));
      showNotification(t('userRoleManager.alerts.updateSuccess'), 'success');
    } catch (error) {
      console.error('Error updating user role:', error);
      showNotification(t('userRoleManager.alerts.updateFailure'), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center p-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      <div>
        <h2 className='text-2xl font-bold text-gray-900'>{t('userRoleManager.title')}</h2>
        <p className='mt-1 text-sm text-gray-600'>{t('userRoleManager.description')}</p>
      </div>

      <div className='bg-white border border-gray-200 rounded-lg overflow-hidden'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead className='bg-gray-50'>
            <tr>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                {t('userRoleManager.table.user')}
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                {t('userRoleManager.table.role')}
              </th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {users.map(user => (
              <tr key={user.id}>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm font-medium text-gray-900'>{user.full_name}</div>
                  <div className='text-sm text-gray-500'>{user.email}</div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <select
                    value={user.role_id || ''}
                    onChange={e => handleRoleChange(user.id, e.target.value)}
                    disabled={saving}
                    className='mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md'
                  >
                    <option value=''>{t('userRoleManager.noRole')}</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserRoleManager;
