import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

/**
 * BACKEND MAESTRO - ORANJEAPP (AWS AMPLIFY GEN 2)
 * Este archivo une la autenticación, los datos RDS y las funciones de Telegram.
 */

const backend = defineBackend({
  auth,
  data,
});

// Aquí configuraremos la conexión directa con el RDS en la próxima sesión
// utilizando la integración de AWS CDK para máxima velocidad.
