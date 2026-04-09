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

  const pConfig = getPriorityConfig(request.priority || 'Normal');

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      sx={{ 
        mb: 2, 
        borderRadius: 3,
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        border: `1px solid ${isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}`,
        borderLeft: `5px solid ${pConfig.color}`,
        bgcolor: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.02)',
        touchAction: 'none',
        '&:hover': {
          transform: transform ? style.transform : 'translateY(-4px)',
          boxShadow: '0 12px 25px rgba(0,0,0,0.1)',
          borderColor: pConfig.color
        }
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 1.5 } }}>
        {/* CABECERA */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography 
            variant="caption" 
            {...attributes} {...listeners} // El arrastre se activa desde el código SR
            sx={{ fontWeight: 900, color: 'text.secondary', fontFamily: 'monospace', cursor: 'grab', '&:active': { cursor: 'grabbing' } }}
          >
            {request.request_number}
          </Typography>
          
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label={pConfig.label} size="small" sx={{ height: 18, fontSize: '0.55rem', fontWeight: 900, bgcolor: pConfig.bg, color: pConfig.color }} />
            {onArchive && (
              <Tooltip title="Mover al Histórico">
                <IconButton 
                  size="small" 
                  onClick={(e) => { e.stopPropagation(); onArchive(request.id); }}
                  sx={{ p: 0.2, color: 'text.disabled', '&:hover': { color: 'primary.main' } }}
                >
                  <ArchiveIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Box>

        {/* CUERPO CLICKABLE */}
        <Box onClick={() => onEdit(request)} sx={{ cursor: 'pointer' }}>
          <Typography variant="body1" sx={{ fontWeight: 800, mb: 0.5, lineHeight: 1.2 }}>{request.role}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <ApartmentIcon sx={{ fontSize: 14, color: 'primary.main', opacity: 0.7 }} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>{request.hotelName}</Typography>
          </Box>

          <Divider sx={{ mb: 1.5, opacity: 0.05 }} />

          <Stack spacing={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PeopleIcon sx={{ fontSize: 16, color: 'action.active' }} />
                <Typography variant="caption" sx={{ fontWeight: 800 }}>{request.candidate_count || 0} / {request.num_of_people}</Typography>
              </Box>
              {request.shift_time && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: 'rgba(0,0,0,0.03)', px: 1, borderRadius: 1 }}>
                  <AccessTimeIcon sx={{ fontSize: 12, color: 'primary.main' }} />
                  <Typography variant="caption" sx={{ fontWeight: 900, fontSize: '0.65rem' }}>{request.shift_time}</Typography>
                </Box>
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarTodayIcon sx={{ fontSize: 14, color: 'action.active' }} />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>{new Date(request.start_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</Typography>
            </Box>
          </Stack>

          <Box sx={{ mt: 2, height: 4, width: '100%', bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ height: '100%', width: `${Math.min(((request.candidate_count || 0) / request.num_of_people) * 100, 100)}%`, bgcolor: 'success.main', transition: 'width 0.5s ease' }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
