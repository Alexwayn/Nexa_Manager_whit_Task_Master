/**
 * Simplified AWS Lambda function for Clerk webhooks - DEBUG VERSION
 */
exports.handler = async (event, context) => {
    console.log('Lambda function started');
    console.log('Event:', JSON.stringify(event, null, 2));
    
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, svix-signature, svix-timestamp',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
        'Content-Type': 'application/json'
    };

    try {
        console.log('Processing request...');
        
        // Handle OPTIONS request
        if (event.httpMethod === 'OPTIONS') {
            console.log('Handling OPTIONS request');
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ message: 'CORS preflight successful' })
            };
        }

        // Handle GET request (for testing)
        if (event.httpMethod === 'GET') {
            console.log('Handling GET request - Test endpoint');
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    message: 'Clerk webhook endpoint is working!',
                    timestamp: new Date().toISOString(),
                    environment: process.env.ENV || 'unknown'
                })
            };
        }

        // Handle POST request (actual webhook)
        if (event.httpMethod === 'POST') {
            console.log('Handling POST request - Webhook');
            
            const body = JSON.parse(event.body || '{}');
            console.log('Webhook payload:', body);
            
            // For now, just log and return success
            // Later we'll add Supabase integration
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    message: 'Webhook received successfully',
                    received_at: new Date().toISOString(),
                    event_type: body.type || 'unknown'
                })
            };
        }

        // Handle unsupported methods
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({
                message: 'Method not allowed',
                method: event.httpMethod
            })
        };

    } catch (error) {
        console.error('Error processing webhook:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                message: 'Internal server error',
                error: error.message,
                timestamp: new Date().toISOString()
            })
        };
    }
}; 