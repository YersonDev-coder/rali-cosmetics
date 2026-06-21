require('dotenv').config({ path: '../.env' });
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const orderRoutes = require('./routes/orders');
const pedidosRoutes = require('./routes/pedidos');
const wishlistRoutes = require('./routes/wishlist');
const adminRoutes = require('./routes/admin');
const orderApprovalRoutes = require('./routes/orderApproval');
const uploadRoutes = require('./routes/upload');
const { initBot, registrarWebhookEndpoint } = require('./services/telegramBot');

const app = express();

// FIX 6: Helmet — headers de seguridad
// contentSecurityPolicy desactivado: las páginas de aprobación de pedidos (orderApproval.js)
// usan inline styles extensivamente. Añadir CSP requiere mover esos estilos a una hoja externa.
app.use(helmet({
  contentSecurityPolicy: false,
}));

// FIX 7: CORS — filtra undefined, restringe localhost a no-producción
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.NODE_ENV !== 'production' ? 'http://localhost:5173' : null,
].filter(Boolean);

if (process.env.NODE_ENV === 'production' && !process.env.CLIENT_URL) {
  console.warn('⚠️  CLIENT_URL no está configurado — CORS bloqueará el frontend en producción');
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/admin', orderApprovalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

initBot();
registrarWebhookEndpoint(app);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
