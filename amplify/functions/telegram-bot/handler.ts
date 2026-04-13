import type { Handler } from 'aws-lambda';

/**
 * ORANJEBOT: SMART RECRUITMENT BOT 🍊
 * Language: English (EN)
 * Synchronized with RDS CamelCase Schema.
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
          text: `🔢 **Step 2/5**: How many people do you need?`,
          reply_markup: { inline_keyboard: [
            [{ text: '1 Person', callback_data: `q_${posId}_1` }, { text: '2 People', callback_data: `q_${posId}_2` }],
            [{ text: '3 People', callback_data: `q_${posId}_3` }, { text: 'More than 3', callback_data: `q_${posId}_5` }],
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
            [{ text: '⏳ Temporary (Support)', callback_data: `t_${posId}_${qty}_temp` }],
            [{ text: '👔 Permanent (Full-time)', callback_data: `t_${posId}_${qty}_perm` }],
            [{ text: '❌ Cancel', callback_data: 'c' }]
          ]}
        });
      }

      if (data.startsWith('t_')) {
        const [_, posId, qty, type] = data.split('_');
        const dates = [];
        for (let i = 0; i < 8; i++) {
          const d = new Date();
          d.setDate(d.getDate() + i);
          const dateStr = d.toISOString().split('T')[0];
          
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const dayName = days[d.getDay()];
          const label = i === 0 ? '🍊 Today!' : (i === 1 ? 'Tomorrow' : `${dayName} ${d.getDate()}/${d.getMonth()+1}`);
          
          dates.push([{ text: `📅 ${label}`, callback_data: `d_${posId}_${qty}_${type}_${dateStr}` }]);
        }
        dates.push([{ text: '🟠 Back / Cancel', callback_data: 'c' }]);

        await telegram(token, 'sendMessage', {
          chat_id: chatId,
          text: `🍊 **Step 4/5**: When should they start?\n\nYou can select any day for the upcoming week.`,
          reply_markup: { inline_keyboard: dates }
        });
      }

      if (data.startsWith('d_')) {
        const [_, posId, qty, type, date] = data.split('_');
        await telegram(token, 'sendMessage', {
          chat_id: chatId,
          text: `🕒 **Step 5/5**: Select the start time:\n\n📅 Date: ${date}`,
          reply_markup: { inline_keyboard: [
            [{ text: '🌅 07:00 AM', callback_data: `f_${posId}_${qty}_${type}_${date}_07:00` }, { text: '🌅 08:00 AM', callback_data: `f_${posId}_${qty}_${type}_${date}_08:00` }],
            [{ text: '☀️ 02:00 PM', callback_data: `f_${posId}_${qty}_${type}_${date}_14:00` }, { text: '☀️ 03:00 PM', callback_data: `f_${posId}_${qty}_${type}_${date}_15:00` }],
            [{ text: '🌙 10:00 PM', callback_data: `f_${posId}_${qty}_${type}_${date}_22:00` }, { text: '🌙 11:00 PM', callback_data: `f_${posId}_${qty}_${type}_${date}_23:00` }],
            [{ text: '🕒 Other / Custom', callback_data: `f_${posId}_${qty}_${type}_${date}_Flexible` }],
            [{ text: '🟠 Cancel', callback_data: 'c' }]
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
          const year = new Date().getFullYear().toString().slice(-2);
          const random = Math.floor(Math.random()*900)+100;
          const request_number = `SR${year}-${random}`;
          const now = new Date().toISOString().split('T')[0];

          await callGraphQL(CREATE_REQUEST, { input: {
            request_number, 
            hotel_id: hotel.id, 
            role: pos.name, 
            num_of_people: parseInt(qty),
            request_type: type === 'temp' ? 'temporal' : 'permanente', 
            start_date: date, 
            request_date: now, 
            shift_time: time, 
            status: 'Enviada a Reclutamiento',
            priority: 'medium',
            is_archived: false
          }});

          await telegram(token, 'sendMessage', { 
            chat_id: chatId, 
            text: `🍊 **REQUEST REGISTERED!** 🍊\n\n📋 **Folio:** \`${request_number}\`\n🏨 **Hotel:** ${hotel.name}\n👤 **Position:** ${pos.name}\n👥 **Quantity:** ${qty} people\n📅 **Start Date:** ${date}\n🕒 **Shift:** ${time}\n\n🚀 **Status:** Sent to Recruitment\n\nOur team is already working on your request! ✨` 
          });
        }
      }

      if (data === 'c') await telegram(token, 'sendMessage', { chat_id: chatId, text: "🟠 Request cancelled. I'm here if you need me! 🍊" });
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
          await telegram(token, 'sendMessage', { chat_id: chatId, text: `🍊 **VINCULATION SUCCESSFUL!** 🍊\n\nHello! I have linked this chat with **${hotelRes.getHotel.name}**. You can now request staff by typing /new or any message.` });
          return { statusCode: 200, body: 'OK' };
        }
      }
      await telegram(token, 'sendMessage', { chat_id: chatId, text: "🚀 Welcome to **OranjeBot**. To get started, use the vinculation link from your web Dashboard. 🍊" });
    }

    if (text === '/new' || !text.startsWith('/')) {
      const hotelRes = await callGraphQL(LIST_HOTELS_BY_CHAT, { chatId });
      if (hotelRes.listHotels.items.length > 0) {
        const hotel = hotelRes.listHotels.items[0];
        const posRes = await callGraphQL(LIST_POSITIONS);
        
        const buttons = posRes.listPositions.items.map((p: any) => ([{ text: `🍊 Position: ${p.name}`, callback_data: `p_${p.id}` }]));
        buttons.push([{ text: '🟠 Cancel', callback_data: 'c' }]);

        await telegram(token, 'sendMessage', { 
          chat_id: chatId, 
          text: `🍊 **REQUEST MENU** 🍊\n\nHello Manager of **${hotel.name}**. How can we help you today?\n\n👇 **Select the position you need to cover:**`, 
          reply_markup: { 
            inline_keyboard: buttons
          } 
        });
      } else if (text === '/new') {
        await telegram(token, 'sendMessage', { chat_id: chatId, text: "⚠️ **Access Denied**: This chat is not linked. Please link it through the administrative portal. 🍊" });
      }
    }

    return { statusCode: 200, body: 'OK' };
  } catch (error: any) {
    console.error(error);
    if (chatId !== '0') await telegram(token, 'sendMessage', { chat_id: chatId, text: `❌ OranjeBot Error:\n${error.message}` });
    return { statusCode: 500, body: 'Error' };
  }
};
