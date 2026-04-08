import { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';

export interface Application {
  id: string;
  created_at: string;
  candidate_id: string;
  request_id: string;
  status: 'pendiente' | 'completada' | 'empleado_creado';
  completed_at: string | null;
  candidate_name?: string;
  hotel_id?: string;
  role?: string;
}

export const useApplications = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const client = generateClient<Schema>();
      const { data: apps } = await client.models.Application.list();
      const { data: candidates } = await client.models.Candidate.list();
      const { data: requests } = await client.models.StaffingRequest.list();

      const formattedData = apps.map(app => {
        const candidate = candidates.find(c => c.id === app.candidate_id);
        const request = requests.find(r => r.id === app.request_id);
        
        return {
          id: app.id,
          created_at: app.applied_at,
          candidate_id: app.candidate_id,
          request_id: app.request_id,
          status: (app.status as any) || 'pendiente',
          completed_at: null,
          candidate_name: candidate?.name || 'N/A',
          hotel_id: request?.hotel_id || 'N/A',
          role: request?.role || 'N/A',
        };
      });

      setApplications(formattedData as Application[]);
    } catch (error) {
      console.error('Error fetching applications from AWS:', error);
      setApplications([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const updateApplicationStatus = async (id: string, status: 'pendiente' | 'completada' | 'empleado_creado') => {
    try {
      const client = generateClient<Schema>();
      await client.models.Application.update({
        id,
        status,
      });
      setApplications(prev => prev.map(app => app.id === id ? { ...app, status } : app));
    } catch (error) {
      console.error('Error updating application status in AWS:', error);
      throw error;
    }
  };

  const deleteApplication = async (id: string) => {
    try {
      const client = generateClient<Schema>();
      await client.models.Application.delete({ id });
      setApplications(prev => prev.filter(app => app.id !== id));
    } catch (error) {
      console.error('Error deleting application from AWS:', error);
      throw error;
    }
  };

  const addApplication = async (applicationData: { candidate_name: string; hotel_id: string; role: string }) => {
    try {
      const client = generateClient<Schema>();
      
      const { data: candidate } = await client.models.Candidate.create({
        name: applicationData.candidate_name,
        role: applicationData.role,
        status: 'Postulado'
      });

      if (!candidate) throw new Error("Error al crear candidato");

      const { data: request } = await client.models.StaffingRequest.create({
        request_number: `APP-${Date.now()}`,
        hotel_id: applicationData.hotel_id,
        role: applicationData.role,
        start_date: new Date().toISOString().split('T')[0],
        status: 'Pendiente'
      });

      if (!request) throw new Error("Error al crear solicitud");

      await client.models.Application.create({
        candidate_id: candidate.id,
        request_id: request.id,
        status: 'pendiente',
        applied_at: new Date().toISOString()
      });

      await fetchApplications();
    } catch (error) {
      console.error('Error adding application to AWS:', error);
      throw error;
    }
  };

  return { applications, loading, fetchApplications, updateApplicationStatus, deleteApplication, addApplication };
};
