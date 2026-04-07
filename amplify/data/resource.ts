import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

/**
 * ESQUEMA MAESTRO DE ORANJEAPP (AWS AMPLIFY GEN 2)
 * Definición profesional de modelos para Empleados, Hoteles y Solicitudes.
 */

const schema = a.schema({
  Hotel: a
    .model({
      id: a.id(),
      name: a.string().required(),
      city: a.string().required(),
      address: a.string(),
      zone: a.enum(['Centro', 'Norte', 'Noroeste']),
    })
    .authorization((allow) => [allow.authenticated()]),

  Employee: a
    .model({
      employee_number: a.string().required(),
      name: a.string().required(),
      role: a.string().required(),
      hotelId: a.string(),
      is_active: a.boolean().default(true),
      employee_type: a.enum(['permanente', 'temporal']),
      payroll_type: a.enum(['timesheet', 'Workrecord']),
      documentacion_completa: a.boolean().default(true),
    })
    .authorization((allow) => [allow.authenticated()]),

  StaffingRequest: a
    .model({
      request_number: a.string().required(),
      hotel_id: a.string().required(),
      request_type: a.enum(['permanente', 'temporal']),
      num_of_people: a.integer().default(1),
      role: a.string().required(),
      status: a.string().default('Pendiente'),
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
