const puppeteer = require('puppeteer');

const METODO_LABELS = { yape: 'Yape', plin: 'Plin', contra_entrega: 'Contra entrega' };
const ENTREGA_LABELS = { delivery: 'Delivery a domicilio', recojo: 'Recojo en tienda' };

function formatearFecha(fechaStr) {
  return new Date(fechaStr).toLocaleDateString('es-PE', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function generarHtml({ pedido, cliente, items }) {
  const filas = items.map(item => `
    <tr>
      <td class="td">${item.nombre}</td>
      <td class="td center">${item.cantidad}</td>
      <td class="td right">S/ ${parseFloat(item.precio_unitario).toFixed(2)}</td>
      <td class="td right">S/ ${(item.cantidad * parseFloat(item.precio_unitario)).toFixed(2)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:Arial,sans-serif; color:#333; background:#fff; padding:36px 44px; font-size:13px; line-height:1.5; }

  /* Header */
  .header { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:18px; border-bottom:3px solid #b76e79; margin-bottom:26px; }
  .brand-name { font-size:26px; font-weight:bold; color:#b76e79; letter-spacing:1px; }
  .brand-sub { font-size:10px; color:#999; margin-top:4px; }
  .boleta-meta { text-align:right; }
  .boleta-tag { font-size:10px; text-transform:uppercase; letter-spacing:1px; color:#999; }
  .boleta-num { font-size:20px; font-weight:bold; color:#b76e79; margin:2px 0; }
  .boleta-fecha { font-size:11px; color:#666; }

  /* Cliente */
  .section-title { font-size:10px; text-transform:uppercase; letter-spacing:1px; color:#b76e79; font-weight:bold; margin-bottom:10px; }
  .cliente-box { background:#f8f0f1; border-radius:10px; padding:14px 18px; margin-bottom:22px; }
  .cliente-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px 24px; }
  .field label { font-size:10px; color:#999; display:block; margin-bottom:2px; }
  .field span { font-size:12px; font-weight:600; color:#333; }

  /* Info row */
  .info-row { display:flex; gap:12px; margin-bottom:22px; }
  .info-pill { flex:1; background:#f8f0f1; border-radius:8px; padding:10px 14px; }
  .info-pill label { font-size:10px; color:#999; text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:3px; }
  .info-pill span { font-size:12px; font-weight:600; }

  /* Tabla */
  table { width:100%; border-collapse:collapse; margin-bottom:20px; }
  thead tr { background:#b76e79; }
  thead th { color:#fff; padding:9px 10px; font-size:11px; font-weight:600; text-align:left; }
  thead th.center { text-align:center; }
  thead th.right { text-align:right; }
  .td { padding:8px 10px; border-bottom:1px solid #f0e0e2; font-size:12px; }
  .td.center { text-align:center; }
  .td.right { text-align:right; }
  tr:nth-child(even) td { background:#fdf5f6; }

  /* Totales */
  .totales-wrap { display:flex; justify-content:flex-end; margin-bottom:28px; }
  .totales { width:220px; }
  .trow { display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px solid #f0e0e2; font-size:12px; color:#555; }
  .trow.bold { font-weight:bold; font-size:15px; color:#b76e79; border-bottom:none; padding-top:10px; }

  /* Footer */
  .footer { border-top:1px solid #f0e0e2; padding-top:14px; text-align:center; color:#bbb; font-size:10px; line-height:1.7; }
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="brand-name">RALI Cosmetics</div>
    <div class="brand-sub">Huánuco, Perú &nbsp;·&nbsp; +51 983 573 536</div>
  </div>
  <div class="boleta-meta">
    <div class="boleta-tag">Boleta de Venta</div>
    <div class="boleta-num">${pedido.numero_boleta}</div>
    <div class="boleta-fecha">${formatearFecha(pedido.created_at)}</div>
  </div>
</div>

<div class="cliente-box">
  <div class="section-title">Datos del cliente</div>
  <div class="cliente-grid">
    <div class="field"><label>Nombre</label><span>${cliente.nombre}</span></div>
    <div class="field"><label>Email</label><span>${cliente.email}</span></div>
    ${cliente.telefono ? `<div class="field"><label>Teléfono</label><span>${cliente.telefono}</span></div>` : ''}
    ${pedido.direccion_entrega ? `<div class="field"><label>Dirección</label><span>${pedido.direccion_entrega}${pedido.distrito ? ', ' + pedido.distrito : ''}</span></div>` : ''}
  </div>
</div>

<div class="info-row">
  <div class="info-pill">
    <label>Pedido N°</label>
    <span>#${pedido.id}</span>
  </div>
  <div class="info-pill">
    <label>Tipo de entrega</label>
    <span>${ENTREGA_LABELS[pedido.tipo_entrega] || pedido.tipo_entrega}</span>
  </div>
  <div class="info-pill">
    <label>Método de pago</label>
    <span>${METODO_LABELS[pedido.metodo_pago] || pedido.metodo_pago}</span>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th>Producto</th>
      <th class="center">Cant.</th>
      <th class="right">P. Unit.</th>
      <th class="right">Total</th>
    </tr>
  </thead>
  <tbody>${filas}</tbody>
</table>

<div class="totales-wrap">
  <div class="totales">
    <div class="trow"><span>Subtotal</span><span>S/ ${parseFloat(pedido.subtotal).toFixed(2)}</span></div>
    <div class="trow"><span>Delivery</span><span>S/ ${parseFloat(pedido.costo_delivery).toFixed(2)}</span></div>
    <div class="trow bold"><span>TOTAL</span><span>S/ ${parseFloat(pedido.total).toFixed(2)}</span></div>
  </div>
</div>

<div class="footer">
  <p>Este documento es un comprobante interno de RALI Cosmetics. No válido como comprobante SUNAT.</p>
  <p>Gracias por tu compra &mdash; RALI Cosmetics &nbsp;|&nbsp; zyersonrojasvilca7z@gmail.com</p>
</div>

</body>
</html>`;
}

async function generarBoletaPDF(datos) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(generarHtml(datos), { waitUntil: 'load' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    return Buffer.from(pdf);
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { generarBoletaPDF };
