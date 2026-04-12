import { useState, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';
import { getDistanceInMeters } from '../utils/geolocation';
import { useHotels } from './useHotels';
import { useAuth } from './useAuth';

export function useInspectorVisits() {
  const [loading, setLoading] = useState(false);
  const { hotels } = useHotels();
  const { user, profile } = useAuth();

  const registerVisit = useCallback(async (lat: number, lng: number) => {
    if (!user || !profile) throw new Error("Usuario no autenticado");

    setLoading(true);
    try {
      // 1. Encontrar el hotel más cercano con coordenadas
      let closestHotel = null;
      let minDistance = Infinity;

      const hotelsWithLocation = hotels.filter(h => h.latitude && h.longitude);

      if (hotelsWithLocation.length === 0) {
        throw new Error("No hay hoteles con coordenadas registradas para validar.");
      }

      hotelsWithLocation.forEach(hotel => {
        const distance = getDistanceInMeters(lat, lng, hotel.latitude!, hotel.longitude!);
        if (distance < minDistance) {
          minDistance = distance;
          closestHotel = hotel;
        }
      });

      // 2. Validar radio (300 metros por defecto)
      const MAX_RADIUS = 300; 
      const isVerified = minDistance <= MAX_RADIUS;

      if (!isVerified) {
        throw new Error(`Estás demasiado lejos del hotel más cercano (${closestHotel?.name}). Distancia: ${Math.round(minDistance)}m. Debes estar a menos de ${MAX_RADIUS}m.`);
      }

      // 3. Registrar en AWS
      const client = generateClient<Schema>();
      const now = new Date();
      
      const { data: newVisit, errors } = await client.models.InspectorVisit.create({
        inspector_id: user.userId,
        hotel_id: closestHotel!.id,
        visit_date: now.toISOString().split('T')[0],
        check_in_time: now.toISOString(),
        latitude: lat,
        longitude: lng,
        distance_meters: minDistance,
        is_verified: isVerified,
        notes: `Marcación automática GPS a ${Math.round(minDistance)}m de la ubicación central.`
      });

      if (errors) throw new Error(errors[0].message);

      return { success: true, hotelName: closestHotel!.name, distance: Math.round(minDistance) };

    } catch (error: any) {
      console.error("Error al registrar visita:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, profile, hotels]);

  return { registerVisit, loading };
}
