import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';
import type { StaffingRequest } from '../types';

/**
 * SERVICIO PROFESIONAL DE SOLICITUDES (AWS RDS)
 * Conectado a PostgreSQL en AWS Cloud.
 */
export const staffingService = {
  getClient() {
    return generateClient<Schema>();
  },

  async getAll(): Promise<StaffingRequest[]> {
    try {
      const client = this.getClient();
      const { data: requests, errors } = await client.models.StaffingRequest.list();
      
      if (errors) {
        console.warn('⚠️ [AWS] Avisos al listar solicitudes:', errors);
      }

      // Validar y limpiar cada solicitud para evitar crashes
      return (requests || [])
        .filter(r => r && r.id) // Ignorar registros corruptos
        .map(r => ({
          id: String(r.id),
          request_number: r.request_number || 'SR-N/A',
          created_at: (r as any).createdAt || new Date().toISOString(),
          hotel_id: r.hotel_id || '',
          request_type: (r.request_type as any) || 'temporal',
          num_of_people: Number(r.num_of_people) || 1,
          role: r.role || 'Sin cargo',
          priority: (r.priority as any) || 'medium',
          shift_time: r.shift_time || '',
          start_date: r.start_date || new Date().toISOString().split('T')[0],
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

  async create(request: Omit<StaffingRequest, 'id' | 'created_at' | 'hotelName' | 'request_number'>, userName: string = 'Sistema'): Promise<string> {
    try {
      const client = this.getClient();
      const currentYear = new Date().getFullYear().toString().slice(-2);
      const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const request_number = `SR${currentYear}-${randomPart}`;
      const now = new Date().toISOString().split('T')[0];

      const { data: newReq, errors } = await client.models.StaffingRequest.create({
        request_number,
        hotel_id: request.hotel_id,
        request_type: request.request_type || 'temporal',
        num_of_people: Math.max(1, Number(request.num_of_people)),
        role: request.role || 'Sin cargo',
        priority: request.priority || 'medium',
        shift_time: request.shift_time || '07:00',
        start_date: request.start_date || now,
        request_date: now,
        status: 'Pendiente',
        notes: request.notes || '',
        is_archived: false
      });

      if (errors || !newReq) {
        console.error('Detalle de error AWS:', errors);
        throw new Error("AWS rechazó la creación de la solicitud.");
      }

      // REGISTRAR HISTORIAL INICIAL
      await this.addHistory(newReq.id, `Solicitud creada en estado Pendiente vía ${userName}`, userName);

      return newReq.id;
    } catch (error: any) {
      console.error('❌ Error crítico en creación:', error.message);
      throw error;
    }
  },

  async update(id: string, updates: Partial<StaffingRequest>, userName: string = 'Sistema'): Promise<void> {
    try {
      const client = this.getClient();
      
      const input: any = { id: String(id) };
      let changeLog: string[] = [];

      if (updates.hotel_id) input.hotel_id = updates.hotel_id;
      if (updates.request_type) input.request_type = updates.request_type;
      if (updates.num_of_people) input.num_of_people = Number(updates.num_of_people);
      if (updates.role) {
        input.role = updates.role;
        changeLog.push(`Cargo actualizado a: ${updates.role}`);
      }
      if (updates.start_date) input.start_date = updates.start_date;
      if (updates.status) {
        input.status = updates.status;
        changeLog.push(`Estado cambiado a: ${updates.status}`);
      }
      if (updates.notes !== undefined) input.notes = updates.notes || '';
      if (updates.priority) input.priority = updates.priority;
      if (updates.shift_time !== undefined) input.shift_time = updates.shift_time || '';

      const { errors } = await client.models.StaffingRequest.update(input);
      if (errors) {
        console.error('Detalle de error AWS Update:', errors);
        throw new Error("AWS rechazó la actualización.");
      }

      if (changeLog.length > 0) {
        const fullDescription = changeLog.join(" | ");
        await this.addHistory(id, fullDescription, userName);
      }
    } catch (error: any) {
      console.error('❌ Error crítico en actualización:', error.message);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const client = this.getClient();
      await client.models.StaffingRequest.delete({ id: String(id) });
    } catch (error) {
      console.error('❌ Error al eliminar en RDS:', error);
    }
  },

  async addHistory(requestId: string, description: string, userName: string): Promise<void> {
    try {
      const client = this.getClient();
      await client.models.StaffingRequestHistory.create({
        request_id: requestId,
        change_description: description,
        changed_by: userName,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error al registrar historial:', error);
    }
  },

  async getHistory(requestId: string): Promise<any[]> {
    try {
      const client = this.getClient();
      const { data } = await client.models.StaffingRequestHistory.list({
        filter: { request_id: { eq: requestId } }
      });
      return data.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    } catch (error) {
      console.error('Error al obtener historial de AWS:', error);
      return [];
    }
  }
};
