import { useState, useEffect, useCallback } from 'react';
import { hotelService } from '../services/hotelService';
import { employeeService } from '../services/employeeService';
import type { Hotel, Employee } from '../types';

export function useHotels() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHotelsAndEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const [hotelsData, employeesData] = await Promise.all([
          hotelService.getAll(),
          employeeService.getAll()
      ]);

      setEmployees(employeesData);

      const hotelsWithCounts = hotelsData.map(hotel => {
        const hotelEmployees = employeesData.filter(emp => emp.hotelId === hotel.id);
        return {
          ...hotel,
          totalEmployees: hotelEmployees.length,
          activeEmployees: hotelEmployees.filter(emp => emp.isActive).length,
        };
      });
      setHotels(hotelsWithCounts);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHotelsAndEmployees();
  }, [fetchHotelsAndEmployees]);

  const addHotel = async (hotelData: Partial<Hotel>) => {
    await hotelService.create(hotelData);
    await fetchHotelsAndEmployees();
  };

  const updateHotel = async (updatedHotel: Partial<Hotel>) => {
    if (!updatedHotel.id) return;
    await hotelService.update(updatedHotel.id, updatedHotel);
    await fetchHotelsAndEmployees();
  };

  const deleteHotel = async (id: string) => {
    await hotelService.delete(id);
    await fetchHotelsAndEmployees();
  };

  const uploadHotelImage = async (_file: File, hotelId: string) => {
    console.warn('[OFFLINE] Upload image not supported in mock mode');
    // En producción esto usaría S3
  };

  return {
    hotels,
    employees,
    loading,
    addHotel,
    updateHotel,
    deleteHotel,
    uploadHotelImage,
    refreshHotels: fetchHotelsAndEmployees,
  };
}
