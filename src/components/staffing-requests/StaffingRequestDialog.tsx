import { useState, useEffect, useMemo } from 'react';
import { 
  Dialog, DialogContent, DialogActions, Button, TextField, Select, MenuItem, 
  FormControl, InputLabel, Grid, Tabs, Tab, Box, 
  Typography, Chip, Stack, Autocomplete, InputAdornment, Divider, Paper, IconButton,
  Avatar, Tooltip, CircularProgress, useTheme, Snackbar, Alert
} from '@mui/material';

// Iconos
import ApartmentIcon from '@mui/icons-material/Apartment';
import WorkIcon from '@mui/icons-material/Work';
import PeopleIcon from '@mui/icons-material/People';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import NotesIcon from '@mui/icons-material/Notes';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import CategoryIcon from '@mui/icons-material/Category';
import HistoryIcon from '@mui/icons-material/History';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import PublicIcon from '@mui/icons-material/Public';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

import { useHotels } from '../../hooks/useHotels';
import { useEmployees } from '../../hooks/useEmployees';
import { useStaffingRequestsContext } from '../../contexts/StaffingRequestsContext';
import { useRequestCandidates } from '../../hooks/useRequestCandidates';
import { useAuth } from '../../hooks/useAuth';
import type { StaffingRequest, StaffingRequestHistory, RequestCandidate } from '../../types';
import { getInitials } from '../../utils/stringUtils';

// Lista de países para el selector premium
const countries = [
  { code: 'US', label: 'United States', phone: '1', flag: '🇺🇸' },
  { code: 'MX', label: 'México', phone: '52', flag: '🇲🇽' },
  { code: 'GT', label: 'Guatemala', phone: '502', flag: '🇬🇹' },
  { code: 'HN', label: 'Honduras', phone: '504', flag: '🇭🇳' },
  { code: 'SV', label: 'El Salvador', phone: '503', flag: '🇸🇻' },
  { code: 'NI', label: 'Nicaragua', phone: '505', flag: '🇳🇮' },
  { code: 'CR', label: 'Costa Rica', phone: '506', flag: '🇨🇷' },
  { code: 'CO', label: 'Colombia', phone: '57', flag: '🇨🇴' },
  { code: 'VE', label: 'Venezuela', phone: '58', flag: '🇻🇪' },
  { code: 'CU', label: 'Cuba', phone: '53', flag: '🇨🇺' },
  { code: 'DO', label: 'Rep. Dominicana', phone: '1', flag: '🇩🇴' },
  { code: 'PR', label: 'Puerto Rico', phone: '1', flag: '🇵🇷' },
  { code: 'CA', label: 'Canada', phone: '1', flag: '🇨🇦' },
];

interface StaffingRequestDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (request: Omit<StaffingRequest, 'id' | 'created_at' | 'hotelName' | 'request_number'>) => Promise<void>;
  initialData?: StaffingRequest | null;
}

const defaultState: Omit<StaffingRequest, 'id' | 'created_at' | 'hotelName' | 'request_number'> = {
  hotel_id: '',
  request_type: 'temporal',
  num_of_people: 1,
  role: '',
  priority: 'Normal',
  shift_time: '',
  start_date: new Date().toISOString().split('T')[0],
  status: 'Pendiente',
  notes: '',
};

export default function StaffingRequestDialog({ open, onClose, onSubmit, initialData }: StaffingRequestDialogProps) {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const [formData, setFormData] = useState(defaultState);
  const [tab, setTab] = useState(0);
  const [history, setHistory] = useState<StaffingRequestHistory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Alertas
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' as 'info' | 'error' | 'success' });
  
  const { hotels } = useHotels();
  const { employees, roles = [] } = useEmployees(); 
  const { fetchHistory, fetchRequests } = useStaffingRequestsContext();
  const { profile } = useAuth();
  const { candidates, loading: candidatesLoading, addCandidate, updateCandidateStatus, deleteCandidate } = useRequestCandidates(initialData?.id ? String(initialData.id) : null);

  const [newCandidateName, setNewCandidateName] = useState('');
  const [newCandidatePhone, setNewCandidatePhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [selectedExistingEmployeeId, setSelectedExistingEmployeeId] = useState<string | null>(null);
  
  const isInspector = profile?.role === 'INSPECTOR';
  const isRecruiter = profile?.role === 'RECRUITER';
  const [selectedZone, setSelectedZone] = useState<string>('all');

  useEffect(() => {
    if (initialData && open) {
      setFormData({
        ...defaultState,
        ...initialData,
        start_date: new Date(initialData.start_date).toISOString().split('T')[0],
      });
      if (typeof fetchHistory === 'function') {
        fetchHistory(initialData.id).then(setHistory).catch(console.error);
      }
      const initialHotel = hotels.find(h => h.id === initialData.hotel_id);
      if (initialHotel && initialHotel.zone) setSelectedZone(initialHotel.zone);
    } else if (open) {
      setFormData(defaultState);
      setHistory([]);
      setTab(0);
    }
  }, [initialData, open, fetchHistory, hotels]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTabChange = (_e: any, newValue: number) => setTab(newValue);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 15); // Hasta 15 dígitos para internacional
    setNewCandidatePhone(value);
  };

  const rolesOptions = useMemo(() => {
    const list = [...roles];
    if (formData.role && !list.includes(formData.role)) {
      list.push(formData.role);
    }
    return list;
  }, [roles, formData.role]);

  const handleSubmit = async () => {
    if (!formData.hotel_id) {
      setSnackbar({ open: true, message: "Por favor seleccione un hotel destino.", severity: 'error' });
      return;
    }
    if (!initialData && !roles.includes(formData.role)) {
      setSnackbar({ open: true, message: "Por favor seleccione un cargo oficial.", severity: 'error' });
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddExternal = async () => {
    if (!newCandidateName.trim()) {
      setSnackbar({ open: true, message: 'Ingrese el nombre del candidato', severity: 'error' });
      return;
    }

    const cleanPhone = newCandidatePhone.replace(/\D/g, '');
    if (cleanPhone && cleanPhone.length < 8) {
      setSnackbar({ open: true, message: 'Teléfono demasiado corto', severity: 'error' });
      return;
    }

    if (initialData?.id) { 
      try {
        const formattedPhone = cleanPhone ? `+${selectedCountry.phone} ${cleanPhone}` : 'N/A';
        
        await addCandidate({ 
          request_id: String(initialData.id), 
          candidate_name: newCandidateName, 
          phone: formattedPhone,
          existing_employee_id: null 
        }, formData.request_type, initialData.hotel_id, formData.role); 
        
        setNewCandidateName(''); 
        setNewCandidatePhone('');
        setSnackbar({ open: true, message: 'Candidato externo añadido', severity: 'success' });
        fetchRequests();
      } catch (e: any) {
        setSnackbar({ open: true, message: e.message, severity: 'error' });
      }
    }
  };

  const handleAssignExisting = async () => {
    if (selectedExistingEmployeeId && initialData?.id) { 
      try {
        await addCandidate({ 
          request_id: String(initialData.id), 
          candidate_name: null, 
          existing_employee_id: selectedExistingEmployeeId 
        }, formData.request_type, initialData.hotel_id, formData.role); 
        setSelectedExistingEmployeeId(null); 
        setSnackbar({ open: true, message: 'Empleado asignado correctamente', severity: 'success' });
        fetchRequests();
      } catch (e: any) {
        setSnackbar({ open: true, message: e.message, severity: 'error' });
      }
    }
  };

  const handleUpdateCandidateStatus = async (id: string, status: string) => {
    try {
      await updateCandidateStatus(id, status);
      setSnackbar({ open: true, message: 'Estado actualizado', severity: 'success' });
    } catch (e: any) {
      setSnackbar({ open: true, message: 'Error al actualizar estado', severity: 'error' });
    }
  };

  const handleDeleteCandidate = async (id: string) => {
    try {
      await deleteCandidate(id);
      setSnackbar({ open: true, message: 'Candidato removido', severity: 'success' });
      fetchRequests();
    } catch (e: any) {
      setSnackbar({ open: true, message: 'Error al remover candidato', severity: 'error' });
    }
  };

  const availableStatuses = useMemo(() => {
    const allStatuses: StaffingRequest['status'][] = ['Pendiente', 'Enviada a Reclutamiento', 'En Proceso', 'Completada', 'Completada Parcialmente', 'Candidato No Presentado', 'Cancelada por Hotel', 'Vencida'];
    let filtered = allStatuses;
    if (isInspector) filtered = ['Pendiente', 'Enviada a Reclutamiento'];
    else if (isRecruiter) filtered = allStatuses.filter(s => s !== 'Pendiente');
    if (formData.status && !filtered.includes(formData.status as any)) filtered = [formData.status as any, ...filtered];
    return filtered;
  }, [isInspector, isRecruiter, formData.status]);

  const inputStyles = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
      {/* TÍTULO */}
      <Box sx={{ p: 3, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', boxShadow: '0 4px 12px rgba(255, 87, 34, 0.3)' }}>
            {initialData ? <AssignmentIndIcon /> : <GroupAddIcon />}
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.5px' }}>
              {initialData ? 'Gestionar Solicitud' : 'Nueva Solicitud de Personal'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
              {initialData ? `Orden: ${formData.request_number}` : 'Apertura de vacantes'}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </Box>

      <Box sx={{ px: 3, pt: 1 }}>
        <Tabs value={tab} onChange={handleTabChange} variant="fullWidth" sx={{ minHeight: 40, '& .MuiTab-root': { fontWeight: 800, fontSize: '0.75rem' } }}>
          <Tab icon={<InfoOutlinedIcon sx={{ fontSize: 18 }} />} label="Detalles" />
          <Tab icon={<HistoryIcon sx={{ fontSize: 18 }} />} label="Historial" disabled={!initialData} />
          <Tab icon={<GroupAddIcon sx={{ fontSize: 18 }} />} label="Candidatos" disabled={!initialData} />
        </Tabs>
      </Box>

      <DialogContent sx={{ mt: 2, px: 3 }}>
        {tab === 0 && (
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: 3, background: 'linear-gradient(135deg, rgba(255, 87, 34, 0.08) 0%, rgba(255, 255, 255, 0) 100%)', border: '1px solid rgba(255, 87, 34, 0.1)' }}>
                <Stack spacing={2}>
                  {!isInspector && (
                    <FormControl fullWidth size="small" sx={inputStyles}>
                      <InputLabel>Filtrar por Zona</InputLabel>
                      <Select value={selectedZone} label="Filtrar por Zona" onChange={(e) => setSelectedZone(e.target.value)}>
                        <MenuItem value="all">Todas las Zonas</MenuItem>
                        <MenuItem value="Centro">Centro</MenuItem>
                        <MenuItem value="Norte">Norte</MenuItem>
                        <MenuItem value="Noroeste">Noroeste</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                  <Autocomplete
                    options={hotels.filter(h => selectedZone === 'all' || h.zone === selectedZone)}
                    getOptionLabel={(option) => option.name}
                    value={hotels.find(h => h.id === formData.hotel_id) || null}
                    onChange={(_e, val) => setFormData(prev => ({ ...prev, hotel_id: val ? val.id : '' }))}
                    renderInput={(params) => <TextField {...params} label="Hotel Destino" size="small" sx={inputStyles} InputProps={{ ...params.InputProps, startAdornment: <InputAdornment position="start"><ApartmentIcon color="primary" fontSize="small" /></InputAdornment> }} />}
                  />
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: 3, background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.08) 0%, rgba(255, 255, 255, 0) 100%)', border: '1px solid rgba(33, 150, 243, 0.1)' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small" sx={inputStyles}>
                      <InputLabel>Cargo Requerido</InputLabel>
                      <Select name="role" value={formData.role || ''} onChange={handleChange} label="Cargo Requerido" startAdornment={<InputAdornment position="start"><WorkIcon fontSize="small" color="info" /></InputAdornment>}>
                        {rolesOptions.map(role => <MenuItem key={role} value={role}>{role} {!roles.includes(role) && "(No oficial)"}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small" sx={inputStyles}>
                      <InputLabel>Tipo de Solicitud</InputLabel>
                      <Select name="request_type" value={formData.request_type || 'temporal'} onChange={handleChange} label="Tipo de Solicitud" startAdornment={<InputAdornment position="start"><CategoryIcon fontSize="small" color="info" /></InputAdornment>}>
                        <MenuItem value="temporal">Temporal</MenuItem>
                        <MenuItem value="permanente">Permanente</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small" sx={inputStyles}>
                      <InputLabel>Prioridad</InputLabel>
                      <Select name="priority" value={formData.priority || 'Normal'} onChange={handleChange} label="Prioridad" startAdornment={<InputAdornment position="start"><PriorityHighIcon fontSize="small" color={formData.priority === 'Crítica' ? 'error' : 'info'} /></InputAdornment>}>
                        <MenuItem value="Baja">Baja</MenuItem>
                        <MenuItem value="Normal">Normal</MenuItem>
                        <MenuItem value="Alta">Alta</MenuItem>
                        <MenuItem value="Crítica">Crítica</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Horario de Entrada" name="shift_time" size="small" placeholder="Ej: 08:00 AM" value={formData.shift_time || ''} onChange={handleChange} sx={inputStyles} InputProps={{ startAdornment: <InputAdornment position="start"><AccessTimeIcon fontSize="small" color="info" /></InputAdornment> }} />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: 3, bgcolor: isLight ? '#f8fafc' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,0,0,0.05)' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Vacantes Necesarias" name="num_of_people" type="number" size="small" value={formData.num_of_people || 1} onChange={handleChange} sx={inputStyles} InputProps={{ startAdornment: <InputAdornment position="start"><PeopleIcon fontSize="small" color="success" /></InputAdornment> }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth type="date" label="Fecha de Inicio" name="start_date" size="small" value={formData.start_date || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} sx={inputStyles} />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small" sx={inputStyles}>
                      <InputLabel>Estado de la Solicitud</InputLabel>
                      <Select name="status" value={formData.status || 'Pendiente'} onChange={handleChange} label="Estado de la Solicitud" startAdornment={<InputAdornment position="start"><AssignmentIndIcon fontSize="small" color="success" /></InputAdornment>}>
                        {availableStatuses.map(status => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth multiline rows={2} label="Observaciones Especiales" name="notes" size="small" value={formData.notes || ''} onChange={handleChange} sx={inputStyles} placeholder="Instrucciones para el reclutador..." />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        )}

        {tab === 1 && (
          <Box sx={{ py: 1 }}>
            {history.length > 0 ? (
              <Stack spacing={2}>
                {history.map((entry) => (
                  <Paper key={entry.id} variant="outlined" sx={{ p: 2, borderRadius: 3, borderLeft: '4px solid #FF5722', bgcolor: 'rgba(255, 87, 34, 0.02)' }}>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>{entry.change_description}</Typography>
                    <Typography variant="caption" color="text.secondary">Por: {entry.changed_by?.toUpperCase() || 'SISTEMA'} • {new Date(entry.created_at).toLocaleString()}</Typography>
                  </Paper>
                ))}
              </Stack>
            ) : <Box sx={{ textAlign: 'center', py: 6, opacity: 0.3 }}><HistoryIcon sx={{ fontSize: 50 }} /><Typography variant="body2">SIN HISTORIAL</Typography></Box>}
          </Box>
        )}

        {tab === 2 && (
          <Box sx={{ py: 1 }}>
            <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, bgcolor: isLight ? '#f8fafc' : 'rgba(255,255,255,0.03)', border: '1px dashed rgba(0,0,0,0.1)' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2 }}>ASIGNAR PERSONAL</Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, mb: 1, display: 'block' }}>CANDIDATO EXTERNO (NUEVO)</Typography>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12}>
                      <TextField 
                        fullWidth size="small" 
                        placeholder="Nombre completo del candidato..." 
                        value={newCandidateName} 
                        onChange={(e) => setNewCandidateName(e.target.value)} 
                        sx={inputStyles} 
                      />
                    </Grid>
                    <Grid item xs={12} sm={5}>
                      <Autocomplete
                        size="small"
                        options={countries}
                        getOptionLabel={(option) => `${option.flag} +${option.phone}`}
                        value={selectedCountry}
                        onChange={(_e, val) => val && setSelectedCountry(val)}
                        renderInput={(params) => (
                          <TextField 
                            {...params} 
                            label="País" 
                            sx={inputStyles}
                            InputProps={{
                              ...params.InputProps,
                              startAdornment: <PublicIcon sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                            }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} sm={5}>
                      <TextField 
                        fullWidth size="small" 
                        placeholder="Número telefónico" 
                        value={newCandidatePhone} 
                        onChange={handlePhoneChange}
                        sx={inputStyles} 
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Button 
                        fullWidth variant="contained" 
                        onClick={handleAddExternal} 
                        sx={{ borderRadius: 2, fontWeight: 900, height: '40px', background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)' }}
                      >
                        ADD
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
                <Divider><Typography variant="caption" sx={{ fontWeight: 800 }}>Ó</Typography></Divider>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>RE-ASIGNAR EMPLEADO EXISTENTE</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                    <Autocomplete
                      fullWidth
                      size="small"
                      options={employees}
                      getOptionLabel={(option) => `${option.name} (${option.employeeType === 'permanente' ? 'Fijo' : 'Eventual'})`}
                      onChange={(_e, val) => setSelectedExistingEmployeeId(val ? val.id : null)}
                      renderInput={(params) => <TextField {...params} label="Buscar en base de datos" sx={inputStyles} />}
                    />
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      onClick={handleAssignExisting}
                      sx={{ borderRadius: 2, fontWeight: 'bold' }}
                    >
                      Asignar
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            </Paper>

            <Stack spacing={1.5}>
              {candidates.map(candidate => {
                const emp = employees.find(e => e.id === candidate.existing_employee_id);
                return (
                  <Paper key={candidate.id} elevation={0} sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 2, borderRadius: 3, border: '1px solid rgba(0,0,0,0.05)', transition: 'all 0.2s', '&:hover': { bgcolor: 'rgba(255, 87, 34, 0.03)' } }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, fontWeight: 900 }}>{getInitials(candidate.candidate_name || emp?.name || '?')}</Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{candidate.candidate_name || emp?.name}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {candidate.existing_employee_id ? <PersonSearchIcon sx={{ fontSize: 12 }} /> : <GroupAddIcon sx={{ fontSize: 12 }} />}
                        {candidate.existing_employee_id ? 'EMPLEADO SISTEMA' : 'EXTERNO'}
                        {candidate.phone && candidate.phone !== 'N/A' && (
                          <Stack direction="row" alignItems="center" component="span" sx={{ ml: 1 }}>
                            • 📞 {candidate.phone}
                            <IconButton 
                              size="small" 
                              onClick={() => {
                                const clean = candidate.phone!.replace(/\D/g, '');
                                window.open(`https://wa.me/${clean}`, '_blank');
                              }}
                              sx={{ color: '#25D366', p: 0, ml: 0.5 }}
                            >
                              <WhatsAppIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Stack>
                        )}
                      </Typography>
                    </Box>
                    <FormControl size="small" sx={{ minWidth: 110 }}>
                      <Select value={candidate.status} onChange={(e) => handleUpdateCandidateStatus(candidate.id, e.target.value as any)} sx={{ height: 30, fontSize: '0.7rem', fontWeight: 800 }}>
                        <MenuItem value="Asignado">Asignado</MenuItem>
                        <MenuItem value="Confirmado">Confirmado</MenuItem>
                        <MenuItem value="pendiente">Llegó</MenuItem>
                        <MenuItem value="No llegó">No llegó</MenuItem>
                        <MenuItem value="completada">Validado</MenuItem>
                        <MenuItem value="empleado_creado">Contratado</MenuItem>
                      </Select>
                    </FormControl>
                    <IconButton size="small" color="error" onClick={() => handleDeleteCandidate(String(candidate.id))}><DeleteOutlineIcon fontSize="small" /></IconButton>
                  </Paper>
                );
              })}
            </Stack>
          </Box>
        )}
      </DialogContent>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%', fontWeight: 800, borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} color="inherit" sx={{ fontWeight: 800 }}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={isSubmitting} sx={{ borderRadius: 2, px: 4, fontWeight: 900, background: 'linear-gradient(45deg, #FF5722 30%, #FF8A65 90%)', boxShadow: '0 4px 14px rgba(255, 87, 34, 0.3)' }}>
          {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Guardar Cambios'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
