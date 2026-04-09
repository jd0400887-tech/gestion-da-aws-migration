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
}

export interface Profile {
  id: string;
  email: string;
  role: 'ADMIN' | 'COORDINATOR' | 'INSPECTOR' | 'RECRUITER';
  assigned_zone: 'Centro' | 'Norte' | 'Noroeste' | null;
  permissions?: string[];
  telegram_id?: string | null; // For automatic identification via bot
  language_preference?: 'en' | 'es'; // Preferred language for communication
}

export interface EmployeeAssignment {
  id: string;
  employeeId: string;
  hotelId: string;
  role: string;
  startDate: string;
  endDate?: string | null;
  status: 'active' | 'inactive' | 'transferred';
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

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  hotelId: string;
  timestamp: number; // Unix timestamp
}

export interface StaffingRequest {
  id: number;
  request_number: string; // Follow-up number (SR26-001)
  created_at: string;
  hotel_id: string;
  hotelName?: string; // From the join
  request_type: 'permanente' | 'temporal';
  num_of_people: number;
  role: string;
  priority: 'Baja' | 'Normal' | 'Alta' | 'Crítica';
  shift_time?: string;
  start_date: string;
  status: 'Pendiente' | 'Enviada a Reclutamiento' | 'En Proceso' | 'Completada' | 'Completada Parcialmente' | 'Cancelada por Hotel' | 'Candidato No Presentado' | 'Vencida';
  completed_at?: string | null;
  notes?: string | null;
  candidate_count?: number;
}

export interface StaffingRequestHistory {
  id: number;
  created_at: string;
  request_id: number;
  changed_by: string;
  change_description: string;
}

export interface RequestCandidate {
  id: number;
  request_id: number;
  candidate_name: string | null;
  existing_employee_id: string | null;
  status: 'Asignado' | 'Llegó' | 'No llegó' | 'Confirmado';
}

// Force cache invalidation 2025-10-03