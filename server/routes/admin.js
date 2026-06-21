const express = require('express');
const pool = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { upload, wrapMulter, uploadToCloudinary } = require('../middleware/upload');

const router = express.Router();
router.use(authMiddleware, adminMiddleware);

// Dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [pedidosHoy, pendientes, agotados, ingresos, ultimosPedidos] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM pedidos WHERE DATE(created_at)=$1`, [today]),
      pool.query(`SELECT COUNT(*) FROM pedidos WHERE estado='pendiente'`),
      pool.query(`SELECT COUNT(*) FROM productos WHERE stock=0 AND activo=TRUE`),
      pool.query(`SELECT COALESCE(SUM(total),0) as total FROM pedidos WHERE DATE_TRUNC('month',created_at)=DATE_TRUNC('month',NOW()) AND estado!='cancelado'`),
      pool.query(`
        SELECT p.*, u.nombre as cliente_nombre, u.email as cliente_email
        FROM pedidos p LEFT JOIN usuarios u ON p.usuario_id=u.id
        ORDER BY p.created_at DESC LIMIT 10
      `),
    ]);
    res.json({
      pedidosHoy: parseInt(pedidosHoy.rows[0].count),
      pendientes: parseInt(pendientes.rows[0].count),
      agotados: parseInt(agotados.rows[0].count),
      ingresosMes: parseFloat(ingresos.rows[0].total),
      ultimosPedidos: ultimosPedidos.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Products CRUD
router.get('/products', async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  let where = [];
  let params = [];
  let i = 1;
  if (search) {
    where.push(`p.nombre ILIKE $${i++}`);
    params.push(`%${search}%`);
  }
  const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';
  try {
    const countQ = await pool.query(`SELECT COUNT(*) FROM productos p ${whereStr}`, params);
    const total = parseInt(countQ.rows[0].count);
    const { rows } = await pool.query(
      `SELECT p.*, c.nombre as categoria_nombre FROM productos p
       LEFT JOIN categorias c ON p.categoria_id=c.id
       ${whereStr} ORDER BY p.created_at DESC LIMIT $${i} OFFSET $${i + 1}`,
      [...params, limit, offset]
    );
    res.json({ products: rows, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/products', wrapMulter(upload.single('imagen')), async (req, res) => {
  const { nombre, descripcion, precio, stock, categoria_id, activo } = req.body;
  let imagen_url = req.body.imagen_url || null;
  if (req.file) {
    imagen_url = await uploadToCloudinary(req.file.buffer, 'rali-productos');
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO productos (nombre,descripcion,precio,stock,imagen_url,categoria_id,activo)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [nombre, descripcion, precio, stock, imagen_url, categoria_id || null, activo !== 'false']
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/products/:id', wrapMulter(upload.single('imagen')), async (req, res) => {
  const { nombre, descripcion, precio, stock, categoria_id, activo } = req.body;
  let imagen_url = req.body.imagen_url;
  if (req.file) {
    imagen_url = await uploadToCloudinary(req.file.buffer, 'rali-productos');
  }
  try {
    const { rows } = await pool.query(
      `UPDATE productos SET nombre=$1,descripcion=$2,precio=$3,stock=$4,imagen_url=$5,categoria_id=$6,activo=$7
       WHERE id=$8 RETURNING *`,
      [nombre, descripcion, precio, stock, imagen_url, categoria_id || null, activo !== 'false', req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM productos WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Categories CRUD
router.get('/categories', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*, COUNT(p.id)::int as productos_count
      FROM categorias c LEFT JOIN productos p ON p.categoria_id=c.id
      GROUP BY c.id ORDER BY c.orden ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/categories', wrapMulter(upload.single('imagen')), async (req, res) => {
  const { nombre, slug, orden } = req.body;
  let imagen_url = null;
  if (req.file) imagen_url = await uploadToCloudinary(req.file.buffer, 'rali-categorias');
  try {
    const { rows } = await pool.query(
      'INSERT INTO categorias (nombre,slug,imagen_url,orden) VALUES ($1,$2,$3,$4) RETURNING *',
      [nombre, slug, imagen_url, orden || 0]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/categories/:id', wrapMulter(upload.single('imagen')), async (req, res) => {
  const { nombre, slug, orden } = req.body;
  let imagen_url = req.body.imagen_url;
  if (req.file) imagen_url = await uploadToCloudinary(req.file.buffer, 'rali-categorias');
  try {
    const { rows } = await pool.query(
      'UPDATE categorias SET nombre=$1,slug=$2,imagen_url=$3,orden=$4 WHERE id=$5 RETURNING *',
      [nombre, slug, imagen_url, orden || 0, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    const check = await pool.query('SELECT COUNT(*) FROM productos WHERE categoria_id=$1', [req.params.id]);
    if (parseInt(check.rows[0].count) > 0) {
      return res.status(400).json({ error: 'No se puede eliminar: tiene productos asociados' });
    }
    await pool.query('DELETE FROM categorias WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Orders
router.get('/orders', async (req, res) => {
  const { estado, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  let where = [];
  let params = [];
  let i = 1;
  if (estado) { where.push(`p.estado=$${i++}`); params.push(estado); }
  const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';
  try {
    const countQ = await pool.query(`SELECT COUNT(*) FROM pedidos p ${whereStr}`, params);
    const total = parseInt(countQ.rows[0].count);
    const { rows } = await pool.query(
      `SELECT p.*, u.nombre as cliente_nombre, u.email as cliente_email, u.telefono as cliente_telefono
       FROM pedidos p LEFT JOIN usuarios u ON p.usuario_id=u.id
       ${whereStr} ORDER BY p.created_at DESC LIMIT $${i} OFFSET $${i + 1}`,
      [...params, limit, offset]
    );
    res.json({ orders: rows, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/orders/:id', async (req, res) => {
  try {
    const orderQ = await pool.query(
      `SELECT p.*, u.nombre as cliente_nombre, u.email as cliente_email, u.telefono as cliente_telefono
       FROM pedidos p LEFT JOIN usuarios u ON p.usuario_id=u.id WHERE p.id=$1`,
      [req.params.id]
    );
    if (!orderQ.rows.length) return res.status(404).json({ error: 'Pedido no encontrado' });
    const itemsQ = await pool.query(
      `SELECT dp.*, pr.nombre, pr.imagen_url FROM detalle_pedidos dp
       JOIN productos pr ON dp.producto_id=pr.id WHERE dp.pedido_id=$1`,
      [req.params.id]
    );
    res.json({ ...orderQ.rows[0], items: itemsQ.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/orders/:id/estado', async (req, res) => {
  const { estado } = req.body;
  const valid = ['pendiente', 'verificado', 'en_camino', 'entregado', 'cancelado', 'rechazado'];
  if (!valid.includes(estado)) return res.status(400).json({ error: 'Estado inválido' });
  try {
    const { rows } = await pool.query(
      'UPDATE pedidos SET estado=$1 WHERE id=$2 RETURNING *',
      [estado, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DIAGNÓSTICO TEMPORAL — eliminar una vez confirmado el chat_id correcto ───
router.get('/telegram-debug', (req, res) => {
  const { getChatIdsDiagnostico } = require('../services/telegramBot');
  const idsDetectados = getChatIdsDiagnostico();
  const configurado = (process.env.TELEGRAM_CHAT_ID || '').trim();

  if (idsDetectados.length === 0) {
    return res.json({
      chat_id_configurado: configurado || null,
      chat_ids_detectados: [],
      diagnostico: 'SIN DATOS',
      instrucciones: [
        '1. Abre Telegram y envíale cualquier mensaje al bot (por ejemplo "hola").',
        '2. Vuelve a llamar este endpoint.',
        '3. Verás el chat_id real en chat_ids_detectados.',
      ],
    });
  }

  const coincide = configurado && idsDetectados.includes(configurado);

  const respuesta = {
    chat_id_configurado: configurado || null,
    chat_ids_detectados: idsDetectados,
  };

  if (!configurado) {
    respuesta.diagnostico = 'ERROR';
    respuesta.instrucciones = `TELEGRAM_CHAT_ID no está configurado en tu .env. Agrega: TELEGRAM_CHAT_ID=${idsDetectados[0]}`;
  } else if (coincide) {
    respuesta.diagnostico = 'OK — el chat_id configurado coincide';
    respuesta.instrucciones = [
      'El chat_id es correcto. Si el error persiste, verifica:',
      '1. Que el bot sea miembro del grupo/canal (si usas uno).',
      '2. Que el bot no esté bloqueado o silenciado.',
      '3. Reinicia el servidor para que el polling reconecte.',
    ];
  } else {
    respuesta.diagnostico = 'ERROR — chat_id incorrecto';
    respuesta.instrucciones = `Tu TELEGRAM_CHAT_ID actual es "${configurado}", pero el chat_id real detectado es "${idsDetectados[0]}". Actualiza tu .env con ese valor y reinicia el servidor.`;
  }

  res.json(respuesta);
});
// ─── FIN DIAGNÓSTICO TEMPORAL ──────────────────────────────────────────────

module.exports = router;
