const express = require('express');
const pool = require('../db');
const { enviarClienteAprobado, enviarClienteRechazado } = require('../utils/mailer');

const router = express.Router();

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function paginaHtml(titulo, mensaje, color) {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><title>${escapeHtml(titulo)}</title></head>
    <body style="font-family: Arial, sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; background:#f8f0f1;">
      <div style="background:#fff; padding:40px; border-radius:16px; box-shadow:0 4px 20px rgba(0,0,0,0.1); text-align:center; max-width:420px;">
        <h1 style="color:${escapeHtml(color)}; margin-bottom:16px;">${escapeHtml(titulo)}</h1>
        <p style="color:#555; font-size:16px;">${escapeHtml(mensaje)}</p>
      </div>
    </body>
    </html>
  `;
}

// Lógica de aprobación extraída como función reutilizable.
// Usada tanto por el endpoint GET (link de email legacy) como por el bot de Telegram.
// Retorna { ok: false, yaUsado: true } si el token ya fue consumido o no existe.
async function aprobarPedido(token) {
  const { rows } = await pool.query('SELECT * FROM pedidos WHERE approval_token=$1', [token]);
  if (!rows.length) return { ok: false, yaUsado: true };

  const pedido = rows[0];
  let numeroBoleta;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: seqRows } = await client.query("SELECT nextval('boleta_seq') as n");
    numeroBoleta = `B001-${String(parseInt(seqRows[0].n)).padStart(5, '0')}`;
    await client.query(
      'UPDATE pedidos SET estado=$1, approval_token=NULL, numero_boleta=$2 WHERE id=$3',
      ['verificado', numeroBoleta, pedido.id]
    );
    await client.query('COMMIT');
  } catch (txErr) {
    await client.query('ROLLBACK');
    throw txErr;
  } finally {
    client.release();
  }

  const clienteQ = await pool.query('SELECT email FROM usuarios WHERE id=$1', [pedido.usuario_id]);
  if (clienteQ.rows.length) {
    try {
      await enviarClienteAprobado(clienteQ.rows[0].email, pedido.id);
    } catch (mailErr) {
      console.error('Error al notificar al cliente:', mailErr.message);
    }
  }

  return { ok: true, pedido: { ...pedido, numero_boleta: numeroBoleta } };
}

// Lógica de rechazo extraída como función reutilizable.
async function rechazarPedido(token) {
  const { rows } = await pool.query('SELECT * FROM pedidos WHERE approval_token=$1', [token]);
  if (!rows.length) return { ok: false, yaUsado: true };

  const pedido = rows[0];
  await pool.query('UPDATE pedidos SET estado=$1, approval_token=NULL WHERE id=$2', ['rechazado', pedido.id]);

  const clienteQ = await pool.query('SELECT email FROM usuarios WHERE id=$1', [pedido.usuario_id]);
  if (clienteQ.rows.length) {
    try {
      await enviarClienteRechazado(clienteQ.rows[0].email, pedido.id);
    } catch (mailErr) {
      console.error('Error al notificar al cliente:', mailErr.message);
    }
  }

  return { ok: true, pedido };
}

// Endpoint legacy: aprobación por link de email. Se mantiene como respaldo manual.
router.get('/aprobar-pedido', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send(paginaHtml('Enlace inválido', 'Falta el token de aprobación.', '#c62828'));
  try {
    const resultado = await aprobarPedido(token);
    if (!resultado.ok) {
      return res.send(paginaHtml('Enlace no válido', 'Este enlace ya fue utilizado anteriormente o no es válido.', '#c62828'));
    }
    res.send(paginaHtml(
      `✅ Pedido #${resultado.pedido.id} aprobado correctamente`,
      `Boleta ${resultado.pedido.numero_boleta} generada. El cliente ha sido notificado por correo.`,
      '#2e7d32'
    ));
  } catch (err) {
    res.status(500).send(paginaHtml('Error', err.message, '#c62828'));
  }
});

// Endpoint legacy: rechazo por link de email. Se mantiene como respaldo manual.
router.get('/rechazar-pedido', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send(paginaHtml('Enlace inválido', 'Falta el token de aprobación.', '#c62828'));
  try {
    const resultado = await rechazarPedido(token);
    if (!resultado.ok) {
      return res.send(paginaHtml('Enlace no válido', 'Este enlace ya fue utilizado anteriormente o no es válido.', '#c62828'));
    }
    res.send(paginaHtml(`❌ Pedido #${resultado.pedido.id} rechazado`, 'El cliente ha sido notificado por correo.', '#c62828'));
  } catch (err) {
    res.status(500).send(paginaHtml('Error', err.message, '#c62828'));
  }
});

module.exports = router;
module.exports.aprobarPedido = aprobarPedido;
module.exports.rechazarPedido = rechazarPedido;
