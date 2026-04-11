import type { Handler } from 'aws-lambda';
import TelegramBot from 'node-telegram-bot-api';

/**
 * ORANJEBOT: NATIVE FETCH GRAPHQL (ULTRA-ROBUST)
 * Esta función evita problemas de autenticación de Amplify en Lambda.
 */
async function callGraphQL(query: string, variables: any = {}) {
  const endpoint = process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT || '';
  const apiKey = process.env.AMPLIFY_DATA_GRAPHQL_API_KEY || '';

  if (!endpoint || !apiKey) {
    throw new Error(`Configuración incompleta: ENDPOINT=${!!endpoint}, KEY=${!!apiKey}`);
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify({ query, variables })
  });

  const json: any = await response.json();
  if (json.errors) {
    throw new Error(JSON.stringify(json.errors));
  }
  return json.data;
}

// QUERIES NATIVAS
const GET_HOTEL = `query GetHotel($id: ID!) { getHotel(id: $id) { id name telegram_chat_id } }`;
const UPDATE_HOTEL_CHAT = `mutation UpdateHotelChat($id: ID!, $chatId: String!) { updateHotel(input: { id: $id, telegram_chat_id: $chatId }) { id name } }`;
const LIST_HOTELS_BY_CHAT = `query ListHotels($chatId: String!) { listHotels(filter: { telegram_chat_id: { eq: $chatId } }) { items { id name } } }`;
const LIST_POSITIONS = `query ListPositions { listPositions(filter: { is_active: { eq: true } }) { items { id name } } }`;
const GET_POSITION = `query GetPosition($id: ID!) { getPosition(id: $id) { id name } }`;
const CREATE_REQUEST = `
  mutation CreateRequest($input: CreateStaffingRequestInput!) {
    createStaffingRequest(input: $input) { id request_number }
  }
`;
const CREATE_HISTORY = `
  mutation CreateHistory($input: CreateStaffingRequestHistoryInput!) {
    createStaffingRequestHistory(input: $input) { id }
  }
`;

