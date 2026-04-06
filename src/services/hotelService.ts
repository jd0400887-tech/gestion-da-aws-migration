import type { Hotel } from '../types';

/**
 * MOCK DATABASE - Hoteles
 */
let mockHotels: Hotel[] = [
  {
    id: 'hotel-1',
    name: 'Hotel Oranje Centro',
    city: 'Mazatlán',
    address: 'Av. del Mar 100',
    latitude: 23.2329,
    longitude: -106.4178,
    imageUrl: null,
    zone: 'Centro',
    totalEmployees: 25,
    activeEmployees: 20
  },
  {
    id: 'hotel-2',
    name: 'Hotel Oranje Norte',
    city: 'Mazatlán',
    address: 'Sábalo Country 500',
    latitude: 23.2750,
    longitude: -106.4450,
    imageUrl: null,
    zone: 'Norte',
    totalEmployees: 15,
    activeEmployees: 12
  }
];

export const hotelService = {
  async getAll(): Promise<Hotel[]> {
    console.info('[OFFLINE] Obteniendo hoteles mock');
    return [...mockHotels];
  },

  async create(hotel: Partial<Hotel>): Promise<void> {
    const newHotel: Hotel = {
      ...hotel,
      id: `hotel-${Date.now()}`,
      totalEmployees: 0,
      activeEmployees: 0
    } as Hotel;
    mockHotels.push(newHotel);
    console.info('[OFFLINE] Hotel creado localmente:', newHotel);
  },

  async update(id: string, updates: Partial<Hotel>): Promise<void> {
    mockHotels = mockHotels.map(h => h.id === id ? { ...h, ...updates } : h);
    console.info('[OFFLINE] Hotel actualizado:', id, updates);
  },

  async delete(id: string): Promise<void> {
    mockHotels = mockHotels.filter(h => h.id !== id);
    console.info('[OFFLINE] Hotel eliminado:', id);
  }
};
