// Service Worker for Analytics Offline Capabilities
const CACHE_NAME = 'nexa-analytics-v1';
const ANALYTICS_CACHE = 'analytics-data-v1';

// Cache essential analytics resources
const urlsToCache = [
  '/analytics',
  '/static/js/analytics.js',
  '/static/css/analytics.css'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Handle analytics API requests
  if (event.request.url.includes('/api/analytics')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response
          const responseClone = response.clone();
          
          // Cache successful responses
          if (response.status === 200) {
            caches.open(ANALYTICS_CACHE)
              .then((cache) => {
                cache.put(event.request, responseClone);
              });
          }
          
          return response;
        })
        .catch(() => {
          // Return cached data when offline
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              
              // Return fallback data structure
              return new Response(JSON.stringify({
                data: {
                  statusDistribution: { paid: { count: 0 }, pending: { count: 0 }, overdue: { count: 0 } },
                  revenueAnalytics: { totalRevenue: 0, pendingRevenue: 0, overdueRevenue: 0 },
                  performanceMetrics: { averagePaymentTime: 0, collectionEfficiency: 0 },
                  invoices: []
                },
                financial: {
                  totalRevenue: 0,
                  totalExpenses: 0,
                  profitMargin: 0,
                  cashFlow: { inflow: 0, outflow: 0 },
                  financialHealth: 0
                },
                clients: { data: [] },
                offline: true
              }), {
                headers: { 'Content-Type': 'application/json' }
              });
            });
        })
    );
  } else {
    // Handle other requests
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          return response || fetch(event.request);
        })
    );
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== ANALYTICS_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for analytics data
self.addEventListener('sync', (event) => {
  if (event.tag === 'analytics-sync') {
    event.waitUntil(
      // Sync analytics data when connection is restored
      syncAnalyticsData()
    );
  }
});

async function syncAnalyticsData() {
  try {
    // Get pending analytics updates from IndexedDB
    const pendingUpdates = await getPendingUpdates();
    
    // Send updates to server
    for (const update of pendingUpdates) {
      await fetch('/api/analytics/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update)
      });
    }
    
    // Clear pending updates
    await clearPendingUpdates();
  } catch (error) {
    console.error('Analytics sync failed:', error);
  }
}

// Helper functions for IndexedDB operations
async function getPendingUpdates() {
  // Implementation would use IndexedDB to get pending updates
  return [];
}

async function clearPendingUpdates() {
  // Implementation would clear IndexedDB pending updates
}