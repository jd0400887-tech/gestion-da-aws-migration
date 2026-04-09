import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './useAuth';
import { staffingService } from '../services/staffingService';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';
import type { StaffingRequest } from '../types';

/**
 * HOOK DE SOLICITUDES DE PERSONAL (AWS CLOUD)
 * Gestiona el estado de las vacantes con auditoría de usuario.
 */
export const useStaffingRequests = () => {
  const { profile } = useAuth();
  const [allRequests, setAllRequests] = useState<StaffingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const isInitialMount = useRef(true);

  const userName = profile?.name || 'Sistema';

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const client = generateClient<Schema>();
      const requestsData = await staffingService.getAll();
      const { data: allApplications } = await client.models.Application.list();

      const enrichedData = requestsData.map(req => {
        const count = allApplications.filter(app => 
          String(app.request_id) === String(req.id) && 
          app.status !== 'Eliminado'
        ).length;
        return { ...req, candidate_count: count };
      });

      setAllRequests(enrichedData);
    } catch (error) {
      console.error('Error al sincronizar solicitudes:', error);
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

  const fetchHistory = useCallback(async (requestId: string) => {
    return await staffingService.getHistory(requestId);
  }, []);

  const activeRequests = useMemo(() => 
    allRequests.filter(r => r.status !== 'Completada' && r.status !== 'Archivada'), 
    [allRequests]
  );

  const archivedRequests = useMemo(() => 
    allRequests.filter(r => r.status === 'Archivada' || r.status === 'Completada'), 
    [allRequests]
  );

  const addRequest = async (request: any) => {
    await staffingService.create(request, userName);
    await fetchRequests();
  };

  const updateRequest = async (id: string, updates: Partial<StaffingRequest>) => {
    await staffingService.update(id, updates, userName);
    await fetchRequests();
  };

  const deleteRequest = async (id: string | number) => {
    await staffingService.delete(String(id));
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
    fetchRequests,
    fetchHistory
  };
};
