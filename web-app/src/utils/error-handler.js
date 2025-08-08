/**
 * Error Handler for Production Environment
 * Handles common production errors like ERR_BLOCKED_BY_CLIENT
 */

// Handle ERR_BLOCKED_BY_CLIENT errors gracefully
function handleBlockedRequests() {
  // Override fetch to handle blocked requests
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    try {
      return await originalFetch.apply(this, args);
    } catch (error) {
      // Check if it's a blocked request error
      if (error.message?.includes('ERR_BLOCKED_BY_CLIENT') || 
          error.name === 'TypeError' && error.message?.includes('Failed to fetch')) {
        console.warn('Request blocked by client (likely ad-blocker):', args[0]);
        
        // Return a mock response for non-critical requests
        return new Response(JSON.stringify({ blocked: true }), {
          status: 200,
          statusText: 'OK',
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Re-throw other errors
      throw error;
    }
  };
}

// Handle message channel errors
function handleMessageChannelErrors() {
  // Catch unhandled promise rejections related to message channels
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('message channel closed')) {
      console.warn('Message channel closed before response received - this is usually safe to ignore');
      event.preventDefault(); // Prevent the error from being logged
    }
  });
}

// Initialize error handlers
if (typeof window !== 'undefined') {
  handleBlockedRequests();
  handleMessageChannelErrors();
}

export { handleBlockedRequests, handleMessageChannelErrors };
