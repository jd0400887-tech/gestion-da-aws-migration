import type { Handler } from 'aws-lambda';

/**
 * ORANJEBOT: ULTRA-LIGHTWEIGHT (NO EXTERNAL DEPENDENCIES)
 * Esta versión garantiza la eliminación de errores 502 en producción.
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
const LIST_POSITIONS = `query ListPositions { listPositions(filter: { is_active: { eq: true } }) { items { id name } } }`;
const GET_POSITION = `query GetPosition($id: ID!) { getPosition(id: $id) { id name } }`;
const CREATE_REQUEST = `mutation CreateRequest($input: CreateStaffingRequestInput!) { createStaffingRequest(input: $input) { id request_number } }`;

export const handler: Handler = async (event) => {
  const token = process.env.BOT_TOKEN || ''; // Nota: Usamos el nombre exacto configurado
  let chatId = '0';

  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    if (!body) return { statusCode: 200, body: 'OK' };

    if (body.message?.chat?.id) chatId = String(body.message.chat.id);
    if (body.callback_query?.message?.chat?.id) chatId = String(body.callback_query.message.chat.id);

    if (!token) {
      if (chatId !== '0') await telegram(token, 'sendMessage', { chat_id: chatId, text: "❌ Error: Token no encontrado." });
      return { statusCode: 500, body: 'Token Error' };
    }

    // --- CALLBACK QUERIES (Botones) ---
    if (body.callback_query) {
      const cb = body.callback_query;
      const data = cb.data || '';

      if (data.startsWith('p_')) {
        const posId = data.split('_')[1];
        await telegram(token, 'sendMessage', {
          chat_id: chatId,
          text: `🔢 **Step 2/5**: How many people do you need?`,
          reply_markup: { inline_keyboard: [
            [{ text: '1', callback_data: `q_${posId}_1` }, { text: '2', callback_data: `q_${posId}_2` }, { text: '3', callback_data: `q_${posId}_3` }],
            [{ text: '4', callback_data: `q_${posId}_4` }, { text: '5', callback_data: `q_${posId}_5` }],
            [{ text: '❌ Cancel', callback_data: 'c' }]
          ]}
        });
      }

      if (data.startsWith('q_')) {
        const [_, posId, qty] = data.split('_');
        await telegram(token, 'sendMessage', {
          chat_id: chatId,
          text: `💼 **Step 3/5**: Employment Type:`,
          reply_markup: { inline_keyboard: [
            [{ text: '⏳ Temporary', callback_data: `t_${posId}_${qty}_temp` }, { text: '👔 Permanent', callback_data: `t_${posId}_${qty}_perm` }],
            [{ text: '❌ Cancel', callback_data: 'c' }]
          ]}
        });
      }

      if (data.startsWith('t_')) {
        const [_, posId, qty, type] = data.split('_');
        const today = new Date().toISOString().split('T')[0];
        await telegram(token, 'sendMessage', {
          chat_id: chatId,
          text: `📅 **Step 4/5**: Start Date:`,
          reply_markup: { inline_keyboard: [
            [{ text: `Today (${today})`, callback_data: `d_${posId}_${qty}_${type}_${today}` }],
            [{ text: '❌ Cancel', callback_data: 'c' }]
          ]}
        });
      }

      if (data.startsWith('d_')) {
        const [_, posId, qty, type, date] = data.split('_');
        await telegram(token, 'sendMessage', {
          chat_id: chatId,
          text: `🕒 **Step 5/5**: Select Shift:`,
          reply_markup: { inline_keyboard: [
            [{ text: '🌅 Morning', callback_data: `f_${posId}_${qty}_${type}_${date}_07:00` }],
            [{ text: '☀️ Afternoon', callback_data: `f_${posId}_${qty}_${type}_${date}_14:00` }],
            [{ text: '❌ Cancel', callback_data: 'c' }]
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
          await callGraphQL(CREATE_REQUEST, { input: {
            request_number, hotel_id: hotel.id, role: pos.name, num_of_people: parseInt(qty),
            request_type: type === 'temp' ? 'temporal' : 'permanente', start_date: date, shift_time: time, status: 'Pendiente'
          }});
          await telegram(token, 'sendMessage', { chat_id: chatId, text: `✅ **Request Created!**\nFolio: ${request_number}\nHotel: ${hotel.name}` });
        }
      }

      if (data === 'c') await telegram(token, 'sendMessage', { chat_id: chatId, text: "❌ Cancelled." });
      await telegram(token, 'answerCallbackQuery', { callback_query_id: cb.id });
      return { statusCode: 200, body: 'OK' };
    }

    // --- COMMANDS ---
    const text = body.message?.text || '';
    if (text.startsWith('/start')) {
      const hotelId = text.split(' ')[1];
      if (hotelId) {
        const hotelRes = await callGraphQL(GET_HOTEL, { id: hotelId });
        if (hotelRes.getHotel) {
          await callGraphQL(UPDATE_HOTEL_CHAT, { id: hotelId, chatId });
          await telegram(token, 'sendMessage', { chat_id: chatId, text: `✅ Hello! Linked to **${hotelRes.getHotel.name}**.` });
          return { statusCode: 200, body: 'OK' };
        }
      }
      await telegram(token, 'sendMessage', { chat_id: chatId, text: "🚀 Welcome! Use the dashboard to link this bot to your hotel." });
    }

    if (text === '/new' || !text.startsWith('/')) {
      const hotelRes = await callGraphQL(LIST_HOTELS_BY_CHAT, { chatId });
      if (hotelRes.listHotels.items.length > 0) {
        const hotel = hotelRes.listHotels.items[0];
        const posRes = await callGraphQL(LIST_POSITIONS);
        const buttons = posRes.listPositions.items.map((p: any) => ([{ text: p.name, callback_data: `p_${p.id}` }]));
        buttons.push([{ text: '❌ Cancel', callback_data: 'c' }]);
        await telegram(token, 'sendMessage', { 
          chat_id: chatId, 
          text: `👋 **Hi!** Ready to create a request for **${hotel.name}**?\n\n📋 **Step 1/5**: Select position:`, 
          reply_markup: { inline_keyboard: buttons } 
        });
      } else if (text === '/new') {
        await telegram(token, 'sendMessage', { chat_id: chatId, text: "⚠️ Hotel not linked." });
      } else if (!text.startsWith('/')) {
        await telegram(token, 'sendMessage', { chat_id: chatId, text: "🚀 Welcome! Please use the link from your dashboard to link this bot to your hotel." });
      }
    }

    return { statusCode: 200, body: 'OK' };
  } catch (error: any) {
    console.error(error);
    if (chatId !== '0') await telegram(token, 'sendMessage', { chat_id: chatId, text: `❌ Bot Error:\n${error.message}` });
    return { statusCode: 500, body: 'Error' };
  }
};
