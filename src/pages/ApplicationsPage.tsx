import { useState, useMemo } from 'react';
import { 
  Box, Typography, Paper, Button, Snackbar, Alert, Grid, TextField, 
  InputAdornment, Select, MenuItem, FormControl, InputLabel, Chip, 
  IconButton, Dialog, DialogActions, DialogContent, DialogContentText, 
  DialogTitle, Stack, Avatar, Divider, Tooltip, CircularProgress, useTheme,
  FormControlLabel, Switch, Card, CardContent, Badge
} from '@mui/material';

// Iconos
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import ApartmentIcon from '@mui/icons-material/Apartment';
import CategoryIcon from '@mui/icons-material/Category';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HistoryIcon from '@mui/icons-material/History';

import { useApplications, Application } from '../hooks/useApplications';
import { useHotels } from '../hooks/useHotels';
import { useAuth } from '../hooks/useAuth';
import { usePositions } from '../hooks/usePositions';
import EmployeeForm from '../components/employees/EmployeeForm';
import FormModal from '../components/form/FormModal';
import { useEmployees } from '../hooks/useEmployees';
import ApplicationForm from '../components/applications/ApplicationForm';
import { EMPLOYEE_POSITIONS } from '../data/constants';
import { toTitleCase } from '../utils/stringUtils';

// Iconos extra
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneIcon from '@mui/icons-material/Phone';

const statusConfig: { [key in Application['status']]: { label: string, color: any, icon: any } } = {
  'pendiente': { label: 'Por Validar', color: 'warning', icon: <PendingActionsIcon fontSize="small" /> },
  'completada': { label: 'Validado (Listo para Alta)', color: 'info', icon: <CheckCircleIcon fontSize="small" /> },
  'empleado_creado': { label: 'Contratado', color: 'success', icon: <AssignmentIndIcon fontSize="small" /> },
};

