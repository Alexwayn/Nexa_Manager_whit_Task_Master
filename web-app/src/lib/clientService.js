import { supabase, setCurrentUserId } from '@lib/supabaseClient';
import Logger from '@utils/Logger';
import { errorHandler, notify } from '@lib/uiUtils';

/**
 * @class ClientService
 * @description Comprehensive service for managing client operations with Supabase and Clerk authentication.
 */
class ClientService {
  constructor() {
    this.tableName = 'clients';
  }

  /**
   * Get current user from Clerk context
   * @returns {Object|null} Current user object from Clerk
   */
  getCurrentUser() {
    // Get user from Clerk context - this should be set by the calling component
    // For now, we'll use window.clerk if available, but ideally this should be passed as parameter
    if (typeof window !== 'undefined' && window.clerk?.user) {
      return {
        id: window.clerk.user.id,
        email: window.clerk.user.primaryEmailAddress?.emailAddress,
      };
    }
    return null;
  }

  /**
   * Execute query with user context
   * @param {string} userId - Clerk user ID
   * @param {Function} queryFn - Function that executes the query
   * @returns {Promise} Query result
   */
  async executeWithUserContext(userId, queryFn) {
    try {
      // Set current user ID for RLS policies
      await setCurrentUserId(userId);
      return await queryFn();
    } catch (error) {
      Logger.error('Error executing query with user context:', error);
      throw error;
    }
  }

