import { defineFunction, secret } from '@aws-amplify/backend';

/**
 * RECURSO: ORANJEBOT (TELEGRAM AWS LAMBDA)
 */
export const oranjeBot = defineFunction({
  name: 'telegram-bot',
  entry: './telegram-bot/handler.ts',
  environment: {
    TELEGRAM_BOT_TOKEN: secret('BOT_TOKEN'),
    AMPLIFY_DATA_GRAPHQL_API_KEY: secret('AMPLIFY_DATA_GRAPHQL_API_KEY'),
  }
});