const ApplicationCard = ({ application, onStatusChange, onAddEmployee, onDelete, getHotelName }: any) => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const config = statusConfig[application.status as Application['status']] || { label: application.status, color: 'default', icon: null };

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  return (
    <Card sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      borderRadius: 4,
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      backgroundColor: isLight ? '#FFFFFF' : 'rgba(15, 23, 42, 0.6)',
      border: '1px solid rgba(255,255,255,0.05)',
      '&:hover': {
        transform: 'translateY(-8px)',
        boxShadow: `0 15px 35px rgba(0,0,0,0.4)`,
        borderColor: 'primary.main',
      }
    }}>
      <CardContent sx={{ p: 3, pt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Badge 
              overlap="circular" 
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              variant="dot"
              sx={{ '& .MuiBadge-badge': { bgcolor: application.status === 'empleado_creado' ? '#4caf50' : '#ff9800', boxShadow: '0 0 0 2px #0F172A' } }}
            >
              <Avatar 
                sx={{ 
                  background: 'linear-gradient(135deg, #FF5722 0%, #FF8A65 100%)', 
                  width: 56, height: 56, 
                  fontWeight: 900,
                  fontSize: '1.4rem',
                  boxShadow: '0 4px 12px rgba(255, 87, 34, 0.4)'
                }}
              >
                {application.candidate_name ? application.candidate_name[0] : '?'}
              </Avatar>
            </Badge>
            <Box>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 900, 
                  color: '#94A3B8', // Gris Platino Premium
                  textTransform: 'uppercase',
                  letterSpacing: '-0.5px',
                  lineHeight: 1.1,
                  mb: 0.5,
                  transition: 'all 0.3s ease'
                }}
              >
                {application.candidate_name}
              </Typography>
              <Chip 
                label={config.label.toUpperCase()}
                size="small"
                sx={{ 
                  height: 18, fontSize: '0.55rem', fontWeight: 900, 
                  bgcolor: 'rgba(255,255,255,0.05)', 
                  color: theme.palette[config.color as 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'].main,
                  borderRadius: 1
                }}
              />
            </Box>
          </Box>
          <IconButton size="small" onClick={() => onDelete(application.id)} sx={{ color: 'rgba(255,255,255,0.1)', '&:hover': { color: 'error.main', bgcolor: 'rgba(244, 67, 54, 0.1)' } }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>

        <Stack spacing={2} sx={{ mb: 3 }}>
          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CategoryIcon sx={{ color: 'primary.main', fontSize: 18, opacity: 0.8 }} />
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', lineHeight: 1 }}>CARGO SOLICITADO:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: 'white' }}>{toTitleCase(application.role || 'N/A')}</Typography>
              </Box>
            </Stack>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1 }}>
            <ApartmentIcon sx={{ fontSize: 18, color: 'text.secondary', opacity: 0.6 }} />
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>{getHotelName(application.hotel_id)}</Typography>
          </Box>

          {application.phone && application.phone !== 'N/A' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1 }}>
              <PhoneIcon sx={{ fontSize: 18, color: '#4CAF50' }} />
              <Typography variant="body2" sx={{ fontWeight: 900, color: 'white' }}>{application.phone}</Typography>
              <IconButton size="small" onClick={() => handleWhatsApp(application.phone)} sx={{ color: '#25D366', p: 0, '&:hover': { bgcolor: 'rgba(37, 211, 102, 0.1)' } }}>
                <WhatsAppIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Stack>

        <Box sx={{ mt: 'auto' }}>
          {application.status === 'pendiente' && (
            <Button 
              variant="contained" 
              onClick={() => onStatusChange(application.id, 'completada')}
              fullWidth
              sx={{ 
                borderRadius: 2, 
                textTransform: 'none', 
                fontWeight: 900,
                py: 1,
                background: 'linear-gradient(45deg, #FF5722 30%, #FF8A65 90%)',
                boxShadow: '0 4px 12px rgba(255, 87, 34, 0.3)'
              }}
            >
              Validar Candidato
            </Button>
          )}
          
          {application.status === 'completada' && (
            <Button 
              variant="contained" 
              fullWidth
              startIcon={<PersonAddIcon />}
              onClick={() => onAddEmployee(application)} 
              sx={{ 
                borderRadius: 2, fontWeight: 900,
                py: 1,
                textTransform: 'none',
                background: 'linear-gradient(45deg, #4CAF50 30%, #81C784 90%)',
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
              }}
            >
              Dar de Alta en Nómina
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default function ApplicationsPage() {
  const { applications, loading, updateApplicationStatus, deleteApplication, addApplication } = useApplications();
  const { hotels } = useHotels();
  const { profile } = useAuth();
  const { employees, addEmployee } = useEmployees();
  const { positions } = usePositions();

  const isInspector = profile?.role === 'INSPECTOR';
  const isAdmin = profile?.role === 'ADMIN';

  // Dynamic roles from DB or fallback
  const rolesList = useMemo(() => {
    if (positions && positions.length > 0) {
      // Normalizamos a TitleCase para que coincida con los valores pre-llenados
      return positions.map(p => toTitleCase(p.name));
    }
    return EMPLOYEE_POSITIONS;
  }, [positions]);

  // State for Modals and Snackbar
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [currentCandidate, setCurrentCandidate] = useState<Partial<Application> | null>(null);
  const [newEmployeeFormData, setNewEmployeeFormData] = useState<any>(null);
  const [newApplicationFormData, setNewApplicationFormData] = useState({ candidate_name: '', hotel_id: '', role: '' });
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean, id: number | null }>({ open: false, id: null });

  // State for Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [hotelFilter, setHotelFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreated, setShowCreated] = useState(false);

  // SEGURIDAD: Hoteles permitidos para este usuario
  const allowedHotels = useMemo(() => {
    if (isInspector) {
      const userZone = profile?.assigned_zone;
      if (!userZone) return [];
      return hotels.filter(h => h.zone === userZone);
    }
    return hotels;
  }, [hotels, isInspector, profile]);

  const handleStatusChange = async (id: number, newStatus: Application['status']) => {
    try {
      await updateApplicationStatus(id, newStatus);
      setSnackbar({ open: true, message: 'Estado actualizado correctamente', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al actualizar el estado', severity: 'error' });
    }
  };

  const handleConfirmDelete = async () => {
    if (confirmDelete.id) {
      try {
        await deleteApplication(confirmDelete.id);
        setSnackbar({ open: true, message: 'Aplicación eliminada', severity: 'success' });
      } catch (error) {
        setSnackbar({ open: true, message: 'Error al eliminar', severity: 'error' });
      }
    }
    setConfirmDelete({ open: false, id: null });
  };

  const handleOpenAddEmployeeModal = (application: Application) => {
    setCurrentCandidate(application);
    
    // BÚSQUEDA INTELIGENTE: Buscar el cargo oficial que coincida (sin importar mayúsculas/minúsculas)
    const rawRole = application.role || '';
    const officialRole = rolesList.find(r => r.toLowerCase() === rawRole.toLowerCase()) || '';

    setNewEmployeeFormData({
      name: toTitleCase(application.candidate_name || ''),
      phone: application.phone || '',
      hotelId: application.hotel_id || '', 
      role: officialRole, // CARGO OFICIAL ENCONTRADO
      isActive: true,
      isBlacklisted: false,
      payrollType: 'timesheet',
      employeeType: 'permanente',
      documentacion_completa: false,
    });
    setIsEmployeeModalOpen(true);
  };

  const handleCloseEmployeeModal = () => {
    setIsEmployeeModalOpen(false);
    setCurrentCandidate(null);
    setNewEmployeeFormData(null);
  };
  
  const handleOpenNewAppModal = () => {
    setNewApplicationFormData({ candidate_name: '', hotel_id: '', role: '' });
    setIsAppModalOpen(true);
  };

  const handleSaveApplication = async () => {
    try {
      await addApplication(newApplicationFormData);
      setSnackbar({ open: true, message: 'Aplicación creada correctamente', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al crear la aplicación', severity: 'error' });
    }
    setIsAppModalOpen(false);
  };

  const handleSaveEmployee = async () => {
    try {
      await addEmployee(newEmployeeFormData);
      if (currentCandidate?.id) {
        await updateApplicationStatus(currentCandidate.id, 'empleado_creado');
      }
      setSnackbar({ open: true, message: 'Empleado creado correctamente', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al crear el empleado', severity: 'error' });
    }
    setIsEmployeeModalOpen(false);
  };

  const getHotelName = (hotelId: string) => {
    return hotels.find(h => h.id === hotelId)?.name || 'Desconocido';
  };

  const filteredApplications = useMemo(() => {
    return applications
      .filter(app => {
        // SEGURIDAD: Solo ver aplicaciones de su zona
        if (isInspector) {
          const hotel = hotels.find(h => h.id === app.hotel_id);
          const userZone = profile?.assigned_zone;
          if (!userZone || hotel?.zone !== userZone) return false;
        }

        if (hotelFilter !== 'all' && app.hotel_id !== hotelFilter) return false;
        
        if (statusFilter === 'all') {
          return app.status !== 'empleado_creado' || showCreated;
        }
        return app.status === statusFilter;
      })
      .filter(app => {
        const name = app.candidate_name || 'Candidato sin nombre';
        return name.toLowerCase().includes(searchTerm.toLowerCase());
      });
  }, [applications, statusFilter, hotelFilter, searchTerm, showCreated, isInspector, profile, hotels]);

  const pendingApps = filteredApplications.filter(app => app.status === 'pendiente');
  const completedApps = filteredApplications.filter(app => app.status === 'completada' || app.status === 'empleado_creado');

  return (
    <Box component="main" sx={{ p: 2 }}>
      {/* ENCABEZADO MODERNO */}
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
            <PendingActionsIcon sx={{ color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-0.5px' }}>Aplicaciones</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
              Seguimiento de Candidatos en {isInspector ? `Zona ${profile?.assigned_zone}` : 'Todas las Zonas'}
            </Typography>
          </Box>
        </Box>

        {isAdmin && (
          <Button 
            variant="contained" startIcon={<AddIcon />} 
            onClick={handleOpenNewAppModal}
            sx={{ 
              borderRadius: 2, px: 3, fontWeight: 'bold',
              background: 'linear-gradient(45deg, #FF5722 30%, #FF8A65 90%)',
              boxShadow: '0 4px 14px rgba(255, 87, 34, 0.4)',
            }}
          >
            Nueva Aplicación (Admin)
          </Button>
        )}
      </Paper>

      {/* FILTROS PREMIUM */}
      <Paper elevation={0} sx={{ p: 2, mb: 4, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField 
              fullWidth placeholder="Buscar candidato..." variant="outlined" size="small" 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
              InputProps={{ 
                startAdornment: <InputAdornment position="start"><SearchIcon color="primary" fontSize="small" /></InputAdornment>,
                sx: { borderRadius: 2 }
              }} 
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select 
                value={statusFilter} label="Estado" onChange={(e) => setStatusFilter(e.target.value)}
                startAdornment={<InputAdornment position="start"><FilterListIcon color="primary" fontSize="small" /></InputAdornment>}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">Pendientes y Listas</MenuItem>
                <MenuItem value="pendiente">Solo Pendientes</MenuItem>
                <MenuItem value="completada">Listas para Alta</MenuItem>
                <MenuItem value="empleado_creado">Candidatos Contratados</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Hotel</InputLabel>
              <Select 
                value={hotelFilter} label="Hotel" onChange={(e) => setHotelFilter(e.target.value)}
                startAdornment={<InputAdornment position="start"><ApartmentIcon color="primary" fontSize="small" /></InputAdornment>}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">Todos los Hoteles</MenuItem>
                {allowedHotels.map(h => <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControlLabel
              control={<Switch checked={showCreated} onChange={(e) => setShowCreated(e.target.checked)} size="small" />}
              label={<Typography variant="caption" sx={{ fontWeight: 'bold' }}>VER CONTRATADOS</Typography>}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* LISTADO DE APLICACIONES */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 10 }}><CircularProgress /></Box>
      ) : (
        <Stack spacing={5}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: 'warning.main', display: 'flex', alignItems: 'center', gap: 1 }}>
              <PendingActionsIcon /> Pendientes ({pendingApps.length})
            </Typography>
            {pendingApps.length > 0 ? (
              <Grid container spacing={3}>
                {pendingApps.map(app => (
                  <Grid item key={app.id} xs={12} sm={6} md={4}>
                    <ApplicationCard application={app} onStatusChange={handleStatusChange} onAddEmployee={handleOpenAddEmployeeModal} onDelete={(id: any) => setConfirmDelete({ open: true, id })} getHotelName={getHotelName} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 3, opacity: 0.6 }}>
                <Typography variant="body2">No hay aplicaciones pendientes de revisión.</Typography>
              </Paper>
            )}
          </Box>

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: 'success.main', display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleIcon /> Listas y Contratadas ({completedApps.length})
            </Typography>
            {completedApps.length > 0 ? (
              <Grid container spacing={3}>
                {completedApps.map(app => (
                  <Grid item key={app.id} xs={12} sm={6} md={4}>
                    <ApplicationCard application={app} onStatusChange={handleStatusChange} onAddEmployee={handleOpenAddEmployeeModal} onDelete={(id: any) => setConfirmDelete({ open: true, id })} getHotelName={getHotelName} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 3, opacity: 0.6 }}>
                <Typography variant="body2">No hay aplicaciones completadas recientemente.</Typography>
              </Paper>
            )}
          </Box>
        </Stack>
      )}

      {/* MODALS */}
      <FormModal open={isAppModalOpen} onClose={() => setIsAppModalOpen(false)} onSave={handleSaveApplication} title="Nueva Aplicación de Candidato">
        <ApplicationForm formData={newApplicationFormData} onFormChange={(f, v) => setNewApplicationFormData(prev => ({ ...prev, [f]: v }))} hotels={allowedHotels} roles={rolesList} />
      </FormModal>

      <FormModal open={isEmployeeModalOpen} onClose={handleCloseEmployeeModal} onSave={handleSaveEmployee} title={`Alta de Empleado: ${currentCandidate?.candidate_name}`}>
        <EmployeeForm employeeData={newEmployeeFormData || {}} onFormChange={(f, v) => setNewEmployeeFormData((prev: any) => ({ ...prev, [f]: v }))} hotels={allowedHotels} roles={rolesList} onToggleBlacklist={() => {}} />
      </FormModal>

      <Snackbar open={!!snackbar} autoHideDuration={4000} onClose={() => setSnackbar(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }} sx={{ mt: 7 }}>
        <Alert severity={snackbar?.severity} variant="filled" sx={{ width: '100%' }}>{snackbar?.message}</Alert>
      </Snackbar>

      <Dialog open={confirmDelete.open} onClose={() => setConfirmDelete({ open: false, id: null })} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>¿Confirmar eliminación?</DialogTitle>
        <DialogContent><DialogContentText>Esta acción es permanente y eliminará el registro del candidato del sistema.</DialogContentText></DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setConfirmDelete({ open: false, id: null })} color="inherit">Cancelar</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error" sx={{ borderRadius: 2 }}>Eliminar permanentemente</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}