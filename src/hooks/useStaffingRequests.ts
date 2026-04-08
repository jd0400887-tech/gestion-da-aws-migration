import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './useAuth';
import { staffingService } from '../services/staffingService';
import type { StaffingRequest } from '../types';

/**
 * HOOK DE SOLICITUDES DE PERSONAL (AWS CLOUD)
 * Gestiona el estado de las vacantes en los hoteles.
 */
export const useStaffingRequests = () => {
  const { profile } = useAuth();
  const [allRequests, setAllRequests] = useState<StaffingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const isInitialMount = useRef(true);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await staffingService.getAll();
      setAllRequests(data);
    } catch (error) {
      console.error('Error al obtener solicitudes de AWS:', error);
      setAllRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      fetchRequests();
      isInitialMount.current = false;
    }
  }, [fetchRequests]);

  // Filtros simplificados para AWS RDS (usando status en lugar de is_archived)
  const activeRequests = useMemo(() => 
    allRequests.filter(r => r.status !== 'Completada' && r.status !== 'Archivada'), 
    [allRequests]
  );

  const archivedRequests = useMemo(() => 
    allRequests.filter(r => r.status === 'Archivada' || r.status === 'Completada'), 
    [allRequests]
  );

  const addRequest = async (request: any) => {
    await staffingService.create(request);
    await fetchRequests();
  };

  const updateRequest = async (id: string, updates: Partial<StaffingRequest>) => {
    await staffingService.update(id, updates);
    await fetchRequests();
  };

  const deleteRequest = async (id: string) => {
    await staffingService.delete(id);
    await fetchRequests();
  };

  return { 
    allRequests, 
    activeRequests, 
    archivedRequests, 
    loading, 
    addRequest, 
    updateRequest, 
    deleteRequest, 
    fetchRequests
  };
};
