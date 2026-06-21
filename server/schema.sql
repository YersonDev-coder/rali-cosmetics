CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE SEQUENCE IF NOT EXISTS boleta_seq START 1;

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  direccion TEXT,
  rol VARCHAR(20) DEFAULT 'cliente' CHECK (rol IN ('cliente', 'admin')),
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS codigo_verificacion VARCHAR(6);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS codigo_expira TIMESTAMP;

CREATE TABLE IF NOT EXISTS categorias (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  imagen_url TEXT,
  orden INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS productos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL,
  stock INT DEFAULT 0,
  imagen_url TEXT,
  categoria_id INT REFERENCES categorias(id) ON DELETE SET NULL,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
  tipo_entrega VARCHAR(20) CHECK (tipo_entrega IN ('delivery', 'recojo')),
  direccion_entrega TEXT,
  distrito VARCHAR(100),
  metodo_pago VARCHAR(30) CHECK (metodo_pago IN ('yape', 'plin', 'contra_entrega')),
  comprobante_url TEXT,
  subtotal DECIMAL(10,2) NOT NULL,
  costo_delivery DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  estado VARCHAR(30) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'verificado', 'en_camino', 'entregado', 'cancelado')),
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS approval_token VARCHAR(64) UNIQUE;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS numero_boleta VARCHAR(20) UNIQUE;
ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_estado_check;
ALTER TABLE pedidos ADD CONSTRAINT pedidos_estado_check
  CHECK (estado IN ('pendiente', 'verificado', 'en_camino', 'entregado', 'cancelado', 'rechazado'));

CREATE TABLE IF NOT EXISTS detalle_pedidos (
  id SERIAL PRIMARY KEY,
  pedido_id INT REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id INT REFERENCES productos(id) ON DELETE SET NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS lista_deseos (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
  producto_id INT REFERENCES productos(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(usuario_id, producto_id)
);
