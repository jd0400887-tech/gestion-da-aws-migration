import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';
import type { StaffingRequest } from '../types';

const client = generateClient<Schema>();

/**
 * SERVICIO PROFESIONAL DE SOLICITUDES (AWS AMPLIFY)
 * Conexión directa con la base de datos en la nube.
 */
export const staffingService = {
  async getAll(): Promise<StaffingRequest[]> {
    console.info('📡 [AWS] Intentando obtener solicitudes de la nube...');
    try {
      const { data: requests } = await client.models.StaffingRequest.list();
      console.info(`✅ [AWS] ${requests.length} solicitudes obtenidas.`);
      return requests.map(r => ({
        id: Number(r.id), // AWS usa IDs de tipo string por defecto
        request_number: r.request_number,
        created_at: new Date().toISOString(),
        hotel_id: r.hotel_id,
        request_type: (r.request_type as 'permanente' | 'temporal') || 'permanente',
        num_of_people: r.num_of_people || 1,
        role: r.role,
        start_date: new Date().toISOString().split('T')[0],
        status: (r.status as any) || 'Pendiente',
        notes: '',
        candidate_count: 0
      }));
    } catch (error) {
      console.error('❌ Error al obtener solicitudes de AWS:', error);
      return [];
    }
  },

  async create(request: Omit<StaffingRequest, 'id' | 'created_at' | 'hotelName' | 'request_number'>): Promise<void> {
    console.info('📡 [AWS] Creando nueva solicitud en la nube...');
    try {
      const currentYear = new Date().getFullYear().toString().slice(-2);
      const request_number = `SR${currentYear}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

      await client.models.StaffingRequest.create({
        request_number,
        hotel_id: request.hotel_id,
        request_type: request.request_type,
        num_of_people: request.num_of_people,
        role: request.role,
        status: 'Pendiente',
      });
      console.info('✅ Solicitud creada exitosamente en AWS.');
    } catch (error) {
      console.error('❌ Error al crear solicitud en AWS:', error);
      throw error;
    }
  },

  async update(id: number, updates: Partial<StaffingRequest>): Promise<void> {
    try {
      // Nota: id es un número en el frontend pero string en AWS
      await client.models.StaffingRequest.update({
        id: String(id),
        status: updates.status,
      });
    } catch (error) {
      console.error('❌ Error al actualizar solicitud en AWS:', error);
    }
  },

  async delete(id: number): Promise<void> {
    try {
      await client.models.StaffingRequest.delete({ id: String(id) });
    } catch (error) {
      console.error('❌ Error al eliminar solicitud en AWS:', error);
    }
  },

  async logHistory(): Promise<void> {
    // Implementaremos el historial en la siguiente fase
  },

  async getHistory(): Promise<any[]> {
    return [];
  }
};
