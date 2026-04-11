import type { Handler } from 'aws-lambda';
import TelegramBot from 'node-telegram-bot-api';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';

/**
 * ORANJEBOT: RDS NATIVE GRAPHQL QUERIES (VERSIÓN ORIGINAL EXITOSA)
 */
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
    Amplify.configure({
      API: {
        GraphQL: {
          endpoint: process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT || '',
          region: process.env.AWS_REGION || 'us-east-1',
          defaultAuthMode: 'apiKey',
          apiKey: process.env.AMPLIFY_DATA_GRAPHQL_API_KEY || ''
        }
      }
    });

    const client = generateClient({
      authMode: 'apiKey',
      apiKey: process.env.AMPLIFY_DATA_GRAPHQL_API_KEY || ''
    });

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
              [{ text: '4', callback_data: `q_${posId}_4` }, { text: '5', callback_data: `q_${posId}_5` }],
              [{ text: '❌ Cancel', callback_data: 'c' }]
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
        const hotelsRes: any = await client.graphql({ query: LIST_HOTELS_BY_CHAT, variables: { chatId } });
        const hotel = hotelsRes.data.listHotels.items[0];
        const posRes: any = await client.graphql({ query: GET_POSITION, variables: { id: posId } });
        const position = posRes.data.getPosition;

        if (!hotel || !position) {
          await bot.sendMessage(chatId, "❌ Identification error. Please contact support.");
          return { statusCode: 200, body: 'OK' };
        }

        const request_number = `SR${new Date().getFullYear().toString().slice(-2)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

        const newReqRes: any = await client.graphql({
          query: CREATE_REQUEST,
          variables: {
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
          }
        });
        const newReq = newReqRes.data.createStaffingRequest;

        if (newReq?.id) {
          await client.graphql({
            query: CREATE_HISTORY,
            variables: {
              input: {
                request_id: newReq.id,
                change_description: `Request folio ${request_number} created via Telegram.`,
                changed_by: `OranjeBot`,
                created_at: new Date().toISOString()
              }
            }
          });
        }

        await bot.sendMessage(chatId, `✅ **Request Submitted!**\nFolio: \`${request_number}\`\nHotel: ${hotel.name}`);
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
        const hotelRes: any = await client.graphql({ query: GET_HOTEL, variables: { id: hotelId } });
        const hotel = hotelRes.data.getHotel;
        if (hotel) {
          await client.graphql({ query: UPDATE_HOTEL_CHAT, variables: { id: hotelId, chatId } });
          await bot.sendMessage(chatId, `✅ Hello ${userName}! Linked to **${hotel.name}**.`);
          return { statusCode: 200, body: 'OK' };
        }
      }
      await bot.sendMessage(chatId, "🚀 Welcome! Use the dashboard to link this bot to your hotel.");
      return { statusCode: 200, body: 'OK' };
    }

    if (text === '/new' || text === '/nueva') {
      const hotelsRes: any = await client.graphql({ query: LIST_HOTELS_BY_CHAT, variables: { chatId } });
      const hotels = hotelsRes.data.listHotels.items;
      if (hotels.length === 0) {
        await bot.sendMessage(chatId, "⚠️ Hotel not linked.");
        return { statusCode: 200, body: 'OK' };
      }
      const posRes: any = await client.graphql({ query: LIST_POSITIONS });
      const positions = posRes.data.listPositions.items;
      const buttons = positions.map((p: any) => ([{ text: p.name, callback_data: `p_${p.id}` }]));
      await bot.sendMessage(chatId, `📋 **Step 1/5**: Select position for **${hotels[0].name}**:`, { reply_markup: { inline_keyboard: buttons } });
      return { statusCode: 200, body: 'OK' };
    }

    return { statusCode: 200, body: 'OK' };
  } catch (error: any) {
    console.error('Bot Error:', error);
    if (chatId !== '0') {
      const errorMsg = error.message || JSON.stringify(error);
      await bot.sendMessage(chatId, `❌ **Bot Error:**\n\`\`\`\n${errorMsg}\n\`\`\``);
    }
    return { statusCode: 500, body: 'Error' };
  }
};
