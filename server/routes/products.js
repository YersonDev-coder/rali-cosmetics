const express = require('express');
const pool = require('../db');

const router = express.Router();

// Para productos con variantes, reemplaza su stock=0 por la suma real de sus variantes
async function enrichWithVarianteStock(rows) {
  const ids = rows.filter(p => p.tiene_variantes).map(p => p.id);
  if (ids.length === 0) return rows;
  const { rows: stocks } = await pool.query(
    `SELECT producto_id, COALESCE(SUM(stock), 0)::int AS total_stock
     FROM producto_variantes WHERE producto_id = ANY($1::int[]) GROUP BY producto_id`,
    [ids]
  );
  const stockMap = Object.fromEntries(stocks.map(r => [r.producto_id, r.total_stock]));
  return rows.map(p => p.tiene_variantes ? { ...p, stock: stockMap[p.id] ?? 0 } : p);
}

router.get('/suggestions', async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) return res.json([]);

  const palabras = q.trim().split(/\s+/).filter(Boolean).slice(0, 4);
  const condiciones = [];
  const params = [];

  palabras.forEach((palabra, idx) => {
    const n = idx + 1;
    condiciones.push(
      `(unaccent(lower(p.nombre)) ILIKE unaccent(lower($${n})) OR unaccent(lower(p.descripcion)) ILIKE unaccent(lower($${n})))`
    );
    params.push(`%${palabra}%`);
  });

  const relevanciaExpr = palabras.map((_, idx) => {
    const n = idx + 1;
    return `(CASE WHEN unaccent(lower(p.nombre)) ILIKE unaccent(lower($${n})) THEN 2 ELSE 0 END + CASE WHEN unaccent(lower(p.descripcion)) ILIKE unaccent(lower($${n})) THEN 1 ELSE 0 END)`;
  }).join(' + ');

  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.nombre, p.imagen_url, p.precio
       FROM productos p
       WHERE p.activo = TRUE AND ${condiciones.join(' AND ')}
       ORDER BY (${relevanciaExpr}) DESC
       LIMIT 8`,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  const { categoria, search, sort, page = 1, limit = 12, min_price, max_price, disponible } = req.query;
  const offset = (page - 1) * limit;
  let where = ['p.activo = TRUE'];
  let params = [];
  let i = 1;
  let searchParamIndices = [];

  if (categoria) {
    where.push(`c.slug = $${i++}`);
    params.push(categoria);
  }
  if (search) {
    const palabras = search.trim().split(/\s+/).filter(Boolean).slice(0, 5);
    palabras.forEach(palabra => {
      where.push(
        `(unaccent(lower(p.nombre)) ILIKE unaccent(lower($${i})) OR unaccent(lower(p.descripcion)) ILIKE unaccent(lower($${i})))`
      );
      searchParamIndices.push(i);
      params.push(`%${palabra}%`);
      i++;
    });
  }
  if (min_price) { where.push(`p.precio >= $${i++}`); params.push(min_price); }
  if (max_price) { where.push(`p.precio <= $${i++}`); params.push(max_price); }
  if (disponible === 'true') {
    where.push(`(
      (p.tiene_variantes = FALSE AND p.stock > 0) OR
      (p.tiene_variantes = TRUE AND EXISTS (
        SELECT 1 FROM producto_variantes pv WHERE pv.producto_id = p.id AND pv.stock > 0
      ))
    )`);
  }

  const orderMap = {
    precio_asc: 'p.precio ASC',
    precio_desc: 'p.precio DESC',
    nuevos: 'p.created_at DESC',
    default: 'p.created_at DESC',
  };

  let order;
  if (search && searchParamIndices.length > 0 && (!sort || sort === 'default')) {
    const relevanciaExpr = searchParamIndices.map(idx =>
      `(CASE WHEN unaccent(lower(p.nombre)) ILIKE unaccent(lower($${idx})) THEN 2 ELSE 0 END + ` +
      `CASE WHEN unaccent(lower(p.descripcion)) ILIKE unaccent(lower($${idx})) THEN 1 ELSE 0 END)`
    ).join(' + ');
    order = `(${relevanciaExpr}) DESC, p.created_at DESC`;
  } else {
    order = orderMap[sort] || orderMap.default;
  }

  const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';

  try {
    const countQ = await pool.query(
      `SELECT COUNT(*) FROM productos p LEFT JOIN categorias c ON p.categoria_id=c.id ${whereStr}`,
      params
    );
    const total = parseInt(countQ.rows[0].count);

    const { rows } = await pool.query(
      `SELECT p.*, c.nombre as categoria_nombre, c.slug as categoria_slug
       FROM productos p LEFT JOIN categorias c ON p.categoria_id=c.id
       ${whereStr} ORDER BY ${order} LIMIT $${i} OFFSET $${i + 1}`,
      [...params, limit, offset]
    );

    const products = await enrichWithVarianteStock(rows);
    res.json({ products, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/bestsellers', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.*, c.nombre as categoria_nombre,
             COALESCE(SUM(dp.cantidad),0) as ventas
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id=c.id
      LEFT JOIN detalle_pedidos dp ON dp.producto_id=p.id
      WHERE p.activo=TRUE
      GROUP BY p.id, c.nombre
      ORDER BY ventas DESC LIMIT 8
    `);
    res.json(await enrichWithVarianteStock(rows));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/new', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*, c.nombre as categoria_nombre FROM productos p
       LEFT JOIN categorias c ON p.categoria_id=c.id
       WHERE p.activo=TRUE ORDER BY p.created_at DESC LIMIT 8`
    );
    res.json(await enrichWithVarianteStock(rows));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*, c.nombre as categoria_nombre, c.slug as categoria_slug
       FROM productos p LEFT JOIN categorias c ON p.categoria_id=c.id
       WHERE p.id=$1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Producto no encontrado' });
    const product = rows[0];
    if (product.tiene_variantes) {
      const varQ = await pool.query(
        'SELECT id, nombre, stock FROM producto_variantes WHERE producto_id=$1 ORDER BY id',
        [product.id]
      );
      product.variantes = varQ.rows;
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/related', async (req, res) => {
  try {
    const prod = await pool.query('SELECT categoria_id FROM productos WHERE id=$1', [req.params.id]);
    if (!prod.rows.length) return res.json([]);
    const { rows } = await pool.query(
      `SELECT p.*, c.nombre as categoria_nombre FROM productos p
       LEFT JOIN categorias c ON p.categoria_id=c.id
       WHERE p.categoria_id=$1 AND p.id!=$2 AND p.activo=TRUE LIMIT 4`,
      [prod.rows[0].categoria_id, req.params.id]
    );
    res.json(await enrichWithVarianteStock(rows));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
