import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { supabase, withUserContext } from '@/lib/supabaseClient';
// import Logger from '@/utils/Logger';

// Environment variable access that works in both Vite and Jest
const getEnvVar = (key, defaultValue = '') => {
  // In test environment, use process.env
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') {
    return process.env[key] || defaultValue;
  }
  
  // Try to access import.meta.env safely
  try {
    if (typeof window !== 'undefined' && window.importMeta && window.importMeta.env) {
      return window.importMeta.env[key] || defaultValue;
    }
  } catch (e) {
    // Ignore errors accessing import.meta
  }
  
  // Fallback to process.env if available
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  
  return defaultValue;
};

// Sample data for development/fallback
const SAMPLE_CLIENTS = [
  {
    id: 1,
    name: 'Alexandru Stepanenco',
    full_name: 'Alexandru Stepanenco',
    email: 'rinelox@gmail.com',
    phone: '+1 (555) 123-4567',
    industry: 'Technology',
    status: 'active',
    location: 'San Francisco, CA',
    city: 'San Francisco, CA',
    revenue: 55000,
    last_contact: '2024-12-29',
    created_at: '2024-01-15T10:30:00Z',
    notes: 'Important client for technology consulting',
  },
  {
    id: 2,
    name: 'Maria Rossi',
    full_name: 'Maria Rossi',
    email: 'maria.rossi@example.com',
    phone: '+39 333 456 7890',
    industry: 'Marketing',
    status: 'active',
    location: 'Milano, IT',
    city: 'Milano',
    revenue: 32000,
    last_contact: '2024-12-28',
    created_at: '2024-02-10T14:20:00Z',
    notes: 'Marketing specialist',
  },
  {
    id: 3,
    name: 'John Smith',
    full_name: 'John Smith',
    email: 'john.smith@company.com',
    phone: '+1 (555) 987-6543',
    industry: 'Finance',
    status: 'pending',
    location: 'New York, NY',
    city: 'New York',
    revenue: 78000,
    last_contact: '2024-12-27',
    created_at: '2024-03-05T09:15:00Z',
    notes: 'Financial consulting services',
  },
  {
    id: 4,
    name: 'Sophie Dubois',
    full_name: 'Sophie Dubois',
    email: 'sophie.dubois@paris.fr',
    phone: '+33 1 42 86 83 26',
    industry: 'Design',
    status: 'active',
    location: 'Paris, FR',
    city: 'Paris',
    revenue: 45000,
    last_contact: '2024-12-26',
    created_at: '2024-04-12T16:45:00Z',
    notes: 'Creative design agency',
  },
];

export function useClients() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { user } = useUser();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Simple helper - just use the regular supabase client for now
  const executeQuery = async queryFn => {
    try {
      return await queryFn(supabase);
    } catch (error) {
      console.error('Error executing query:', error);
      throw error;
    }
  };

  // Función para generar un nuevo ID
  const generateId = () => Math.floor(100000 + Math.random() * 900000);

  // Función para obtener el nombre a mostrar
  const getDisplayName = client => {
    return client.full_name || client.name || 'Cliente';
  };

  // Función para recargar los clientes
  const refreshClients = async () => {
    if (!user?.id || !isLoaded) return;

    setLoading(true);
    setError(null);

    try {
      // Logger.info('Refreshing clients for user ID:', user.id);

      // Use simple query with user_id filtering
      const result = await executeQuery(client =>
        client
          .from('clients')
          .select('*')
          .eq('user_id', user.id)
          .order('full_name', { ascending: true }),
      );

      if (result.error) {
        // Logger.error('Error refreshing clients:', result.error);
        // Use sample data as fallback
        console.log('Using sample data for development');
        setClients(SAMPLE_CLIENTS);
        setLoading(false);
        return;
      }

      // If no real clients exist, use sample data for development
      if (!result.data || result.data.length === 0) {
        console.log('No real clients found, using sample data for development');
        setClients(SAMPLE_CLIENTS);
        setLoading(false);
        return;
      }

      // Adapta los datos para compatibilidad frontend
      const adaptedData = (result.data || []).map(client => ({
        ...client,
        name: client.full_name || client.name || 'Cliente',
      }));

      setClients(adaptedData);
      // Logger.info('Clients refreshed successfully');
    } catch (err) {
      // Logger.error('Exception refreshing clients:', err);
      // Use sample data as fallback
      console.log('Exception occurred, using sample data for development');
      setClients(SAMPLE_CLIENTS);
    } finally {
      setLoading(false);
    }
  };

  // Función para crear un cliente
  const createClient = async clientData => {
    if (!user?.id || !isLoaded) return { success: false, error: 'Usuario no autenticado' };

    try {
      console.log('Creating client with data:', clientData);
      console.log('User ID:', user.id);

      const newClient = {
        // Essential fields only for testing
        full_name: clientData.name || clientData.full_name || '',
        email: clientData.email || '',
        phone: clientData.phone || '',
        address: clientData.address || '',
        notes: clientData.notes || '',
        user_id: user.id, // Explicit user_id
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('New client object:', newClient);
      console.log('User ID in object:', newClient.user_id);

      // Simple insert with user_id (trigger issue is now fixed)
      console.log('Attempting insert with user_id...');
      console.log('Supabase URL:', getEnvVar('VITE_SUPABASE_URL'));
      console.log('Supabase Key exists:', !!getEnvVar('VITE_SUPABASE_ANON_KEY'));
      console.log(
        'Supabase Key first 20 chars:',
        getEnvVar('VITE_SUPABASE_ANON_KEY')?.substring(0, 20),
      );

      // Test with a direct fetch to bypass Supabase client
      try {
        console.log('Testing direct fetch...');
        const directResponse = await fetch(`${getEnvVar('VITE_SUPABASE_URL')}/rest/v1/clients`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: getEnvVar('VITE_SUPABASE_ANON_KEY'),
            Prefer: 'return=representation',
          },
          body: JSON.stringify(newClient),
        });

        console.log('Direct fetch response status:', directResponse.status);
        console.log(
          'Direct fetch response headers:',
          Object.fromEntries(directResponse.headers.entries()),
        );

        if (directResponse.ok) {
          const directData = await directResponse.json();
          console.log('Direct fetch success:', directData);
          return { success: true, data: Array.isArray(directData) ? directData[0] : directData };
        } else {
          const directError = await directResponse.text();
          console.log('Direct fetch error:', directError);
        }
      } catch (directFetchError) {
        console.error('Direct fetch failed:', directFetchError);
      }

      const result = await executeQuery(client =>
        client.from('clients').insert([newClient]).select().single(),
      );

      if (result.error) {
        console.error('Insert failed:', result.error);
        return { success: false, error: `Error al crear el cliente: ${String(result?.error?.message || result?.error || 'Unknown error')}` };
      }

      console.log('Client created successfully:', result.data);

      // Adapta los datos y actualiza la lista
      const adaptedClient = {
        ...result.data,
        name: result.data.full_name || result.data.name || 'Cliente',
      };

      setClients(prev => [...prev, adaptedClient]);

      return { success: true, data: adaptedClient };
    } catch (err) {
      console.error('Exception creating client:', err);
      return { success: false, error: `Error de conexión: ${String(err?.message || err || 'Unknown error')}` };
    }
  };

  // Función para actualizar un cliente
  const updateClient = async (clientId, updates) => {
    if (!user?.id || !isLoaded) return { success: false, error: 'Usuario no autenticado' };

    try {
      const updatedData = {
        ...updates,
        // Map 'name' field to 'full_name' for database compatibility
        full_name: updates.name || updates.full_name,
        updated_at: new Date().toISOString(),
      };

      // Remove the original 'name' field to avoid confusion
      if (updatedData.name && updatedData.full_name) {
        delete updatedData.name;
      }

      const result = await withUserContext(user.id, async () => {
        return await supabase
          .from('clients')
          .update(updatedData)
          .eq('id', clientId)
          .select()
          .single();
      });

      if (result.error) {
        // Logger.error('Error updating client:', result.error);
        return { success: false, error: 'Error al actualizar el cliente' };
      }

      // Adapta los datos y actualiza la lista
      const adaptedClient = {
        ...result.data,
        name: result.data.full_name || result.data.name || 'Cliente',
      };

      setClients(prev => prev.map(client => (client.id === clientId ? adaptedClient : client)));

      return { success: true, data: adaptedClient };
    } catch (err) {
      // Logger.error('Exception updating client:', err);
      return { success: false, error: 'Error de conexión' };
    }
  };

  // Función para eliminar un cliente
  const deleteClient = async clientId => {
    if (!user?.id || !isLoaded) return { success: false, error: 'Usuario no autenticado' };

    try {
      const result = await withUserContext(user.id, async () => {
        return await supabase.from('clients').delete().eq('id', clientId);
      });

      if (result.error) {
        // Logger.error('Error deleting client:', result.error);
        return { success: false, error: 'Error al eliminar el cliente' };
      }

      // Actualiza la lista removiendo el cliente
      setClients(prev => prev.filter(client => client.id !== clientId));

      return { success: true };
    } catch (err) {
      // Logger.error('Exception deleting client:', err);
      return { success: false, error: 'Error de conexión' };
    }
  };

  // Cargar clientes al inicializar
  useEffect(() => {
    if (user?.id && isLoaded) {
      refreshClients();
    } else if (isLoaded) {
      // Use sample data for development when not authenticated
      console.log('User not authenticated, using sample data for development');
      setClients(SAMPLE_CLIENTS);
      setLoading(false);
    }
  }, [user?.id, isLoaded]);

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
