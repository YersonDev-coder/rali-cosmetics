const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const url = process.env.BACKUP_DATABASE_URL;
if (!url) {
  console.error('ERROR: define BACKUP_DATABASE_URL antes de correr este script.');
  console.error('Ejemplo: BACKUP_DATABASE_URL="postgresql://..." node server/backup-db.js');
  process.exit(1);
}

const pool = new Pool({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

const TABLES = [
  'categorias',
  'productos',
  'usuarios',
  'pedidos',
  'detalle_pedidos',
  'lista_deseos',
];

function timestamp() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

async function run() {
  const backupsDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir);

  const ts = timestamp();
  const runDir = path.join(backupsDir, ts);
  fs.mkdirSync(runDir);

  const client = await pool.connect();
  console.log(`\nBackup iniciado — ${ts}\nDestino: ${runDir}\n`);

  try {
    const totals = {};
    for (const tabla of TABLES) {
      try {
        const { rows } = await client.query(`SELECT * FROM ${tabla}`);
        const filePath = path.join(runDir, `${tabla}.json`);
        fs.writeFileSync(filePath, JSON.stringify(rows, null, 2), 'utf8');
        totals[tabla] = rows.length;
        console.log(`  ✓ ${tabla.padEnd(20)} ${rows.length} filas`);
      } catch (err) {
        console.warn(`  ✗ ${tabla.padEnd(20)} ERROR: ${err.message}`);
        totals[tabla] = 'ERROR';
      }
    }

    const summary = { timestamp: ts, tables: totals };
    fs.writeFileSync(path.join(runDir, '_resumen.json'), JSON.stringify(summary, null, 2), 'utf8');

    console.log(`\nBackup completado en: ${runDir}`);
    console.log('Archivo de resumen: _resumen.json\n');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error('Error inesperado:', err.message);
  process.exit(1);
});