  /**
   * Retrieves all clients for the current user with optional filtering and pagination.
   * @param {Object} [options={}] - Query options.
   * @param {string} [options.searchQuery=''] - Search term for filtering clients.
   * @param {string} [options.sortBy='full_name'] - Field to sort by.
   * @param {boolean} [options.ascending=true] - Sort direction.
   * @param {number|null} [options.limit=null] - Number of records to return.
   * @param {number} [options.offset=0] - Number of records to skip.
   * @param {Object} [options.filters={}] - Additional key-value filters.
   * @param {string} [options.userId] - Clerk user ID (optional, will auto-detect if not provided)
   * @returns {Promise<{data: Array<Object>, count: number, error: Object|null}>} An object containing the client data, total count, and a potential error.
   */
  async getClients(options = {}) {
    try {
      const {
        searchQuery = '',
        sortBy = 'full_name',
        ascending = true,
        limit = null,
        offset = 0,
        filters = {},
        userId: providedUserId,
      } = options;

      // Get current user
      const user = this.getCurrentUser();
      const userId = providedUserId || user?.id;

      if (!userId) {
        throw new Error('User not authenticated - no Clerk user ID available');
      }

      return await this.executeWithUserContext(userId, async () => {
        // Start building the query
        let query = supabase
          .from(this.tableName)
          .select('*', { count: 'exact' })
          .eq('user_id', userId);

        // Apply search filter if provided
        if (searchQuery.trim()) {
          const searchTerm = `%${searchQuery.toLowerCase()}%`;
          query = query.or(
            `full_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm},address.ilike.${searchTerm},city.ilike.${searchTerm}`,
          );
        }

        // Apply additional filters
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            query = query.eq(key, value);
          }
        });

        // Apply sorting
        query = query.order(sortBy, { ascending });

        // Apply pagination if specified
        if (limit) {
          query = query.range(offset, offset + limit - 1);
        }

        const { data, error, count } = await query;

        if (error) {
          throw error;
        }

        // Adapt data for frontend compatibility
        const adaptedData = (data || []).map(client => ({
          ...client,
          name: client.full_name || client.name || 'Client',
          displayName: this.getDisplayName(client),
        }));

        return {
          data: adaptedData,
          count: count || 0,
          error: null,
        };
      });
    } catch (error) {
      Logger.error('Error fetching clients:', error);
      errorHandler.handleSupabaseError(error, 'fetching clients');
      return {
        data: [],
        count: 0,
        error,
      };
    }
  }

  /**
   * Retrieves a single client by its ID.
   * @param {string} clientId - The unique identifier of the client.
   * @param {string} [userId] - Clerk user ID (optional, will auto-detect if not provided)
   * @returns {Promise<{data: Object|null, error: Object|null}>} An object containing the client data or a potential error.
   */
  async getClientById(clientId, userId = null) {
    try {
      // Get current user
      const user = this.getCurrentUser();
      const currentUserId = userId || user?.id;

      if (!currentUserId) {
        throw new Error('User not authenticated - no Clerk user ID available');
      }

      return await this.executeWithUserContext(currentUserId, async () => {
        const { data, error } = await supabase
          .from(this.tableName)
          .select('*')
          .eq('id', clientId)
          .eq('user_id', currentUserId)
          .single();

        if (error) {
          throw error;
        }

        // Adapt data for frontend
        const adaptedData = data
          ? {
              ...data,
              name: data.full_name || data.name || 'Client',
              displayName: this.getDisplayName(data),
            }
          : null;

        return {
          data: adaptedData,
          error: null,
        };
      });
    } catch (error) {
      Logger.error('Error fetching client:', error);
      errorHandler.handleSupabaseError(error, 'fetching client');
      return {
        data: null,
        error,
      };
    }
  }

  /**
   * Creates a new client.
   * @param {Object} clientData - The data for the new client.
   * @param {string} [userId] - Clerk user ID (optional, will auto-detect if not provided)
   * @returns {Promise<{data: Object|null, error: Object|null}>} An object containing the newly created client's data or a potential error.
   */
  async createClient(clientData, userId = null) {
    try {
      // Get current user
      const user = this.getCurrentUser();
      const currentUserId = userId || user?.id;

      if (!currentUserId) {
        throw new Error('User not authenticated - no Clerk user ID available');
      }

      // Validate required fields
      const validationError = this.validateClientData(clientData);
      if (validationError) {
        throw new Error(validationError);
      }

      // Check for duplicates
      const duplicateCheck = await this.checkForDuplicates(clientData, currentUserId);
      if (duplicateCheck.isDuplicate) {
        throw new Error(`Client already exists: ${duplicateCheck.reason}`);
      }

      // Prepare data for database
      const dbData = this.prepareClientDataForDB(clientData, currentUserId);

      return await this.executeWithUserContext(currentUserId, async () => {
        const { data, error } = await supabase
          .from(this.tableName)
          .insert([dbData])
          .select()
          .single();

        if (error) {
          throw error;
        }

        // Adapt data for frontend
        const adaptedData = {
          ...data,
          name: data.full_name || data.name || 'Client',
          displayName: this.getDisplayName(data),
        };

        notify.success('Client created successfully');

        return {
          data: adaptedData,
          error: null,
        };
      });
    } catch (error) {
      Logger.error('Error creating client:', error);
      errorHandler.handleSupabaseError(error, 'creating client');
      return {
        data: null,
        error,
      };
    }
  }

  /**
   * Updates an existing client.
   * @param {string} clientId - The unique identifier of the client to update.
   * @param {Object} clientData - The new data for the client.
   * @param {string} [userId] - Clerk user ID (optional, will auto-detect if not provided)
   * @returns {Promise<{data: Object|null, error: Object|null}>} An object containing the updated client's data or a potential error.
   */
  async updateClient(clientId, clientData, userId = null) {
    try {
      // Get current user
      const user = this.getCurrentUser();
      const currentUserId = userId || user?.id;

      if (!currentUserId) {
        throw new Error('User not authenticated - no Clerk user ID available');
      }

      // Validate required fields
      const validationError = this.validateClientData(clientData, true);
      if (validationError) {
        throw new Error(validationError);
      }

      // Check for duplicates, excluding the current client
      const duplicateCheck = await this.checkForDuplicates(clientData, currentUserId, clientId);
      if (duplicateCheck.isDuplicate) {
        throw new Error(`Client already exists: ${duplicateCheck.reason}`);
      }

      // Prepare data for database update
      const dbData = this.prepareClientDataForDB(clientData, currentUserId, true);

      return await this.executeWithUserContext(currentUserId, async () => {
        const { data, error } = await supabase
          .from(this.tableName)
          .update(dbData)
          .eq('id', clientId)
          .eq('user_id', currentUserId)
          .select()
          .single();

        if (error) {
          throw error;
        }

        // Adapt data for frontend
        const adaptedData = {
          ...data,
          name: data.full_name || data.name || 'Client',
          displayName: this.getDisplayName(data),
        };

        notify.success('Client updated successfully');

        return {
          data: adaptedData,
          error: null,
        };
      });
    } catch (error) {
      Logger.error('Error updating client:', error);
      errorHandler.handleSupabaseError(error, 'updating client');
      return {
        data: null,
        error,
      };
    }
  }

  /**
   * Deletes a client by its ID after checking for related data.
   * @param {string} clientId - The unique identifier of the client to delete.
   * @param {string} [userId] - Clerk user ID (optional, will auto-detect if not provided)
   * @returns {Promise<{success: boolean, error: Object|null}>} An object indicating the success of the operation.
   */
  async deleteClient(clientId, userId = null) {
    try {
      // Get current user
      const user = this.getCurrentUser();
      const currentUserId = userId || user?.id;

      if (!currentUserId) {
        throw new Error('User not authenticated - no Clerk user ID available');
      }

      // Check if client has related data (invoices, quotes, etc.)
      const hasRelatedData = await this.checkClientHasRelatedData(clientId);
      if (hasRelatedData.hasData) {
        let message = 'Cannot delete client. They have related:';
        if (hasRelatedData.reason.includes('invoices')) message += ' invoices';
        if (hasRelatedData.reason.includes('quotes')) message += ' quotes';
        if (hasRelatedData.reason.includes('appointments')) message += ' appointments';
        message += '.';
        throw new Error(message);
      }

      return await this.executeWithUserContext(currentUserId, async () => {
        const { error } = await supabase
          .from(this.tableName)
          .delete()
          .eq('id', clientId)
          .eq('user_id', currentUserId);

        if (error) {
          throw error;
        }

        notify.success('Client deleted successfully');

        return {
          success: true,
          error: null,
        };
      });
    } catch (error) {
      Logger.error('Error deleting client:', error);
      errorHandler.handleSupabaseError(error, 'deleting client');
      return {
        success: false,
        error,
      };
    }
  }

  /**
   * Searches for clients based on various criteria.
   * @param {Object} searchParams - The search criteria.
   * @param {string} searchParams.query - General search query.
   * @param {string} searchParams.name - Name filter.
   * @param {string} searchParams.email - Email filter.
   * @param {string} searchParams.phone - Phone filter.
   * @param {string} searchParams.city - City filter.
   * @param {string} [searchParams.userId] - Clerk user ID (optional, will auto-detect if not provided)
   * @returns {Promise<{data: Array<Object>, count: number, error: Object|null}>} An object containing the search results.
   */
  async searchClients(searchParams) {
    try {
      // Get current user
      const user = this.getCurrentUser();
      const userId = searchParams.userId || user?.id;

      if (!userId) {
        throw new Error('User not authenticated - no Clerk user ID available');
      }

      return await this.executeWithUserContext(userId, async () => {
        let query = supabase
          .from(this.tableName)
          .select('*', { count: 'exact' })
          .eq('user_id', userId);

        // Apply specific field filters
        if (searchParams.name) {
          query = query.ilike('full_name', `%${searchParams.name}%`);
        }
        if (searchParams.email) {
          query = query.ilike('email', `%${searchParams.email}%`);
        }
        if (searchParams.phone) {
          query = query.ilike('phone', `%${searchParams.phone}%`);
        }
        if (searchParams.city) {
          query = query.ilike('city', `%${searchParams.city}%`);
        }

        // Apply general search if provided
        if (
          searchParams.query &&
          !searchParams.name &&
          !searchParams.email &&
          !searchParams.phone &&
          !searchParams.city
        ) {
          const searchTerm = `%${searchParams.query.toLowerCase()}%`;
          query = query.or(
            `full_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm},address.ilike.${searchTerm},city.ilike.${searchTerm}`,
          );
        }

        query = query.order('full_name', { ascending: true });

        const { data, error, count } = await query;

        if (error) {
          throw error;
        }

        // Adapt data for frontend compatibility
        const adaptedData = (data || []).map(client => ({
          ...client,
          name: client.full_name || client.name || 'Client',
          displayName: this.getDisplayName(client),
        }));

        return {
          data: adaptedData,
          count: count || 0,
          error: null,
        };
      });
    } catch (error) {
      Logger.error('Error searching clients:', error);
      errorHandler.handleSupabaseError(error, 'searching clients');
      return {
        data: [],
        count: 0,
        error,
      };
    }
  }

  /**
   * Retrieves the history (invoices, quotes, and appointments) for a specific client.
   * @param {string} clientId - The unique identifier of the client.
   * @param {string} [userId] - Clerk user ID (optional, will auto-detect if not provided)
   * @returns {Promise<{data: Object, error: null|Object}>} An object containing the client's history.
   */
  async getClientHistory(clientId, userId = null) {
    try {
      // Get current user
      const user = this.getCurrentUser();
      const currentUserId = userId || user?.id;

      if (!currentUserId) {
        throw new Error('User not authenticated - no Clerk user ID available');
      }

      const clientResult = await this.getClientById(clientId, currentUserId);
      if (clientResult.error) {
        throw clientResult.error;
      }

      return await this.executeWithUserContext(currentUserId, async () => {
        // Get related invoices
        const { data: invoices, error: invoicesError } = await supabase
          .from('invoices')
          .select('*')
          .eq('client_id', clientId)
          .eq('user_id', currentUserId)
          .order('created_at', { ascending: false });

        if (invoicesError) {
          Logger.warn('Error fetching invoices:', invoicesError);
        }

        // Get related quotes
        const { data: quotes, error: quotesError } = await supabase
          .from('quotes')
          .select('*')
          .eq('client_id', clientId)
          .eq('user_id', currentUserId)
          .order('created_at', { ascending: false });

        if (quotesError) {
          Logger.warn('Error fetching quotes:', quotesError);
        }

        // Get related appointments
        const { data: appointments, error: appointmentsError } = await supabase
          .from('appointments')
          .select('*')
          .eq('client_id', clientId)
          .eq('user_id', currentUserId)
          .order('created_at', { ascending: false });

        if (appointmentsError) {
          Logger.warn('Error fetching appointments:', appointmentsError);
        }

        return {
          data: {
            client: clientResult.data,
            invoices: invoices || [],
            quotes: quotes || [],
            appointments: appointments || [],
            totalInvoices: invoices ? invoices.length : 0,
            totalQuotes: quotes ? quotes.length : 0,
            totalAppointments: appointments ? appointments.length : 0,
            totalRevenue: invoices
              ? invoices.reduce((sum, inv) => sum + (parseFloat(inv.total_amount) || 0), 0)
              : 0,
          },
          error: null,
        };
      });
    } catch (error) {
      Logger.error('Error fetching client history:', error);
      errorHandler.handleSupabaseError(error, 'fetching client history');
      return {
        data: null,
        error,
      };
    }
  }

  /**
   * Validates client data before creation or update.
   * @param {Object} clientData - The client data to validate.
   * @param {boolean} [isUpdate=false] - Flag indicating if this is an update operation.
   * @returns {string|null} An error message string if validation fails, otherwise null.
   */
  validateClientData(clientData, isUpdate = false) {
    if (!clientData.name || clientData.name.trim() === '') {
      return 'Client name is required';
    }

    if (clientData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientData.email)) {
      return 'Invalid email';
    }

    if (clientData.name.length > 100) {
      return 'Name cannot exceed 100 characters';
    }

    if (clientData.email && clientData.email.length > 100) {
      return 'Email cannot exceed 100 characters';
    }

    if (clientData.phone && clientData.phone.length > 20) {
      return 'Phone cannot exceed 20 characters';
    }

    return null;
  }

  /**
   * Checks if a client with the same identifying information already exists.
   * @param {Object} clientData - The data of the client to check.
   * @param {string} userId - The ID of the current user.
   * @param {string|null} [excludeId=null] - A client ID to exclude from the duplicate check (used for updates).
   * @returns {Promise<{isDuplicate: boolean, reason: string}>} An object indicating if a duplicate was found and why.
   */
  async checkForDuplicates(clientData, userId, excludeId = null) {
    try {
      let query = supabase
        .from(this.tableName)
        .select('id, full_name, email')
        .eq('user_id', userId);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      // Check for exact name match
      if (clientData.name) {
        query = query.eq('full_name', clientData.name.trim());
      }

      const { data: nameMatches, error: nameError } = await query;

      if (nameError) {
        Logger.warn('Error checking name duplicates:', nameError);
      }

      if (nameMatches && nameMatches.length > 0) {
        return {
          isDuplicate: true,
          reason: 'client with same name already exists',
        };
      }

      // Check for email match if email is provided
      if (clientData.email && clientData.email.trim()) {
        const { data: emailMatches, error: emailError } = await supabase
          .from(this.tableName)
          .select('id, full_name, email')
          .eq('user_id', userId)
          .eq('email', clientData.email.trim())
          .neq('id', excludeId || '');

        if (emailError) {
          Logger.warn('Error checking email duplicates:', emailError);
        }

        if (emailMatches && emailMatches.length > 0) {
          return {
            isDuplicate: true,
            reason: 'client with same email already exists',
          };
        }
      }

      return {
        isDuplicate: false,
        reason: '',
      };
    } catch (error) {
      Logger.error('Error checking duplicates:', error);
      return {
        isDuplicate: false,
        reason: '',
      };
    }
  }

  /**
   * Checks if a client has any related invoices or quotes.
   * @param {string} clientId - The unique identifier of the client.
   * @returns {Promise<{hasData: boolean, reason: string}>} An object indicating the presence of related data.
   */
  async checkClientHasRelatedData(clientId) {
    try {
      // Check for invoices
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('id')
        .eq('client_id', clientId)
        .limit(1);

      if (invoicesError) {
        Logger.warn('Error checking invoices:', invoicesError);
      }

      if (invoices && invoices.length > 0) {
        return {
          hasData: true,
          reason: 'client has linked invoices',
        };
      }

      // Check for quotes
      const { data: quotes, error: quotesError } = await supabase
        .from('quotes')
        .select('id')
        .eq('client_id', clientId)
        .limit(1);

      if (quotesError) {
        Logger.warn('Error checking quotes:', quotesError);
      }

      if (quotes && quotes.length > 0) {
        return {
          hasData: true,
          reason: 'client has linked quotes',
        };
      }

      // Check for appointments
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('id')
        .eq('client_id', clientId)
        .limit(1);

      if (appointmentsError) {
        Logger.warn('Error checking appointments:', appointmentsError);
      }

      if (appointments && appointments.length > 0) {
        return {
          hasData: true,
          reason: 'client has linked appointments',
        };
      }

      return {
        hasData: false,
        reason: '',
      };
    } catch (error) {
      Logger.error('Error checking related data:', error);
      return {
        hasData: false,
        reason: '',
      };
    }
  }

  /**
   * Prepares client data for insertion or update into the database.
   * @param {Object} clientData - The source client data.
   * @param {string} userId - The ID of the current user.
   * @param {boolean} [isUpdate=false] - Flag to indicate if this is for an update.
   * @returns {Object} The prepared data object for the database.
   */
  prepareClientDataForDB(clientData, userId, isUpdate = false) {
    const dbData = {
      full_name: clientData.name.trim(),
      email: clientData.email ? clientData.email.trim() : null,
      phone: clientData.phone ? clientData.phone.trim() : null,
      address: clientData.address ? clientData.address.trim() : null,
      city: clientData.city ? clientData.city.trim() : null,
      province: clientData.province ? clientData.province.trim() : null,
      postal_code: clientData.postal_code ? clientData.postal_code.trim() : null,
      vat_number: clientData.vat_number ? clientData.vat_number.trim() : null,
      fiscal_code: clientData.fiscal_code ? clientData.fiscal_code.trim() : null,
      notes: clientData.notes ? clientData.notes.trim() : null,
      updated_at: new Date().toISOString(),
    };

    if (!isUpdate) {
      dbData.user_id = userId;
      dbData.created_at = new Date().toISOString();
    }

    return dbData;
  }

  /**
   * Gets a display-friendly name for the client.
   * @param {Object} client - The client object.
   * @returns {string} The display name.
   */
  getDisplayName(client) {
    return client.full_name || client.name || 'Client';
  }

  /**
   * Exports a list of clients to a CSV formatted string.
   * @param {Array<Object>} clients - The list of clients to export.
   * @returns {string} The CSV formatted string.
   */
  exportToCSV(clients) {
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Address',
      'City',
      'Province',
      'Postal Code',
      'VAT Number',
      'Fiscal Code',
      'Notes',
      'Creation Date',
    ];

    const csvContent = [
      headers.join(','),
      ...clients.map(client =>
        [
          `"${client.full_name || ''}"`,
          `"${client.email || ''}"`,
          `"${client.phone || ''}"`,
          `"${client.address || ''}"`,
          `"${client.city || ''}"`,
          `"${client.province || ''}"`,
          `"${client.postal_code || ''}"`,
          `"${client.vat_number || ''}"`,
          `"${client.fiscal_code || ''}"`,
          `"${client.notes || ''}"`,
          `"${new Date(client.created_at).toLocaleDateString('en-US')}"`,
        ].join(','),
      ),
    ].join('\n');

    return csvContent;
  }

  /**
   * Imports clients from a CSV formatted string.
   * @param {string} csvContent - The CSV content to import.
   * @param {string} [userId] - Clerk user ID (optional, will auto-detect if not provided)
   * @returns {Promise<{success: boolean, imported: number, errors: Array<string>}>} The result of the import operation.
   */
  async importFromCSV(csvContent, userId = null) {
    try {
      // Get current user
      const user = this.getCurrentUser();
      const currentUserId = userId || user?.id;

      if (!currentUserId) {
        throw new Error('User not authenticated - no Clerk user ID available');
      }

      const lines = csvContent.split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

      const imported = [];
      const errors = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        try {
          const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());

          const clientData = {
            name: values[0] || '',
            email: values[1] || '',
            phone: values[2] || '',
            address: values[3] || '',
            city: values[4] || '',
            province: values[5] || '',
            postal_code: values[6] || '',
            vat_number: values[7] || '',
            fiscal_code: values[8] || '',
            notes: values[9] || '',
          };

          if (!clientData.name) {
            errors.push(`Row ${i + 1}: Name is required`);
            continue;
          }

          const result = await this.createClient(clientData, currentUserId);
          if (result.error) {
            errors.push(`Row ${i + 1}: ${result.error.message}`);
          } else {
            imported.push(result.data);
          }
        } catch (error) {
          errors.push(`Row ${i + 1}: ${error.message}`);
        }
      }

      return {
        success: true,
        imported: imported.length,
        errors,
      };
    } catch (error) {
      Logger.error('Error importing clients:', error);
      return {
        success: false,
        imported: 0,
        errors: [error.message],
      };
    }
  }

  /**
   * Get client metrics for dashboard (total, active, newThisMonth)
   * @param {Date} startDate - Start date for the period
   * @param {Date} endDate - End date for the period
   * @returns {Promise<{success: boolean, data: {total: number, active: number, newThisMonth: number}}>} Metrics
   */
  async getClientMetrics(startDate, endDate) {
    try {
      const user = this.getCurrentUser();
      const userId = user?.id;
      if (!userId) {
        throw new Error('User not authenticated - no Clerk user ID available');
      }
      return await this.executeWithUserContext(userId, async () => {
        // Get all clients for the user
        const { data: clients, error } = await supabase
          .from(this.tableName)
          .select('*')
          .eq('user_id', userId);
        if (error) throw error;
        const total = clients.length;
        // Consider all as active (or add logic if you have is_active field)
        const active = total;
        // Count new clients in the selected month
        let newThisMonth = 0;
        if (startDate && endDate) {
          newThisMonth = clients.filter(c => {
            const created = new Date(c.created_at);
            return created >= startDate && created <= endDate;
          }).length;
        }
        return { success: true, data: { total, active, newThisMonth } };
      });
    } catch (error) {
      Logger.error('Error fetching client metrics:', error);
      return { success: false, data: { total: 0, active: 0, newThisMonth: 0 }, error };
    }
  }
}

// Create and export a singleton instance
const clientService = new ClientService();
export default clientService;
