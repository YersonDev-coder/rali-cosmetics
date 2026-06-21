const express = require('express');
const pool = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/mis-pedidos', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*,
        (SELECT json_agg(json_build_object('nombre',pr.nombre,'cantidad',dp.cantidad,'precio',dp.precio_unitario,'imagen',pr.imagen_url))
         FROM detalle_pedidos dp JOIN productos pr ON dp.producto_id=pr.id WHERE dp.pedido_id=p.id) as items
       FROM pedidos p WHERE p.usuario_id=$1 ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
