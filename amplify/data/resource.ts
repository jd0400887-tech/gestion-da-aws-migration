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
    // Permisos de Visualización
    can_view_hotels: a.boolean().default(false),
    can_view_employees: a.boolean().default(false),
    can_view_requests: a.boolean().default(false),
    can_view_applications: a.boolean().default(false),
    can_view_payroll: a.boolean().default(false),
    can_view_qa: a.boolean().default(false),
    can_view_reports: a.boolean().default(false),
    can_view_adoption: a.boolean().default(false),
    // Permisos de Edición
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
    hotelCode: a.string(), // Restaurado de hotel_code
    name: a.string().required(),
    city: a.string().required(),
    address: a.string().required(),
    zone: a.string().required(),
    latitude: a.float(),
    longitude: a.float(),
    managerName: a.string(), // Restaurado de manager_name
    phone: a.string(),
    email: a.string(),
    image_url: a.string(),
    description: a.string(),
    telegram_chat_id: a.string(), // Necesario para el bot
    employees: a.hasMany('Employee', 'hotelId'),
    requests: a.hasMany('StaffingRequest', 'hotelId'),
    qa_audits: a.hasMany('QAAudit', 'hotelId'),
    attendance_records: a.hasMany('AttendanceRecord', 'hotelId'),
    applications: a.hasMany('Application', 'hotelId'),
    payroll_reviews: a.hasMany('PayrollReview', 'hotelId'),
  }).authorization((allow) => [
    allow.authenticated(),
    allow.publicApiKey().to(['read', 'update']),
  ]),

  // 3. GESTIÓN DE PERSONAL
  Employee: a.model({
    id: a.id(),
    employeeNumber: a.string().required(), // Restaurado de employee_number
    name: a.string().required(),
    role: a.string().required(),
    phone: a.string(),
    email: a.string(),
    employeeType: a.string().required(), // 'permanente', 'temporal'
    payrollType: a.string().required(), // 'timesheet', 'Workrecord'
    isActive: a.boolean().default(true), // Restaurado de is_active
    isBlacklisted: a.boolean().default(false), // Restaurado de is_blacklisted
    blacklistReason: a.string(), // Restaurado de blacklist_reason
    hotelId: a.id().required(), // Restaurado de current_hotel_id
    hotel: a.belongsTo('Hotel', 'hotelId'),
    hireDate: a.date(), // Restaurado de hire_date
    terminationDate: a.date(), // Restaurado de termination_date
    documentacion_completa: a.boolean().default(false),
    city: a.string(),
    image_url: a.string(),
    document_urls: a.string().array(),
    lastReviewedTimestamp: a.string(), // Restaurado de last_reviewed_timestamp
    attendance: a.hasMany('AttendanceRecord', 'employeeId'),
    status_history: a.hasMany('EmployeeStatusChange', 'employeeId'),
    qa_audits: a.hasMany('QAAudit', 'employeeId'),
  }).authorization((allow) => [allow.authenticated()]),

  EmployeeStatusChange: a.model({
    id: a.id(),
    employeeId: a.id().required(),
    employee: a.belongsTo('Employee', 'employeeId'),
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
    hotelId: a.id().required(), // Restaurado de hotel_id
    hotel: a.belongsTo('Hotel', 'hotelId'),
    role: a.string().required(),
    num_of_people: a.integer().required(),
    status: a.string().required(), // 'Pendiente', 'Parcial', 'Completada', 'Cancelada'
    priority: a.string().required(), // 'high', 'medium', 'low'
    request_date: a.date(),
    start_date: a.date().required(),
    shift_time: a.string(),
    request_type: a.string(), // 'permanente', 'temporal'
    notes: a.string(),
    is_archived: a.boolean().default(false),
    history: a.hasMany('StaffingRequestHistory', 'requestId'),
  }).authorization((allow) => [allow.authenticated()]),

  StaffingRequestHistory: a.model({
    id: a.id(),
    requestId: a.id().required(),
    request: a.belongsTo('StaffingRequest', 'requestId'),
    changeDescription: a.string().required(),
    changedBy: a.string().required(),
    createdAt: a.datetime().required(),
  }).authorization((allow) => [allow.authenticated()]),

  // 4.1 APLICACIONES DE CANDIDATOS
  Application: a.model({
    id: a.id(),
    candidateName: a.string().required(), // Restaurado de candidate_name
    phone: a.string().required(),
    email: a.string(),
    hotelId: a.id().required(), // Restaurado de hotel_id
    hotel: a.belongsTo('Hotel', 'hotelId'),
    role: a.string().required(),
    status: a.string().default('pendiente'), // 'pendiente', 'completada', 'empleado_creado'
    appliedAt: a.datetime(), // Restaurado de applied_at
    notes: a.string(),
  }).authorization((allow) => [allow.authenticated()]),

  // 5. ASISTENCIA Y OPERACIONES
  AttendanceRecord: a.model({
    id: a.id(),
    employeeId: a.id().required(), // Restaurado de employee_id
    employee: a.belongsTo('Employee', 'employeeId'),
    hotelId: a.id().required(), // Restaurado de hotel_id
    hotel: a.belongsTo('Hotel', 'hotelId'),
    date: a.date().required(),
    checkIn: a.datetime(), // Restaurado de check_in
    checkOut: a.datetime(), // Restaurado de check_out
    latitude: a.float(),
    longitude: a.float(),
    status: a.string(),
    isGpsVerified: a.boolean().default(false), // Restaurado de is_gps_verified
    distanceFromHotel: a.float(), // Restaurado de distance_from_hotel
  }).authorization((allow) => [allow.authenticated()]),

  PayrollReview: a.model({
    id: a.id(),
    hotelId: a.id().required(), // Restaurado de hotel_id
    hotel: a.belongsTo('Hotel', 'hotelId'),
    periodStart: a.date().required(), // Restaurado de period_start
    periodEnd: a.date().required(), // Restaurado de period_end
    totalHours: a.float(), // Restaurado de total_hours
    totalAmount: a.float(), // Restaurado de total_amount
    status: a.string(),
    reviewedBy: a.string(), // Restaurado de reviewed_by
  }).authorization((allow) => [allow.authenticated()]),

  // 6. CALIDAD (QA)
  QAAudit: a.model({
    id: a.id(),
    auditType: a.string().required(), // Restaurado de audit_type
    hotelId: a.id().required(), // Restaurado de hotel_id
    hotel: a.belongsTo('Hotel', 'hotelId'),
    employeeId: a.id(), // Restaurado de employee_id
    employee: a.belongsTo('Employee', 'employeeId'),
    roomNumber: a.string(), // Restaurado de room_number
    auditorName: a.string().required(), // Restaurado de auditor_name
    score: a.float().required(),
    observations: a.string(),
    checklistResults: a.json(), // Restaurado de checklist_results
    auditDate: a.date().required(), // Restaurado de audit_date
  }).authorization((allow) => [allow.authenticated()]),

  // 7. CONFIGURACIÓN
  Position: a.model({
    id: a.id(),
    name: a.string().required(),
    description: a.string(),
    isActive: a.boolean().default(true), // Restaurado de is_active
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
