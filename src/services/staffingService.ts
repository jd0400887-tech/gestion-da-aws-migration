import type { StaffingRequest, StaffingRequestHistory } from '../types';

/**
 * MOCK DATABASE - Datos temporales para desarrollo offline.
 * Esto protege tus datos reales de Supabase.
 */
let mockRequests: StaffingRequest[] = [
  {
    id: 1,
    request_number: 'SR26-001',
    created_at: new Date().toISOString(),
    hotel_id: 'hotel-1',
    hotelName: 'Hotel Oranje Centro',
    request_type: 'permanente',
    num_of_people: 5,
    role: 'Camarista',
    start_date: '2026-04-01',
    status: 'Pendiente',
    notes: 'Solicitud de prueba en modo offline.',
    candidate_count: 0
  },
  {
    id: 2,
    request_number: 'SR26-002',
    created_at: new Date().toISOString(),
    hotel_id: 'hotel-2',
    hotelName: 'Hotel Oranje Norte',
    request_type: 'temporal',
    num_of_people: 2,
    role: 'Recepcionista',
    start_date: '2026-04-05',
    status: 'En Proceso',
    notes: 'Candidatos en entrevista.',
    candidate_count: 2
  }
];

let mockHistory: StaffingRequestHistory[] = [];

/**
 * Servicio en MODO OFFLINE.
 * No realiza llamadas a Supabase.
 */
export const staffingService = {
  async getAll(): Promise<StaffingRequest[]> {
    console.info('[OFFLINE] Obteniendo solicitudes mock');
    return [...mockRequests];
  },

  async create(request: Omit<StaffingRequest, 'id' | 'created_at' | 'hotelName' | 'request_number'>): Promise<void> {
    const currentYear = new Date().getFullYear().toString().slice(-2);
    const prefix = `SR${currentYear}-`;
    
    // Buscar el siguiente número correlativo
    const sameYearRequests = mockRequests
      .filter(r => r.request_number.startsWith(prefix))
      .map(r => parseInt(r.request_number.split('-')[1] || '0'))
      .sort((a, b) => b - a);
    
    const nextNum = (sameYearRequests[0] || 0) + 1;
    const request_number = `${prefix}${nextNum.toString().padStart(3, '0')}`;
    
    const nextId = (mockRequests.map(r => r.id).sort((a, b) => b - a)[0] || 0) + 1;

    const newRequest: StaffingRequest = {
      ...request,
      id: nextId,
      request_number,
      created_at: new Date().toISOString(),
      hotelName: 'Hotel Mock'
    };
    
    mockRequests.push(newRequest);
    console.info('[OFFLINE] Nueva solicitud creada con Nº:', request_number);
  },

  async update(id: number, updates: Partial<StaffingRequest>, userEmail?: string): Promise<void> {
    const index = mockRequests.findIndex(r => r.id === id);
    if (index === -1) return;

    const oldStatus = mockRequests[index].status;
    mockRequests[index] = { ...mockRequests[index], ...updates };

    if (updates.status && updates.status !== oldStatus) {
      await this.logHistory(id, `Estado cambiado de '${oldStatus}' a '${updates.status}'`, userEmail);
    }
    console.info('[OFFLINE] Solicitud actualizada:', id, updates);
  },

  async setArchived(id: number, is_archived: boolean): Promise<void> {
    mockRequests = mockRequests.map(r => r.id === id ? { ...r, is_archived } : r);
    console.info('[OFFLINE] Solicitud archivada/desarchivada:', id, is_archived);
  },

  async delete(id: number): Promise<void> {
    mockRequests = mockRequests.filter(r => r.id === id);
    console.info('[OFFLINE] Solicitud eliminada:', id);
  },

  async logHistory(requestId: number, description: string, userEmail?: string): Promise<void> {
    mockHistory.push({
      id: Math.random(),
      created_at: new Date().toISOString(),
      request_id: requestId,
      changed_by: userEmail || 'Admin Mock',
      change_description: description
    });
  },

  async getHistory(requestId: number): Promise<StaffingRequestHistory[]> {
    return mockHistory.filter(h => h.request_id === requestId);
  }
};
