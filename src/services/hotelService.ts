import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';
import type { Hotel } from '../types';

/**
 * SERVICIO PROFESIONAL DE HOTELES (AWS RDS)
 * Conectado directamente a PostgreSQL en Virginia.
 */
export const hotelService = {
  getClient() {
    return generateClient<Schema>();
  },

  async getAll(): Promise<Hotel[]> {
    try {
      const client = this.getClient();
      console.info('📡 [AWS] Consultando hoteles en RDS PostgreSQL...');
      const { data: hotels } = await client.models.Hotel.list();
      
      return hotels.map(h => ({
        id: h.id,
        name: h.name,
        city: h.city,
        address: h.address || '',
        latitude: h.latitude || undefined,
        longitude: h.longitude || undefined,
        imageUrl: h.image_url || undefined,
        zone: (h.zone as 'Centro' | 'Norte' | 'Noroeste') || 'Centro'
      }));
    } catch (error: any) {
      if (error.message?.includes('No current user')) return [];
      console.error('❌ Error al obtener hoteles de RDS:', error);
      return [];
    }
  },

  async create(hotel: Partial<Hotel>): Promise<void> {
    try {
      const client = this.getClient();
      await client.models.Hotel.create({
        name: hotel.name || 'Nuevo Hotel',
        city: hotel.city || 'Ciudad',
        address: hotel.address,
        latitude: hotel.latitude,
        longitude: hotel.longitude,
        image_url: hotel.imageUrl,
        zone: hotel.zone || 'Centro'
      });
    } catch (error) {
      console.error('❌ Error al crear hotel en RDS:', error);
      throw error;
    }
  },

  async update(id: string, updates: Partial<Hotel>): Promise<void> {
    try {
      const client = this.getClient();
      await client.models.Hotel.update({
        id,
        name: updates.name,
        city: updates.city,
        address: updates.address,
        latitude: updates.latitude,
        longitude: updates.longitude,
        image_url: updates.imageUrl,
        zone: updates.zone
      });
    } catch (error) {
      console.error('❌ Error al actualizar hotel en RDS:', error);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const client = this.getClient();
      await client.models.Hotel.delete({ id });
    } catch (error) {
      console.error('❌ Error al eliminar hotel en RDS:', error);
    }
  }
};
