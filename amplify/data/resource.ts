import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

const schema = a.schema({
  
  // 1. USUARIOS
  Profile: a.model({
    id: a.id(),
    email: a.string().required(),
    name: a.string(),
    role: a.string(),
    is_active: a.boolean().default(true),
  }).authorization((allow) => [allow.authenticated()]),

  // 2. HOTELES
  Hotel: a.model({
    id: a.id(),
    hotel_code: a.string(),
    name: a.string().required(),
    city: a.string().required(),
    address: a.string(),
    latitude: a.float(),
    longitude: a.float(),
    image_url: a.string(),
    zone: a.string(),
    telegram_chat_id: a.string(),
    manager_name: a.string(),
    phone: a.string(),
    email: a.string(),
    employees: a.hasMany('Employee', 'current_hotel_id'),
    requests: a.hasMany('StaffingRequest', 'hotel_id'),
  }).authorization((allow) => [
    allow.authenticated(),
    allow.publicApiKey().to(['read', 'update']),
  ]),

  // 3. EMPLEADOS
  Employee: a.model({
    id: a.id(),
    employee_number: a.string().required(),
    name: a.string().required(),
    role: a.string().required(),
    current_hotel_id: a.id(),
    hotel: a.belongsTo('Hotel', 'current_hotel_id'),
    is_active: a.boolean().default(true),
    employee_type: a.string(),
    is_blacklisted: a.boolean().default(false),
    blacklist_reason: a.string(),
    payroll_type: a.string(),
    documentacion_completa: a.boolean().default(true),
    last_reviewed_timestamp: a.datetime(),
    phone: a.string(),
    email: a.string(),
    address: a.string(),
    city: a.string(),
    image_url: a.string(),
    document_urls: a.string().array(),
    attendance: a.hasMany('AttendanceRecord', 'employee_id'),
    status_history: a.hasMany('EmployeeStatusChange', 'employee_id'),
  }).authorization((allow) => [allow.authenticated()]),

  EmployeeStatusChange: a.model({
    id: a.id(),
    employee_id: a.id().required(),
    employee: a.belongsTo('Employee', 'employee_id'),
    old_status: a.string(),
    new_status: a.string(),
    change_reason: a.string(),
    changed_by: a.string(),
    created_at: a.datetime().required(),
  }).authorization((allow) => [allow.authenticated()]),

  // 4. SOLICITUDES Y RECLUTAMIENTO
  StaffingRequest: a.model({
    id: a.id(),
    request_number: a.string().required(),
    hotel_id: a.id().required(),
    hotel: a.belongsTo('Hotel', 'hotel_id'),
    request_type: a.string(),
    num_of_people: a.integer().required(),
    role: a.string().required(),
    priority: a.string().default('Normal'),
    status: a.string().default('Pendiente'),
    start_date: a.date().required(),
    shift_time: a.string(),
    notes: a.string(),
    completed_at: a.datetime(),
    history: a.hasMany('StaffingRequestHistory', 'request_id'),
    applications: a.hasMany('Application', 'request_id'),
  }).authorization((allow) => [
    allow.authenticated(),
    allow.publicApiKey().to(['read', 'create', 'update']),
  ]),

  StaffingRequestHistory: a.model({
    id: a.id(),
    request_id: a.id().required(),
    request: a.belongsTo('StaffingRequest', 'request_id'),
    change_description: a.string().required(),
    changed_by: a.string().required(),
    created_at: a.datetime().required(),
  }).authorization((allow) => [
    allow.authenticated(),
    allow.publicApiKey().to(['create']),
  ]),

  Candidate: a.model({
    id: a.id(),
    name: a.string().required(),
    phone: a.string().required(),
    email: a.string(),
    role_applied: a.string(),
    experience_years: a.integer(),
    status: a.string(),
    resume_url: a.string(),
    applications: a.hasMany('Application', 'candidate_id'),
  }).authorization((allow) => [allow.authenticated()]),

  Application: a.model({
    id: a.id(),
    request_id: a.id().required(),
    request: a.belongsTo('StaffingRequest', 'request_id'),
    candidate_id: a.id().required(),
    candidate: a.belongsTo('Candidate', 'candidate_id'),
    status: a.string(),
    applied_at: a.datetime().required(),
  }).authorization((allow) => [allow.authenticated()]),

  // 5. ASISTENCIA Y OPERACIONES
  AttendanceRecord: a.model({
    id: a.id(),
    employee_id: a.id().required(),
    employee: a.belongsTo('Employee', 'employee_id'),
    hotel_id: a.id().required(),
    date: a.date().required(),
    check_in: a.datetime(),
    check_out: a.datetime(),
    latitude: a.float(),
    longitude: a.float(),
    status: a.string(),
    is_gps_verified: a.boolean().default(false),
    distance_from_hotel: a.float(),
  }).authorization((allow) => [allow.authenticated()]),

  PayrollReview: a.model({
    id: a.id(),
    hotel_id: a.id().required(),
    period_start: a.date().required(),
    period_end: a.date().required(),
    total_hours: a.float(),
    total_amount: a.float(),
    status: a.string(),
    reviewed_by: a.string(),
  }).authorization((allow) => [allow.authenticated()]),

  QAAudit: a.model({
    id: a.id(),
    hotel_id: a.id().required(),
    auditor_name: a.string().required(),
    score: a.float().required(),
    observations: a.string(),
    checklist_results: a.json(),
    audit_date: a.date().required(),
  }).authorization((allow) => [allow.authenticated()]),

  Position: a.model({
    id: a.id(),
    name: a.string().required(),
    description: a.string(),
    is_active: a.boolean().default(true),
  }).authorization((allow) => [
    allow.authenticated(),
    allow.publicApiKey().to(['read']),
  ]),

});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 365,
    },
  },
});
