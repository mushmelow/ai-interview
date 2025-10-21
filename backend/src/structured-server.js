const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3005",
    credentials: true
}));
app.use(express.json());

// Mock storage
const consentRecords = [];

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({
        message: 'Backend is working!',
        timestamp: new Date().toISOString()
    });
});

// Consent endpoints
app.post('/api/consent', (req, res) => {
    try {
        const { userId, consents, ipAddress, userAgent } = req.body;

        if (!userId || !consents) {
            return res.status(400).json({
                success: false,
                message: 'User ID and consents are required'
            });
        }

        const allConsentsGiven = Object.values(consents).every(consent => consent === true);
        if (!allConsentsGiven) {
            return res.status(400).json({
                success: false,
                message: 'All consents must be given to proceed'
            });
        }

        const consentRecord = {
            id: Date.now().toString(),
            userId,
            consents,
            ipAddress: ipAddress || req.ip,
            userAgent: userAgent || req.get('User-Agent'),
            timestamp: new Date().toISOString(),
            version: '1.0',
        };

        consentRecords.push(consentRecord);

        console.log(`Consent recorded for user: ${userId}`);

        res.status(201).json({
            success: true,
            message: 'Consent recorded successfully',
            consentId: consentRecord.id,
            timestamp: consentRecord.timestamp
        });

    } catch (error) {
        console.error('Error processing consent:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

app.get('/api/consent/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const consent = consentRecords.find(record => record.userId === userId);

        if (!consent) {
            return res.status(404).json({
                success: false,
                message: 'No consent record found for this user'
            });
        }

        res.json({
            success: true,
            consent: {
                id: consent.id,
                consents: consent.consents,
                timestamp: consent.timestamp,
                version: consent.version
            }
        });

    } catch (error) {
        console.error('Error getting consent:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔒 Consent API: http://localhost:${PORT}/api/consent`);
});

module.exports = app;




