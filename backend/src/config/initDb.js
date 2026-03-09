require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const pool = require('./db');

async function initDb() {
  const sql = fs.readFileSync(path.join(__dirname, '../../sql/schema.sql'), 'utf8');
  try {
    await pool.query(sql);
    console.log('✅ Database schema initialised successfully');
  } catch (err) {
    console.error('❌ Schema init failed:', err.message);
  } finally {
    await pool.end();
  }
}

initDb();
