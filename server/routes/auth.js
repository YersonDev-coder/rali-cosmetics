const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { loginLimiter, verifyLimiter } = require('../middleware/rateLimiter');
const { registerSchema, loginSchema, validate } = require('../validators');
const { enviarCodigoVerificacion, generarCodigo } = require('../utils/mailer');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function setCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

router.post('/register', validate(registerSchema), async (req, res) => {
  const { nombre, email, password, telefono, direccion } = req.body;
  if (!nombre || !email || !password) return res.status(400).json({ error: 'Campos requeridos' });
  try {
    const exists = await pool.query('SELECT id FROM usuarios WHERE email=$1', [email]);
    if (exists.rows.length) return res.status(409).json({ error: 'Email ya registrado' });
    const hash = await bcrypt.hash(password, 10);
    const codigo = generarCodigo();
    const expira = new Date(Date.now() + 15 * 60 * 1000);
    const { rows } = await pool.query(
      `INSERT INTO usuarios (nombre,email,password_hash,telefono,direccion,codigo_verificacion,codigo_expira)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id,nombre,email,rol`,
      [nombre, email, hash, telefono || null, direccion || null, codigo, expira]
    );
    await enviarCodigoVerificacion(email, codigo);
    res.json({ mensaje: 'Cuenta creada. Revisa tu correo para verificar tu cuenta.', email: rows[0].email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/verificar-email', verifyLimiter, async (req, res) => {
  const { email, codigo } = req.body;
  if (!email || !codigo) return res.status(400).json({ error: 'Campos requeridos' });
  try {
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE email=$1', [email]);
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
    const usuario = rows[0];
    if (usuario.email_verificado) return res.status(400).json({ error: 'El email ya está verificado' });
    if (usuario.codigo_verificacion !== codigo) return res.status(400).json({ error: 'Código incorrecto' });
    if (!usuario.codigo_expira || new Date(usuario.codigo_expira) < new Date()) {
      return res.status(400).json({ error: 'El código ha expirado, solicita uno nuevo' });
    }
    await pool.query(
      'UPDATE usuarios SET email_verificado=true, codigo_verificacion=NULL, codigo_expira=NULL WHERE id=$1',
      [usuario.id]
    );
    res.json({ mensaje: 'Email verificado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reenviar-codigo', verifyLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requerido' });
  try {
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE email=$1', [email]);
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (rows[0].email_verificado) return res.status(400).json({ error: 'El email ya está verificado' });
    const codigo = generarCodigo();
    const expira = new Date(Date.now() + 15 * 60 * 1000);
    await pool.query('UPDATE usuarios SET codigo_verificacion=$1, codigo_expira=$2 WHERE id=$3', [codigo, expira, rows[0].id]);
    await enviarCodigoVerificacion(email, codigo);
    res.json({ mensaje: 'Código reenviado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', loginLimiter, validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE email=$1', [email]);
    if (!rows.length) return res.status(401).json({ error: 'Credenciales inválidas' });
    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });
    if (!rows[0].email_verificado) {
      return res.status(403).json({ error: 'Verifica tu correo primero', emailNoVerificado: true, email: rows[0].email });
    }
    const token = signToken(rows[0]);
    setCookie(res, token);
    const { password_hash, ...user } = rows[0];
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id,nombre,email,telefono,direccion,rol,created_at FROM usuarios WHERE id=$1',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/me', authMiddleware, async (req, res) => {
  const { nombre, telefono, direccion } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE usuarios SET nombre=$1,telefono=$2,direccion=$3 WHERE id=$4 RETURNING id,nombre,email,telefono,direccion,rol',
      [nombre, telefono, direccion, req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
