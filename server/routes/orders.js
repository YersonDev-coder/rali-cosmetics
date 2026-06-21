const express = require('express');
const crypto = require('crypto');
const pool = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { uploadComprobante, wrapMulter, uploadToCloudinary } = require('../middleware/upload');
const { createOrderSchema, validate } = require('../validators');
const { notificarAdminNuevoPedido } = require('../services/telegramBot');

const router = express.Router();

router.post('/', authMiddleware, wrapMulter(uploadComprobante.single('comprobante')), validate(createOrderSchema), async (req, res) => {
  const { tipo_entrega, direccion_entrega, distrito, metodo_pago, items } = req.body;
  // subtotal, costo_delivery y total del body son ignorados — se calculan en el servidor

  // Parseo y validación estructural de items
  let parsedItems;
  try {
    parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
    if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
      return res.status(400).json({ error: 'El pedido debe contener al menos un producto' });
    }
  } catch {
    return res.status(400).json({ error: 'Formato de items inválido' });
  }

  // FIX 2: cada cantidad debe ser un entero positivo >= 1
  for (const item of parsedItems) {
    const cant = Number(item.cantidad);
    if (!Number.isInteger(cant) || cant < 1) {
      return res.status(400).json({ error: `Cantidad inválida para el producto ${item.id}: debe ser un entero mayor a 0` });
    }
  }

  // Obtener precios y stock reales desde la DB
  const productIds = [...new Set(parsedItems.map(i => i.id))];
  const placeholders = productIds.map((_, idx) => `$${idx + 1}`).join(',');
  let productosMap;
  try {
    const { rows: prods } = await pool.query(
      `SELECT id, precio, stock, tiene_variantes FROM productos WHERE id IN (${placeholders}) AND activo = TRUE`,
      productIds
    );
    productosMap = Object.fromEntries(prods.map(p => [String(p.id), p]));
  } catch (err) {
    return res.status(500).json({ error: 'Error al verificar disponibilidad de productos' });
  }

  // Obtener stocks de variantes si aplica
  const varianteIds = parsedItems.filter(i => i.variante_id).map(i => i.variante_id);
  let variantesMap = {};
  if (varianteIds.length > 0) {
    try {
      const vPlaceholders = varianteIds.map((_, idx) => `$${idx + 1}`).join(',');
      const { rows: vars } = await pool.query(
        'SELECT id, producto_id, nombre, stock FROM producto_variantes WHERE id IN (' + vPlaceholders + ')',
        varianteIds
      );
      variantesMap = Object.fromEntries(vars.map(v => [String(v.id), v]));
    } catch (err) {
      return res.status(500).json({ error: 'Error al verificar disponibilidad de variantes' });
    }
  }

  for (const item of parsedItems) {
    const cant = Number(item.cantidad);
    const producto = productosMap[String(item.id)];
    if (!producto) {
      return res.status(400).json({ error: `Producto ${item.id} no disponible` });
    }
    if (producto.tiene_variantes) {
      if (!item.variante_id) {
        return res.status(400).json({ error: `Debes seleccionar un tono para el producto ${item.id}` });
      }
      const variante = variantesMap[String(item.variante_id)];
      if (!variante || String(variante.producto_id) !== String(item.id)) {
        return res.status(400).json({ error: `Variante no válida para el producto ${item.id}` });
      }
      if (variante.stock < cant) {
        return res.status(400).json({ error: `Stock insuficiente para el tono "${variante.nombre}"` });
      }
    } else {
      if (producto.stock < cant) {
        return res.status(400).json({ error: `Stock insuficiente para el producto ${item.id}` });
      }
    }
  }

  // FIX 1: calcular totales en el servidor
  const costo_delivery_real = tipo_entrega === 'delivery' ? 5.00 : 0.00;
  const subtotal_real = parsedItems.reduce(
    (sum, item) => sum + parseFloat(productosMap[String(item.id)].precio) * Number(item.cantidad),
    0
  );
  const total_real = parseFloat((subtotal_real + costo_delivery_real).toFixed(2));

  let comprobante_url = null;
  if (req.file) {
    comprobante_url = await uploadToCloudinary(req.file.buffer, 'rali-comprobantes');
  }

  const requiereAprobacion = metodo_pago === 'yape' || metodo_pago === 'plin';
  const approval_token = requiereAprobacion ? crypto.randomUUID() : null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO pedidos (usuario_id,tipo_entrega,direccion_entrega,distrito,metodo_pago,comprobante_url,subtotal,costo_delivery,total,approval_token)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.user.id, tipo_entrega, direccion_entrega || null, distrito || null,
       metodo_pago, comprobante_url, subtotal_real, costo_delivery_real, total_real, approval_token]
    );
    const pedido = rows[0];

    for (const item of parsedItems) {
      const cant = Number(item.cantidad);
      const precio_real = parseFloat(productosMap[String(item.id)].precio);
      const variante = item.variante_id ? variantesMap[String(item.variante_id)] : null;
      await client.query(
        'INSERT INTO detalle_pedidos (pedido_id,producto_id,cantidad,precio_unitario,variante_id,variante_nombre) VALUES ($1,$2,$3,$4,$5,$6)',
        [pedido.id, item.id, cant, precio_real, variante?.id || null, variante?.nombre || null]
      );
      if (variante) {
        const upd = await client.query(
          'UPDATE producto_variantes SET stock=stock-$1 WHERE id=$2 AND stock>=$1',
          [cant, variante.id]
        );
        if (upd.rowCount === 0) throw new Error(`Stock insuficiente para el tono "${variante.nombre}"`);
      } else {
        const upd = await client.query(
          'UPDATE productos SET stock=stock-$1 WHERE id=$2 AND stock>=$1',
          [cant, item.id]
        );
        if (upd.rowCount === 0) throw new Error(`Stock insuficiente para el producto ${item.id}`);
      }
    }

    await client.query('COMMIT');
    res.json(pedido);

    if (requiereAprobacion) {
      try {
        const clienteQ = await pool.query('SELECT nombre FROM usuarios WHERE id=$1', [req.user.id]);
        await notificarAdminNuevoPedido({ pedido, cliente: clienteQ.rows[0] });
      } catch (telegramErr) {
        console.error('Error al enviar notificación Telegram al admin:', telegramErr.message);
      }
    }
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.get('/my', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*,
        (SELECT json_agg(json_build_object('nombre',pr.nombre,'cantidad',dp.cantidad,'precio',dp.precio_unitario,'imagen',pr.imagen_url,'variante_nombre',dp.variante_nombre))
         FROM detalle_pedidos dp JOIN productos pr ON dp.producto_id=pr.id WHERE dp.pedido_id=p.id) as items
       FROM pedidos p WHERE p.usuario_id=$1 ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/boleta', authMiddleware, async (req, res) => {
  try {
    const orderQ = await pool.query(
      `SELECT p.*, u.nombre as cliente_nombre, u.email as cliente_email, u.telefono as cliente_telefono
       FROM pedidos p JOIN usuarios u ON p.usuario_id=u.id WHERE p.id=$1`,
      [req.params.id]
    );
    if (!orderQ.rows.length) return res.status(404).json({ error: 'Pedido no encontrado' });

    const pedido = orderQ.rows[0];

    if (req.user.rol !== 'admin' && pedido.usuario_id !== req.user.id) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    if (!pedido.numero_boleta) {
      return res.status(404).json({ error: 'Este pedido aún no tiene boleta generada' });
    }

    const itemsQ = await pool.query(
      `SELECT dp.cantidad, dp.precio_unitario, pr.nombre, dp.variante_nombre
       FROM detalle_pedidos dp JOIN productos pr ON dp.producto_id=pr.id WHERE dp.pedido_id=$1`,
      [req.params.id]
    );

    let generarBoletaPDF;
    try {
      ({ generarBoletaPDF } = require('../utils/boletaPDF'));
    } catch {
      return res.status(500).json({ error: 'Módulo PDF no disponible. Ejecuta: npm install puppeteer --prefix server' });
    }

    const pdfBuffer = await generarBoletaPDF({
      pedido,
      cliente: {
        nombre: pedido.cliente_nombre,
        email: pedido.cliente_email,
        telefono: pedido.cliente_telefono,
      },
      items: itemsQ.rows,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="boleta-${pedido.numero_boleta}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error al generar boleta PDF:', err.message);
    res.status(500).json({ error: 'Error al generar la boleta' });
  }
});

module.exports = router;
