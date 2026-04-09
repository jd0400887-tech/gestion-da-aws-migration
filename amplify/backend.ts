import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';

/**
 * BACKEND MAESTRO - ORANJEAPP (AWS AMPLIFY GEN 2)
 * Este archivo une la autenticación, los datos RDS, el almacenamiento S3 y funciones.
 */

const backend = defineBackend({
  auth,
  data,
  storage,
});

/**
 * CONFIGURACIÓN DE RDS POSTGRESQL (N. VIRGINIA)
 * Host: oranjeapp-db-v3.cbu0qiwu6p8s.us-east-1.rds.amazonaws.com
 * Database: oranjeapp_db
 */
// Los resolvers de SQL se conectan automáticamente cuando el esquema 
// se despliega con el ID de conexión de la base de datos en la consola de AWS.
