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
    // Permisos granulares
    can_view_hotels: a.boolean().default(false),
    can_view_employees: a.boolean().default(false),
    can_view_requests: a.boolean().default(false),
    can_view_applications: a.boolean().default(false),
    can_view_payroll: a.boolean().default(false),
    can_view_qa: a.boolean().default(false),
    can_view_reports: a.boolean().default(false),
    can_view_adoption: a.boolean().default(false),
    // Permisos de edición/modificación
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
    zone: a.string().required(), // 'Norte', 'Centro', 'Sur', etc.
    latitude: a.float(),
    longitude: a.float(),
    manager_name: a.string(),
    phone: a.string(),
    email: a.string(),
    employees: a.hasMany('Employee', 'current_hotel_id'),
    requests: a.hasMany('StaffingRequest', 'hotel_id'),
    qa_audits: a.hasMany('QAAudit', 'hotel_id'),
    attendance_records: a.hasMany('AttendanceRecord', 'hotel_id'),
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
    payrollType: a.string().required(), // 'timesheet', 'workrecord'
    isActive: a.boolean().default(true),
    isBlacklisted: a.boolean().default(false),
    blacklistReason: a.string(),
    current_hotel_id: a.id().required(),
    current_hotel: a.belongsTo('Hotel', 'current_hotel_id'),
    hire_date: a.date(),
    termination_date: a.date(),
    documentacion_completa: a.boolean().default(false),
    city: a.string(),
    image_url: a.string(),
    document_urls: a.string().array(),
    attendance: a.hasMany('AttendanceRecord', 'employee_id'),
    status_history: a.hasMany('EmployeeStatusChange', 'employee_id'),
    qa_audits: a.hasMany('QAAudit', 'employee_id'),
  }).authorization((allow) => [allow.authenticated()]),

  EmployeeStatusChange: a.model({
    id: a.id(),
    employee_id: a.id().required(),
    employee: a.belongsTo('Employee', 'employee_id'),
    old_status: a.string(),
    new_status: a.string().required(),
    reason: a.string(),
    changed_by: a.string().required(),
    change_date: a.datetime().required(),
  }).authorization((allow) => [allow.authenticated()]),

  // 4. RECLUTAMIENTO Y SOLICITUDES
  StaffingRequest: a.model({
    id: a.id(),
    hotel_id: a.id().required(),
    hotel: a.belongsTo('Hotel', 'hotel_id'),
    role: a.string().required(),
    quantity: a.integer().required(),
    status: a.string().required(), // 'open', 'partially_filled', 'filled', 'cancelled'
    priority: a.string().required(), // 'high', 'medium', 'low'
    request_date: a.date().required(),
    required_date: a.date().required(),
    notes: a.string(),
    is_archived: a.boolean().default(false),
    history: a.hasMany('StaffingRequestHistory', 'request_id'),
  }).authorization((allow) => [allow.authenticated()]),

  StaffingRequestHistory: a.model({
    id: a.id(),
    request_id: a.id().required(),
    request: a.belongsTo('StaffingRequest', 'request_id'),
    change_description: a.string().required(),
    changed_by: a.string().required(),
    created_at: a.datetime().required(),
  }).authorization((allow) => [allow.authenticated()]),

  // 5. ASISTENCIA Y OPERACIONES
  AttendanceRecord: a.model({
    id: a.id(),
    employee_id: a.id().required(), // Para Inspectores, se guarda su userId aquí
    employee: a.belongsTo('Employee', 'employee_id'),
    hotel_id: a.id().required(),
    hotel: a.belongsTo('Hotel', 'hotel_id'),
    date: a.date().required(),
    check_in: a.datetime(),
    check_out: a.datetime(),
    latitude: a.float(),
    longitude: a.float(),
    status: a.string(), // 'present', 'absent', etc.
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

  // 6. CALIDAD (QA)
  QAAudit: a.model({
    id: a.id(),
    audit_type: a.string().required(), // 'hotel', 'staff', 'room'
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
