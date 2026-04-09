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
        hotelCode: h.hotel_code || 'S/C',
        name: h.name,
        city: h.city,
        address: h.address || '',
        managerName: h.manager_name || '',
        phone: h.phone || '',
        email: h.email || '',
        latitude: h.latitude || null,
        longitude: h.longitude || null,
        imageUrl: h.image_url || null,
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
      
      // Lógica de Generación de Código Operativo (Ej: HOT26-123)
      const year = new Date().getFullYear().toString().slice(-2);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const generatedCode = `HOT${year}-${random}`;

      await client.models.Hotel.create({
        hotel_code: generatedCode,
        name: hotel.name || 'Nuevo Hotel',
        city: hotel.city || 'Ciudad',
        address: hotel.address,
        manager_name: hotel.managerName,
        phone: hotel.phone,
        email: hotel.email,
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
        manager_name: updates.managerName,
        phone: updates.phone,
        email: updates.email,
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
