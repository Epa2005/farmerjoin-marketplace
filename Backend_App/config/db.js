const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Single source of truth for DB access across the backend.
// This delegates to dbConnection, which now supports Supabase Postgres
// (via DATABASE_URL / DB_CLIENT=postgres) and legacy MySQL fallback.
module.exports = require('../dbConnection');
