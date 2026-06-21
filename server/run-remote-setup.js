const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const url = process.env.REMOTE_DATABASE_URL;
if (!url) {
  console.error('ERROR: define REMOTE_DATABASE_URL antes de correr este script.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const client = await pool.connect();
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(sql);
    console.log('Schema aplicado correctamente en la base de datos remota.');

    const { rows } = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
    );
    console.log('Tablas existentes ahora:');
    rows.forEach(r => console.log(' -', r.table_name));
  } catch (err) {
    console.error('Error al aplicar schema:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
