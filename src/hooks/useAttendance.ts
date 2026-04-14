import { useState, useEffect, useMemo, useCallback } from 'react';
import { startOfDay, endOfDay } from 'date-fns';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';
import type { AttendanceRecord } from '../types';
import { useHotels } from './useHotels';
import { useAuth } from './useAuth';
import { getDistanceInMeters } from '../utils/geolocation';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export function useAttendance(dateRange: DateRange, selectedHotelId?: string) {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const { hotels, loading: hotelsLoading } = useHotels();
  const { user, profile } = useAuth();

  const fetchAttendanceRecords = async () => {
    try {
      const client = generateClient<Schema>();
      // Listamos todos los registros. En producción con miles de datos, 
      // aquí deberíamos filtrar por fecha en la consulta de AppSync.
      const { data } = await client.models.AttendanceRecord.list();
      setAttendanceRecords(data.map(r => ({
        id: r.id,
        hotelId: r.hotel_id,
        employeeId: r.employee_id,
        timestamp: r.check_in || r.date || new Date().toISOString(),
        latitude: r.latitude || undefined,
        longitude: r.longitude || undefined,
        isGpsVerified: r.is_gps_verified || false,
        distanceFromHotel: r.distance_from_hotel || undefined
      })));
    } catch (error) {
      console.error('Error fetching attendance records from AWS:', error);
    }
  };

  useEffect(() => {
    fetchAttendanceRecords();
  }, []);

  // 1. Filtrado por ZONA (Seguridad de visualización)
  const zoneFilteredRecords = useMemo(() => {
    let records = attendanceRecords;

    // Si es INSPECTOR, solo ve los de su zona
    if (profile?.role === 'INSPECTOR' && profile.assigned_zone) {
      records = records.filter(record => {
        const hotel = hotels.find(h => h.id === record.hotelId);
        return hotel?.zone === profile.assigned_zone;
      });
    }
    // ADMIN y COORDINATOR ven todos (no filtramos más por zona)

    return records;
  }, [attendanceRecords, hotels, profile]);

  // 2. Filtrado por UI (Fecha y Hotel seleccionado)
  const filteredRecords = useMemo(() => {
    let result = zoneFilteredRecords;

    if (selectedHotelId) {
      result = result.filter(r => r.hotelId === selectedHotelId);
    }

    if (dateRange.start && dateRange.end) {
      const start = startOfDay(dateRange.start);
      const end = endOfDay(dateRange.end);
      result = result.filter(r => {
        const d = new Date(r.timestamp);
        return d >= start && d <= end;
      });
    }

    return result;
  }, [zoneFilteredRecords, selectedHotelId, dateRange]);

  // 3. Agrupación para el reporte (Formato que espera AttendanceGroupedList)
  const visitsByHotel = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredRecords.forEach(r => {
      counts[r.hotelId] = (counts[r.hotelId] || 0) + 1;
    });

    return Object.entries(counts).map(([hotelId, count]) => ({
      hotel: hotels.find(h => h.id === hotelId),
      count: count
    })).filter(item => item.hotel !== undefined) // Solo si el hotel existe
    .sort((a, b) => b.count - a.count);
  }, [filteredRecords, hotels]);

  const addRecord = useCallback(async (lat: number, lng: number) => {
    if (!user) throw new Error("No se pudo identificar al usuario.");

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

    const MAX_RADIUS = 300; 
    const isVerified = minDistance <= MAX_RADIUS;

    if (!isVerified) {
      throw new Error(`Estás demasiado lejos del hotel más cercano (${closestHotel?.name}). Distancia: ${Math.round(minDistance)}m. Debes estar a menos de ${MAX_RADIUS}m.`);
    }

    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const exists = attendanceRecords.some(r => 
      r.employeeId === user.userId && 
      r.hotelId === closestHotel!.id && 
      new Date(r.timestamp) >= todayStart && 
      new Date(r.timestamp) <= todayEnd
    );

    if (exists) {
      throw new Error('Ya marcaste visita hoy en este hotel');
    }

    try {
      const client = generateClient<Schema>();
      const now = new Date();
      
      const { data: newRecord } = await client.models.AttendanceRecord.create({
        employee_id: user.userId,
        hotel_id: closestHotel!.id,
        date: now.toISOString().split('T')[0],
        check_in: now.toISOString(),
        latitude: lat,
        longitude: lng,
        is_gps_verified: isVerified,
        distance_from_hotel: minDistance,
        status: 'present'
      });

      if (newRecord) {
        await fetchAttendanceRecords();
      }

      return { success: true, hotelName: closestHotel!.name, distance: Math.round(minDistance) };
    } catch (error) {
      console.error('Error adding attendance record to AWS:', error);
      throw new Error('No se pudo registrar la visita.');
    }
  }, [user, hotels, attendanceRecords]);

  const deleteRecord = async (id: string) => {
    try {
      const client = generateClient<Schema>();
      await client.models.AttendanceRecord.delete({ id });
      setAttendanceRecords(prev => prev.filter(record => record.id !== id));
    } catch (error) {
      console.error('Error deleting attendance record from AWS:', error);
    }
  };

  return {
    allRecords: attendanceRecords,
    filteredRecords,
    visitsByHotel,
    addRecord,
    deleteRecord,
    hotels,
    hotelsLoading,
  };
}
