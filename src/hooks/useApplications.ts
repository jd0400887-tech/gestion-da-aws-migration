import { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';

export interface Application {
  id: string;
  candidate_name: string;
  phone: string;
  email?: string;
  hotel_id: string;
  role: string;
  status: 'pendiente' | 'completada' | 'empleado_creado';
  applied_at?: string;
  notes?: string;
}

export const useApplications = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const client = generateClient<Schema>();
      const { data: apps } = await client.models.Application.list();
      
      setApplications(apps.map(app => ({
        id: app.id,
        candidate_name: app.candidate_name,
        phone: app.phone,
        email: app.email || undefined,
        hotel_id: app.hotel_id,
        role: app.role,
        status: (app.status as any) || 'pendiente',
        applied_at: app.applied_at || undefined,
        notes: app.notes || undefined
      })));
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

  const addApplication = async (applicationData: Partial<Application>) => {
    try {
      const client = generateClient<Schema>();
      
      await client.models.Application.create({
        candidate_name: applicationData.candidate_name || 'N/A',
        phone: applicationData.phone || 'N/A',
        email: applicationData.email,
        hotel_id: applicationData.hotel_id || '',
        role: applicationData.role || '',
        status: 'pendiente',
        applied_at: new Date().toISOString(),
        notes: applicationData.notes
      });

      await fetchApplications();
    } catch (error) {
      console.error('Error adding application to AWS:', error);
      throw error;
    }
  };

  return { applications, loading, fetchApplications, updateApplicationStatus, deleteApplication, addApplication };
};
