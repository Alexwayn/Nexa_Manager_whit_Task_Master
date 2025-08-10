import { createClient } from '@supabase/supabase-js';
import Logger from '@/utils/Logger';
import { getEnvVar } from '@/utils/env';

// Use top-level exports and assign based on environment to satisfy Jest/Babel
const isTestEnvironment =
  typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test';

let supabaseInstance = null;
let supabaseAdminInstance = null;

if (isTestEnvironment) {
  // Rich Jest-friendly mock for tests
  const createMockFunction = (initialImpl) => {
    let impl = initialImpl;
    const baseFn = (...args) => impl(...args);
    // Enhance with minimal mock control methods when jest isn't available
    baseFn.mockResolvedValue = (value) => {
      impl = async () => value;
    };
    baseFn.mockReturnValue = (value) => {
      impl = () => value;
    };
    baseFn.mockImplementation = (nextImpl) => {
      impl = nextImpl;
    };
    return typeof jest !== 'undefined' ? jest.fn(baseFn) : baseFn;
  };

  const createQueryMock = () => {
    let currentResponse = { data: [], error: null };
    const query = {};

    // Configure response for this query instance
    Object.defineProperty(query, '__setMockResponse', {
      value: (nextResponse) => {
        currentResponse = nextResponse;
      },
      enumerable: false,
      configurable: true,
    });

    // Chainable operations should return the same query object
    const returnSelf = () => query;

    // Data ops (still chainable in our mock)
    query.select = createMockFunction(returnSelf);
    query.insert = createMockFunction(returnSelf);
    query.update = createMockFunction(returnSelf);
    query.delete = createMockFunction(returnSelf);
    query.upsert = createMockFunction(returnSelf);

    // Filters and modifiers
    query.eq = createMockFunction(returnSelf);
    query.neq = createMockFunction(returnSelf);
    query.gt = createMockFunction(returnSelf);
    query.gte = createMockFunction(returnSelf);
    query.lt = createMockFunction(returnSelf);
    query.lte = createMockFunction(returnSelf);
    query.like = createMockFunction(returnSelf);
    query.ilike = createMockFunction(returnSelf);
    query.in = createMockFunction(returnSelf);
    query.contains = createMockFunction(returnSelf);
    query.order = createMockFunction(returnSelf);
    query.range = createMockFunction(returnSelf);
    query.single = createMockFunction(returnSelf);
    query.maybeSingle = createMockFunction(returnSelf);

    // Make the object thenable so `await query` returns the response
    query.then = (onFulfilled, onRejected) =>
      Promise.resolve(currentResponse).then(onFulfilled, onRejected);

    return query;
  };

  const storageFrom = createMockFunction(() => ({
    upload: createMockFunction(async () => ({ data: null, error: null })),
    download: createMockFunction(async () => ({ data: null, error: null })),
    remove: createMockFunction(async () => ({ data: null, error: null })),
  }));

  supabaseInstance = {
    // from: when called with a table name, create and store the last query;
    // when called without args (tests), return the last created query for configuration
    from: createMockFunction((tableName) => {
      const query = createQueryMock();
      // Attach metadata for potential debugging
      Object.defineProperty(query, '__table', { value: tableName, enumerable: false });
      supabaseInstance.__lastQuery = query;
      // Track calls for jest assertions
      if (supabaseInstance.from && typeof supabaseInstance.from.mock === 'object') {
        // jest.fn will record the args automatically, so nothing else needed here
      }
      return query;
    }),
    __lastQuery: null,
    rpc: createMockFunction(async (fnName, params) => {
      // Support test expectations that call without params (undefined)
      return { data: null, error: null };
    }),
    storage: { from: storageFrom },
    auth: {
      getSession: createMockFunction(async () => ({ data: { session: null }, error: null })),
      getUser: createMockFunction(async () => ({ data: { user: null }, error: null })),
      signInWithPassword: createMockFunction(async () => ({ data: null, error: null })),
      signUp: createMockFunction(async () => ({ data: null, error: null })),
      signOut: createMockFunction(async () => ({ error: null })),
      onAuthStateChange: createMockFunction(() => ({ data: { subscription: { unsubscribe: createMockFunction(() => {}) } } })),
    },
  };

  // Allow tests to get the last query by calling from() with no args
  const originalFrom = supabaseInstance.from;
  supabaseInstance.from = new Proxy(originalFrom, {
    apply(target, thisArg, argumentsList) {
      if (argumentsList.length === 0) {
        if (!supabaseInstance.__lastQuery) {
          supabaseInstance.__lastQuery = createQueryMock();
        }
        return supabaseInstance.__lastQuery;
      }
      // Record the call with jest while preserving previously configured query
      const hadLast = Boolean(supabaseInstance.__lastQuery);
      const saved = supabaseInstance.__lastQuery;
      const created = target.apply(thisArg, argumentsList);
      if (hadLast) {
        // Restore and return the previously configured query so chained ops affect it
        supabaseInstance.__lastQuery = saved;
        return saved;
      }
      // No prior configuration; use the newly created query
      supabaseInstance.__lastQuery = created;
      return created;
    },
  });
  supabaseAdminInstance = null;
} else {
  // Production/development client
  const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
  const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');
  const supabaseServiceRoleKey = getEnvVar('VITE_SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    Logger.error('Missing Supabase configuration');
    throw new Error('Missing Supabase environment variables');
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });

  supabaseAdminInstance = supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, { auth: { persistSession: false } })
    : null;
}

export const supabase = supabaseInstance;
export const supabaseAdmin = supabaseAdminInstance;

export const setCurrentUserId = async (userId) => {
  if (!userId) return;
  if (isTestEnvironment || !supabaseInstance) return;
  try {
    await supabaseInstance.rpc('set_current_user_id', { user_id: userId });
  } catch (e) {
    try {
      Logger.warn('setCurrentUserId failed', e);
    } catch (_) {
      // noop if Logger is not available for any reason
    }
  }
};

export const withUserContext = async (userId, queryFunction) => {
  if (isTestEnvironment) return queryFunction();
  if (userId) await setCurrentUserId(userId);
  return queryFunction();
};
