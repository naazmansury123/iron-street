const { Pool } = require('pg');
// .env will be loaded by server.js, so no need for dotenv here directly

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
    console.log('Successfully connected to IRON STREET PostgreSQL database');
});

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1); // exit the process for critical DB errors
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};