import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Typography, Button, Stack, ToggleButtonGroup, ToggleButton, Paper, useTheme } from '@mui/material';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import SearchIcon from '@mui/icons-material/Search';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import PeopleIcon from '@mui/icons-material/People';
import AddIcon from '@mui/icons-material/Add';

import { useEmployees } from '../hooks/useEmployees';
import { useHotels } from '../hooks/useHotels';
import { useAuth } from '../hooks/useAuth';
import type { Employee } from '../types';
import FormModal from '../components/form/FormModal';
import EmployeeForm from '../components/employees/EmployeeForm';
import EmptyState from '../components/EmptyState';
import ConfirmationDialog from '../components/common/ConfirmationDialog';
import { exportEmployeesToExcel } from '../utils/exportUtils';
import EmployeeFilters from '../components/employees/EmployeeFilters';
import EmployeeGrid from '../components/employees/EmployeeGrid';
import EmployeeTable from '../components/employees/EmployeeTable';
import BulkImportButton from '../components/common/BulkImportButton';

export default function EmployeesPage() {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const { employees, addEmployee, updateEmployee, deleteEmployee, toggleEmployeeBlacklist, roles, handleBulkImport } = useEmployees();
  const { hotels } = useHotels();
  const { profile } = useAuth();
  
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  
  const isAdmin = profile?.role === 'ADMIN';
  const isInspector = profile?.role === 'INSPECTOR';
  const initialZone = isInspector 
    ? (profile?.assigned_zone || 'Centro') 
    : 'all';
    
  const [zoneFilter, setZoneFilter] = useState(initialZone);
  const [hotelFilter, setHotelFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid'); 

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Partial<Employee>>({});

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (isInspector) {
      setZoneFilter(profile?.assigned_zone || 'Centro');
    }
  }, [profile, isInspector]);

  const filteredEmployees = useMemo(() => {
    const documentationFilter = searchParams.get('documentation');

    return employees.filter(employee => {
      if (documentationFilter === 'incomplete' && employee.documentacion_completa) return false;
      if (statusFilter === 'active' && (!employee.isActive || employee.isBlacklisted)) return false;
      if (statusFilter === 'inactive' && (employee.isActive || employee.isBlacklisted)) return false;
      if (statusFilter === 'blacklisted' && !employee.isBlacklisted) return false;
      if (!employee.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      
      // RESTRICCIÓN ESTRICTA PARA INSPECTORES
      if (isInspector) {
        const hotel = hotels.find(h => h.id === employee.hotelId);
        const userZone = profile?.assigned_zone || 'Centro';
        if (hotel?.zone !== userZone) return false;
      } 
      // FILTRO OPCIONAL PARA OTROS ROLES (ADMIN, COORDINATOR, RECRUITER)
      else if (zoneFilter !== 'all') {
        const hotel = hotels.find(h => h.id === employee.hotelId);
        if (hotel?.zone !== zoneFilter) return false;
      }

      if (hotelFilter && employee.hotelId !== hotelFilter) return false;

      return true;
    });
  }, [employees, statusFilter, searchQuery, hotelFilter, searchParams, zoneFilter, hotels, isInspector, profile]);

  const handleOpenAddModal = () => {
    setCurrentEmployee({ isActive: true, isBlacklisted: false, payrollType: 'timesheet', employeeType: 'permanente' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (employee: Employee) => {
    setCurrentEmployee(employee);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentEmployee({});
  };

  const handleFormChange = (field: keyof Employee, value: any) => {
    setCurrentEmployee(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (currentEmployee.id) {
      updateEmployee(currentEmployee);
    } else {
      addEmployee(currentEmployee);
    }
    handleCloseModal();
  };

  const handleDeleteRequest = (id: string) => {
    setEmployeeToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (employeeToDelete) {
      deleteEmployee(employeeToDelete);
    }
    setIsConfirmOpen(false);
    setEmployeeToDelete(null);
  };

  const handleToggleBlacklist = () => {
    if (!currentEmployee.id) return;
    toggleEmployeeBlacklist(currentEmployee.id);
    handleCloseModal();
  };

  const handleViewChange = (_event: React.MouseEvent<HTMLElement>, nextView: string | null) => {
    if (nextView !== null) {
      setViewMode(nextView);
    }
  };

  return (
    <Box component="main" sx={{ p: 2 }}>
      {/* ENCABEZADO PROFESIONAL */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, mb: 3, borderRadius: 3, 
          background: 'linear-gradient(135deg, rgba(255, 87, 34, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
          border: '1px solid rgba(255, 87, 34, 0.1)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ backgroundColor: 'primary.main', p: 1, borderRadius: 2, display: 'flex', boxShadow: '0 4px 12px rgba(255, 87, 34, 0.3)' }}>
            <PeopleIcon sx={{ color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-0.5px' }}>Personal</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Gestión de Capital Humano - AWS Cloud</Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<SaveAltIcon />} onClick={() => exportEmployeesToExcel(filteredEmployees, hotels)} sx={{ borderRadius: 2, fontWeight: 'bold' }}>
            Exportar Excel
          </Button>
          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAddModal}
              sx={{
                borderRadius: 2, px: 3, fontWeight: 'bold',
                background: 'linear-gradient(45deg, #FF5722 30%, #FF8A65 90%)',
                boxShadow: '0 4px 14px rgba(255, 87, 34, 0.4)',
              }}
            >
              Nuevo Empleado
            </Button>
          )}
          <BulkImportButton onImport={handleBulkImport} />
        </Stack>
      </Paper>

      <EmployeeFilters 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        hotels={hotels}
        zoneFilter={zoneFilter}
        onZoneChange={(val) => {
          setZoneFilter(val);
          setHotelFilter('');
        }}
        hotelFilter={hotelFilter}
        onHotelChange={setHotelFilter}
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <ToggleButtonGroup value={viewMode} exclusive onChange={handleViewChange} size="small">
          <ToggleButton value="grid" aria-label="grid view"><ViewModuleIcon fontSize="small" /></ToggleButton>
          <ToggleButton value="table" aria-label="table view"><ViewListIcon fontSize="small" /></ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {filteredEmployees.length > 0 ? (
        viewMode === 'grid' ? (
          <EmployeeGrid employees={filteredEmployees} hotels={hotels} onEdit={handleOpenEditModal} onDelete={handleDeleteRequest} />
        ) : (
          <EmployeeTable employees={filteredEmployees} hotels={hotels} onEdit={handleOpenEditModal} onDelete={handleDeleteRequest} />
        )
      ) : (
        <Paper sx={{ mt: 2, borderRadius: 4 }}>
          <EmptyState icon={<SearchIcon />} title="No se encontraron empleados" subtitle="Intenta cambiar los filtros o el término de búsqueda." />
        </Paper>
      )}

      <FormModal open={isModalOpen} onClose={handleCloseModal} onSave={handleSave} title={currentEmployee.id ? "Editar Empleado" : "Añadir Nuevo Empleado"}>
        <EmployeeForm employeeData={currentEmployee} onFormChange={handleFormChange} hotels={hotels} roles={roles} onToggleBlacklist={handleToggleBlacklist} />
      </FormModal>

      <ConfirmationDialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Eliminación"
        content="¿Estás seguro de que quieres eliminar este empleado? Esta acción no se puede deshacer."
      />
    </Box>
  );
}
