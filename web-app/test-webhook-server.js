const express = require('express');
const crypto = require('crypto');
const app = express();
const port = 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, svix-signature, svix-timestamp');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Test endpoint
app.get('/webhook', (req, res) => {
    console.log('GET /webhook - Test endpoint called');
    res.json({
        message: 'Webhook test server is working!',
        timestamp: new Date().toISOString(),
        method: req.method
    });
});

// Webhook endpoint
app.post('/webhook', (req, res) => {
    console.log('POST /webhook - Webhook received');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    
    const signature = req.headers['svix-signature'];
    const timestamp = req.headers['svix-timestamp'];
    
    try {
        const { type, data } = req.body;
        
        console.log(`Processing webhook: ${type}`);
        console.log('Data received:', {
            type,
            dataKeys: data ? Object.keys(data) : [],
            userId: data?.id,
            organizationId: data?.organization?.id
        });
        
        // Simulate processing
        const response = {
            message: 'Webhook processed successfully',
            type,
            timestamp: new Date().toISOString(),
            hasSignature: !!signature,
            hasTimestamp: !!timestamp
        };
        
        console.log('Sending response:', response);
        res.json(response);
        
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Start server
app.listen(port, () => {
    console.log(`🚀 Webhook test server running at http://localhost:${port}`);
    console.log(`📍 Test endpoint: http://localhost:${port}/webhook`);
    console.log(`📨 Webhook endpoint: POST http://localhost:${port}/webhook`);
    console.log('');
    console.log('To test:');
    console.log(`curl http://localhost:${port}/webhook`);
    console.log(`curl -X POST http://localhost:${port}/webhook -H "Content-Type: application/json" -d '{"type":"test","data":{"id":"123"}}'`);
});

module.exports = app; 