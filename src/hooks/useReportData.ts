import { useMemo, useState, useEffect } from 'react';
import { useEmployees } from './useEmployees';
import { useHotels } from './useHotels';
import { useAttendance } from './useAttendance';
import { useStaffingRequestsContext } from '../contexts/StaffingRequestsContext';
import { useApplications } from './useApplications';
import { differenceInDays, subDays, startOfWeek } from 'date-fns';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';

export interface EmployeeStatusChange {
  id: string;
  employee_id: string;
  change_date: string;
  old_is_active: boolean;
  new_is_active: boolean;
  reason: string | null;
}

const calculatePeriodStats = (
  allRecords: any[], 
  allEmployees: any[], 
  allHotels: any[], 
  allRequests: any[],
  allApplications: any[],
  periodPayrollHistory: any[],
  periodEmployeeStatusHistory: EmployeeStatusChange[],
  start: Date, 
  end: Date
) => {
  const startTime = start.getTime();
  const endTime = end.getTime();

  const permanentEmployees = allEmployees.filter(e => e.employeeType === 'permanente');

  const periodRecords = allRecords.filter(r => {
    const recordTime = new Date(r.timestamp).getTime();
    return recordTime >= startTime && recordTime <= endTime;
  });

  const hotelCityMap = new Map(allHotels.map(h => [h.id, h.city]));

  const visitsByHotel = periodRecords.reduce((acc, record) => {
    acc[record.hotelId] = (acc[record.hotelId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const hotelRanking = allHotels.map(hotel => ({
    id: hotel.id,
    name: hotel.name,
    visits: visitsByHotel[hotel.id] || 0,
  })).sort((a, b) => b.visits - a.visits);

  const newRequestsList = allRequests.filter(r => {
    const reqDate = new Date(r.created_at);
    return reqDate >= start && reqDate <= end;
  });

  return {
    visits: periodRecords.length,
    visitsList: periodRecords,
    newEmployees: 0,
    hotelRanking,
    newRequests: newRequestsList.length,
    newRequestsList,
    fulfillmentRate: 0,
    newApplications: allApplications.length
  };
};

export const useReportData = (startDate: string | null, endDate: string | null) => {
  const { employees, loading: employeesLoading } = useEmployees();
  const { hotels, loading: hotelsLoading } = useHotels();
  const { allRecords, loading: attendanceLoading } = useAttendance({ start: null, end: null });
  const { allRequests, loading: requestsLoading } = useStaffingRequestsContext();
  const { applications: allApplications, loading: applicationsLoading } = useApplications();

  const [payrollHistoryLoading, setPayrollHistoryLoading] = useState(false);
  const [employeeStatusHistoryLoading, setEmployeeStatusHistoryLoading] = useState(false);

  const loading = employeesLoading || hotelsLoading || attendanceLoading || requestsLoading || applicationsLoading;

  const reportData = useMemo(() => {
    if (loading || !startDate || !endDate) {
      return { currentPeriod: null, previousPeriod: null, activeEmployees: 0, totalHotels: 0 };
    }

    const currentStart = new Date(startDate);
    const currentEnd = new Date(endDate);

    const currentPeriodStats = calculatePeriodStats(
        allRecords, employees, hotels, allRequests, allApplications,
        [], [], currentStart, currentEnd
    );

    return {
      currentPeriod: currentPeriodStats,
      activeEmployees: employees.filter(e => e.isActive).length,
      totalHotels: hotels.length,
      employeesByHotel: hotels.map(h => ({ name: h.name, count: 0 })),
      activeEmployeesByRole: []
    };

  }, [loading, startDate, endDate, employees, hotels, allRecords, allRequests, allApplications]);

  return {
    data: reportData,
    loading,
    employees,
    hotels,
  };
};
