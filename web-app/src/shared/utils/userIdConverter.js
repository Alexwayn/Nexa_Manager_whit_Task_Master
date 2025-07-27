/**
 * UserIdConverter - AGGIORNATO per usare direttamente Clerk IDs nel database
 *
 * NUOVO APPROCCIO: Il database ora usa direttamente i Clerk User IDs
 * Non facciamo più conversioni UUID, passiamo attraverso il Clerk ID.
 */

/**
 * Utility per gestire i User ID nel database
 * Il database ha un MISMATCH: alcune tabelle usano TEXT, altre UUID per user_id
 *
 * MAPPING DEFINITIVO:
 * - business_profiles.user_id = TEXT (usa Clerk ID diretto)
 * - clients.user_id = TEXT (usa Clerk ID diretto)
 * - income.user_id = UUID (usa UUID fisso)
 * - expenses.user_id = UUID (usa UUID fisso)
 * - income_categories.user_id = UUID (usa UUID fisso)
 * - expense_categories.user_id = UUID (usa UUID fisso)
 */

// UUID fisso che mappiamo al Clerk ID 'user_2yyhN4lw9ritLheD4CxN5RRMXUR'
const FIXED_UUID = '12345678-1234-5678-9abc-123456789012';

/**
 * Converte un Clerk ID in UUID (per backwards compatibility)
 * @param {string} clerkId - Il Clerk User ID
 * @returns {string} UUID corrispondente
 */
export const convertClerkIdToUuid = clerkId => {
  if (!clerkId) return null;
  // Per ora mappiamo tutti i Clerk ID allo stesso UUID fisso
  // In futuro si potrebbe creare una tabella di mapping
  return FIXED_UUID;
};

/**
 * Ottiene l'User ID corretto per le tabelle che usano TEXT (business_profiles, clients)
 */
export const getUserIdForTextTables = clerkUserId => {
  return clerkUserId; // Usa direttamente il Clerk ID
};

/**
 * Ottiene l'User ID corretto per le tabelle che usano UUID (income, expenses, categories)
 */
export const getUserIdForUuidTables = clerkUserId => {
  // Per ora mappiamo tutti i Clerk ID allo stesso UUID fisso
  // In futuro si potrebbe creare una tabella di mapping
  return FIXED_UUID;
};

/**
 * Funzione principale per ottenere l'User ID corretto per una specifica tabella
 */
export const getUserId = (clerkUserId, tableName) => {
  if (!clerkUserId) return null;

  // Tabelle che usano TEXT
  const textTables = ['business_profiles', 'clients'];

  // Tabelle che usano UUID
  const uuidTables = ['income', 'expenses', 'income_categories', 'expense_categories'];

  if (textTables.includes(tableName)) {
    return getUserIdForTextTables(clerkUserId);
  } else if (uuidTables.includes(tableName)) {
    return getUserIdForUuidTables(clerkUserId);
  } else {
    console.warn(`Tabella '${tableName}' non riconosciuta, uso TEXT per default`);
    return getUserIdForTextTables(clerkUserId);
  }
};

// Per backwards compatibility
export const convertUuidToClerkId = uuid => {
  return uuid;
};

export default {
  convertClerkIdToUuid,
  getUserId,
  getUserIdForTextTables,
  getUserIdForUuidTables,
  convertUuidToClerkId,
  FIXED_UUID,
};
