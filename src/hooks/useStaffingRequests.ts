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
        // 1. Contador de Candidatos (Mapeo inteligente para requestId)
        const count = allApplications.filter(app => {
          const a = app as any;
          const reqId = a.requestId || a.request_id || a.hotelId; // Fallback extremo
          return String(reqId) === String(req.id) && app.status !== 'Eliminado';
        }).length;

        // 2. Lógica de SLA (72 Horas para resolución)
        const creationDate = new Date(req.created_at);
        const now = new Date();
        const diffHours = (now.getTime() - creationDate.getTime()) / (1000 * 60 * 60);
        
        let currentStatus = req.status;
        const activeStatuses = ['Pendiente', 'Enviada a Reclutamiento', 'En Proceso', 'Completada Parcialmente'];
        if (diffHours > 72 && activeStatuses.includes(req.status)) {
          currentStatus = 'Vencida';
        }

        return { 
          ...req, 
          status: currentStatus,
          candidate_count: count,
          hours_since_creation: Math.floor(diffHours)
        };
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
    // 1. Carga inicial
    fetchRequests();

    // 2. SUSCRIPCIONES EN TIEMPO REAL (Professional Real-time UI)
    const client = generateClient<Schema>();
    
    // Escuchar nuevas solicitudes (Bot de Telegram o Web)
    const createSub = client.models.StaffingRequest.onCreate().subscribe({
      next: () => fetchRequests(),
      error: (error) => console.warn('Error en suscripción onCreate:', error)
    });

    // Escuchar actualizaciones (Cambios de estado, asignaciones)
    const updateSub = client.models.StaffingRequest.onUpdate().subscribe({
      next: () => fetchRequests(),
      error: (error) => console.warn('Error en suscripción onUpdate:', error)
    });

    // Escuchar eliminaciones
    const deleteSub = client.models.StaffingRequest.onDelete().subscribe({
      next: () => fetchRequests(),
      error: (error) => console.warn('Error en suscripción onDelete:', error)
    });

    // Limpieza al desmontar el componente
    return () => {
      createSub.unsubscribe();
      updateSub.unsubscribe();
      deleteSub.unsubscribe();
    };
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

  const archiveRequest = async (id: string) => {
    await staffingService.update(id, { status: 'Archivada' }, userName);
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
    archiveRequest,
    deleteRequest, 
    fetchRequests,
    fetchHistory
  };
};
