import { 
  TextField, Button, Box, Grid, Typography, FormControl, InputLabel, 
  Select, MenuItem, Stack, Divider, Avatar, Paper, useTheme, 
  Switch, FormControlLabel, InputAdornment 
} from '@mui/material';

// Iconos
import PersonIcon from '@mui/icons-material/Person';
import ApartmentIcon from '@mui/icons-material/Apartment';
import BadgeIcon from '@mui/icons-material/Badge';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import GavelIcon from '@mui/icons-material/Gavel';
import WorkIcon from '@mui/icons-material/Work';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

import type { Employee, Hotel } from '../../types';
import { toTitleCase } from '../../utils/stringUtils';

interface EmployeeFormProps {
  employeeData: Partial<Employee>;
  onFormChange: (field: keyof Employee, value: any) => void;
  hotels: Hotel[];
  roles: string[];
  onToggleBlacklist: () => void;
}

export default function EmployeeForm({ employeeData, onFormChange, hotels, roles, onToggleBlacklist }: EmployeeFormProps) {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';

  // Estilo base para inputs
  const inputStyles = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
    }
  };

  const handleNameChange = (val: string) => {
    onFormChange('name', toTitleCase(val));
  };

  return (
    <Box sx={{ mt: 1 }}>
      <Grid container spacing={3}>
        
        {/* --- SECCIÓN 1: IDENTIDAD --- */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ 
            p: 2, borderRadius: 3, 
            background: 'linear-gradient(135deg, rgba(255, 87, 34, 0.08) 0%, rgba(255, 255, 255, 0) 100%)',
            border: '1px solid rgba(255, 87, 34, 0.1)'
          }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2.5 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, boxShadow: '0 4px 10px rgba(255, 87, 34, 0.3)' }}>
                <PersonIcon />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Datos del Colaborador</Typography>
                <Typography variant="caption" color="text.secondary">Identificación y contacto personal</Typography>
              </Box>
            </Stack>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={7}>
                <TextField 
                  label="Nombre Completo" 
                  fullWidth size="small" 
                  value={employeeData.name || ''} 
                  onChange={(e) => handleNameChange(e.target.value)} 
                  required 
                  sx={inputStyles}
                  InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon fontSize="small" color="primary" /></InputAdornment> }}
                />
              </Grid>
              <Grid item xs={12} sm={5}>
                <TextField 
                  label="ID Sistema" 
                  fullWidth size="small" 
                  value={employeeData.employeeNumber || ''} 
                  disabled
                  helperText="Generado automáticamente"
                  sx={inputStyles}
                  InputProps={{ startAdornment: <InputAdornment position="start"><BadgeIcon fontSize="small" /></InputAdornment> }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="Teléfono (WhatsApp)" 
                  fullWidth size="small" 
                  value={employeeData.phone || ''} 
                  onChange={(e) => onFormChange('phone', e.target.value)} 
                  required 
                  sx={inputStyles}
                  InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon fontSize="small" color="primary" /></InputAdornment> }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="Email (Opcional)" 
                  fullWidth size="small" 
                  value={employeeData.email || ''} 
                  onChange={(e) => onFormChange('email', e.target.value.toLowerCase())} 
                  sx={inputStyles}
                  InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon fontSize="small" color="action" /></InputAdornment> }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* --- SECCIÓN 2: ASIGNACIÓN --- */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ 
            p: 2, borderRadius: 3, 
            background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.08) 0%, rgba(255, 255, 255, 0) 100%)',
            border: '1px solid rgba(33, 150, 243, 0.1)'
          }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2.5 }}>
              <Avatar sx={{ bgcolor: '#2196F3', width: 40, height: 40, boxShadow: '0 4px 10px rgba(33, 150, 243, 0.3)' }}>
                <ApartmentIcon />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Ubicación y Cargo</Typography>
                <Typography variant="caption" color="text.secondary">Detalles del puesto de trabajo</Typography>
              </Box>
            </Stack>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" required sx={inputStyles}>
                  <InputLabel>Hotel Asignado</InputLabel>
                  <Select 
                    value={employeeData.hotelId || ''} 
                    label="Hotel Asignado" 
                    onChange={(e) => onFormChange('hotelId', e.target.value)}
                    startAdornment={<InputAdornment position="start"><ApartmentIcon fontSize="small" color="info" /></InputAdornment>}
                  >
                    {hotels.map(h => <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" required sx={inputStyles}>
                  <InputLabel>Cargo / Rol</InputLabel>
                  <Select 
                    value={employeeData.role || ''} 
                    label="Cargo / Rol" 
                    onChange={(e) => onFormChange('role', e.target.value)}
                    startAdornment={<InputAdornment position="start"><WorkIcon fontSize="small" color="info" /></InputAdornment>}
                  >
                    {roles.map(pos => <MenuItem key={pos} value={pos}>{pos}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" required sx={inputStyles}>
                  <InputLabel>Tipo de Nómina</InputLabel>
                  <Select 
                    value={employeeData.payrollType || 'timesheet'} 
                    label="Tipo de Nómina" 
                    onChange={(e) => onFormChange('payrollType', e.target.value)}
                    startAdornment={<InputAdornment position="start"><AccountBalanceWalletIcon fontSize="small" color="info" /></InputAdornment>}
                  >
                    <MenuItem value="timesheet">Timesheet (Estándar)</MenuItem>
                    <MenuItem value="Workrecord">Workrecord (Control Diario)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" required sx={inputStyles}>
                  <InputLabel>Contrato</InputLabel>
                  <Select value={employeeData.employeeType || 'permanente'} label="Contrato" onChange={(e) => onFormChange('employeeType', e.target.value)}>
                    <MenuItem value="permanente">Permanente</MenuItem>
                    <MenuItem value="temporal">Temporal / Eventual</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* --- SECCIÓN 3: ESTADO Y SEGURIDAD --- */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ 
            p: 2, borderRadius: 3, 
            background: employeeData.isBlacklisted 
              ? 'linear-gradient(135deg, rgba(244, 67, 54, 0.1) 0%, rgba(255, 255, 255, 0) 100%)'
              : 'linear-gradient(135deg, rgba(76, 175, 80, 0.08) 0%, rgba(255, 255, 255, 0) 100%)',
            border: `1px solid ${employeeData.isBlacklisted ? 'rgba(244, 67, 54, 0.2)' : 'rgba(76, 175, 80, 0.1)'}`
          }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: employeeData.isBlacklisted ? 'error.main' : 'success.main', width: 40, height: 40, boxShadow: 10 }}>
                  {employeeData.isBlacklisted ? <GavelIcon /> : <BadgeIcon />}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Estado y Seguridad</Typography>
                  <Typography variant="caption" color="text.secondary">Control disciplinario y estatus activo</Typography>
                </Box>
              </Stack>
              
              <Stack direction="row" spacing={2}>
                <FormControlLabel
                  control={<Switch checked={!!employeeData.isActive} onChange={(e) => onFormChange('isActive', e.target.checked)} color="success" />}
                  label={<Typography variant="body2" sx={{ fontWeight: 'bold' }}>ACTIVO</Typography>}
                />
                <FormControlLabel
                  control={<Switch checked={!!employeeData.isBlacklisted} onChange={onToggleBlacklist} color="error" />}
                  label={<Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>LISTA NEGRA</Typography>}
                />
              </Stack>
            </Stack>

            {employeeData.isBlacklisted && (
              <Box sx={{ mt: 2 }}>
                <TextField
                  label="Motivo de la Restricción"
                  fullWidth
                  multiline
                  rows={2}
                  required
                  value={employeeData.blacklistReason || ''}
                  onChange={(e) => onFormChange('blacklistReason', e.target.value)}
                  placeholder="Explique detalladamente la razón de la restricción..."
                  sx={inputStyles}
                  error={!employeeData.blacklistReason}
                  helperText={!employeeData.blacklistReason ? "El motivo es obligatorio para la Lista Negra" : ""}
                />
              </Box>
            )}
          </Paper>
        </Grid>

      </Grid>
    </Box>
  );
}
