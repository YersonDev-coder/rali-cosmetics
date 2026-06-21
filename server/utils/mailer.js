const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function enviarCodigoVerificacion(email, codigo) {
  await transporter.sendMail({
    from: `"RALI Cosmetics" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verifica tu correo - RALI Cosmetics',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #b76e79;">RALI Cosmetics</h2>
        <p>Gracias por registrarte. Usa el siguiente código para verificar tu correo:</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; text-align: center; background: #f8f0f1; padding: 16px; border-radius: 12px; color: #b76e79; margin: 24px 0;">
          ${codigo}
        </div>
        <p>Este código expira en <strong>15 minutos</strong>.</p>
        <p style="margin-top: 32px; color: #777;">— Equipo RALI Cosmetics</p>
      </div>
    `,
  });
}

function generarCodigo() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const ADMIN_EMAIL = 'zyersonrojasvilca7z@gmail.com';

async function enviarPedidoAdmin({ pedido, cliente, items }) {
  const itemsHtml = items.map(i =>
    `<tr>
      <td style="padding:6px 8px; border-bottom:1px solid #eee;">${i.nombre}</td>
      <td style="padding:6px 8px; border-bottom:1px solid #eee; text-align:center;">${i.cantidad}</td>
      <td style="padding:6px 8px; border-bottom:1px solid #eee; text-align:right;">S/ ${parseFloat(i.precio_unitario).toFixed(2)}</td>
    </tr>`
  ).join('');

  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const aprobarUrl = `${baseUrl}/api/admin/aprobar-pedido?token=${pedido.approval_token}`;
  const rechazarUrl = `${baseUrl}/api/admin/rechazar-pedido?token=${pedido.approval_token}`;

  const attachments = [];
  let imagenHtml = '<p style="color:#999;">Sin comprobante adjunto</p>';
  if (pedido.comprobante_url) {
    attachments.push({ filename: 'comprobante.jpg', path: pedido.comprobante_url, cid: 'comprobante' });
    imagenHtml = `<img src="cid:comprobante" alt="Comprobante de pago" style="max-width:100%; border-radius:8px; margin-top:8px;" />`;
  }

  await transporter.sendMail({
    from: `"RALI Cosmetics" <${process.env.EMAIL_USER}>`,
    to: ADMIN_EMAIL,
    subject: `Nuevo pedido #${pedido.id} - S/ ${parseFloat(pedido.total).toFixed(2)} - ${cliente.nombre}`,
    attachments,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #b76e79;">Nuevo pedido #${pedido.id}</h2>
        <p><strong>Cliente:</strong> ${cliente.nombre}<br/>
        <strong>Teléfono:</strong> ${cliente.telefono || 'No registrado'}</p>

        <table style="width:100%; border-collapse:collapse; margin:16px 0;">
          <thead>
            <tr>
              <th style="text-align:left; padding:6px 8px; border-bottom:2px solid #b76e79;">Producto</th>
              <th style="text-align:center; padding:6px 8px; border-bottom:2px solid #b76e79;">Cant.</th>
              <th style="text-align:right; padding:6px 8px; border-bottom:2px solid #b76e79;">Precio</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>

        <p><strong>Tipo de entrega:</strong> ${pedido.tipo_entrega}<br/>
        <strong>Método de pago:</strong> ${pedido.metodo_pago}<br/>
        <strong>Total:</strong> S/ ${parseFloat(pedido.total).toFixed(2)}</p>

        <p><strong>Comprobante:</strong></p>
        ${imagenHtml}

        <div style="text-align:center; margin:32px 0;">
          <a href="${aprobarUrl}" style="display:inline-block; background:#2e7d32; color:#fff; padding:14px 28px; border-radius:8px; text-decoration:none; font-weight:bold; margin:0 8px;">✅ Aprobar pedido</a>
          <a href="${rechazarUrl}" style="display:inline-block; background:#c62828; color:#fff; padding:14px 28px; border-radius:8px; text-decoration:none; font-weight:bold; margin:0 8px;">❌ Rechazar pedido</a>
        </div>

        <p style="margin-top:32px; color:#777;">— RALI Cosmetics</p>
      </div>
    `,
  });
}

async function enviarClienteAprobado(email, pedidoId) {
  await transporter.sendMail({
    from: `"RALI Cosmetics" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Tu pedido #${pedidoId} fue verificado - RALI Cosmetics`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #2e7d32;">¡Pedido verificado!</h2>
        <p>Tu pedido <strong>#${pedidoId}</strong> fue verificado correctamente. Pronto nos pondremos en contacto contigo para coordinar la entrega.</p>
        <p style="margin-top:32px; color:#777;">— RALI Cosmetics</p>
      </div>
    `,
  });
}

async function enviarClienteRechazado(email, pedidoId) {
  await transporter.sendMail({
    from: `"RALI Cosmetics" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `No pudimos verificar tu pedido #${pedidoId} - RALI Cosmetics`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #c62828;">No pudimos verificar tu comprobante</h2>
        <p>Tu comprobante de pago para el pedido <strong>#${pedidoId}</strong> no pudo verificarse. Por favor contáctanos al WhatsApp <strong>+51 983 573 536</strong> para resolverlo.</p>
        <p style="margin-top:32px; color:#777;">— RALI Cosmetics</p>
      </div>
    `,
  });
}

module.exports = {
  enviarCodigoVerificacion,
  generarCodigo,
  enviarPedidoAdmin,
  enviarClienteAprobado,
  enviarClienteRechazado,
};
