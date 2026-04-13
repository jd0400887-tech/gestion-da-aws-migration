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
      const mapped = await Promise.all(apps.map(async (app) => {
        const candidateId = app.candidate_id || '';
        
        const { data: emp } = await client.models.Employee.get({ id: candidateId });
        if (emp) {
          return {
            id: app.id as any,
            request_id: requestId as any,
            candidate_name: emp.name,
            phone: emp.phone,
            status: (app.status as any) || 'Asignado',
            created_at: app.applied_at,
            existing_employee_id: emp.id
          };
        }

        const { data: cand } = await client.models.Candidate.get({ id: candidateId });
        return {
          id: app.id as any,
          request_id: requestId as any,
          candidate_name: cand?.name || 'Candidato Desconocido',
          phone: cand?.phone,
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
  const addCandidate = async (newCandidate: Omit<RequestCandidate, 'id' | 'status'>, requestType: 'permanente' | 'temporal' = 'temporal', hotelId?: string, role?: string) => {
    try {
      setLoading(true);
      const client = generateClient<Schema>();
      let candidateId = newCandidate.existing_employee_id;
      let nameForLog = newCandidate.candidate_name;

      // 1. Validaciones de Negocio para Empleados Existentes
      if (candidateId) {
        const { data: emp } = await client.models.Employee.get({ id: candidateId });
        if (emp) {
          if (emp.employee_type === 'permanente' && requestType === 'permanente') {
            throw new Error(`RESTRICCIÓN: ${emp.name} ya cuenta con contrato Permanente. No puede ser asignado a otra vacante de plaza fija.`);
          }
          if (emp.is_blacklisted) {
            throw new Error(`BLOQUEO DE SEGURIDAD: ${emp.name} se encuentra en Lista Negra y no puede ser asignado.`);
          }
          nameForLog = emp.name;
        }
      }

      // 2. Crear Perfil de Candidato si es Externo
      if (!candidateId) {
        const { data: cand, errors: candErrors } = await client.models.Candidate.create({
          name: newCandidate.candidate_name || 'Nuevo Candidato',
          phone: newCandidate.phone || 'N/A',
          role: 'Externo',
          status: 'Activo'
        });
        
        if (candErrors || !cand) {
          throw new Error("Error al crear el perfil del candidato externo.");
        }
        candidateId = cand.id;
      }

      // 3. Vincular Candidato con la Solicitud (Crear Aplicación)
      const { errors: appErrors } = await client.models.Application.create({
        candidate_id: candidateId,
        request_id: String(requestId),
        hotel_id: hotelId || '', 
        candidate_name: nameForLog, // GUARDAR NOMBRE PARA EL MÓDULO DE APLICACIONES
        phone: newCandidate.phone || 'N/A', // GUARDAR TELÉFONO
        role: role || 'Sin cargo', 
        status: 'Asignado',
        applied_at: new Date().toISOString()
      });

      if (appErrors) {
        console.error('AWS Application Error:', appErrors);
        throw new Error("AWS rechazó la vinculación del candidato.");
      }

      // 4. Registrar Historial
      const isCover = candidateId && requestType === 'temporal';
      const logMessage = isCover 
        ? `Candidato asignado como REFUERZO (COVER): ${nameForLog}`
        : `Candidato asignado: ${nameForLog}`;

      await staffingService.addHistory(String(requestId), logMessage, userName);
      
      // 5. Forzar refresco inmediato
      await fetchCandidates();
      
      console.info('✅ Candidato vinculado y lista actualizada.');
    } catch (error: any) {
      console.error('❌ Error en addCandidate:', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateCandidateStatus = async (applicationId: string, newStatus: string) => {
    try {
      const client = generateClient<Schema>();
      const current = candidates.find(c => String(c.id) === applicationId);
      
      // Mapeo lógico: Si en la solicitud marcan 'Llegó', 
      // para el módulo de aplicaciones es un estado 'pendiente' de validación.
      let apiStatus = newStatus;
      if (newStatus === 'Llegó') apiStatus = 'pendiente';

      const updateData: any = {
        id: applicationId,
        status: apiStatus
      };

      // Si marcamos como llegó, aprovechamos para sincronizar nombre y teléfono si faltaban
      if (apiStatus === 'pendiente' && current) {
        updateData.candidate_name = current.candidate_name;
        updateData.phone = current.phone;
      }

      await client.models.Application.update(updateData);

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

