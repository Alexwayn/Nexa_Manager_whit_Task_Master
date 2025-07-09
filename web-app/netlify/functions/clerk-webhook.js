// Netlify function wrapper for Clerk webhook handler
import handler from '../../api/webhooks/clerk.js';

export default async function netlifyHandler(event, context) {
  // Convert Netlify event to standard request object
  const req = {
    method: event.httpMethod,
    headers: event.headers,
    body: JSON.parse(event.body || '{}'),
  };

  // Mock response object
  const res = {
    statusCode: 200,
    headers: {},
    body: '',
    status: function (code) {
      this.statusCode = code;
      return this;
    },
    json: function (data) {
      this.headers['Content-Type'] = 'application/json';
      this.body = JSON.stringify(data);
      return this;
    },
  };

  try {
    await handler(req, res);

    return {
      statusCode: res.statusCode,
      headers: res.headers,
      body: res.body,
    };
  } catch (error) {
    console.error('Netlify function error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
