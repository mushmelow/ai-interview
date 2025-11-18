const { Pool } = require('pg');
require('dotenv').config();

// Create PostgreSQL connection pool
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'zhenghao',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ai_interview_db',
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Test database connection
const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('✅ Database connected successfully');
        client.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
};

// Graceful shutdown
const closePool = async () => {
    try {
        await pool.end();
        console.log('Database pool closed');
    } catch (error) {
        console.error('Error closing database pool:', error);
    }
};

// Handle process termination (only register once)
if (!process.listeners('SIGINT').includes(closePool)) {
    process.on('SIGINT', closePool);
}
if (!process.listeners('SIGTERM').includes(closePool)) {
    process.on('SIGTERM', closePool);
}

// Export query function for models
const query = (text, params) => pool.query(text, params);

module.exports = {
    pool,
    query,
    testConnection,
    closePool
};
