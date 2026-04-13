import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Card, CardContent, Typography, Box, Chip, Stack, 
  Divider, useTheme, IconButton, Tooltip
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PeopleIcon from '@mui/icons-material/People';
import ApartmentIcon from '@mui/icons-material/Apartment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArchiveIcon from '@mui/icons-material/Archive';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import TimerIcon from '@mui/icons-material/Timer';

import type { StaffingRequest } from '../../types';

interface RequestCardProps {
  request: StaffingRequest;
  onEdit: (request: StaffingRequest) => void;
  onArchive?: (id: string) => void; // Cambiado a string para AWS
  onDelete?: (id: string) => void;
}

export default function RequestCard({ request, onEdit, onArchive }: RequestCardProps) {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: request.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'Crítica': return { color: '#f44336', label: 'CRÍTICA', bg: 'rgba(244, 67, 54, 0.1)' };
      case 'Alta': return { color: '#ff9800', label: 'ALTA', bg: 'rgba(255, 152, 0, 0.1)' };
      case 'Baja': return { color: '#4caf50', label: 'BAJA', bg: 'rgba(76, 175, 80, 0.1)' };
      default: return { color: '#2196f3', label: 'NORMAL', bg: 'rgba(33, 150, 243, 0.1)' };
    }
  };

  const getSLAConfig = (hours?: number) => {
    if (hours === undefined) return { color: 'text.secondary', icon: <TimerIcon fontSize="inherit" />, text: 'Sin tiempo' };
    if (hours < 24) return { color: '#4caf50', icon: <TimerIcon fontSize="inherit" />, text: `${hours}h` };
    if (hours < 48) return { color: '#ff9800', icon: <TimerIcon fontSize="inherit" />, text: `${hours}h` };
    if (hours < 72) return { color: '#f44336', icon: <TimerIcon fontSize="inherit" />, text: `${hours}h` };
    return { color: '#d32f2f', icon: <ErrorOutlineIcon fontSize="inherit" />, text: 'VENCIDA', urgent: true };
  };

  const pConfig = getPriorityConfig(request.priority || 'Normal');
  const sla = getSLAConfig(request.hours_since_creation);

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      sx={{ 
        mb: 2, 
        borderRadius: 4,
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        border: `1px solid ${isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}`,
        borderLeft: `6px solid ${pConfig.color}`,
        bgcolor: isLight ? '#FFFFFF' : 'rgba(15, 23, 42, 0.6)',
        touchAction: 'none',
        '&:hover': {
          transform: transform ? style.transform : 'translateY(-5px)',
          boxShadow: isLight ? '0 15px 35px rgba(0,0,0,0.1)' : '0 15px 35px rgba(0,0,0,0.4)',
          borderColor: pConfig.color,
          '& .request-title': { color: 'primary.main' }
        }
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2 } }}>
        {/* CABECERA: NÚMERO Y PRIORIDAD */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography 
              variant="caption" 
              {...attributes} {...listeners} 
              sx={{ fontWeight: 900, color: 'text.disabled', letterSpacing: '1px', cursor: 'grab' }}
            >
              #{request.request_number.split('-')[1] || request.request_number}
            </Typography>
            
            <Chip 
              label={pConfig.label} 
              size="small" 
              sx={{ 
                height: 18, fontSize: '0.55rem', fontWeight: 900, 
                bgcolor: pConfig.bg, color: pConfig.color,
                borderRadius: 1
              }} 
            />
          </Stack>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* INDICADOR SLA PREMIUM */}
            <Tooltip title={`SLA: ${request.hours_since_creation}h transcurridas`}>
              <Box sx={{ 
                display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.2, borderRadius: 1,
                bgcolor: sla.urgent ? 'rgba(211, 47, 47, 0.15)' : 'rgba(255,255,255,0.03)',
                color: sla.color,
                border: sla.urgent ? '1px solid rgba(211, 47, 47, 0.3)' : '1px solid transparent',
                animation: sla.urgent ? 'pulse-red 2s infinite' : 'none',
                '@keyframes pulse-red': { '0%': { boxShadow: '0 0 0 0 rgba(211, 47, 47, 0.4)' }, '70%': { boxShadow: '0 0 0 10px rgba(211, 47, 47, 0)' }, '100%': { boxShadow: '0 0 0 0 rgba(211, 47, 47, 0)' } }
              }}>
                <AccessTimeIcon sx={{ fontSize: 12 }} />
                <Typography variant="caption" sx={{ fontWeight: 900, fontSize: '0.6rem' }}>{sla.text}</Typography>
              </Box>
            </Tooltip>
            
            {onArchive && (
              <IconButton 
                size="small" 
                onClick={(e) => { e.stopPropagation(); onArchive(request.id); }}
                sx={{ color: 'text.disabled', '&:hover': { color: 'primary.main' } }}
              >
                <ArchiveIcon sx={{ fontSize: 16 }} />
              </IconButton>
            )}
          </Box>
        </Box>

        {/* CUERPO: CARGO Y HOTEL */}
        <Box onClick={() => onEdit(request)} sx={{ cursor: 'pointer' }}>
          <Typography 
            variant="h6" 
            className="request-title"
            sx={{ 
              fontWeight: 900, 
              color: '#94A3B8', // Gris Azulado Premium (Platino)
              textTransform: 'uppercase',
              letterSpacing: '-0.5px',
              lineHeight: 1.1,
              mb: 0.5,
              transition: 'all 0.3s ease'
            }}
          >
            {request.role}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 2.5 }}>
            <ApartmentIcon sx={{ fontSize: 14, color: 'primary.main', opacity: 0.8 }} />
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {request.hotelName}
            </Typography>
          </Box>

          {/* KPI DE COBERTURA */}
          <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled', display: 'block', mb: 0.2, fontSize: '0.6rem' }}>AVANCE COBERTURA</Typography>
              <Typography variant="body2" sx={{ fontWeight: 900, color: 'white' }}>
                {request.candidate_count || 0} <Typography component="span" variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>/ {request.num_of_people} VACANTES</Typography>
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <CalendarTodayIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                {new Date(request.start_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase()}
              </Typography>
            </Stack>
          </Box>

          <Box sx={{ height: 6, width: '100%', bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
            <Box 
              sx={{ 
                height: '100%', 
                width: `${Math.min(((request.candidate_count || 0) / request.num_of_people) * 100, 100)}%`, 
                background: (request.candidate_count || 0) >= request.num_of_people 
                  ? 'linear-gradient(90deg, #4CAF50 0%, #81C784 100%)'
                  : 'linear-gradient(90deg, #FF5722 0%, #FF8A65 100%)',
                boxShadow: (request.candidate_count || 0) > 0 ? '0 0 10px rgba(255, 87, 34, 0.3)' : 'none',
                transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' 
              }} 
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
