const { z } = require('zod');

const registerSchema = z.object({
  nombre:    z.string({ required_error: 'El nombre es requerido' }).min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  email:     z.string({ required_error: 'El email es requerido' }).email('Email inválido'),
  password:  z.string({ required_error: 'La contraseña es requerida' })
               .min(8, 'La contraseña debe tener al menos 8 caracteres')
               .regex(/[A-Z]/, 'La contraseña debe tener al menos una mayúscula')
               .regex(/[*&%$#!?@.,-]/, 'La contraseña debe tener al menos un carácter especial (*&%$#!?@.,-)'),
  telefono:  z.string().max(15).optional().nullable(),
  direccion: z.string().max(200).optional().nullable(),
});

const loginSchema = z.object({
  email:    z.string({ required_error: 'El email es requerido' }).email('Email inválido'),
  password: z.string({ required_error: 'La contraseña es requerida' }).min(1, 'La contraseña es requerida'),
});

const createOrderSchema = z.object({
  tipo_entrega: z.enum(['delivery', 'recojo'], {
    errorMap: () => ({ message: "tipo_entrega debe ser 'delivery' o 'recojo'" }),
  }),
  metodo_pago: z.enum(['yape', 'plin', 'contra_entrega'], {
    errorMap: () => ({ message: "Método de pago no válido. Opciones: yape, plin, contra_entrega" }),
  }),
  items: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return val; }
      }
      return val;
    },
    z.array(
      z.object({
        id:          z.coerce.number().int().positive('El id del producto debe ser un número positivo'),
        cantidad:    z.coerce.number().int().positive('La cantidad debe ser un entero mayor a 0'),
        variante_id: z.preprocess(
          val => (val == null || val === '') ? undefined : Number(val),
          z.number().int().positive().optional()
        ),
      })
    ).min(1, 'El pedido debe contener al menos un producto')
  ),
  direccion_entrega: z.string().max(200).optional().nullable(),
  distrito:          z.string().max(100).optional().nullable(),
});

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues.map(e => e.message).join('; ');
      return res.status(400).json({ error: message });
    }
    req.body = result.data;
    next();
  };
}

module.exports = { registerSchema, loginSchema, createOrderSchema, validate };
