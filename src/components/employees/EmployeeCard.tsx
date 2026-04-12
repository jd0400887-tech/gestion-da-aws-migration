import { 
  Card, CardContent, Typography, Box, IconButton, Chip, 
  Stack, Avatar, Tooltip, Divider, useTheme, Paper, CircularProgress 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ApartmentIcon from '@mui/icons-material/Apartment';
import BadgeIcon from '@mui/icons-material/Badge';
import GavelIcon from '@mui/icons-material/Gavel';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import StarIcon from '@mui/icons-material/Star';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import HistoryIcon from '@mui/icons-material/History';

import type { Employee, Hotel } from '../../types';
import { getInitials } from '../../utils/stringUtils';
import { useEmployeeQuality } from '../../hooks/useEmployeeQuality';

interface EmployeeCardProps {
  employee: Employee;
  hotels: Hotel[];
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
}

export default function EmployeeCard({ employee, hotels, onEdit, onDelete }: EmployeeCardProps) {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const { iq, level, loading: qualityLoading } = useEmployeeQuality(employee.id);
  
  const hotel = hotels.find(h => h.id === employee.hotelId);
  const isBlacklisted = employee.isBlacklisted;

  // Configuración de colores para el IQ (Versión Minimalista)
  const getQualityConfig = () => {
    if (qualityLoading) return null;
    switch(level) {
      case 'Elite': return { color: '#FFD700', label: 'ELITE', icon: <WorkspacePremiumIcon sx={{ fontSize: 12 }} /> };
      case 'Standard': return { color: '#4CAF50', label: 'OK', icon: <StarIcon sx={{ fontSize: 12 }} /> };
      case 'Below Standard': return { color: '#F44336', label: 'OBS', icon: <StarIcon sx={{ fontSize: 12 }} /> };
      default: return { color: theme.palette.text.disabled, label: 'S/A', icon: <HistoryIcon sx={{ fontSize: 12 }} /> };
    }
  };

  const qualityConfig = getQualityConfig();

  const cardStyles = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 4,
    position: 'relative',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    border: isBlacklisted 
      ? '2px solid rgba(244, 67, 54, 0.5)' 
      : `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
    bgcolor: isBlacklisted 
      ? (isLight ? '#FFF5F5' : 'rgba(244, 67, 54, 0.05)')
      : (isLight ? '#FFFFFF' : 'rgba(255,255,255,0.02)'),
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: isLight ? '0 12px 24px rgba(0,0,0,0.08)' : '0 12px 24px rgba(0,0,0,0.3)',
      borderColor: isBlacklisted ? 'error.main' : 'primary.main',
    }
  };

  const handleWhatsApp = () => {
    if (employee.phone) {
      const cleanPhone = employee.phone.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanPhone}`, '_blank');
    }
  };

  return (
    <Card sx={cardStyles}>
      <CardContent sx={{ p: 2.5 }}>
        {/* HEADER: AVATAR + NOMBRE + IQ */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar 
              sx={{ 
                width: 52, height: 56, // Ligeramente estirado para look premium
                borderRadius: 2.5,
                bgcolor: isBlacklisted ? 'error.main' : 'primary.main',
                fontSize: '1.1rem', fontWeight: 900,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              {getInitials(employee.name)}
            </Avatar>
            
            {/* IQ BADGE MINI SOBRE AVATAR */}
            {qualityConfig && !isBlacklisted && (
              <Tooltip title={`Calidad: ${iq || 'N/A'}%`}>
                <Box sx={{ 
                  position: 'absolute', top: -8, right: -8, 
                  bgcolor: qualityConfig.color, color: 'white',
                  borderRadius: '50%', width: 22, height: 22,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `2px solid ${isLight ? 'white' : '#1e293b'}`,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                }}>
                  {qualityConfig.icon}
                </Box>
              </Tooltip>
            )}
          </Box>

          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, lineHeight: 1.1, noWrap: true }}>
                {employee.name}
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600 }}>
                #{employee.employeeNumber.split('-')[1] || employee.employeeNumber}
              </Typography>
            </Box>
            <Typography variant="caption" color="primary.main" sx={{ fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <BadgeIcon sx={{ fontSize: 14 }} /> {employee.role}
            </Typography>
          </Box>
        </Box>

        <Stack spacing={1.5}>
          {/* UBICACIÓN ACTUAL */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ApartmentIcon sx={{ fontSize: 18, color: 'text.secondary', opacity: 0.6 }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                {hotel ? hotel.name : 'Sin Asignación'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: -0.2 }}>
                {hotel ? hotel.city : 'Ubicación pendiente'}
              </Typography>
            </Box>
          </Box>

          {/* CHIPS DE ESTADO COMPACTOS */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 0.5 }}>
            <Stack direction="row" spacing={1}>
              <Chip 
                label={employee.employeeType === 'permanente' ? 'Fijo' : 'Refuerzo'} 
                size="small" 
                variant="soft"
                sx={{ fontSize: '0.65rem', fontWeight: 800, height: 20, bgcolor: 'rgba(0,0,0,0.04)' }} 
              />
              {iq && (
                <Chip 
                  label={`${iq}% Calidad`}
                  size="small"
                  sx={{ fontSize: '0.65rem', fontWeight: 800, height: 20, bgcolor: `${qualityConfig?.color}15`, color: qualityConfig?.color }}
                />
              )}
            </Stack>
            
            {employee.phone && (
              <IconButton 
                size="small" 
                onClick={handleWhatsApp}
                sx={{ color: '#25D366', bgcolor: 'rgba(37, 211, 102, 0.08)' }}
              >
                <WhatsAppIcon sx={{ fontSize: 16 }} />
              </IconButton>
            )}
          </Box>

          {isBlacklisted && (
            <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: 'rgba(244, 67, 54, 0.08)', borderLeft: '3px solid #f44336' }}>
              <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <GavelIcon sx={{ fontSize: 14 }} /> RESTRICCIÓN ACTIVA
              </Typography>
              <Typography variant="caption" color="error.main" sx={{ display: 'block', fontSize: '0.65rem', mt: 0.5, lineHeight: 1 }}>
                {employee.blacklistReason || 'Motivo no especificado'}
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>

      <Box sx={{ flexGrow: 1 }} />
      <Divider sx={{ opacity: 0.05 }} />

      {/* PIE DE TARJETA DISCRETO */}
      <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'rgba(0,0,0,0.01)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <FiberManualRecordIcon sx={{ fontSize: 8, color: employee.isActive && !isBlacklisted ? 'success.main' : 'text.disabled' }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.6rem', textTransform: 'uppercase' }}>
            {employee.isActive ? 'Activo' : 'Inactivo'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" onClick={() => onEdit(employee)} sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
            <EditIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <IconButton size="small" onClick={() => onDelete(employee.id)} sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}>
            <DeleteIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Stack>
      </Box>
    </Card>
  );
}
