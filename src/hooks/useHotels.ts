import { useHotelsContext } from '../contexts/HotelsContext';
import type { Hotel } from '../types';

export function useHotels() {
  const context = useHotelsContext();

  const uploadHotelImage = async (_file: File, _hotelId: string) => {
    console.warn('Upload image to S3 logic pending');
  };

  return {
    hotels: context.hotels,
    employees: context.employees,
    loading: context.loading,
    addHotel: context.addHotel,
    updateHotel: context.updateHotel,
    deleteHotel: context.deleteHotel,
    uploadHotelImage,
    refreshHotels: context.refreshHotels,
  };
}
