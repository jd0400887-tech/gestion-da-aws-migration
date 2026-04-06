import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from './useAuth';
import { staffingService } from '../services/staffingService';
import type { StaffingRequest } from '../types';

export const useStaffingRequests = () => {
  const { session } = useAuth();
  const [allRequests, setAllRequests] = useState<StaffingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await staffingService.getAll();
      setAllRequests(data);
    } catch (error) {
      console.error('Error fetching staffing requests:', error);
      setAllRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();

    // Suscripción Realtime optimizada
    const channel = supabase
      .channel('staffing_db_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'staffing_requests' },
        () => fetchRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRequests]);

  const activeRequests = useMemo(() => allRequests.filter(r => !r.is_archived), [allRequests]);
  const archivedRequests = useMemo(() => allRequests.filter(r => r.is_archived), [allRequests]);

  const addRequest = async (request: Omit<StaffingRequest, 'id' | 'created_at' | 'hotelName' | 'is_archived'>) => {
    await staffingService.create(request);
    await fetchRequests();
  };

  const updateRequest = async (id: number, updates: Partial<StaffingRequest>) => {
    await staffingService.update(id, updates, session?.user?.email);
    await fetchRequests();
  };

  const deleteRequest = async (id: number) => {
    await staffingService.delete(id);
    await fetchRequests();
  };

  const archiveRequest = async (id: number) => {
    // Optimistic Update
    setAllRequests(prev => prev.map(r => r.id === id ? { ...r, is_archived: true } : r));
    try {
      await staffingService.setArchived(id, true);
    } catch (error) {
      await fetchRequests(); // Rollback en caso de error
      throw error;
    }
  };

  const unarchiveRequest = async (id: number) => {
    setAllRequests(prev => prev.map(r => r.id === id ? { ...r, is_archived: false } : r));
    try {
      await staffingService.setArchived(id, false);
    } catch (error) {
      await fetchRequests();
      throw error;
    }
  };

  const fetchHistory = useCallback(async (requestId: number) => {
    return staffingService.getHistory(requestId);
  }, []);

  return { 
    allRequests, 
    activeRequests, 
    archivedRequests, 
    loading, 
    addRequest, 
    updateRequest, 
    deleteRequest, 
    archiveRequest, 
    unarchiveRequest, 
    fetchHistory,
    fetchRequests
  };
};