import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { oranjeBot } from './functions/telegram-bot-resource';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { FunctionUrlAuthType } from 'aws-cdk-lib/aws-lambda';

/**
 * BACKEND MAESTRO - ORANJEAPP (AWS AMPLIFY GEN 2)
 */
const backend = defineBackend({
  auth,
  data,
  storage,
  oranjeBot,
});

// 1. OTORGAR PERMISOS A LA FUNCIÓN PARA ACCEDER AL API GRAPHQL (RDS)
backend.oranjeBot.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['appsync:GraphQL'],
    resources: [`${backend.data.resources.graphqlApi.arn}/*`],
  })
);

// 2. ACTIVAR URL PÚBLICA PARA EL WEBHOOK DE TELEGRAM
const botLambda = backend.oranjeBot.resources.lambda as any;
if (botLambda.addEnvironment) {
  botLambda.addEnvironment(
    'AMPLIFY_DATA_GRAPHQL_ENDPOINT',
    backend.data.resources.cfnResources.cfnGraphqlApi.attrGraphQlUrl
  );
}

// Forzar el empaquetado de dependencias para evitar el error 502 en producción
backend.oranjeBot.resources.lambda.node.addMetadata('bundling', {
  externalModules: [],
  nodeModules: ['node-telegram-bot-api']
});

const botUrl = backend.oranjeBot.resources.lambda.addFunctionUrl({
  authType: FunctionUrlAuthType.NONE, // Público para recibir de Telegram
});

// 3. EXPORTAR LA URL PARA QUE APAREZCA EN LA TERMINAL
backend.addOutput({
  custom: {
    telegramBotUrl: botUrl.url,
  },
});
