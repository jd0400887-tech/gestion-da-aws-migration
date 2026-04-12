import type { Handler } from 'aws-lambda';

/**
 * ORANJEBOT: SMART RECRUITMENT BOT 🍊
 * Sincronizado con esquema RDS CamelCase.
 */

async function telegram(token: string, method: string, body: any) {
  const url = `https://api.telegram.org/bot${token}/${method}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function callGraphQL(query: string, variables: any = {}) {
  const endpoint = process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT || '';
  const apiKey = process.env.AMPLIFY_DATA_GRAPHQL_API_KEY || '';
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({ query, variables })
  });
  const json: any = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

const GET_HOTEL = `query GetHotel($id: ID!) { getHotel(id: $id) { id name } }`;
const UPDATE_HOTEL_CHAT = `mutation UpdateHotelChat($id: ID!, $chatId: String!) { updateHotel(input: { id: $id, telegram_chat_id: $chatId }) { id name } }`;
const LIST_HOTELS_BY_CHAT = `query ListHotels($chatId: String!) { listHotels(filter: { telegram_chat_id: { eq: $chatId } }) { items { id name } } }`;
const LIST_POSITIONS = `query ListPositions { listPositions(filter: { isActive: { eq: true } }) { items { id name } } }`;
const GET_POSITION = `query GetPosition($id: ID!) { getPosition(id: $id) { id name } }`;
const CREATE_REQUEST = `mutation CreateRequest($input: CreateStaffingRequestInput!) { createStaffingRequest(input: $input) { id request_number } }`;

export const handler: Handler = async (event) => {
  const token = process.env.TELEGRAM_BOT_TOKEN || '';
  let chatId = '0';

  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    if (!body) return { statusCode: 200, body: 'OK' };

    if (body.message?.chat?.id) chatId = String(body.message.chat.id);
    if (body.callback_query?.message?.chat?.id) chatId = String(body.callback_query.message.chat.id);

    if (!token) return { statusCode: 500, body: 'Token Error' };

    if (body.callback_query) {
      const cb = body.callback_query;
      const data = cb.data || '';

      if (data.startsWith('p_')) {
        const posId = data.split('_')[1];
        await telegram(token, 'sendMessage', {
          chat_id: chatId,
          text: `🔢 **Paso 2/5**: ¿Cuántas personas necesitas?`,
          reply_markup: { inline_keyboard: [
            [{ text: '1 Persona', callback_data: `q_${posId}_1` }, { text: '2 Personas', callback_data: `q_${posId}_2` }],
            [{ text: '3 Personas', callback_data: `q_${posId}_3` }, { text: 'Más de 3', callback_data: `q_${posId}_5` }],
            [{ text: '❌ Cancelar', callback_data: 'c' }]
          ]}
        });
      }

      if (data.startsWith('q_')) {
        const [_, posId, qty] = data.split('_');
        await telegram(token, 'sendMessage', {
          chat_id: chatId,
          text: `💼 **Paso 3/5**: Tipo de Contratación:`,
          reply_markup: { inline_keyboard: [
            [{ text: '⏳ Temporal (Refuerzo)', callback_data: `t_${posId}_${qty}_temp` }],
            [{ text: '👔 Permanente (Fijo)', callback_data: `t_${posId}_${qty}_perm` }],
            [{ text: '❌ Cancelar', callback_data: 'c' }]
          ]}
        });
      }

      if (data.startsWith('t_')) {
        const [_, posId, qty, type] = data.split('_');
        const dates = [];
        for (let i = 0; i < 4; i++) {
          const d = new Date();
          d.setDate(d.getDate() + i);
          const dateStr = d.toISOString().split('T')[0];
          const label = i === 0 ? 'Hoy' : (i === 1 ? 'Mañana' : dateStr);
          dates.push([{ text: `📅 ${label}`, callback_data: `d_${posId}_${qty}_${type}_${dateStr}` }]);
        }
        dates.push([{ text: '❌ Cancelar', callback_data: 'c' }]);

        await telegram(token, 'sendMessage', {
          chat_id: chatId,
          text: `🍊 **Paso 4/5**: ¿Cuándo deben iniciar?`,
          reply_markup: { inline_keyboard: dates }
        });
      }

      if (data.startsWith('d_')) {
        const [_, posId, qty, type, date] = data.split('_');
        await telegram(token, 'sendMessage', {
          chat_id: chatId,
          text: `🕒 **Paso 5/5**: Selecciona el turno:`,
          reply_markup: { inline_keyboard: [
            [{ text: '🌅 Mañana (07:00 AM)', callback_data: `f_${posId}_${qty}_${type}_${date}_07:00` }],
            [{ text: '☀️ Tarde (02:00 PM)', callback_data: `f_${posId}_${qty}_${type}_${date}_14:00` }],
            [{ text: '🌙 Noche (10:00 PM)', callback_data: `f_${posId}_${qty}_${type}_${date}_22:00` }],
            [{ text: '❌ Cancelar', callback_data: 'c' }]
          ]}
        });
      }

      if (data.startsWith('f_')) {
        const [_, posId, qty, type, date, time] = data.split('_');
        const hotelRes = await callGraphQL(LIST_HOTELS_BY_CHAT, { chatId });
        const hotel = hotelRes.listHotels.items[0];
        const posRes = await callGraphQL(GET_POSITION, { id: posId });
        const pos = posRes.getPosition;

        if (hotel && pos) {
          const request_number = `SR${new Date().getFullYear().toString().slice(-2)}-${Math.floor(Math.random()*900)+100}`;
          const now = new Date().toISOString().split('T')[0];
          await callGraphQL(CREATE_REQUEST, { input: {
            request_number, hotel_id: hotel.id, role: pos.name, num_of_people: parseInt(qty),
            request_type: type === 'temp' ? 'temporal' : 'permanente', start_date: date, request_date: now, shift_time: time, status: 'Pendiente'
          }});
          await telegram(token, 'sendMessage', { 
            chat_id: chatId, 
            text: `🍊 **¡Solicitud Creada con Éxito!**\n\n📋 **Folio:** ${request_number}\n🏨 **Hotel:** ${hotel.name}\n👤 **Cargo:** ${pos.name}\n👥 **Cantidad:** ${qty}\n📅 **Inicio:** ${date}\n🕒 **Turno:** ${time}\n\nEl equipo de reclutamiento ya está trabajando en tu solicitud.` 
          });
        }
      }

      if (data === 'c') await telegram(token, 'sendMessage', { chat_id: chatId, text: "❌ Solicitud cancelada." });
      await telegram(token, 'answerCallbackQuery', { callback_query_id: cb.id });
      return { statusCode: 200, body: 'OK' };
    }

    const text = body.message?.text || '';
    if (text.startsWith('/start')) {
      const hotelId = text.split(' ')[1];
      if (hotelId) {
        const hotelRes = await callGraphQL(GET_HOTEL, { id: hotelId });
        if (hotelRes.getHotel) {
          await callGraphQL(UPDATE_HOTEL_CHAT, { id: hotelId, chatId });
          await telegram(token, 'sendMessage', { chat_id: chatId, text: `🍊 ¡Hola! Bienvenido a **OranjeBot**. He vinculado este chat con **${hotelRes.getHotel.name}** correctamente.` });
          return { statusCode: 200, body: 'OK' };
        }
      }
      await telegram(token, 'sendMessage', { chat_id: chatId, text: "🚀 Bienvenido a OranjeBot. Usa el enlace desde tu Dashboard para vincular tu hotel." });
    }

    if (text === '/new' || !text.startsWith('/')) {
      const hotelRes = await callGraphQL(LIST_HOTELS_BY_CHAT, { chatId });
      if (hotelRes.listHotels.items.length > 0) {
        const hotel = hotelRes.listHotels.items[0];
        const posRes = await callGraphQL(LIST_POSITIONS);
        const buttons = posRes.listPositions.items.map((p: any) => ([{ text: `🍊 ${p.name}`, callback_data: `p_${p.id}` }]));
        buttons.push([{ text: '❌ Cancelar', callback_data: 'c' }]);

        await telegram(token, 'sendMessage', { 
          chat_id: chatId, 
          text: `👋 **Hola Gerente de ${hotel.name}**\n\n¿Necesitas personal nuevo? Puedes usar el portal interactivo o seleccionar un cargo abajo.\n\n📋 **Paso 1/5**: Selecciona el cargo:`, 
          reply_markup: { 
            inline_keyboard: [
              [{ text: "🚀 ABRIR PORTAL ORANJE 🍊", web_app: { url: "https://master.d1okkcyyykb2rg.amplifyapp.com/solicitud-bot" } }],
              ...buttons
            ] 
          } 
        });
      } else if (text === '/new') {
        await telegram(token, 'sendMessage', { chat_id: chatId, text: "⚠️ Este chat no está vinculado a ningún hotel. Usa el enlace oficial desde la web." });
      }
    }

    return { statusCode: 200, body: 'OK' };
  } catch (error: any) {
    console.error(error);
    if (chatId !== '0') await telegram(token, 'sendMessage', { chat_id: chatId, text: `❌ Error en el Bot Oranje:\n${error.message}` });
    return { statusCode: 500, body: 'Error' };
  }
};
