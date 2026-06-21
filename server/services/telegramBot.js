const TelegramBot = require('node-telegram-bot-api');

let bot = null;
// Almacena en memoria los chat IDs que interactúan con el bot (diagnóstico temporal)
const chatIdsVistos = new Set();

function esc(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function initBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn('[Telegram] TELEGRAM_BOT_TOKEN no configurado — bot desactivado');
    return null;
  }

  const useWebhook = process.env.TELEGRAM_USE_WEBHOOK === 'true';

  try {
    if (useWebhook) {
      bot = new TelegramBot(token);
      console.log('[Telegram] Bot iniciado en modo webhook');
    } else {
      bot = new TelegramBot(token, { polling: true });
      console.log('[Telegram] Bot iniciado en modo polling');
    }

    bot.on('polling_error', (err) => {
      console.error('[Telegram] Error de polling:', err.code, '-', err.message);
    });
    bot.on('error', (err) => {
      console.error('[Telegram] Error del bot:', err.message);
    });

    registrarCallbackHandler();

    // Captura el chat.id de cualquier mensaje recibido (para diagnóstico con /telegram-debug)
    bot.on('message', (msg) => {
      if (msg.chat?.id !== undefined) chatIdsVistos.add(String(msg.chat.id));
    });
  } catch (err) {
    console.error('[Telegram] Error al inicializar bot:', err.message);
    bot = null;
  }

  return bot;
}

// Registra el endpoint POST /bot/webhook para producción/Render.
// Llama a esta función desde index.js después de app.use(express.json()).
// Para activarlo: setea TELEGRAM_USE_WEBHOOK=true y registra el webhook con Telegram:
//   await bot.setWebHook('https://tu-dominio.com/bot/webhook', { secret_token: TELEGRAM_WEBHOOK_SECRET })
function registrarWebhookEndpoint(app) {
  if (process.env.TELEGRAM_USE_WEBHOOK !== 'true' || !bot) return;

  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  app.post('/bot/webhook', (req, res) => {
    const incomingSecret = req.headers['x-telegram-bot-api-secret-token'];
    if (webhookSecret && incomingSecret !== webhookSecret) {
      console.warn('[Telegram] Webhook: secret_token inválido — petición rechazada');
      return res.status(403).send('Forbidden');
    }
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });

  console.log('[Telegram] Endpoint webhook registrado en POST /bot/webhook');
}

function registrarCallbackHandler() {
  if (!bot) return;

  bot.on('callback_query', async (query) => {
    const { data, message } = query;
    if (!data || !message) return;

    const chatId = message.chat.id;
    const messageId = message.message_id;
    chatIdsVistos.add(String(chatId));

    // callback_data: "aprobar_<uuid>" o "rechazar_<uuid>"
    // UUIDs usan guiones (-), no underscores (_), así que el primer _ separa la acción del token
    const underscoreIdx = data.indexOf('_');
    if (underscoreIdx === -1) return;
    const accion = data.slice(0, underscoreIdx);
    const token = data.slice(underscoreIdx + 1);

    if (accion !== 'aprobar' && accion !== 'rechazar') return;

    try {
      await bot.answerCallbackQuery(query.id);

      // Require diferido para evitar dependencias circulares en carga de módulos
      const { aprobarPedido, rechazarPedido } = require('../routes/orderApproval');
      const resultado = accion === 'aprobar'
        ? await aprobarPedido(token)
        : await rechazarPedido(token);

      if (!resultado.ok) {
        await bot.editMessageText('⚠️ Este pedido ya fue procesado anteriormente.', {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: { inline_keyboard: [] },
        });
        return;
      }

      const emoji = accion === 'aprobar' ? '✅' : '❌';
      const accionLabel = accion === 'aprobar' ? 'APROBADO' : 'RECHAZADO';
      await bot.editMessageText(`${emoji} Pedido #${resultado.pedido.id} ${accionLabel}`, {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: { inline_keyboard: [] },
      });
    } catch (err) {
      console.error('[Telegram] Error al procesar callback:', err.message);
      try {
        await bot.editMessageText('❌ Error al procesar la acción. Revisa los logs del servidor.', {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: { inline_keyboard: [] },
        });
      } catch (_) {}
    }
  });
}

async function notificarAdminNuevoPedido({ pedido, cliente }) {
  if (!bot) {
    console.warn('[Telegram] Bot no inicializado — notificación omitida');
    return;
  }

  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) {
    console.warn('[Telegram] TELEGRAM_CHAT_ID no configurado — notificación omitida');
    return;
  }

  const tipoEntregaLabel = pedido.tipo_entrega === 'delivery' ? '🚚 Delivery' : '🏪 Recojo en tienda';
  const metodoLabel =
    pedido.metodo_pago === 'yape' ? 'Yape' :
    pedido.metodo_pago === 'plin' ? 'Plin' :
    esc(pedido.metodo_pago);

  let texto = `🛍️ <b>Nuevo pedido #${pedido.id}</b>\n\n`;
  texto += `👤 <b>Cliente:</b> ${esc(cliente.nombre)}\n`;
  texto += `💰 <b>Total:</b> S/ ${parseFloat(pedido.total).toFixed(2)}\n`;
  texto += `📦 <b>Entrega:</b> ${tipoEntregaLabel}\n`;
  texto += `💳 <b>Pago:</b> ${metodoLabel}`;

  if (pedido.comprobante_url) {
    texto += `\n\n📎 <a href="${pedido.comprobante_url}">Ver comprobante</a>`;
  } else {
    texto += `\n\n📎 <i>Sin comprobante adjunto</i>`;
  }

  await bot.sendMessage(chatId, texto, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [[
        { text: '✅ Aprobar', callback_data: `aprobar_${pedido.approval_token}` },
        { text: '❌ Rechazar', callback_data: `rechazar_${pedido.approval_token}` },
      ]],
    },
  });
}

// Devuelve los chat IDs que han interactuado con el bot desde que arrancó el proceso.
// Solo usado por el endpoint de diagnóstico temporal GET /api/admin/telegram-debug.
function getChatIdsDiagnostico() {
  return [...chatIdsVistos];
}

module.exports = { initBot, registrarWebhookEndpoint, notificarAdminNuevoPedido, getChatIdsDiagnostico };
