import { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';
import type { RequestCandidate } from '../types';
import { staffingService } from '../services/staffingService';

/**
 * SERVICIO DE CANDIDATOS PARA SOLICITUDES (AWS RDS)
 * Filtra candidatos y registra logs en el historial de la solicitud.
 */
export const useRequestCandidates = (requestId: string | null, userName: string = 'Sistema') => {
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
      const { data: apps } = await client.models.Application.list({
        filter: { request_id: { eq: requestId } }
      });

      const { data: allCandidates } = await client.models.Candidate.list();
      const { data: allEmployees } = await client.models.Employee.list();

      const mapped = apps.map(app => {
        const cand = allCandidates.find(c => c.id === app.candidate_id);
        const emp = allEmployees.find(e => e.id === app.candidate_id);
        return {
          id: app.id as any,
          request_id: requestId as any,
          candidate_name: cand?.name || emp?.name || 'Candidato Desconocido',
          status: (app.status as any) || 'Asignado',
          created_at: app.applied_at,
          existing_employee_id: emp ? emp.id : null
        };
      });
      setCandidates(mapped);
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
      let candidateId = newCandidate.existing_employee_id;
      let nameForLog = newCandidate.candidate_name;

      if (!candidateId) {
        const { data: cand } = await client.models.Candidate.create({
          name: newCandidate.candidate_name || 'Nuevo Candidato',
          role: 'Externo',
          status: 'Activo'
        });
        candidateId = cand?.id || '';
      } else {
        const emp = (await client.models.Employee.get({ id: candidateId })).data;
        nameForLog = emp?.name || 'Empleado';
      }

      await client.models.Application.create({
        candidate_id: candidateId,
        request_id: String(requestId),
        status: 'Asignado',
        applied_at: new Date().toISOString()
      });

      // REGISTRAR EN HISTORIAL
      await staffingService.addHistory(String(requestId), `Candidato asignado: ${nameForLog}`, userName);

      await fetchCandidates();
    } catch (error) {
      console.error('Error adding candidate to AWS:', error);
      throw error;
    }
  };

  const updateCandidateStatus = async (applicationId: string, newStatus: string) => {
    try {
      const client = generateClient<Schema>();
      
      // Obtener nombre para el log
      const current = candidates.find(c => String(c.id) === applicationId);
      
      await client.models.Application.update({
        id: applicationId,
        status: newStatus
      });

      // REGISTRAR EN HISTORIAL
      await staffingService.addHistory(String(requestId), `Seguimiento: ${current?.candidate_name} cambió a estado ${newStatus}`, userName);

      await fetchCandidates();
    } catch (error) {
      console.error('Error updating status in AWS:', error);
    }
  };

  const deleteCandidate = async (applicationId: string) => {
    try {
      const client = generateClient<Schema>();
      const current = candidates.find(c => String(c.id) === applicationId);

      await client.models.Application.delete({ id: applicationId });

      // REGISTRAR EN HISTORIAL
      await staffingService.addHistory(String(requestId), `Candidato removido: ${current?.candidate_name}`, userName);

      await fetchCandidates();
    } catch (error) {
      console.error('Error deleting candidate in AWS:', error);
    }
  };

  return { candidates, loading, addCandidate, updateCandidateStatus, deleteCandidate };
};
