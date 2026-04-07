import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';
import type { Hotel } from '../types';

const client = generateClient<Schema>();

/**
 * SERVICIO PROFESIONAL DE HOTELES (AWS AMPLIFY)
 * Conexión directa con la base de datos en la nube.
 */
export const hotelService = {
  async getAll(): Promise<Hotel[]> {
    console.info('📡 [AWS] Intentando obtener hoteles de la nube...');
    try {
      const { data: hotels } = await client.models.Hotel.list();
      console.info(`✅ [AWS] ${hotels.length} hoteles obtenidos.`);
      return hotels.map(h => ({
        id: h.id,
        name: h.name,
        city: h.city,
        address: h.address || '',
        latitude: null,
        longitude: null,
        imageUrl: null,
        zone: (h.zone as 'Centro' | 'Norte' | 'Noroeste') || 'Centro',
        totalEmployees: 0,
        activeEmployees: 0
      }));
    } catch (error) {
      console.error('❌ Error al obtener hoteles de AWS:', error);
      return [];
    }
  },

  async create(hotel: Partial<Hotel>): Promise<void> {
    console.info('📡 [AWS] Creando nuevo hotel en la nube...');
    try {
      await client.models.Hotel.create({
        name: hotel.name || 'Nuevo Hotel',
        city: hotel.city || 'Desconocida',
        address: hotel.address || '',
        zone: hotel.zone || 'Centro',
      });
      console.info('✅ Hotel creado exitosamente en AWS.');
    } catch (error) {
      console.error('❌ Error al crear hotel en AWS:', error);
      throw error;
    }
  },

  async update(id: string, updates: Partial<Hotel>): Promise<void> {
    try {
      await client.models.Hotel.update({
        id,
        name: updates.name,
        city: updates.city,
        address: updates.address,
        zone: updates.zone,
      });
    } catch (error) {
      console.error('❌ Error al actualizar en AWS:', error);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await client.models.Hotel.delete({ id });
    } catch (error) {
      console.error('❌ Error al eliminar en AWS:', error);
    }
  }
};
