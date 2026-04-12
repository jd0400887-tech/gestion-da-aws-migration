import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // 1. GESTIÓN DE USUARIOS Y PERFILES
  Profile: a.model({
    id: a.id(),
    email: a.string().required(),
    name: a.string().required(),
    role: a.string().required(), // 'ADMIN', 'RECRUITER', 'INSPECTOR', 'BUSINESS_DEVELOPER', 'COORDINATOR'
    assigned_zone: a.string(),
    phone: a.string(),
    is_active: a.boolean().default(true),
    // Permisos
    can_view_hotels: a.boolean().default(false),
    can_view_employees: a.boolean().default(false),
    can_view_requests: a.boolean().default(false),
    can_view_applications: a.boolean().default(false),
    can_view_payroll: a.boolean().default(false),
    can_view_qa: a.boolean().default(false),
    can_view_reports: a.boolean().default(false),
    can_view_adoption: a.boolean().default(false),
    can_edit_hotels: a.boolean().default(false),
    can_edit_employees: a.boolean().default(false),
    can_edit_requests: a.boolean().default(false),
    can_approve_applications: a.boolean().default(false),
    can_manage_users: a.boolean().default(false),
  }).authorization((allow) => [
    allow.authenticated(),
    allow.owner(),
    allow.group('ADMIN')
  ]),

  // 2. ESTRUCTURA ORGANIZATIVA (HOTELES)
  Hotel: a.model({
    id: a.id(),
    hotelCode: a.string(), 
    name: a.string().required(),
    city: a.string().required(),
    address: a.string().required(),
    zone: a.string().required(),
    latitude: a.float(),
    longitude: a.float(),
    managerName: a.string(), 
    phone: a.string(),
    email: a.string(),
    image_url: a.string(),
    description: a.string(),
    telegram_chat_id: a.string(), 
    employees: a.hasMany('Employee', 'current_hotel_id'),
    requests: a.hasMany('StaffingRequest', 'hotel_id'),
    qa_audits: a.hasMany('QAAudit', 'hotel_id'),
    attendance_records: a.hasMany('AttendanceRecord', 'hotel_id'),
    applications: a.hasMany('Application', 'hotel_id'),
    payroll_reviews: a.hasMany('PayrollReview', 'hotel_id'),
  }).authorization((allow) => [
    allow.authenticated(),
    allow.publicApiKey().to(['read', 'update']),
  ]),

  // 3. GESTIÓN DE PERSONAL
  Employee: a.model({
    id: a.id(),
    employeeNumber: a.string().required(), 
    name: a.string().required(),
    role: a.string().required(),
    phone: a.string(),
    email: a.string(),
    employeeType: a.string().required(), // 'permanente', 'temporal'
    payrollType: a.string().required(), // 'timesheet', 'Workrecord'
    isActive: a.boolean().default(true), 
    isBlacklisted: a.boolean().default(false), 
    blacklistReason: a.string(), 
    current_hotel_id: a.id().required(), 
    current_hotel: a.belongsTo('Hotel', 'current_hotel_id'),
    hireDate: a.date(), 
    terminationDate: a.date(), 
    documentacion_completa: a.boolean().default(false),
    city: a.string(),
    image_url: a.string(),
    document_urls: a.string().array(),
    lastReviewedTimestamp: a.string(), 
    attendance: a.hasMany('AttendanceRecord', 'employee_id'),
    status_history: a.hasMany('EmployeeStatusChange', 'employee_id'),
    qa_audits: a.hasMany('QAAudit', 'employee_id'),
  }).authorization((allow) => [allow.authenticated()]),

  EmployeeStatusChange: a.model({
    id: a.id(),
    employee_id: a.id().required(),
    employee: a.belongsTo('Employee', 'employee_id'),
    oldStatus: a.string(),
    newStatus: a.string().required(),
    reason: a.string(),
    changedBy: a.string().required(),
    changeDate: a.datetime().required(),
  }).authorization((allow) => [allow.authenticated()]),

  // 4. RECLUTAMIENTO Y SOLICITUDES
  StaffingRequest: a.model({
    id: a.id(),
    request_number: a.string().required(),
    hotel_id: a.id().required(), 
    hotel: a.belongsTo('Hotel', 'hotel_id'),
    role: a.string().required(),
    num_of_people: a.integer().required(),
    status: a.string().required(), 
    priority: a.string().required(), 
    request_date: a.date(),
    start_date: a.date().required(),
    shift_time: a.string(),
    request_type: a.string(), 
    notes: a.string(),
    is_archived: a.boolean().default(false),
    history: a.hasMany('StaffingRequestHistory', 'request_id'),
  }).authorization((allow) => [
    allow.authenticated(),
    allow.publicApiKey().to(['create', 'read']) // Permitir crear y leer vía API Key para la Mini App
  ]),

  StaffingRequestHistory: a.model({
    id: a.id(),
    request_id: a.id().required(),
    request: a.belongsTo('StaffingRequest', 'request_id'),
    changeDescription: a.string().required(),
    changedBy: a.string().required(),
    createdAt: a.datetime().required(),
  }).authorization((allow) => [allow.authenticated()]),

  // 4.1 APLICACIONES DE CANDIDATOS
  Application: a.model({
    id: a.id(),
    candidateName: a.string().required(), 
    phone: a.string().required(),
    email: a.string(),
    hotel_id: a.id().required(), 
    hotel: a.belongsTo('Hotel', 'hotel_id'),
    role: a.string().required(),
    status: a.string().default('pendiente'), 
    appliedAt: a.datetime(), 
    notes: a.string(),
  }).authorization((allow) => [allow.authenticated()]),

  // 5. ASISTENCIA Y OPERACIONES
  AttendanceRecord: a.model({
    id: a.id(),
    employee_id: a.id().required(), 
    employee: a.belongsTo('Employee', 'employee_id'),
    hotel_id: a.id().required(), 
    hotel: a.belongsTo('Hotel', 'hotel_id'),
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
    hotel: a.belongsTo('Hotel', 'hotel_id'),
    periodStart: a.date().required(), 
    periodEnd: a.date().required(), 
    totalHours: a.float(), 
    totalAmount: a.float(), 
    status: a.string(),
    reviewedBy: a.string(), 
  }).authorization((allow) => [allow.authenticated()]),

  // 6. CALIDAD (QA)
  QAAudit: a.model({
    id: a.id(),
    audit_type: a.string().required(), 
    hotel_id: a.id().required(), 
    hotel: a.belongsTo('Hotel', 'hotel_id'),
    employee_id: a.id(), 
    employee: a.belongsTo('Employee', 'employee_id'),
    room_number: a.string(), 
    auditor_name: a.string().required(),
    score: a.float().required(),
    observations: a.string(),
    checklist_results: a.json(), 
    audit_date: a.date().required(), 
  }).authorization((allow) => [allow.authenticated()]),

  // 7. CONFIGURACIÓN
  Position: a.model({
    id: a.id(),
    name: a.string().required(),
    description: a.string(),
    isActive: a.boolean().default(true), 
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
