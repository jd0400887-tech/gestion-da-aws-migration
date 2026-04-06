import { defineAuth } from '@aws-amplify/backend';

/**
 * CONFIGURACIÓN MAESTRA DE USUARIOS (AWS COGNITO)
 * Este archivo define cómo se gestionan tus usuarios en la nube.
 */

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    "custom:role": {
      dataType: "String",
      mutable: true,
    }
  },
  groups: ["ADMIN", "INSPECTOR", "RECRUITER"]
});
