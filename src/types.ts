export interface Hotel {
  id: string;
  hotelCode?: string;
  name: string;
  city: string;
  address: string;
  managerName?: string;
  phone?: string;
  email?: string;
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;
  activeEmployees?: number;
  totalEmployees?: number;
  zone: 'Centro' | 'Norte' | 'Noroeste';
  telegram_chat_id?: string | null;
}

export interface Employee {
  id: string; 
  employeeNumber: string;
  name: string;
  hotelId: string;
  isActive: boolean;
  role: string;
  employeeType: 'permanente' | 'temporal';
  phone?: string;
  email?: string;
  isBlacklisted: boolean;
  blacklistReason?: string;
  payrollType: 'timesheet' | 'Workrecord';
  lastReviewedTimestamp: string | null;
  documentacion_completa: boolean;
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'RECRUITER' | 'INSPECTOR' | 'COORDINATOR';
  assigned_zone?: string;
  // Permisos de Visualización (Módulos)
  can_view_hotels: boolean;
  can_view_employees: boolean;
  can_view_requests: boolean;
  can_view_applications: boolean;
  can_view_payroll: boolean;
  can_view_qa: boolean;
  can_view_reports: boolean;
  can_view_adoption: boolean;
  // Permisos de Edición/Acción (Funcionalidades)
  can_edit_hotels?: boolean;
  can_edit_employees?: boolean;
  can_edit_requests?: boolean;
  can_approve_applications?: boolean;
  can_manage_users?: boolean;
  can_export_data?: boolean;
  can_view_archived_requests?: boolean;
}

export interface StaffingRequest {
  id: number;
  request_number: string;
  created_at: string;
  hotel_id: string;
  hotelName?: string;
  request_type: 'permanente' | 'temporal';
  num_of_people: number;
  role: string;
  priority: 'Baja' | 'Normal' | 'Alta' | 'Crítica';
  shift_time?: string;
  start_date: string;
  status: 'Pendiente' | 'Enviada a Reclutamiento' | 'En Proceso' | 'Completada' | 'Completada Parcialmente' | 'Cancelada por Hotel' | 'Candidato No Presentado' | 'Vencida';
  notes: string | null;
  candidate_count?: number;
  hours_since_creation?: number;
  completed_at?: string | null;
}

export interface RequestCandidate {
  id: number;
  request_id: number;
  candidate_name: string | null;
  existing_employee_id: string | null;
  status: 'Asignado' | 'Llegó' | 'No llegó' | 'Confirmado';
}

export interface StaffingRequestHistory {
  id: string;
  request_id: string;
  change_description: string;
  changed_by: string;
  created_at: string;
}
