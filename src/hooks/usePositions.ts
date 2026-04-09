import { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';

export interface Position {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

/**
 * HOOK DE CARGOS DINÁMICOS (AWS CLOUD)
 * Permite gestionar los roles de personal desde la base de datos.
 */
export function usePositions() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPositions = useCallback(async () => {
    try {
      setLoading(true);
      const client = generateClient<Schema>();
      const { data } = await client.models.Position.list();
      
      // Si la tabla está vacía (primera vez), podrías inyectar los básicos o dejarla vacía.
      setPositions(data.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        is_active: p.is_active ?? true
      })).sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Error al cargar cargos de AWS:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  const addPosition = async (name: string, description?: string) => {
    try {
      const client = generateClient<Schema>();
      await client.models.Position.create({
        name,
        description,
        is_active: true
      });
      await fetchPositions();
    } catch (error) {
      console.error('Error al crear cargo:', error);
      throw error;
    }
  };

  const deletePosition = async (id: string) => {
    try {
      const client = generateClient<Schema>();
      await client.models.Position.delete({ id });
      await fetchPositions();
    } catch (error) {
      console.error('Error al eliminar cargo:', error);
    }
  };

  return { positions, loading, addPosition, deletePosition, refreshPositions: fetchPositions };
}
