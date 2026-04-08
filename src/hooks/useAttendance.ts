import { useState, useEffect, useMemo } from 'react';
import { startOfDay, endOfDay } from 'date-fns';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';
import type { AttendanceRecord } from '../types';
import { useHotels } from './useHotels';
import { useAuthenticator } from '@aws-amplify/ui-react';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export function useAttendance(dateRange: DateRange, selectedHotelId?: string) {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const { hotels, loading: hotelsLoading } = useHotels();
  const { user } = useAuthenticator();

  const fetchAttendanceRecords = async () => {
    try {
      const client = generateClient<Schema>();
      const { data } = await client.models.AttendanceRecord.list();
      setAttendanceRecords(data.map(r => ({
        id: r.id,
        hotelId: r.hotel_id,
        employeeId: r.employee_id,
        timestamp: r.timestamp,
        latitude: r.latitude || undefined,
        longitude: r.longitude || undefined
      })));
    } catch (error) {
      console.error('Error fetching attendance records from AWS:', error);
    }
  };

  useEffect(() => {
    fetchAttendanceRecords();
  }, []);

  const addRecord = async (hotelId: string) => {
    if (!user) {
      throw new Error("No se pudo identificar al usuario.");
    }

    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const exists = attendanceRecords.some(r => 
      r.employeeId === user.userId && 
      r.hotelId === hotelId && 
      new Date(r.timestamp) >= todayStart && 
      new Date(r.timestamp) <= todayEnd
    );

    if (exists) {
      throw new Error('Ya marcaste ingreso hoy en este hotel');
    }

    try {
      const client = generateClient<Schema>();
      const { data: newRecord } = await client.models.AttendanceRecord.create({
        employee_id: user.userId,
        hotel_id: hotelId,
        timestamp: new Date().toISOString(),
      });

      if (newRecord) {
        await fetchAttendanceRecords();
      }
    } catch (error) {
      console.error('Error adding attendance record to AWS:', error);
      throw new Error('No se pudo registrar la asistencia.');
    }
  };

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
    filteredRecords: attendanceRecords,
    addRecord,
    deleteRecord,
    hotels,
    hotelsLoading,
  };
}
