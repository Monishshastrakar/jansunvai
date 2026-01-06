// ============================================
// jan-sunvai Backend Server
// AI-Driven Grievance Redressal Platform
// ============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Middleware Configuration
// ============================================

// CORS - Allow frontend to communicate with backend
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Explicitly serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve static files from grievance-system directory
app.use(express.static(__dirname));

// ============================================
// API Configuration Validation
// ============================================

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const DIGILOCKER_CLIENT_ID = process.env.DIGILOCKER_CLIENT_ID;
const DIGILOCKER_CLIENT_SECRET = process.env.DIGILOCKER_CLIENT_SECRET;
const DIGILOCKER_REDIRECT_URI = process.env.DIGILOCKER_REDIRECT_URI;
const DIGILOCKER_BASE_URL = process.env.DIGILOCKER_BASE_URL || 'https://api.digitallocker.gov.in/public/oauth2/1';

// ============================================
// Helper Functions
// ============================================

function validateApiKey(apiKey, serviceName) {
    if (!apiKey || apiKey.includes('your_') || apiKey.includes('_here')) {
        return {
            valid: false,
            message: `${serviceName} API key not configured. Please update the .env file with a valid API key.`
        };
    }
    return { valid: true };
}

// ============================================
// Google Maps API Endpoints
// ============================================

/**
 * POST /api/geocode
 * Convert address to coordinates (lat/lng)
 */
app.post('/api/geocode', async (req, res) => {
    try {
        const { address } = req.body;

        if (!address) {
            return res.status(400).json({
                error: 'Address is required',
                success: false
            });
        }

        // Validate API key
        const validation = validateApiKey(GOOGLE_MAPS_API_KEY, 'Google Maps');
        if (!validation.valid) {
            return res.status(503).json({
                error: validation.message,
                success: false,
                configurationRequired: true
            });
        }

        // Call Google Geocoding API
        const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: {
                address: address,
                key: GOOGLE_MAPS_API_KEY
            }
        });

        if (response.data.status === 'OK' && response.data.results.length > 0) {
            const result = response.data.results[0];
            res.json({
                success: true,
                location: {
                    lat: result.geometry.location.lat,
                    lng: result.geometry.location.lng,
                    formattedAddress: result.formatted_address,
                    placeId: result.place_id
                }
            });
        } else {
            res.status(404).json({
                error: 'Location not found',
                success: false,
                status: response.data.status
            });
        }
    } catch (error) {
        console.error('Geocoding error:', error.message);
        res.status(500).json({
            error: 'Failed to geocode address',
            success: false,
            details: error.message
        });
    }
});

/**
 * POST /api/reverse-geocode
 * Convert coordinates to address
 */
app.post('/api/reverse-geocode', async (req, res) => {
    try {
        const { lat, lng } = req.body;

        if (!lat || !lng) {
            return res.status(400).json({
                error: 'Latitude and longitude are required',
                success: false
            });
        }

        const validation = validateApiKey(GOOGLE_MAPS_API_KEY, 'Google Maps');
        if (!validation.valid) {
            return res.status(503).json({
                error: validation.message,
                success: false,
                configurationRequired: true
            });
        }

        const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: {
                latlng: `${lat},${lng}`,
                key: GOOGLE_MAPS_API_KEY
            }
        });

        if (response.data.status === 'OK' && response.data.results.length > 0) {
            const result = response.data.results[0];
            res.json({
                success: true,
                address: result.formatted_address,
                placeId: result.place_id,
                components: result.address_components
            });
        } else {
            res.status(404).json({
                error: 'Address not found for these coordinates',
                success: false
            });
        }
    } catch (error) {
        console.error('Reverse geocoding error:', error.message);
        res.status(500).json({
            error: 'Failed to reverse geocode',
            success: false,
            details: error.message
        });
    }
});

/**
 * GET /api/maps-config
 * Return Google Maps API key for frontend (safe to expose for Maps JavaScript API)
 */
app.get('/api/maps-config', (req, res) => {
    const validation = validateApiKey(GOOGLE_MAPS_API_KEY, 'Google Maps');

    if (!validation.valid) {
        return res.json({
            success: false,
            configured: false,
            message: validation.message
        });
    }

    res.json({
        success: true,
        configured: true,
        apiKey: GOOGLE_MAPS_API_KEY
    });
});

// ============================================
// DigiLocker API Endpoints
// ============================================

/**
 * GET /api/digilocker/auth
 * Initialize DigiLocker OAuth flow
 */
app.get('/api/digilocker/auth', (req, res) => {
    const validation = validateApiKey(DIGILOCKER_CLIENT_ID, 'DigiLocker');

    if (!validation.valid) {
        return res.status(503).json({
            error: validation.message,
            success: false,
            configurationRequired: true
        });
    }

    // Generate OAuth URL
    const authUrl = `${DIGILOCKER_BASE_URL}/authorize?` +
        `response_type=code&` +
        `client_id=${DIGILOCKER_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(DIGILOCKER_REDIRECT_URI)}&` +
        `state=${Math.random().toString(36).substring(7)}`;

    res.json({
        success: true,
        authUrl: authUrl
    });
});

