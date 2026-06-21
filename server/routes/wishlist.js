const express = require('express');
const pool = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*, c.nombre as categoria_nombre FROM lista_deseos ld
       JOIN productos p ON ld.producto_id=p.id
       LEFT JOIN categorias c ON p.categoria_id=c.id
       WHERE ld.usuario_id=$1 ORDER BY ld.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:producto_id', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'INSERT INTO lista_deseos (usuario_id,producto_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [req.user.id, req.params.producto_id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:producto_id', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM lista_deseos WHERE usuario_id=$1 AND producto_id=$2',
      [req.user.id, req.params.producto_id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/ids', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT producto_id FROM lista_deseos WHERE usuario_id=$1',
      [req.user.id]
    );
    res.json(rows.map(r => r.producto_id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
