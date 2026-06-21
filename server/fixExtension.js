const pool = require('./db');

pool.query('CREATE EXTENSION IF NOT EXISTS unaccent;')
  .then(() => {
    console.log('✅ Extensión unaccent instalada correctamente');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });