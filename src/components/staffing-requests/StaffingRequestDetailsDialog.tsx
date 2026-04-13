import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, 
  Grid, Chip, Box, Stack, Divider, Avatar, Paper, IconButton, useTheme,
  LinearProgress, CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ApartmentIcon from '@mui/icons-material/Apartment';
import BadgeIcon from '@mui/icons-material/Badge';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleIcon from '@mui/icons-material/People';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import AssignmentIcon from '@mui/icons-material/Assignment';
import NotesIcon from '@mui/icons-material/Notes';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';

import { useRequestCandidates } from '../../hooks/useRequestCandidates';
import { useEmployees } from '../../hooks/useEmployees';
import type { StaffingRequest } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getInitials } from '../../utils/stringUtils';

interface StaffingRequestDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  request: StaffingRequest | null;
}

const statusColors: { [key in StaffingRequest['status'] | 'Archivada']: { bg: string, text: string, label: string } } = {
  'Pendiente': { bg: '#f4f5f7', text: '#172b4d', label: 'PENDIENTE' },
  'Enviada a Reclutamiento': { bg: '#e6fcff', text: '#00526e', label: 'EN RECLUTAMIENTO' },
  'En Proceso': { bg: '#deebff', text: '#0747a6', label: 'EN PROCESO' },
  'Completada': { bg: '#e3fcef', text: '#006644', label: 'COMPLETADA' },
  'Completada Parcialmente': { bg: '#fffae6', text: '#974f0c', label: 'PARCIAL' },
  'Candidato No Presentado': { bg: '#ffebe6', text: '#bf2600', label: 'NO PRESENTADO' },
  'Cancelada por Hotel': { bg: '#ffebe6', text: '#bf2600', label: 'CANCELADA' },
  'Vencida': { bg: '#ffebe6', text: '#bf2600', label: 'VENCIDA' },
  'Archivada': { bg: '#f4f5f7', text: '#475569', label: 'ARCHIVADA' }
};

const candidateStatusColors: { [key: string]: string } = {
  'Asignado': 'info',
  'Confirmado': 'primary',
  'Llegó': 'success',
  'pendiente': 'success',
  'No llegó': 'error',
  'completada': 'info',
  'empleado_creado': 'success'
};

export default function StaffingRequestDetailsDialog({ open, onClose, request }: StaffingRequestDetailsDialogProps) {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const { employees } = useEmployees();
  const { candidates, loading: candidatesLoading } = useRequestCandidates(request?.id ? String(request.id) : null);

  if (!request) return null;

  const sColor = statusColors[request.status] || statusColors['Pendiente'];
  const progress = Math.min(((request.candidate_count || 0) / request.num_of_people) * 100, 100);

  const SectionHeader = ({ icon, title }: { icon: React.ReactNode, title: string }) => (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5, mt: 1 }}>
      <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
      <Typography variant="caption" sx={{ fontWeight: 900, letterSpacing: '1px', color: 'text.secondary', textTransform: 'uppercase' }}>
        {title}
      </Typography>
    </Stack>
  );

  const InfoItem = ({ label, value, icon }: { label: string, value: string | number, icon?: React.ReactNode }) => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        {icon && <Box sx={{ color: 'action.active', display: 'flex', opacity: 0.6 }}>{icon}</Box>}
        <Typography variant="body2" sx={{ fontWeight: 800 }}>
          {value}
        </Typography>
      </Stack>
    </Box>
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth 
      PaperProps={{ 
        sx: { borderRadius: 4, overflow: 'hidden' } 
      }}
    >
      {/* HEADER PREMIUM */}
      <Box sx={{ 
        p: 3, 
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', 
        color: 'white',
        position: 'relative'
      }}>
        <IconButton 
          onClick={onClose} 
          size="small" 
          sx={{ position: 'absolute', top: 12, right: 12, color: 'rgba(255,255,255,0.5)', '&:hover': { color: 'white' } }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ 
            width: 56, height: 56, 
            bgcolor: 'primary.main', 
            boxShadow: '0 8px 16px rgba(255, 87, 34, 0.4)',
            border: '2px solid rgba(255,255,255,0.1)'
          }}>
            <AssignmentIcon fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.5px', mb: 0.5 }}>
              {request.request_number}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip 
                label={sColor.label} 
                size="small" 
                sx={{ 
                  height: 20, 
                  fontSize: '0.65rem', 
                  fontWeight: 900, 
                  bgcolor: sColor.bg, 
                  color: sColor.text,
                  border: 'none'
                }} 
              />
              <Chip 
                label={request.request_type.toUpperCase()} 
                size="small" 
                variant="outlined"
                sx={{ 
                  height: 20, 
                  fontSize: '0.65rem', 
                  fontWeight: 900, 
                  color: 'rgba(255,255,255,0.7)',
                  borderColor: 'rgba(255,255,255,0.2)'
                }} 
              />
            </Stack>
          </Box>
        </Stack>
      </Box>

      <DialogContent dividers sx={{ p: 3, bgcolor: isLight ? '#f8fafc' : 'rgba(0,0,0,0.2)' }}>
        <Grid container spacing={3}>
          
          {/* SECCIÓN 1: PERFIL Y COBERTURA */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid rgba(0,0,0,0.05)' }}>
              <SectionHeader icon={<BadgeIcon fontSize="small" />} title="Perfil Requerido" />
              <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.main', mb: 2 }}>
                {request.role}
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800 }}>PROGRESO DE COBERTURA</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 900, color: 'success.main' }}>
                    {request.candidate_count || 0} / {request.num_of_people} PLAZAS
                  </Typography>
                </Stack>
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4, 
                    bgcolor: 'rgba(0,0,0,0.05)',
                    '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: 'success.main' }
                  }} 
                />
              </Box>
            </Paper>
          </Grid>

          {/* SECCIÓN 2: LOGÍSTICA */}
          <Grid item xs={12} sm={6}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, height: '100%', border: '1px solid rgba(0,0,0,0.05)' }}>
              <SectionHeader icon={<ApartmentIcon fontSize="small" />} title="Ubicación" />
              <InfoItem label="Hotel" value={request.hotelName || 'N/A'} />
              <InfoItem label="Prioridad" value={request.priority} icon={<PriorityHighIcon fontSize="inherit" />} />
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, height: '100%', border: '1px solid rgba(0,0,0,0.05)' }}>
              <SectionHeader icon={<CalendarTodayIcon fontSize="small" />} title="Temporalidad" />
              <InfoItem label="Fecha Inicio" value={format(new Date(request.start_date), 'dd/MM/yyyy')} />
              <InfoItem label="Horario" value={request.shift_time || 'No especificado'} icon={<AccessTimeIcon fontSize="inherit" />} />
            </Paper>
          </Grid>

          {/* SECCIÓN 3: PERSONAL ASIGNADO (NUEVA) */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid rgba(0,0,0,0.05)' }}>
              <SectionHeader icon={<GroupIcon fontSize="small" />} title="Personal Asignado" />
              
              {candidatesLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={20} />
                </Box>
              ) : candidates.length > 0 ? (
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {candidates.map(candidate => {
                    const emp = employees.find(e => e.id === candidate.existing_employee_id);
                    const name = candidate.candidate_name || emp?.name || 'Desconocido';
                    return (
                      <Box key={candidate.id} sx={{ 
                        p: 1.5, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        borderRadius: 2,
                        bgcolor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(0,0,0,0.03)'
                      }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar sx={{ 
                            width: 32, height: 32, 
                            fontSize: '0.75rem', 
                            fontWeight: 900,
                            bgcolor: candidate.existing_employee_id ? 'primary.main' : 'info.main'
                          }}>
                            {getInitials(name)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 800 }}>{name}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {candidate.existing_employee_id ? <BadgeIcon sx={{ fontSize: 10 }} /> : <PersonIcon sx={{ fontSize: 10 }} />}
                              {candidate.existing_employee_id ? 'EMPLEADO' : 'EXTERNO'}
                            </Typography>
                          </Box>
                        </Stack>
                        <Chip 
                          label={candidate.status.toUpperCase()} 
                          size="small" 
                          color={(candidateStatusColors[candidate.status] as any) || 'default'}
                          variant="filled"
                          sx={{ height: 18, fontSize: '0.6rem', fontWeight: 900 }}
                        />
                      </Box>
                    );
                  })}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center', fontStyle: 'italic' }}>
                  Aún no hay personal asignado a esta solicitud.
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* SECCIÓN 4: NOTAS Y AUDITORÍA */}
          {request.notes && (
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(255, 87, 34, 0.03)', border: '1px dashed rgba(255, 87, 34, 0.2)' }}>
                <SectionHeader icon={<NotesIcon fontSize="small" />} title="Observaciones Especiales" />
                <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
                  "{request.notes}"
                </Typography>
              </Paper>
            </Grid>
          )}

          <Grid item xs={12}>
            <Divider sx={{ mb: 2, opacity: 0.5 }} />
            <Stack direction="row" spacing={3} justifyContent="center">
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" display="block">CREADA</Typography>
                <Typography variant="caption" sx={{ fontWeight: 800 }}>
                  {format(new Date(request.created_at), 'dd MMM, yyyy', { locale: es })}
                </Typography>
              </Box>
              {request.completed_at && (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="success.main" display="block">COMPLETADA</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 800 }}>
                    {format(new Date(request.completed_at), 'dd MMM, yyyy', { locale: es })}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, bgcolor: isLight ? '#f1f5f9' : 'rgba(0,0,0,0.3)' }}>
        <Button 
          onClick={onClose} 
          variant="contained" 
          sx={{ 
            borderRadius: 2, 
            px: 4, 
            fontWeight: 900,
            textTransform: 'none',
            background: 'linear-gradient(45deg, #0F172A 30%, #1E293B 90%)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}
        >
          Cerrar Detalle
        </Button>
      </DialogActions>
    </Dialog>
  );
}
