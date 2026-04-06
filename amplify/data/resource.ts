import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

/**
 * ESQUEMA MAESTRO DE ORANJEAPP (AWS AMPLIFY GEN 2)
 * Definición de los modelos profesionales para empleados y hoteles.
 */

const schema = a.schema({
  Employee: a
    .model({
      employee_number: a.string().required(),
      name: a.string().required(),
      role: a.string().required(),
      is_active: a.boolean().default(true),
      employee_type: a.enum(['permanente', 'temporal']),
      payroll_type: a.enum(['timesheet', 'Workrecord']),
    })
    .authorization((allow) => [allow.authenticated()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
