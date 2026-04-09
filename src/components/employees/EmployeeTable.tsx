import { 
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Paper, IconButton, Chip, Avatar, Box, Typography, 
  Tooltip, useTheme, Stack 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import type { Employee, Hotel } from '../../types';
import { getInitials } from '../../utils/stringUtils';

interface EmployeeTableProps {
  employees: Employee[];
  hotels: Hotel[];
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
}

export default function EmployeeTable({ employees, hotels, onEdit, onDelete }: EmployeeTableProps) {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)' }}>
      <Table>
        <TableHead sx={{ bgcolor: isLight ? '#f8fafc' : 'rgba(255,255,255,0.02)' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 800 }}>Colaborador</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Cargo</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Hotel Asignado</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Nómina</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Estado</TableCell>
            <TableCell align="right" sx={{ fontWeight: 800 }}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {employees.map((employee) => {
            const hotel = hotels.find(h => h.id === employee.hotelId);
            return (
              <TableRow key={employee.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: employee.isBlacklisted ? 'error.main' : 'primary.main', fontWeight: 900, width: 35, height: 35, fontSize: '0.8rem' }}>
                      {getInitials(employee.name)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{employee.name}</Typography>
                      <Typography variant="caption" color="text.secondary">ID: {employee.employeeNumber}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{employee.role}</Typography>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{hotel ? hotel.name : 'No Asignado'}</Typography>
                    <Typography variant="caption" color="text.secondary">{hotel?.city || '-'}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={employee.payrollType} size="small" variant="outlined" sx={{ fontWeight: 800, fontSize: '0.65rem' }} />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={employee.isBlacklisted ? 'BLOQUEADO' : (employee.isActive ? 'ACTIVO' : 'INACTIVO')} 
                    size="small" 
                    color={employee.isBlacklisted ? 'error' : (employee.isActive ? 'success' : 'default')}
                    sx={{ fontWeight: 900, fontSize: '0.65rem' }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    {employee.phone && (
                      <IconButton size="small" onClick={() => handleWhatsApp(employee.phone!)} sx={{ color: '#25D366' }}>
                        <WhatsAppIcon fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton size="small" onClick={() => onEdit(employee)} color="primary">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => onDelete(employee.id)} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
