import { useMemo } from 'react';
import { startOfWeek } from 'date-fns';

import { useHotels } from './useHotels';
import { useAttendance } from './useAttendance';
import { useStaffingRequestsContext } from '../contexts/StaffingRequestsContext';
import { useApplications } from './useApplications';

/**
 * HOOK DE ESTADÍSTICAS DEL DASHBOARD (AWS CLOUD)
 * Centraliza los contadores y KPIs principales.
 */
export function useDashboardStats(filter?: { hotelIds?: string[], zone?: string }) {
  const { hotels = [], employees = [], loading: hotelsLoading } = useHotels();
  const { allRecords: allAttendanceRecords = [] } = useAttendance({ start: null, end: null });
  const { allRequests: staffingRequests = [] } = useStaffingRequestsContext();
  const { applications = [] } = useApplications();

  const filterZone = filter?.zone;
  const filterHotelIds = filter?.hotelIds ? JSON.stringify(filter.hotelIds) : undefined;

  const stats = useMemo(() => {
    try {
      // 1. DETERMINAR HOTELES FILTRADOS
      let filteredHotels = Array.isArray(hotels) ? hotels : [];
      if (filter?.hotelIds && filter.hotelIds.length > 0) {
        filteredHotels = filteredHotels.filter(h => filter.hotelIds!.includes(h.id));
      } else if (filterZone && filterZone !== 'Todas') {
        filteredHotels = filteredHotels.filter(h => h.zone === filterZone);
      }

      const hasActiveFilter = (filter?.hotelIds && filter.hotelIds.length > 0) || (filterZone && filterZone !== 'Todas');
      const filteredHotelIdsSet = new Set(filteredHotels.map(h => h.id));

      // 2. FILTRAR EMPLEADOS
      const safeEmployees = Array.isArray(employees) ? employees : [];
      const filteredEmployees = hasActiveFilter
        ? safeEmployees.filter(e => filteredHotelIdsSet.has(e.hotelId))
        : safeEmployees;

      const activeEmployeesCount = filteredEmployees.filter(e => e.isActive).length;

      // 3. FILTRAR SOLICITUDES
      const safeRequests = Array.isArray(staffingRequests) ? staffingRequests : [];
      const filteredRequests = hasActiveFilter
        ? safeRequests.filter(req => filteredHotelIdsSet.has(req.hotel_id))
        : safeRequests;

      const unfulfilledRequests = filteredRequests.filter(req =>
        ['Pendiente', 'Enviada a Reclutamiento', 'En Proceso'].includes(req.status)
      );

      // 4. FILTRAR APLICACIONES
      const safeApplications = Array.isArray(applications) ? applications : [];
      const pendingApplicationsCount = safeApplications.filter(app => {
        if (app.status !== 'pendiente') return false;
        if (!hasActiveFilter) return true;
        return filteredHotelIdsSet.has(app.hotel_id || '');
      }).length;

      // 5. ASISTENCIA
      const startOfWeekTime = startOfWeek(new Date(), { weekStartsOn: 0 }).getTime();
      const safeAttendance = Array.isArray(allAttendanceRecords) ? allAttendanceRecords : [];
      const filteredAttendance = hasActiveFilter
        ? safeAttendance.filter(r => filteredHotelIdsSet.has(r.hotelId))
        : safeAttendance;

      const visitsThisWeek = filteredAttendance.filter(r => new Date(r.timestamp).getTime() >= startOfWeekTime).length;

      return {
        totalHotels: filteredHotels.length,
        activeEmployees: activeEmployeesCount,
        pendingApplications: pendingApplicationsCount,
        unfulfilledRequestsCount: unfulfilledRequests.length,
        unfulfilledRequests,
        visitsThisWeek,
        compliance72h: { onTime: 0, critical: 0, overdue: 0 },
        incompleteDocsCount: filteredEmployees.filter(e => !e.documentacion_completa).length,
      };
    } catch (error) {
      console.error("Error calculando estadísticas en local:", error);
      return {
        totalHotels: 0,
        activeEmployees: 0,
        pendingApplications: 0,
        unfulfilledRequestsCount: 0,
        unfulfilledRequests: [],
        visitsThisWeek: 0,
        compliance72h: { onTime: 0, critical: 0, overdue: 0 },
        incompleteDocsCount: 0,
      };
    }
  }, [employees, hotels, allAttendanceRecords, staffingRequests, applications, filterZone, filterHotelIds]);

  return { stats, loading: hotelsLoading };
}
