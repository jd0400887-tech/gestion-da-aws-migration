import { useState, useEffect, Fragment, useMemo, useCallback } from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Toolbar, FormControl, InputLabel, Select, MenuItem, Chip, TextField, IconButton, Grid, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Button, ListSubheader, CircularProgress, Snackbar, Alert } from '@mui/material';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import UndoIcon from '@mui/icons-material/Undo';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PeopleIcon from '@mui/icons-material/People';
import FilterListIcon from '@mui/icons-material/FilterList';
import { getWeek, subWeeks } from 'date-fns';
import { useEmployees } from '../hooks/useEmployees';
import { useHotels } from '../hooks/useHotels';
import type { Employee } from '../types';
import EmptyState from '../components/EmptyState';
import StatCard from '../components/dashboard/StatCard';
import { usePayrollHistory } from '../hooks/usePayrollHistory';
import { useTrendData } from '../hooks/useTrendData';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';
import { ComplianceReviewModal } from '../components/payroll/ComplianceReviewModal';
import { NotApplicableModal } from '../components/payroll/NotApplicableModal';

export default function PayrollReviewPage() {
  const { employees, updateEmployee } = useEmployees();
  const { hotelTrend, payrollTrend } = useTrendData();
  const { hotels } = useHotels();
  const [selectedHotel, setSelectedHotel] = useState<string>('all');
  const [nameFilter, setNameFilter] = useState<string>('');
  const [overtimeNotes, setOvertimeNotes] = useState<{[key: string]: string}>({});
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmployeeToReview, setSelectedEmployeeToReview] = useState<Employee | null>(null);
  const [currentEmployeeComplianceStatus, setCurrentEmployeeComplianceStatus] = useState<string>('incumplimiento_total');
  const [currentEmployeeComplianceReason, setCurrentEmployeeComplianceReason] = useState<string | null>(null);

  const [notApplicableModalOpen, setNotApplicableModalOpen] = useState(false);
  const [selectedEmployeeForNA, setSelectedEmployeeForNA] = useState<Employee | null>(null);

  const { startOfThisWeek, endOfThisWeek, startOfWeekTimestamp } = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfThisWeek = new Date(today);
    startOfThisWeek.setDate(today.getDate() - dayOfWeek);
    startOfThisWeek.setHours(0, 0, 0, 0);
    return { startOfThisWeek, endOfThisWeek: new Date(startOfThisWeek.getTime() + 7 * 86400000), startOfWeekTimestamp: startOfThisWeek.getTime() };
  }, []);

  const { history: payrollHistory, refreshHistory } = usePayrollHistory(startOfThisWeek, endOfThisWeek);
  
  const fetchEmployeeCompliance = useCallback(async (employeeId: string) => {
    try {
      const client = generateClient<Schema>();
      const { data } = await client.models.PayrollReview.list();
      const current = data.find(r => r.employee_id === employeeId);
      return current || { compliance_status: 'incumplimiento_total', reason: null };
    } catch (error) {
      console.error('Error fetching compliance from AWS:', error);
      return { compliance_status: 'incumplimiento_total', reason: null };
    }
  }, []);

  useEffect(() => {
    const initialOvertime: {[key: string]: string} = {};
    employees.forEach(emp => {
      const review = payrollHistory.find(h => h.employee_id === emp.id);
      if (review && review.overtime_hours) {
        initialOvertime[emp.id] = String(review.overtime_hours);
      }
    });
    setOvertimeNotes(initialOvertime);
  }, [employees, payrollHistory]);

  const handleOpenModal = useCallback(async (employee: Employee) => {
    const compliance = await fetchEmployeeCompliance(employee.id);
    setSelectedEmployeeToReview(employee);
    setCurrentEmployeeComplianceStatus(compliance.compliance_status || 'incumplimiento_total');
    setCurrentEmployeeComplianceReason(compliance.reason || null);
    setModalOpen(true);
  }, [fetchEmployeeCompliance]);

  const handleSaveCompliance = async (employeeId: string, status: string, reason: string | null) => {
    try {
      const client = generateClient<Schema>();
      const overtimeValue = overtimeNotes[employeeId];
      const overtime = overtimeValue ? parseFloat(overtimeValue) : 0;
      
      await client.models.PayrollReview.create({
        employee_id: employeeId,
        review_date: new Date().toISOString(),
        overtime_hours: overtime,
        compliance_status: status,
        week_of_year: getWeek(new Date()),
        year: new Date().getFullYear()
      });

      await updateEmployee({ id: employeeId, lastReviewedTimestamp: new Date().toISOString() });
      refreshHistory();
      setModalOpen(false);
    } catch (error) {
      console.error('Error saving to AWS RDS:', error);
    }
  };

  const handleUnmarkAsReviewed = async (employeeId: string) => {
    try {
      const client = generateClient<Schema>();
      const { data } = await client.models.PayrollReview.list();
      const toDelete = data.find(r => r.employee_id === employeeId);
      if (toDelete) {
        await client.models.PayrollReview.delete({ id: toDelete.id });
      }
      await updateEmployee({ id: employeeId, lastReviewedTimestamp: null });
      refreshHistory();
    } catch (error) {
      console.error('Error unmarking in AWS:', error);
    }
  };

  const allWorkrecordEmployees = useMemo(() => 
    employees.filter(emp => emp.payrollType === 'Workrecord' && emp.isActive), 
    [employees]
  );

  const employeesNeedingReview = useMemo(() => 
    allWorkrecordEmployees.filter(emp => !emp.lastReviewedTimestamp || new Date(emp.lastReviewedTimestamp).getTime() < startOfWeekTimestamp),
    [allWorkrecordEmployees, startOfWeekTimestamp]
  );

  const workrecordEmployeesFiltered = useMemo(() => {
    return allWorkrecordEmployees
      .filter(emp => selectedHotel === 'all' || emp.hotelId === selectedHotel)
      .filter(emp => emp.name.toLowerCase().includes(nameFilter.toLowerCase()))
      .map(emp => ({ ...emp, needsReview: !emp.lastReviewedTimestamp || new Date(emp.lastReviewedTimestamp).getTime() < startOfWeekTimestamp }))
      .sort((a, b) => a.needsReview === b.needsReview ? a.name.localeCompare(b.name) : (a.needsReview ? -1 : 1));
  }, [allWorkrecordEmployees, selectedHotel, nameFilter, startOfWeekTimestamp]);

  const hotelStats = useMemo(() => 
    hotels.map(hotel => {
      const hotelEmployees = allWorkrecordEmployees.filter(emp => emp.hotelId === hotel.id);
      if (hotelEmployees.length === 0) return null;
      const reviewed = hotelEmployees.filter(emp => emp.lastReviewedTimestamp && new Date(emp.lastReviewedTimestamp).getTime() >= startOfWeekTimestamp).length;
      return { id: hotel.id, name: hotel.name, total: hotelEmployees.length, reviewed, progress: (reviewed / hotelEmployees.length) * 100 };
    }).filter(Boolean),
    [hotels, allWorkrecordEmployees, startOfWeekTimestamp]
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>Revisión de Nómina (AWS Cloud)</Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}><StatCard title="Hoteles Pendientes" value={new Set(employeesNeedingReview.map(e => e.hotelId)).size} icon={<ApartmentIcon />} /></Grid>
        <Grid item xs={12} md={4}><StatCard title="Nóminas Pendientes" value={employeesNeedingReview.length} icon={<PeopleIcon />} /></Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Progreso AWS</Typography>
            <CircularProgress variant="determinate" value={( (allWorkrecordEmployees.length - employeesNeedingReview.length) / (allWorkrecordEmployees.length || 1)) * 100} size={60} />
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField fullWidth label="Buscar empleado..." value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} />
      </Paper>

      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead><TableRow><TableCell>Hotel</TableCell><TableCell align="center">Progreso</TableCell><TableCell align="right">Estado</TableCell><TableCell align="center">Acción</TableCell></TableRow></TableHead>
          <TableBody>
            {hotelStats.map(stat => stat && (
              <TableRow key={stat.id} hover>
                <TableCell>{stat.name}</TableCell>
                <TableCell align="center"><CircularProgress variant="determinate" value={stat.progress} size={30} /></TableCell>
                <TableCell align="right">{`${stat.reviewed} / ${stat.total}`}</TableCell>
                <TableCell align="center"><IconButton onClick={() => setSelectedHotel(stat.id)}><FilterListIcon /></IconButton></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Paper>
        <List>
          {workrecordEmployeesFiltered.map((emp) => (
            <ListItem key={emp.id} divider sx={{ bgcolor: emp.needsReview ? 'rgba(255, 152, 0, 0.05)' : 'transparent' }}>
              <ListItemText 
                primary={<Box sx={{ display: 'flex', alignItems: 'center' }}>{emp.name} {emp.needsReview && <Chip label="Pendiente" size="small" color="warning" sx={{ ml: 1 }} />}</Box>}
                secondary={`Rol: ${emp.role} | Última: ${emp.lastReviewedTimestamp ? new Date(emp.lastReviewedTimestamp).toLocaleDateString() : 'Nunca'}`}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="Extra" size="small" sx={{ width: 80 }} value={overtimeNotes[emp.id] || ''} onChange={(e) => setOvertimeNotes({...overtimeNotes, [emp.id]: e.target.value})} />
                {emp.needsReview ? (
                  <Button variant="contained" size="small" onClick={() => handleOpenModal(emp)}>Revisar</Button>
                ) : (
                  <IconButton color="secondary" onClick={() => handleUnmarkAsReviewed(emp.id)}><UndoIcon /></IconButton>
                )}
              </Box>
            </ListItem>
          ))}
        </List>
      </Paper>

      {selectedEmployeeToReview && (
        <ComplianceReviewModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          employeeId={selectedEmployeeToReview.id}
          employeeName={selectedEmployeeToReview.name}
          initialComplianceStatus={currentEmployeeComplianceStatus}
          onSave={handleSaveCompliance}
        />
      )}
    </Box>
  );
}
