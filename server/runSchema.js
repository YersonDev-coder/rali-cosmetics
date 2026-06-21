require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const sql = fs.readFileSync('./schema.sql', 'utf8');
  try {
    await pool.query(sql);
    console.log('Schema aplicado correctamente');
  } catch (err) {
    console.error('Error al aplicar schema:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
