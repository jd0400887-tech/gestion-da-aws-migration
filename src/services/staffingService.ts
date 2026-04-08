import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';
import type { StaffingRequest } from '../types';

/**
 * SERVICIO PROFESIONAL DE SOLICITUDES (AWS RDS)
 * Conectado directamente a PostgreSQL en Virginia.
 */
export const staffingService = {
  getClient() {
    return generateClient<Schema>();
  },

  async getAll(): Promise<StaffingRequest[]> {
    try {
      const client = this.getClient();
      console.info('📡 [AWS] Consultando solicitudes en RDS PostgreSQL...');
      const { data: requests } = await client.models.StaffingRequest.list();
      
      return requests.map(r => ({
        id: r.id as any,
        request_number: r.request_number,
        created_at: r.createdAt || new Date().toISOString(),
        hotel_id: r.hotel_id,
        request_type: (r.request_type as 'permanente' | 'temporal') || 'permanente',
        num_of_people: r.num_of_people || 1,
        role: r.role,
        start_date: r.start_date,
        status: (r.status as any) || 'Pendiente',
        notes: r.notes || '',
        candidate_count: 0
      }));
    } catch (error: any) {
      if (error.message?.includes('No current user')) return [];
      console.error('❌ Error al obtener solicitudes de RDS:', error);
      return [];
    }
  },

  async create(request: Omit<StaffingRequest, 'id' | 'created_at' | 'hotelName' | 'request_number'>): Promise<void> {
    try {
      const client = this.getClient();
      const currentYear = new Date().getFullYear().toString().slice(-2);
      const request_number = `SR${currentYear}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

      await client.models.StaffingRequest.create({
        request_number,
        hotel_id: request.hotel_id,
        request_type: request.request_type,
        num_of_people: request.num_of_people,
        role: request.role,
        start_date: request.start_date,
        status: 'Pendiente',
        notes: request.notes
      });
    } catch (error) {
      console.error('❌ Error al crear solicitud en RDS:', error);
      throw error;
    }
  },

  async update(id: string, updates: Partial<StaffingRequest>): Promise<void> {
    try {
      const client = this.getClient();
      await client.models.StaffingRequest.update({
        id: String(id),
        status: updates.status,
        notes: updates.notes,
        completed_at: updates.status === 'Completada' ? new Date().toISOString() : undefined
      });
    } catch (error) {
      console.error('❌ Error al actualizar solicitud en RDS:', error);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const client = this.getClient();
      await client.models.StaffingRequest.delete({ id: String(id) });
    } catch (error) {
      console.error('❌ Error al eliminar solicitud en RDS:', error);
    }
  }
};