export const handler: Handler = async (event) => {
  const token = process.env.TELEGRAM_BOT_TOKEN || '';
  const bot = new TelegramBot(token);
  
  let chatId = '0';
  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    if (body?.message?.chat?.id) chatId = String(body.message.chat.id);
    if (body?.callback_query?.message?.chat?.id) chatId = String(body.callback_query.message.chat.id);
  } catch (e) {}

  if (!token) {
    if (chatId !== '0') await bot.sendMessage(chatId, "❌ Error: TELEGRAM_BOT_TOKEN no configurado.");
    return { statusCode: 500, body: 'Config error' };
  }

  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    if (!body) return { statusCode: 200, body: 'OK' };

    // --- CALLBACK QUERIES (STEPS) ---
    if (body.callback_query) {
      const callbackQuery = body.callback_query;
      const data = callbackQuery.data || '';

      if (data.startsWith('p_')) {
        const posId = data.split('_')[1];
        await bot.sendMessage(chatId, `🔢 **Step 2/5**: How many people do you need?`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '1', callback_data: `q_${posId}_1` }, { text: '2', callback_data: `q_${posId}_2` }, { text: '3', callback_data: `q_${posId}_3` }],
              [{ text: '4', callback_data: `q_${posId}_4` }, { text: '5', callback_data: `q_${posId}_5` }, { text: '❌ Cancel', callback_data: 'c' }]
            ]
          }
        });
        return { statusCode: 200, body: 'OK' };
      }

      if (data.startsWith('q_')) {
        const [_, posId, qty] = data.split('_');
        await bot.sendMessage(chatId, `💼 **Step 3/5**: Employment Type:`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '⏳ Temporary', callback_data: `t_${posId}_${qty}_temp` }, { text: '👔 Permanent', callback_data: `t_${posId}_${qty}_perm` }],
              [{ text: '❌ Cancel', callback_data: 'c' }]
            ]
          }
        });
        return { statusCode: 200, body: 'OK' };
      }

      if (data.startsWith('t_')) {
        const [_, posId, qty, type] = data.split('_');
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        await bot.sendMessage(chatId, `📅 **Step 4/5**: Select the Start Date:`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: `Today (${today})`, callback_data: `d_${posId}_${qty}_${type}_${today}` }],
              [{ text: `Tomorrow (${tomorrow})`, callback_data: `d_${posId}_${qty}_${type}_${tomorrow}` }],
              [{ text: '❌ Cancel', callback_data: 'c' }]
            ]
          }
        });
        return { statusCode: 200, body: 'OK' };
      }

      if (data.startsWith('d_')) {
        const [_, posId, qty, type, date] = data.split('_');
        await bot.sendMessage(chatId, `🕒 **Step 5/5**: Select the Shift/Time:`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🌅 Morning (07:00 AM)', callback_data: `f_${posId}_${qty}_${type}_${date}_07:00` }],
              [{ text: '☀️ Afternoon (02:00 PM)', callback_data: `f_${posId}_${qty}_${type}_${date}_14:00` }],
              [{ text: '🌙 Night (10:00 PM)', callback_data: `f_${posId}_${qty}_${type}_${date}_22:00` }],
              [{ text: '❌ Cancel', callback_data: 'c' }]
            ]
          }
        });
        return { statusCode: 200, body: 'OK' };
      }

      if (data.startsWith('f_')) {
        const [_, posId, qty, type, date, time] = data.split('_');
        
        const hotelsRes = await callGraphQL(LIST_HOTELS_BY_CHAT, { chatId });
        const hotel = hotelsRes.listHotels.items[0];
        
        const posRes = await callGraphQL(GET_POSITION, { id: posId });
        const position = posRes.getPosition;

        if (!hotel || !position) {
          await bot.sendMessage(chatId, "❌ Identification error. Please contact support.");
          return { statusCode: 200, body: 'OK' };
        }

        const currentYear = new Date().getFullYear().toString().slice(-2);
        const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const request_number = `SR${currentYear}-${randomPart}`;

        const newReqRes = await callGraphQL(CREATE_REQUEST, {
          input: {
            request_number,
            hotel_id: hotel.id,
            request_type: type === 'temp' ? 'temporal' : 'permanente',
            num_of_people: parseInt(qty),
            role: position.name,
            priority: 'Normal',
            status: 'Pendiente',
            start_date: date,
            shift_time: time,
            notes: 'Auto-created via OranjeBot'
          }
        });
        const newReq = newReqRes.createStaffingRequest;

        if (newReq?.id) {
          await callGraphQL(CREATE_HISTORY, {
            input: {
              request_id: newReq.id,
              change_description: `Request folio ${request_number} created via Telegram.`,
              changed_by: `OranjeBot (${callbackQuery.from.first_name})`,
              created_at: new Date().toISOString()
            }
          });
        }

        await bot.sendMessage(chatId, `✅ **Request Submitted!**\n\n🔹 **Folio:** \`${request_number}\`\n🔹 **Hotel:** ${hotel.name}\n🔹 **Position:** ${position.name}\n🔹 **Qty:** ${qty}\n🔹 **Type:** ${type === 'temp' ? 'Temporary' : 'Permanent'}\n🔹 **Start Date:** ${date}\n🔹 **Shift:** ${time}`);
        await bot.answerCallbackQuery(callbackQuery.id);
        return { statusCode: 200, body: 'OK' };
      }

      if (data === 'c') {
        await bot.sendMessage(chatId, "❌ Request cancelled.");
        await bot.answerCallbackQuery(callbackQuery.id);
        return { statusCode: 200, body: 'OK' };
      }
    }

    // --- STANDARD COMMANDS ---
    if (!body.message) return { statusCode: 200, body: 'OK' };
    const text = body.message.text || '';
    const userName = body.message.from?.first_name || 'Manager';

    if (text.startsWith('/start')) {
      const parts = text.split(' ');
      if (parts.length > 1) {
        const hotelId = parts[1];
        const hotelRes = await callGraphQL(GET_HOTEL, { id: hotelId });
        const hotel = hotelRes.getHotel;
        
        if (hotel) {
          await callGraphQL(UPDATE_HOTEL_CHAT, { id: hotelId, chatId });
          await bot.sendMessage(chatId, `✅ Hello ${userName}! Linked to **${hotel.name}**.\nType /new to start.`);
          return { statusCode: 200, body: 'OK' };
        }
      }
      await bot.sendMessage(chatId, "🚀 Welcome! Use the dashboard to link this bot to your hotel.");
      return { statusCode: 200, body: 'OK' };
    }

    if (text === '/new' || text === '/nueva') {
      const hotelsRes = await callGraphQL(LIST_HOTELS_BY_CHAT, { chatId });
      const hotels = hotelsRes.listHotels.items;
      
      if (hotels.length === 0) {
        await bot.sendMessage(chatId, "⚠️ Hotel not linked.");
        return { statusCode: 200, body: 'OK' };
      }
      
      const posRes = await callGraphQL(LIST_POSITIONS);
      const positions = posRes.listPositions.items;
      
      const buttons = positions.map((p: any) => ([{ text: p.name, callback_data: `p_${p.id}` }]));
      buttons.push([{ text: '❌ Cancel', callback_data: 'c' }]);
      await bot.sendMessage(chatId, `📋 **Step 1/5**: Select position for **${hotels[0].name}**:`, { reply_markup: { inline_keyboard: buttons } });
      return { statusCode: 200, body: 'OK' };
    }

    return { statusCode: 200, body: 'OK' };
  } catch (error: any) {
    console.error('Bot Error:', error);
    if (chatId !== '0') {
      try {
        const errorDetail = error.message || JSON.stringify(error, null, 2);
        await bot.sendMessage(chatId, `❌ **Bot Error Details:**\n\`\`\`json\n${errorDetail}\n\`\`\``);
      } catch (e) {
        await bot.sendMessage(chatId, `❌ **Critical Error:**\n${error.message || 'Unknown error'}`);
      }
    }
    return { statusCode: 500, body: 'Error' };
  }
};
