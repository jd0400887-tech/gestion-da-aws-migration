import { useState } from 'react';
import { useHotelsContext } from '../contexts/HotelsContext';
import type { Hotel } from '../types';
import { uploadData, getUrl } from 'aws-amplify/storage';

/**
 * HOOK DE HOTELES (AWS CLOUD + S3)
 * Gestiona la lógica de hoteles y la subida de imágenes a S3 con persistencia de rutas.
 */
export function useHotels() {
  const context = useHotelsContext();
  const [uploading, setUploading] = useState(false);

  /**
   * Obtiene una URL fresca para una imagen guardada en S3
   */
  const getHotelImageUrl = async (path: string): Promise<string> => {
    try {
      if (!path) return '';
      if (path.startsWith('http')) return path; // Si ya es una URL, la devolvemos
      
      const urlResult = await getUrl({
        path: path,
        options: {
          validateObjectExistence: true,
          expiresIn: 3600 // La URL será válida por 1 hora
        }
      });
      return urlResult.url.toString();
    } catch (error) {
      console.error('Error al recuperar URL de S3:', error);
      return '';
    }
  };

  const uploadHotelImage = async (file: File, hotelId: string) => {
    try {
      setUploading(true);
      
      // 1. Sanear el nombre del archivo (quitar espacios y caracteres raros)
      const cleanFileName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
      const storagePath = `hotel-images/${hotelId}-${cleanFileName}`;

      console.info(`📡 [AWS S3] Subiendo imagen a ruta: ${storagePath}...`);
      
      // 2. Subir el archivo real a S3
      await uploadData({
        path: storagePath,
        data: file,
        options: {
          contentType: file.type
        }
      }).result;

      // 3. ACTUALIZACIÓN CRÍTICA: Guardamos la RUTA (Path), no la URL firmada
      await context.updateHotel({
        id: hotelId,
        imageUrl: storagePath 
      });

      console.info('✅ [AWS S3] Ruta de imagen vinculada con éxito.');
    } catch (error) {
      console.error('❌ Error al subir imagen a S3:', error);
      alert('Error al subir la imagen. Por favor, intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  return {
    hotels: context.hotels,
    employees: context.employees,
    loading: context.loading,
    uploading,
    addHotel: context.addHotel,
    updateHotel: context.updateHotel,
    deleteHotel: context.deleteHotel,
    uploadHotelImage,
    getHotelImageUrl, // Nueva función para las vistas
    refreshHotels: context.refreshHotels,
  };
}