/**
 * GET /api/digilocker/callback
 * Handle DigiLocker OAuth callback
 */
app.get('/api/digilocker/callback', async (req, res) => {
    try {
        const { code, state } = req.query;

        if (!code) {
            return res.status(400).send('Authorization code not received');
        }

        // Exchange code for access token
        const tokenResponse = await axios.post(
            `${DIGILOCKER_BASE_URL}/token`,
            {
                grant_type: 'authorization_code',
                code: code,
                client_id: DIGILOCKER_CLIENT_ID,
                client_secret: DIGILOCKER_CLIENT_SECRET,
                redirect_uri: DIGILOCKER_REDIRECT_URI
            },
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        const { access_token, token_type } = tokenResponse.data;

        // Fetch user details
        const userResponse = await axios.get(
            'https://api.digitallocker.gov.in/public/oauth2/1/user',
            {
                headers: {
                    'Authorization': `${token_type} ${access_token}`
                }
            }
        );

        // Redirect back to frontend with user data
        const userData = encodeURIComponent(JSON.stringify({
            name: userResponse.data.name,
            dob: userResponse.data.dob,
            gender: userResponse.data.gender,
            verified: true,
            accessToken: access_token
        }));

        res.redirect(`/?digilocker_verified=true&user_data=${userData}`);
    } catch (error) {
        console.error('DigiLocker callback error:', error.response?.data || error.message);
        res.redirect('/?digilocker_verified=false&error=' + encodeURIComponent(error.message));
    }
});

/**
 * POST /api/digilocker/documents
 * Fetch user documents from DigiLocker
 */
app.post('/api/digilocker/documents', async (req, res) => {
    try {
        const { accessToken } = req.body;

        if (!accessToken) {
            return res.status(400).json({
                error: 'Access token is required',
                success: false
            });
        }

        const response = await axios.get(
            'https://api.digitallocker.gov.in/public/oauth2/1/files/issued',
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        res.json({
            success: true,
            documents: response.data.items || []
        });
    } catch (error) {
        console.error('DigiLocker documents error:', error.message);
        res.status(500).json({
            error: 'Failed to fetch documents',
            success: false,
            details: error.message
        });
    }
});

// ============================================
// Complaint Management Endpoints
// ============================================

/**
 * POST /api/complaints
 * Submit a new complaint with enhanced data
 */
app.post('/api/complaints', async (req, res) => {
    try {
        const complaint = req.body;

        // Here you would typically save to a database
        // For now, we'll just validate and return

        res.json({
            success: true,
            message: 'Complaint submitted successfully',
            complaint: {
                ...complaint,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Complaint submission error:', error.message);
        res.status(500).json({
            error: 'Failed to submit complaint',
            success: false,
            details: error.message
        });
    }
});

// ============================================
// Health Check Endpoint
// ============================================

app.get('/api/health', (req, res) => {
    const googleMapsConfigured = validateApiKey(GOOGLE_MAPS_API_KEY, 'Google Maps').valid;
    const digilockerConfigured = validateApiKey(DIGILOCKER_CLIENT_ID, 'DigiLocker').valid;

    res.json({
        status: 'ok',
        server: 'jan-sunvai API Server',
        version: '1.0.0',
        apis: {
            googleMaps: googleMapsConfigured ? 'configured' : 'not configured',
            digilocker: digilockerConfigured ? 'configured' : 'not configured'
        },
        timestamp: new Date().toISOString()
    });
});

// ============================================
// Error Handling
// ============================================

app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        success: false,
        message: err.message
    });
});

// ============================================
// Start Server
// ============================================

app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log(`🚀 jan-sunvai API Server running on http://localhost:${PORT}`);
    console.log('='.repeat(60));
    console.log('\nAPI Configuration Status:');
    console.log(`   Google Maps: ${validateApiKey(GOOGLE_MAPS_API_KEY, 'Google Maps').valid ? '✓ Configured' : '✗ Not configured'}`);
    console.log(`   DigiLocker:  ${validateApiKey(DIGILOCKER_CLIENT_ID, 'DigiLocker').valid ? '✓ Configured' : '✗ Not configured'}`);
    console.log('\nAvailable Endpoints:');
    console.log('   GET  /api/health');
    console.log('   GET  /api/maps-config');
    console.log('   POST /api/geocode');
    console.log('   POST /api/reverse-geocode');
    console.log('   GET  /api/digilocker/auth');
    console.log('   GET  /api/digilocker/callback');
    console.log('   POST /api/digilocker/documents');
    console.log('   POST /api/complaints');
    console.log('   GET  * (SPA Fallback)');
    console.log('\n' + '='.repeat(60));
    console.log('💡 Note: Configure API keys in .env file for full functionality');
    console.log('='.repeat(60) + '\n');
});

// ============================================
// Catch-All Route (SPA Support)
// ============================================
// Must be after all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Export for Vercel
module.exports = app;
