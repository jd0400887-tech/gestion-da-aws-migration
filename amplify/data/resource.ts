import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

/**
 * ESQUEMA DE DATOS ORANJEAPP (NATIVO AWS)
 */
const schema = a.schema({
  Hotel: a.model({
    id: a.id(),
    hotel_code: a.string(),
    name: a.string().required(),
    city: a.string().required(),
    address: a.string(),
    manager_name: a.string(),
    phone: a.string(),
    email: a.string(),
    latitude: a.float(),
    longitude: a.float(),
    image_url: a.string(),
    zone: a.enum(['Centro', 'Norte', 'Noroeste']),
  }).authorization((allow) => [allow.authenticated()]),

  Employee: a.model({
    id: a.id(),
    employee_number: a.string().required(),
    name: a.string().required(),
    current_hotel_id: a.string(),
    is_active: a.boolean(),
    role: a.string().required(),
    employee_type: a.string(),
    phone: a.string(),
    email: a.string(),
    is_blacklisted: a.boolean(),
    blacklist_reason: a.string(),
    payroll_type: a.string(),
    last_reviewed_timestamp: a.datetime(),
    documentacion_completa: a.boolean(),
  }).authorization((allow) => [allow.authenticated()]),

  StaffingRequest: a.model({
    id: a.id(),
    request_number: a.string().required(),
    hotel_id: a.string(),
    request_type: a.string(),
    num_of_people: a.integer(),
    role: a.string(),
    start_date: a.string(),
    status: a.string(),
    notes: a.string(),
    completed_at: a.datetime(),
  }).authorization((allow) => [allow.authenticated()]),

  AttendanceRecord: a.model({
    id: a.id(),
    employee_id: a.string(),
    hotel_id: a.string(),
    timestamp: a.datetime(),
    latitude: a.float(),
    longitude: a.float(),
  }).authorization((allow) => [allow.authenticated()]),

  PayrollReview: a.model({
    id: a.id(),
    employee_id: a.string(),
    review_date: a.datetime(),
    overtime_hours: a.float(),
    compliance_status: a.string(),
    week_of_year: a.integer(),
    year: a.integer(),
  }).authorization((allow) => [allow.authenticated()]),

  Candidate: a.model({
    id: a.id(),
    name: a.string().required(),
    email: a.string(),
    phone: a.string(),
    role: a.string(),
    status: a.string(),
    source: a.string(),
  }).authorization((allow) => [allow.authenticated()]),

  Application: a.model({
    id: a.id(),
    candidate_id: a.string(),
    request_id: a.string(),
    status: a.string(),
    applied_at: a.datetime(),
  }).authorization((allow) => [allow.authenticated()]),

  QAAudit: a.model({
    id: a.id(),
    hotel_id: a.string(),
    inspector_id: a.string(),
    audit_date: a.datetime(),
    score: a.float(),
    notes: a.string(),
  }).authorization((allow) => [allow.authenticated()]),

  Profile: a.model({
    id: a.id(),
    email: a.string().required(),
    name: a.string(),
    role: a.string(),
  }).authorization((allow) => [allow.authenticated()]),

  EmployeeStatusChange: a.model({
    id: a.id(),
    employee_id: a.string(),
    change_date: a.datetime(),
    old_is_active: a.boolean(),
    new_is_active: a.boolean(),
    reason: a.string(),
  }).authorization((allow) => [allow.authenticated()]),

  Position: a.model({
    id: a.id(),
    name: a.string().required(),
    description: a.string(),
    is_active: a.boolean().default(true),
  }).authorization((allow) => [allow.authenticated()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
