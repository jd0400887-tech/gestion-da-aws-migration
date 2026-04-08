import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { hotelService } from '../services/hotelService';
import { employeeService } from '../services/employeeService';
import type { Hotel, Employee } from '../types';

interface HotelsContextType {
  hotels: Hotel[];
  employees: Employee[];
  loading: boolean;
  refreshHotels: () => Promise<void>;
  addHotel: (hotelData: Partial<Hotel>) => Promise<void>;
  updateHotel: (updatedHotel: Partial<Hotel>) => Promise<void>;
  deleteHotel: (id: string) => Promise<void>;
}

const HotelsContext = createContext<HotelsContextType | undefined>(undefined);

export const HotelsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const isInitialMount = useRef(true);

  const fetchHotelsAndEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const [hotelsData, employeesData] = await Promise.all([
        hotelService.getAll(),
        employeeService.getAll()
      ]);

      const hotelsWithCounts = hotelsData.map(hotel => {
        const hotelEmployees = employeesData.filter(emp => emp.hotelId === hotel.id);
        return {
          ...hotel,
          totalEmployees: hotelEmployees.length,
          activeEmployees: hotelEmployees.filter(emp => emp.isActive).length,
        };
      });

      setEmployees(employeesData);
      setHotels(hotelsWithCounts);
    } catch (error) {
      console.error('Error fetching global data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      fetchHotelsAndEmployees();
      isInitialMount.current = false;
    }
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

  return (
    <HotelsContext.Provider value={{ 
      hotels, 
      employees, 
      loading, 
      refreshHotels: fetchHotelsAndEmployees,
      addHotel,
      updateHotel,
      deleteHotel
    }}>
      {children}
    </HotelsContext.Provider>
  );
};

export const useHotelsContext = () => {
  const context = useContext(HotelsContext);
  if (context === undefined) {
    throw new Error('useHotelsContext must be used within a HotelsProvider');
  }
  return context;
};
