import { 
  Card, CardContent, Typography, Box, IconButton, Chip, 
  Stack, Avatar, Tooltip, Divider, useTheme, Paper 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ApartmentIcon from '@mui/icons-material/Apartment';
import BadgeIcon from '@mui/icons-material/Badge';
import GavelIcon from '@mui/icons-material/Gavel';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

import type { Employee, Hotel } from '../../types';
import { getInitials } from '../../utils/stringUtils';

interface EmployeeCardProps {
  employee: Employee;
  hotels: Hotel[];
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
}

export default function EmployeeCard({ employee, hotels, onEdit, onDelete }: EmployeeCardProps) {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  
  const hotel = hotels.find(h => h.id === employee.hotelId);
  const isBlacklisted = employee.isBlacklisted;

  // Estilo de la tarjeta basado en seguridad
  const cardStyles = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 4,
    position: 'relative',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    border: isBlacklisted 
      ? '2px solid rgba(244, 67, 54, 0.5)' 
      : `1px solid ${isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}`,
    bgcolor: isBlacklisted 
      ? (isLight ? '#FFF5F5' : 'rgba(244, 67, 54, 0.05)')
      : (isLight ? '#FFFFFF' : 'rgba(255,255,255,0.02)'),
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: isBlacklisted 
        ? '0 10px 30px rgba(244, 67, 54, 0.2)' 
        : '0 10px 30px rgba(0,0,0,0.1)',
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
      {/* CABECERA CON ID */}
      <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
        <Chip 
          label={employee.employeeNumber} 
          size="small" 
          variant="outlined"
          sx={{ 
            fontWeight: 900, 
            fontSize: '0.65rem', 
            height: 20,
            bgcolor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
            border: 'none'
          }} 
        />
      </Box>

      <CardContent sx={{ p: 2.5, pt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
          {/* AVATAR PROFESIONAL */}
          <Box sx={{ position: 'relative' }}>
            <Avatar 
              sx={{ 
                width: 56, height: 56, 
                bgcolor: isBlacklisted ? 'error.main' : 'primary.main',
                fontSize: '1.2rem', fontWeight: 900,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              {getInitials(employee.name)}
            </Avatar>
            <Box sx={{ 
              position: 'absolute', bottom: 0, right: 0, 
              bgcolor: isLight ? 'white' : '#121212', 
              borderRadius: '50%', p: 0.2, display: 'flex' 
            }}>
              <FiberManualRecordIcon 
                sx={{ 
                  fontSize: 14, 
                  color: employee.isActive && !isBlacklisted ? 'success.main' : 'text.disabled' 
                }} 
              />
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2, mb: 0.5, noWrap: true }}>
              {employee.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <BadgeIcon sx={{ fontSize: 14 }} /> {employee.role}
            </Typography>
          </Box>
        </Box>

        <Stack spacing={1.5}>
          {/* HOTEL ASIGNADO */}
          <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: isLight ? '#F1F5F9' : 'rgba(0,0,0,0.2)', border: '1px solid rgba(0,0,0,0.05)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <ApartmentIcon sx={{ fontSize: 18, color: 'primary.main' }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1 }}>
                  {hotel ? hotel.name : 'Sin Asignación'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {hotel ? hotel.city : 'Ubicación pendiente'}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* DETALLES DE CONTRATO Y SEGURIDAD */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Stack direction="row" spacing={1}>
              <Chip 
                label={employee.employeeType.toUpperCase()} 
                size="small" 
                sx={{ fontSize: '0.6rem', fontWeight: 900, height: 18 }} 
              />
              <Chip 
                label={employee.payrollType} 
                size="small" 
                variant="outlined"
                sx={{ fontSize: '0.6rem', fontWeight: 900, height: 18 }} 
              />
            </Stack>
            
            {employee.phone && (
              <Tooltip title="Contactar por WhatsApp">
                <IconButton 
                  size="small" 
                  onClick={handleWhatsApp}
                  sx={{ 
                    color: '#25D366', 
                    bgcolor: 'rgba(37, 211, 102, 0.1)',
                    '&:hover': { bgcolor: 'rgba(37, 211, 102, 0.2)' }
                  }}
                >
                  <WhatsAppIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {isBlacklisted && (
            <Paper elevation={0} sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(244, 67, 54, 0.1)', border: '1px solid rgba(244, 67, 54, 0.2)' }}>
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <GavelIcon sx={{ fontSize: 16, color: 'error.main', mt: 0.2 }} />
                <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 700, lineHeight: 1.2 }}>
                  RESTRICCIÓN: {employee.blacklistReason || 'Sin motivo especificado'}
                </Typography>
              </Stack>
            </Paper>
          )}
        </Stack>
      </CardContent>

      <Divider sx={{ opacity: 0.05 }} />

      {/* ACCIONES */}
      <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end', gap: 1, bgcolor: 'rgba(0,0,0,0.01)' }}>
        <IconButton size="small" onClick={() => onEdit(employee)} color="primary" sx={{ bgcolor: 'rgba(255, 87, 34, 0.05)' }}>
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={() => onDelete(employee.id)} color="error" sx={{ bgcolor: 'rgba(244, 67, 54, 0.05)' }}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    </Card>
  );
}
