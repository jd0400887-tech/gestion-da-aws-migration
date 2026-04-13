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
      <CardContent sx={{ p: 3, pt: 4 }}>
        {/* IDENTIDAD: AVATAR Y NOMBRE IMPONENTE */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', mb: 3 }}>
          <Box sx={{ position: 'relative', mb: 2 }}>
            <Avatar 
              sx={{ 
                width: 80, height: 80,
                background: isBlacklisted 
                  ? 'linear-gradient(135deg, #f44336 0%, #b71c1c 100%)'
                  : 'linear-gradient(135deg, #FF5722 0%, #FF8A65 100%)', 
                fontWeight: 900,
                fontSize: '1.8rem',
                boxShadow: isBlacklisted ? '0 8px 20px rgba(244, 67, 54, 0.4)' : '0 8px 20px rgba(255, 87, 34, 0.4)',
                border: '3px solid rgba(255,255,255,0.1)'
              }}
            >
              {getInitials(employee.name)}
            </Avatar>
            
            {/* INDICADOR DE CALIDAD POSICIONADO ESTRATÉGICAMENTE */}
            {qualityConfig && !isBlacklisted && (
              <Tooltip title={`Excelencia: ${iq || 'N/A'}%`}>
                <Box sx={{ 
                  position: 'absolute', bottom: 0, right: 0, 
                  bgcolor: qualityConfig.color, color: 'white',
                  borderRadius: '50%', width: 28, height: 28,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '3px solid #0F172A',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                }}>
                  {qualityConfig.icon}
                </Box>
              </Tooltip>
            )}
          </Box>

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
            {employee.name}
          </Typography>
          
          <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', textTransform: 'uppercase', letterSpacing: '2px' }}>
            {employee.role}
          </Typography>
        </Box>

        <Stack spacing={2}>
          {/* ASIGNACIÓN ACTUAL */}
          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <ApartmentIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', lineHeight: 1 }}>ASIGNADO A:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: 'white' }}>
                  {hotel ? hotel.name : 'Sin Asignación'}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* CHIPS Y WHATSAPP */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Stack direction="row" spacing={1}>
              <Chip 
                label={employee.employeeType === 'permanente' ? 'FIJO' : 'REFUERZO'} 
                size="small" 
                sx={{ fontWeight: 900, fontSize: '0.6rem', borderRadius: 1, bgcolor: 'rgba(255,255,255,0.05)', color: 'text.secondary' }} 
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.2, borderRadius: 1, bgcolor: employee.isActive ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255,255,255,0.05)' }}>
                <FiberManualRecordIcon sx={{ fontSize: 8, color: employee.isActive ? '#4CAF50' : '#666' }} />
                <Typography variant="caption" sx={{ fontWeight: 900, fontSize: '0.6rem', color: employee.isActive ? '#4CAF50' : '#666' }}>{employee.isActive ? 'ACTIVO' : 'OFF'}</Typography>
              </Box>
            </Stack>
            
            {employee.phone && (
              <Tooltip title="Contactar por WhatsApp">
                <IconButton 
                  size="small" 
                  onClick={handleWhatsApp}
                  sx={{ color: '#25D366', bgcolor: 'rgba(37, 211, 102, 0.1)', '&:hover': { bgcolor: 'rgba(37, 211, 102, 0.2)' } }}
                >
                  <WhatsAppIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {isBlacklisted && (
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(244, 67, 54, 0.1)', border: '1px solid rgba(244, 67, 54, 0.3)' }}>
              <Typography variant="caption" sx={{ color: '#f44336', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: 1 }}>
                <GavelIcon sx={{ fontSize: 16 }} /> RESTRICCIÓN ACTIVA
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5, fontWeight: 600 }}>
                {employee.blacklistReason || 'Motivo no especificado'}
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>

      <Box sx={{ flexGrow: 1 }} />
      
      {/* ACCIONES FLOTANTES INTEGRADAS */}
      <Box sx={{ px: 2, pb: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <IconButton 
          size="small" 
          onClick={() => onEdit(employee)}
          sx={{ color: 'rgba(255,255,255,0.2)', '&:hover': { color: 'primary.main', bgcolor: 'rgba(255, 87, 34, 0.1)' } }}
        >
          <EditIcon sx={{ fontSize: 18 }} />
        </IconButton>
        <IconButton 
          size="small" 
          onClick={() => onDelete(employee.id)}
          sx={{ color: 'rgba(255,255,255,0.1)', '&:hover': { color: 'error.main', bgcolor: 'rgba(244, 67, 54, 0.1)' } }}
        >
          <DeleteIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
    </Card>
  );
}
