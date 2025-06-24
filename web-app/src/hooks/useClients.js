import { useState, useEffect } from 'react';
import { useAuth } from '@context/AuthContext';
import { supabase } from '@lib/supabaseClient';
import Logger from '@utils/Logger';

export function useClients() {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para generar un nuevo ID
  const generateId = () => Math.floor(100000 + Math.random() * 900000);

  // Función para obtener el nombre a mostrar
  const getDisplayName = (client) => {
    return client.full_name || client.name || 'Cliente';
  };

  // Función para recargar los clientes
  const refreshClients = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      Logger.info('Refreshing clients for user ID:', user.id);

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('full_name', { ascending: true });

      if (error) {
        Logger.error('Error refreshing clients:', error);
        setError('Error al cargar los clientes');
        return;
      }

      // Adapta los datos para compatibilidad frontend
      const adaptedData = (data || []).map((client) => ({
        ...client,
        name: client.full_name || client.name || 'Cliente',
      }));

      setClients(adaptedData);
      Logger.info('Clients refreshed successfully');
    } catch (err) {
      Logger.error('Exception refreshing clients:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // Función para crear un cliente
  const createClient = async (clientData) => {
    if (!user) return { success: false, error: 'Usuario no autenticado' };

    try {
      const newClient = {
        ...clientData,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase.from('clients').insert([newClient]).select().single();

      if (error) {
        Logger.error('Error creating client:', error);
        return { success: false, error: 'Error al crear el cliente' };
      }

      // Adapta los datos y actualiza la lista
      const adaptedClient = {
        ...data,
        name: data.full_name || data.name || 'Cliente',
      };

      setClients((prev) => [...prev, adaptedClient]);

      return { success: true, data: adaptedClient };
    } catch (err) {
      Logger.error('Exception creating client:', err);
      return { success: false, error: 'Error de conexión' };
    }
  };

  // Función para actualizar un cliente
  const updateClient = async (clientId, updates) => {
    if (!user) return { success: false, error: 'Usuario no autenticado' };

    try {
      const updatedData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('clients')
        .update(updatedData)
        .eq('id', clientId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        Logger.error('Error updating client:', error);
        return { success: false, error: 'Error al actualizar el cliente' };
      }

      // Adapta los datos y actualiza la lista
      const adaptedClient = {
        ...data,
        name: data.full_name || data.name || 'Cliente',
      };

      setClients((prev) => prev.map((client) => (client.id === clientId ? adaptedClient : client)));

      return { success: true, data: adaptedClient };
    } catch (err) {
      Logger.error('Exception updating client:', err);
      return { success: false, error: 'Error de conexión' };
    }
  };

  // Función para eliminar un cliente
  const deleteClient = async (clientId) => {
    if (!user) return { success: false, error: 'Usuario no autenticado' };

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)
        .eq('user_id', user.id);

      if (error) {
        Logger.error('Error deleting client:', error);
        return { success: false, error: 'Error al eliminar el cliente' };
      }

      // Actualiza la lista removiendo el cliente
      setClients((prev) => prev.filter((client) => client.id !== clientId));

      return { success: true };
    } catch (err) {
      Logger.error('Exception deleting client:', err);
      return { success: false, error: 'Error de conexión' };
    }
  };

  // Cargar clientes al inicializar
  useEffect(() => {
    if (user) {
      refreshClients();
    }
  }, [user]);

  return {
    clients,
    loading,
    error,
    refreshClients,
    createClient,
    updateClient,
    deleteClient,
    generateId,
    getDisplayName,
  };
}
