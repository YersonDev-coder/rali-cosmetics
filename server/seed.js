require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Iniciando seed...');

    let adminPassword = process.env.ADMIN_SEED_PASSWORD;
    if (!adminPassword) {
      adminPassword = crypto.randomBytes(12).toString('base64url');
      console.log(`\n🔑  Contraseña admin generada automáticamente: ${adminPassword}`);
      console.log('    Guárdala ahora — no se volverá a mostrar.\n');
    }

    const hash = await bcrypt.hash(adminPassword, 10);
    await client.query(`
      INSERT INTO usuarios (nombre, email, password_hash, rol, email_verificado)
      VALUES ('Administrador', 'admin@rali.com', $1, 'admin', true)
      ON CONFLICT (email) DO NOTHING
    `, [hash]);
    console.log('Admin creado: admin@rali.com');

    const categorias = [
      { nombre: 'Bases', slug: 'bases', orden: 1 },
      { nombre: 'Polvos Traslúcidos', slug: 'polvos-traslucidos', orden: 2 },
      { nombre: 'Polvo Compacto', slug: 'polvo-compacto', orden: 3 },
      { nombre: 'Rímel', slug: 'rimel', orden: 4 },
      { nombre: 'Delineadores', slug: 'delineadores', orden: 5 },
      { nombre: 'Labiales', slug: 'labiales', orden: 6 },
      { nombre: 'Cuidado de Piel', slug: 'cuidado-piel', orden: 7 },
      { nombre: 'Brochas', slug: 'brochas', orden: 8 },
      { nombre: 'Accesorios', slug: 'accesorios', orden: 9 },
    ];

    for (const cat of categorias) {
      await client.query(`
        INSERT INTO categorias (nombre, slug, orden)
        VALUES ($1, $2, $3)
        ON CONFLICT (slug) DO NOTHING
      `, [cat.nombre, cat.slug, cat.orden]);
    }
    console.log('Categorías creadas:', categorias.length);
    console.log('Seed completado.');
  } catch (err) {
    console.error('Error en seed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
