// Supabase-specific mocks for comprehensive testing
// This file provides detailed mocks for all Supabase functionality

import { jest } from '@jest/globals';

test('supabase mocks load', () => {
  expect(typeof jest.fn).toBe('function');
});

// Mock data generators for Supabase responses
export const createSupabaseResponse = (data = null, error = null, count = null) => ({
  data,
  error,
  status: error ? 400 : 200,
  statusText: error ? 'Bad Request' : 'OK',
  count: count !== null ? count : Array.isArray(data) ? data.length : data ? 1 : 0,
});

export const createSupabaseError = (message, code = 'PGRST116', details = null) => ({
  message,
  code,
  details,
  hint: null,
});

// Mock Supabase Auth User
export const createMockUser = (overrides = {}) => ({
  id: '123e4567-e89b-12d3-a456-426614174000',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'test@example.com',
  email_confirmed_at: '2024-01-01T00:00:00.000Z',
  phone: '',
  confirmed_at: '2024-01-01T00:00:00.000Z',
  last_sign_in_at: '2024-01-01T00:00:00.000Z',
  app_metadata: {
    provider: 'email',
    providers: ['email'],
  },
  user_metadata: {
    name: 'Test User',
  },
  identities: [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      identity_data: {
        email: 'test@example.com',
        sub: '123e4567-e89b-12d3-a456-426614174000',
      },
      provider: 'email',
      last_sign_in_at: '2024-01-01T00:00:00.000Z',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    },
  ],
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

// Mock Supabase Session
export const createMockSession = (user = null, overrides = {}) => ({
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: user || createMockUser(),
  ...overrides,
});

// Mock Supabase Auth Client
export const createMockAuthClient = (initialUser = null, initialSession = null) => {
  let currentUser = initialUser;
  let currentSession = initialSession;
  const authStateListeners = [];

  const mockAuth = {
    // User management
    getUser: jest.fn(() => Promise.resolve(createSupabaseResponse({ user: currentUser }))),

    getSession: jest.fn(() => Promise.resolve(createSupabaseResponse({ session: currentSession }))),

    // Authentication methods
    signInWithPassword: jest.fn(({ email, password }) => {
      if (email === 'test@example.com' && password === 'password') {
        currentUser = createMockUser({ email });
        currentSession = createMockSession(currentUser);
        return Promise.resolve(
          createSupabaseResponse({ user: currentUser, session: currentSession }),
        );
      }
      return Promise.resolve(
        createSupabaseResponse(null, createSupabaseError('Invalid credentials')),
      );
    }),

    signUp: jest.fn(({ email, password, options = {} }) => {
      currentUser = createMockUser({ email, ...options.data });
      currentSession = createMockSession(currentUser);
      return Promise.resolve(
        createSupabaseResponse({ user: currentUser, session: currentSession }),
      );
    }),

    signOut: jest.fn(() => {
      currentUser = null;
      currentSession = null;
      authStateListeners.forEach(listener => listener('SIGNED_OUT', null));
      return Promise.resolve(createSupabaseResponse(null));
    }),

    // Password management
    resetPasswordForEmail: jest.fn(email => Promise.resolve(createSupabaseResponse(null))),

    updateUser: jest.fn(attributes => {
      if (currentUser) {
        currentUser = { ...currentUser, ...attributes };
        return Promise.resolve(createSupabaseResponse({ user: currentUser }));
      }
      return Promise.resolve(
        createSupabaseResponse(null, createSupabaseError('Not authenticated')),
      );
    }),

    // Session management
    setSession: jest.fn(({ access_token, refresh_token }) => {
      currentSession = createMockSession(currentUser, { access_token, refresh_token });
      return Promise.resolve(createSupabaseResponse({ session: currentSession }));
    }),

    refreshSession: jest.fn(() => {
      if (currentSession) {
        currentSession = createMockSession(currentUser);
        return Promise.resolve(createSupabaseResponse({ session: currentSession }));
      }
      return Promise.resolve(createSupabaseResponse(null, createSupabaseError('No session')));
    }),

    // Auth state management
    onAuthStateChange: jest.fn(callback => {
      authStateListeners.push(callback);
      // Immediately call with current state
      if (currentSession) {
        callback('SIGNED_IN', currentSession);
      } else {
        callback('SIGNED_OUT', null);
      }

      return {
        data: {
          subscription: {
            unsubscribe: jest.fn(() => {
              const index = authStateListeners.indexOf(callback);
              if (index > -1) {
                authStateListeners.splice(index, 1);
              }
            }),
          },
        },
      };
    }),

    // Admin methods (for testing)
    admin: {
      createUser: jest.fn(userAttributes =>
        Promise.resolve(createSupabaseResponse({ user: createMockUser(userAttributes) })),
      ),
      deleteUser: jest.fn(id => Promise.resolve(createSupabaseResponse(null))),
      listUsers: jest.fn(() =>
        Promise.resolve(createSupabaseResponse({ users: [createMockUser()] })),
      ),
      updateUserById: jest.fn((id, attributes) =>
        Promise.resolve(createSupabaseResponse({ user: createMockUser(attributes) })),
      ),
    },

    // Helper methods for testing
    _setCurrentUser: user => {
      currentUser = user;
      currentSession = user ? createMockSession(user) : null;
    },
    _setCurrentSession: session => {
      currentSession = session;
    },
    _triggerAuthStateChange: (event, session) => {
      authStateListeners.forEach(listener => listener(event, session));
    },
  };

  return mockAuth;
};

// Mock Supabase Storage Client
export const createMockStorageClient = () => {
  const mockStorage = {
    from: jest.fn(bucket => ({
      // File operations
      upload: jest.fn((path, file, options = {}) => {
        if (file.size > 50 * 1024 * 1024) {
          // 50MB limit
          return Promise.resolve(
            createSupabaseResponse(null, createSupabaseError('File too large')),
          );
        }
        return Promise.resolve(
          createSupabaseResponse({
            path: `${bucket}/${path}`,
            id: '123e4567-e89b-12d3-a456-426614174000',
            fullPath: `${bucket}/${path}`,
          }),
        );
      }),

      download: jest.fn(path =>
        Promise.resolve(
          createSupabaseResponse(new Blob(['mock file content'], { type: 'application/pdf' })),
        ),
      ),

      remove: jest.fn(paths =>
        Promise.resolve(createSupabaseResponse(paths.map(path => ({ name: path })))),
      ),

      list: jest.fn((path = '', options = {}) =>
        Promise.resolve(
          createSupabaseResponse([
            {
              name: 'test-file.pdf',
              id: '123e4567-e89b-12d3-a456-426614174000',
              updated_at: '2024-01-01T00:00:00.000Z',
              created_at: '2024-01-01T00:00:00.000Z',
              last_accessed_at: '2024-01-01T00:00:00.000Z',
              metadata: {
                eTag: '"123456789"',
                size: 1024,
                mimetype: 'application/pdf',
                cacheControl: 'max-age=3600',
              },
            },
          ]),
        ),
      ),

      // URL operations
      getPublicUrl: jest.fn(path => ({
        data: {
          publicUrl: `https://mock-storage.supabase.co/storage/v1/object/public/${bucket}/${path}`,
        },
      })),

      createSignedUrl: jest.fn((path, expiresIn = 3600) =>
        Promise.resolve(
          createSupabaseResponse({
            signedUrl: `https://mock-storage.supabase.co/storage/v1/object/sign/${bucket}/${path}?token=mock-token`,
          }),
        ),
      ),

      createSignedUrls: jest.fn((paths, expiresIn = 3600) =>
        Promise.resolve(
          createSupabaseResponse(
            paths.map(path => ({
              path,
              signedUrl: `https://mock-storage.supabase.co/storage/v1/object/sign/${bucket}/${path}?token=mock-token`,
            })),
          ),
        ),
      ),

      // File operations
      move: jest.fn((fromPath, toPath) =>
        Promise.resolve(
          createSupabaseResponse({
            message: 'Successfully moved',
          }),
        ),
      ),

      copy: jest.fn((fromPath, toPath) =>
        Promise.resolve(
          createSupabaseResponse({
            path: toPath,
            id: '123e4567-e89b-12d3-a456-426614174000',
          }),
        ),
      ),
    })),

    // Bucket operations
    listBuckets: jest.fn(() =>
      Promise.resolve(
        createSupabaseResponse([
          {
            id: 'documents',
            name: 'documents',
            owner: '123e4567-e89b-12d3-a456-426614174000',
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z',
            public: false,
          },
        ]),
      ),
    ),

    getBucket: jest.fn(id =>
      Promise.resolve(
        createSupabaseResponse({
          id,
          name: id,
          owner: '123e4567-e89b-12d3-a456-426614174000',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
          public: false,
        }),
      ),
    ),

    createBucket: jest.fn((id, options = {}) =>
      Promise.resolve(
        createSupabaseResponse({
          name: id,
        }),
      ),
    ),

    deleteBucket: jest.fn(id =>
      Promise.resolve(
        createSupabaseResponse({
          message: 'Successfully deleted',
        }),
      ),
    ),

    emptyBucket: jest.fn(id =>
      Promise.resolve(
        createSupabaseResponse({
          message: 'Successfully emptied',
        }),
      ),
    ),
  };

  return mockStorage;
};

// Mock Supabase Realtime Client
export const createMockRealtimeClient = () => {
  const channels = new Map();

  const mockRealtime = {
    channel: jest.fn((topic, opts = {}) => {
      const channelCallbacks = {
        postgres_changes: [],
        broadcast: [],
        presence: [],
      };

      const mockChannel = {
        on: jest.fn((type, filter, callback) => {
          if (typeof filter === 'function') {
            callback = filter;
            filter = {};
          }

          if (!channelCallbacks[type]) {
            channelCallbacks[type] = [];
          }
          channelCallbacks[type].push({ filter, callback });

          return mockChannel;
        }),

        subscribe: jest.fn(callback => {
          setTimeout(() => {
            if (callback) callback('SUBSCRIBED', null);
          }, 0);
          return Promise.resolve('SUBSCRIBED');
        }),

        unsubscribe: jest.fn(() => {
          channels.delete(topic);
          return Promise.resolve('UNSUBSCRIBED');
        }),

        send: jest.fn(opts => {
          // Simulate broadcast to other clients
          setTimeout(() => {
            channelCallbacks.broadcast?.forEach(({ callback }) => {
              callback(opts);
            });
          }, 0);
          return Promise.resolve('ok');
        }),

        track: jest.fn(state => {
          // Simulate presence tracking
          setTimeout(() => {
            channelCallbacks.presence?.forEach(({ callback }) => {
              callback('sync', state);
            });
          }, 0);
          return Promise.resolve('ok');
        }),

        untrack: jest.fn(() => Promise.resolve('ok')),

        // Helper methods for testing
        _simulatePostgresChange: payload => {
          channelCallbacks.postgres_changes?.forEach(({ filter, callback }) => {
            if (!filter.event || filter.event === payload.eventType) {
              if (!filter.schema || filter.schema === payload.schema) {
                if (!filter.table || filter.table === payload.table) {
                  callback(payload);
                }
              }
            }
          });
        },

        _simulateBroadcast: payload => {
          channelCallbacks.broadcast?.forEach(({ callback }) => {
            callback(payload);
          });
        },

        _simulatePresence: (event, payload) => {
          channelCallbacks.presence?.forEach(({ callback }) => {
            callback(event, payload);
          });
        },
      };

      channels.set(topic, mockChannel);
      return mockChannel;
    }),

    removeChannel: jest.fn(channel => {
      // Find and remove channel
      for (const [topic, ch] of channels.entries()) {
        if (ch === channel) {
          channels.delete(topic);
          break;
        }
      }
      return Promise.resolve('ok');
    }),

    removeAllChannels: jest.fn(() => {
      channels.clear();
      return Promise.resolve('ok');
    }),

    getChannels: jest.fn(() => Array.from(channels.values())),

    // Helper methods for testing
    _getChannel: topic => channels.get(topic),
    _getAllChannels: () => channels,
  };

  return mockRealtime;
};

// Complete Supabase client mock
export const createMockSupabaseClient = (options = {}) => {
  const {
    auth: authOptions = {},
    storage: storageOptions = {},
    realtime: realtimeOptions = {},
    database: databaseOptions = {},
  } = options;

  const mockAuth = createMockAuthClient(authOptions.initialUser, authOptions.initialSession);

  const mockStorage = createMockStorageClient();
  const mockRealtime = createMockRealtimeClient();

  // Database query builder mock
  const createQueryBuilder = tableName => {
    let currentQuery = {
      table: tableName,
      select: '*',
      filters: [],
      modifiers: [],
    };

    const queryBuilder = {
      // Selection methods
      select: jest.fn((columns = '*') => {
        currentQuery.select = columns;
        return queryBuilder;
      }),

      // Insertion methods
      insert: jest.fn(values => {
        const mockData = Array.isArray(values) ? values : [values];
        return Promise.resolve(createSupabaseResponse(mockData));
      }),

      // Update methods
      update: jest.fn(values => {
        return Promise.resolve(createSupabaseResponse(values));
      }),

      // Deletion methods
      delete: jest.fn(() => {
        return Promise.resolve(createSupabaseResponse(null));
      }),

      // Upsert methods
      upsert: jest.fn(values => {
        const mockData = Array.isArray(values) ? values : [values];
        return Promise.resolve(createSupabaseResponse(mockData));
      }),

      // Filter methods
      eq: jest.fn((column, value) => {
        currentQuery.filters.push({ type: 'eq', column, value });
        return queryBuilder;
      }),

      neq: jest.fn((column, value) => {
        currentQuery.filters.push({ type: 'neq', column, value });
        return queryBuilder;
      }),

      gt: jest.fn((column, value) => {
        currentQuery.filters.push({ type: 'gt', column, value });
        return queryBuilder;
      }),

      gte: jest.fn((column, value) => {
        currentQuery.filters.push({ type: 'gte', column, value });
        return queryBuilder;
      }),

      lt: jest.fn((column, value) => {
        currentQuery.filters.push({ type: 'lt', column, value });
        return queryBuilder;
      }),

      lte: jest.fn((column, value) => {
        currentQuery.filters.push({ type: 'lte', column, value });
        return queryBuilder;
      }),

      like: jest.fn((column, pattern) => {
        currentQuery.filters.push({ type: 'like', column, pattern });
        return queryBuilder;
      }),

      ilike: jest.fn((column, pattern) => {
        currentQuery.filters.push({ type: 'ilike', column, pattern });
        return queryBuilder;
      }),

      is: jest.fn((column, value) => {
        currentQuery.filters.push({ type: 'is', column, value });
        return queryBuilder;
      }),

      in: jest.fn((column, values) => {
        currentQuery.filters.push({ type: 'in', column, values });
        return queryBuilder;
      }),

      contains: jest.fn((column, value) => {
        currentQuery.filters.push({ type: 'contains', column, value });
        return queryBuilder;
      }),

      // Modifier methods
      order: jest.fn((column, options = {}) => {
        currentQuery.modifiers.push({ type: 'order', column, ...options });
        return queryBuilder;
      }),

      limit: jest.fn(count => {
        currentQuery.modifiers.push({ type: 'limit', count });
        return queryBuilder;
      }),

      range: jest.fn((from, to) => {
        currentQuery.modifiers.push({ type: 'range', from, to });
        return queryBuilder;
      }),

      single: jest.fn(() => {
        return Promise.resolve(
          createSupabaseResponse(databaseOptions.mockData?.[tableName]?.[0] || null),
        );
      }),

      maybeSingle: jest.fn(() => {
        return Promise.resolve(
          createSupabaseResponse(databaseOptions.mockData?.[tableName]?.[0] || null),
        );
      }),

      // Execution methods
      then: jest.fn((resolve, reject) => {
        const mockData = databaseOptions.mockData?.[tableName] || [];
        return Promise.resolve(createSupabaseResponse(mockData)).then(resolve, reject);
      }),

      // Helper method to get current query state
      _getCurrentQuery: () => currentQuery,
    };

    return queryBuilder;
  };

  const mockClient = {
    // Database operations
    from: jest.fn(table => createQueryBuilder(table)),

    // RPC operations
    rpc: jest.fn((fn, params = {}) => {
      const mockRpcData = databaseOptions.mockRpcData?.[fn] || null;
      return Promise.resolve(createSupabaseResponse(mockRpcData));
    }),

    // Auth
    auth: mockAuth,

    // Storage
    storage: mockStorage,

    // Realtime
    channel: mockRealtime.channel,
    removeChannel: mockRealtime.removeChannel,
    removeAllChannels: mockRealtime.removeAllChannels,
    getChannels: mockRealtime.getChannels,

    // Helper methods for testing
    _setMockData: (table, data) => {
      if (!databaseOptions.mockData) {
        databaseOptions.mockData = {};
      }
      databaseOptions.mockData[table] = data;
    },

    _setMockRpcData: (functionName, data) => {
      if (!databaseOptions.mockRpcData) {
        databaseOptions.mockRpcData = {};
      }
      databaseOptions.mockRpcData[functionName] = data;
    },

    _getMockAuth: () => mockAuth,
    _getMockStorage: () => mockStorage,
    _getMockRealtime: () => mockRealtime,
  };

  return mockClient;
};

// Export default mock client
export default createMockSupabaseClient();
