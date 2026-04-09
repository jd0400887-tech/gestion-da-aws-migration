import { defineStorage } from '@aws-amplify/backend';

/**
 * CONFIGURACIÓN DE ALMACENAMIENTO (AWS S3)
 * Define el bucket para fotos de hoteles y documentos de empleados.
 */
export const storage = defineStorage({
  name: 'oranjeappStorage',
  access: (allow) => ({
    'hotel-images/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
      allow.guest.to(['read'])
    ],
    'employee-docs/*': [
      allow.authenticated.to(['read', 'write', 'delete'])
    ]
  })
});
