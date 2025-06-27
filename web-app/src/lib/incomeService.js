import { supabase } from './supabaseClient';
import Logger from '../utils/Logger';
import { getUserIdForUuidTables } from '../utils/userIdConverter.js';

/**
 * Servizio per la gestione delle entrate
 */
export const incomeService = {
  /**
   * Ottiene tutte le entrate per un utente
   */
  async getIncomes(userId) {
    try {
      if (!userId) {
        throw new Error('User ID richiesto');
      }

      // La tabella income usa UUID per user_id
      const dbUserId = getUserIdForUuidTables(userId);
      console.log('🔍 IncomeService: Clerk ID:', userId, '→ DB UUID:', dbUserId);

      const { data, error } = await supabase
        .from('income')
        .select(`
          *,
          client:clients(name, email)
        `)
        .eq('user_id', dbUserId)
        .order('date', { ascending: false });

      if (error) {
        console.error('❌ Errore nel recupero entrate:', error);
        throw error;
      }

      console.log('✅ IncomeService: Entrate recuperate:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('💥 IncomeService.getIncomes error:', error);
      throw error;
    }
  },

  /**
   * Ottiene statistiche delle entrate
   * @param {string} period - Periodo di analisi (month, year, etc)
   * @param {Date} startDate - Data di inizio
   * @param {Date} endDate - Data di fine
   * @returns {Promise<Object>} Statistiche delle entrate
   */
  async getIncomeStats(period = 'month', startDate = null, endDate = null) {
    try {
      const userUuid = getUserIdForUuidTables();
      Logger.info('incomeService.getIncomeStats: Calcolando statistiche per user_id:', userUuid);

      // Calcola le date se non fornite
      const now = new Date();
      let start, end;

      if (startDate && endDate) {
        start = startDate;
        end = endDate;
      } else {
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Ultimo giorno del mese corrente
        if (period === 'month') {
          start = new Date(now.getFullYear(), now.getMonth(), 1); // Primo giorno del mese corrente
        } else if (period === 'year') {
          start = new Date(now.getFullYear(), 0, 1); // Primo giorno dell'anno corrente
        } else {
          start = new Date(now.getFullYear(), now.getMonth(), 1); // Default: mese corrente
        }
      }

      Logger.info('incomeService.getIncomeStats: Periodo di analisi', {
        period,
        start: start.toISOString(),
        end: end.toISOString()
      });

      const { data, error } = await supabase
        .from('income')
        .select(`
          id,
          amount,
          date,
          category,
          description,
          client_id,
          clients(name)
        `)
        .eq('user_id', userUuid)
        .gte('date', start.toISOString().split('T')[0])
        .lte('date', end.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) {
        Logger.error('incomeService.getIncomeStats: Errore query:', error);
        throw error;
      }

      Logger.info('incomeService.getIncomeStats: Query results', {
        totalRecords: data?.length || 0,
        dateRange: [start, end]
      });

      // Calcola le statistiche
      const incomes = data || [];
      const totalAmount = incomes.reduce((sum, income) => sum + (parseFloat(income.amount) || 0), 0);
      const totalCount = incomes.length;
      const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0;

      // Raggruppa per categoria
      const byCategory = incomes.reduce((acc, income) => {
        const category = income.category || 'Non categorizzato';
        if (!acc[category]) {
          acc[category] = { amount: 0, count: 0 };
        }
        acc[category].amount += parseFloat(income.amount) || 0;
        acc[category].count += 1;
        return acc;
      }, {});

      // Calcola trend giornaliero
      const dailyTrend = incomes.reduce((acc, income) => {
        const date = income.date;
        if (!acc[date]) {
          acc[date] = { date, amount: 0, count: 0 };
        }
        acc[date].amount += parseFloat(income.amount) || 0;
        acc[date].count += 1;
        return acc;
      }, {});

      const dailyTrendArray = Object.values(dailyTrend).sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );

      const stats = {
        totalAmount,
        totalCount,
        averageAmount,
        byCategory,
        dailyTrend: dailyTrendArray,
        period,
        startDate: start,
        endDate: end
      };

      Logger.info('incomeService.getIncomeStats: Statistiche calcolate:', {
        totalAmount,
        totalCount,
        averageAmount,
        categoriesCount: Object.keys(byCategory).length,
        dailyTrendLength: dailyTrendArray.length
      });

      return stats;
    } catch (error) {
      Logger.error('incomeService.getIncomeStats: Errore:', error);
      throw error;
    }
  },

  /**
   * Crea una nuova entrata
   */
  async createIncome(incomeData, userId) {
    try {
      if (!userId) {
        throw new Error('User ID richiesto');
      }

      const dbUserId = getUserIdForUuidTables(userId);
      console.log('🔍 IncomeService: Creazione entrata per UUID:', dbUserId);

      const { data, error } = await supabase
        .from('income')
        .insert([{
          ...incomeData,
          user_id: dbUserId
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Errore nella creazione entrata:', error);
        throw error;
      }

      console.log('✅ IncomeService: Entrata creata:', data);
      return data;
    } catch (error) {
      console.error('💥 IncomeService.createIncome error:', error);
      throw error;
    }
  },

  /**
   * Aggiorna un'entrata esistente
   */
  async updateIncome(id, incomeData) {
    try {
      const { data, error } = await supabase
        .from('income')
        .update(incomeData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Errore nell\'aggiornamento entrata:', error);
        throw error;
      }

      console.log('✅ IncomeService: Entrata aggiornata:', data);
      return data;
    } catch (error) {
      console.error('💥 IncomeService.updateIncome error:', error);
      throw error;
    }
  },

  /**
   * Elimina un'entrata
   */
  async deleteIncome(id) {
    try {
      const { error } = await supabase
        .from('income')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Errore nell\'eliminazione entrata:', error);
        throw error;
      }

      console.log('✅ IncomeService: Entrata eliminata:', id);
      return true;
    } catch (error) {
      console.error('💥 IncomeService.deleteIncome error:', error);
      throw error;
    }
  }
};

export default incomeService;
