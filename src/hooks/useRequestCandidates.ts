import { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';
import type { RequestCandidate } from '../types';

/**
 * SERVICIO DE CANDIDATOS PARA SOLICITUDES (AWS RDS)
 */
export const useRequestCandidates = (requestId: string | null) => {
  const [candidates, setCandidates] = useState<RequestCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCandidates = useCallback(async () => {
    if (!requestId) {
      setCandidates([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const client = generateClient<Schema>();
      // Filtramos candidatos por ID de solicitud en RDS
      const { data } = await client.models.Candidate.list();
      // Nota: En una implementación real con RDS usaríamos un filtro en el list()
      // si la relación está bien definida, o filtraríamos manualmente por ahora.
      const filtered = data.filter(c => c.status !== 'Eliminado'); // Placeholder del filtro real
      
      setCandidates(filtered.map(c => ({
        id: c.id as any,
        request_id: requestId as any,
        candidate_name: c.name,
        status: (c.status as any) || 'Asignado',
        created_at: c.createdAt || new Date().toISOString()
      })));
    } catch (error) {
      console.error('Error fetching candidates from AWS:', error);
    }
    setLoading(false);
  }, [requestId]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const addCandidate = async (newCandidate: Omit<RequestCandidate, 'id' | 'status'>) => {
    try {
      const client = generateClient<Schema>();
      await client.models.Candidate.create({
        name: newCandidate.candidate_name,
        role: 'Candidato',
        status: 'Asignado'
      });
      await fetchCandidates();
    } catch (error) {
      console.error('Error adding candidate to AWS:', error);
      throw error;
    }
  };

  const updateCandidateStatus = async (candidateId: string, newStatus: RequestCandidate['status']) => {
    try {
      const client = generateClient<Schema>();
      await client.models.Candidate.update({
        id: String(candidateId),
        status: newStatus
      });

      if (newStatus === 'Llegó') {
        // Lógica para crear aplicación automáticamente
        await client.models.Application.create({
          candidate_id: String(candidateId),
          request_id: requestId || 'unknown',
          status: 'pendiente',
          applied_at: new Date().toISOString()
        });
      }
      await fetchCandidates();
    } catch (error) {
      console.error('Error updating status in AWS:', error);
    }
  };

  const deleteCandidate = async (candidateId: string) => {
    try {
      const client = generateClient<Schema>();
      await client.models.Candidate.delete({ id: String(candidateId) });
      await fetchCandidates();
    } catch (error) {
      console.error('Error deleting candidate in AWS:', error);
    }
  };

  return { candidates, loading, addCandidate, updateCandidateStatus, deleteCandidate };
};
