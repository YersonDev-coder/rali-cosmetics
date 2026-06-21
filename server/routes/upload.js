const express = require('express');
const { upload, wrapMulter, uploadToCloudinary } = require('../middleware/upload');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, adminMiddleware, wrapMulter(upload.single('image')), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió imagen' });
  try {
    const url = await uploadToCloudinary(req.file.buffer, 'rali-productos');
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
