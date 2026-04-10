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
      
      // 1. Solo traemos las aplicaciones de ESTA solicitud
      const { data: apps } = await client.models.Application.list({
        filter: { request_id: { eq: requestId } }
      });

      // 2. Para cada aplicación, buscamos el perfil (Empleado o Candidato) en paralelo
      // Esto es mucho más rápido que bajar toda la base de datos
      const mapped = await Promise.all(apps.map(async (app) => {
        const candidateId = app.candidate_id || '';
        
        // Intentamos buscar en Empleados primero (más común)
        const { data: emp } = await client.models.Employee.get({ id: candidateId });
        
        if (emp) {
          return {
            id: app.id as any,
            request_id: requestId as any,
            candidate_name: emp.name,
            status: (app.status as any) || 'Asignado',
            created_at: app.applied_at,
            existing_employee_id: emp.id
          };
        }

        // Si no es empleado, buscamos en la tabla de candidatos externos
        const { data: cand } = await client.models.Candidate.get({ id: candidateId });

        return {
          id: app.id as any,
          request_id: requestId as any,
          candidate_name: cand?.name || 'Candidato Desconocido',
          status: (app.status as any) || 'Asignado',
          created_at: app.applied_at,
          existing_employee_id: null
        };
      }));

      setCandidates(mapped);
    } catch (error) {
      console.error('Error fetching candidates from AWS:', error);
    }
    setLoading(false);
  }, [requestId]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  /**
   * AÑADIR CANDIDATO CON REGLAS DE NEGOCIO SENIOR
   */
  const addCandidate = async (newCandidate: Omit<RequestCandidate, 'id' | 'status'>, requestType: 'permanente' | 'temporal' = 'temporal') => {
    try {
      const client = generateClient<Schema>();
      let candidateId = newCandidate.existing_employee_id;
      let nameForLog = newCandidate.candidate_name;

      // VALIDACIÓN DE REGLAS DE NEGOCIO (MANDATOS MAESTROS)
      if (candidateId) {
        const { data: emp } = await client.models.Employee.get({ id: candidateId });
        
        if (emp) {
          // 1. REGLA DE EXCLUSIVIDAD DE PLAZA FIJA
          if (emp.employee_type === 'permanente' && requestType === 'permanente') {
            throw new Error(`RESTRICCIÓN: ${emp.name} ya cuenta con contrato Permanente. No puede ser asignado a otra vacante de plaza fija.`);
          }
          
          // 2. BLOQUEO POR LISTA NEGRA (Seguridad extra)
          if (emp.is_blacklisted) {
            throw new Error(`BLOQUEO DE SEGURIDAD: ${emp.name} se encuentra en Lista Negra y no puede ser asignado.`);
          }

          nameForLog = emp.name;
        }
      }

      // Si no existe el ID, creamos un candidato externo (Prospecto)
      if (!candidateId) {
        const { data: cand } = await client.models.Candidate.create({
          name: newCandidate.candidate_name || 'Nuevo Candidato',
          role: 'Externo',
          status: 'Activo'
        });
        candidateId = cand?.id || '';
      }

      await client.models.Application.create({
        candidate_id: candidateId,
        request_id: String(requestId),
        status: 'Asignado',
        applied_at: new Date().toISOString()
      });

      // REGISTRAR EN HISTORIAL CON ETIQUETA DE REFUERZO SI APLICA
      const isCover = candidateId && requestType === 'temporal';
      const logMessage = isCover 
        ? `Candidato asignado como REFUERZO (COVER): ${nameForLog}`
        : `Candidato asignado: ${nameForLog}`;

      await staffingService.addHistory(String(requestId), logMessage, userName);

      await fetchCandidates();
    } catch (error: any) {
      console.error('Error en validación de negocio:', error.message);
      throw error; // Re-lanzamos para que la UI lo capture
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

