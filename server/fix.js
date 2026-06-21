require('dotenv').config({ path: '../.env' });
const pool = require('./db');

async function main() {
  await pool.query('UPDATE usuarios SET email_verificado = true WHERE email = $1', ['admin@rali.com']);
  console.log('Admin verificado');
  process.exit();
}

main();