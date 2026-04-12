import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Button, Chip, 
  IconButton, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, MenuItem, Select, FormControl, 
  InputLabel, Alert, Snackbar, CircularProgress, Tabs, Tab,
  FormControlLabel, Switch, Divider, Stack, Grid, Avatar
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import WorkIcon from '@mui/icons-material/Work';
import AddIcon from '@mui/icons-material/Add';
import ShieldIcon from '@mui/icons-material/Shield';

import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';
import { useAuth } from '../hooks/useAuth';
import { usePositions } from '../hooks/usePositions';

export default function UsersPage() {
  const { profile: currentUser } = useAuth();
  const { positions, addPosition, deletePosition, loading: positionsLoading } = usePositions();
  
  const [activeTab, setActiveTab] = useState(0);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [openPositionDialog, setOpenPositionDialog] = useState(false);
  
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userFormData, setUserFormData] = useState({ 
    email: '', 
    name: '', 
    role: 'RECRUITER',
    assigned_zone: '',
    can_view_hotels: true,
    can_view_employees: true,
    can_view_requests: true,
    can_view_applications: true,
    can_view_payroll: false,
    can_view_qa: false,
    can_view_reports: false,
    can_view_adoption: false,
    can_edit_hotels: false,
    can_edit_employees: false,
    can_edit_requests: false,
    can_approve_applications: false,
    can_manage_users: false,
  });
  
  const [positionFormData, setPositionFormData] = useState({ name: '', description: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const client = generateClient<Schema>();
      const { data } = await client.models.Profile.list();
      setUsers(data || []);
    } catch (error) {
      console.error('Error al cargar usuarios de AWS:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenUserDialog = (user: any = null) => {
    if (user) {
      setEditingUser(user);
      setUserFormData({ 
        email: user.email, 
        name: user.name || '', 
        role: user.role,
        assigned_zone: user.assigned_zone || '',
        can_view_hotels: user.can_view_hotels ?? true,
        can_view_employees: user.can_view_employees ?? true,
        can_view_requests: user.can_view_requests ?? true,
        can_view_applications: user.can_view_applications ?? true,
        can_view_payroll: user.can_view_payroll ?? false,
        can_view_qa: user.can_view_qa ?? false,
        can_view_reports: user.can_view_reports ?? false,
        can_view_adoption: user.can_view_adoption ?? false,
        can_edit_hotels: user.can_edit_hotels ?? false,
        can_edit_employees: user.can_edit_employees ?? false,
        can_edit_requests: user.can_edit_requests ?? false,
        can_approve_applications: user.can_approve_applications ?? false,
        can_manage_users: user.can_manage_users ?? false,
      });
    } else {
      setEditingUser(null);
      setUserFormData({ 
        email: '', 
        name: '', 
        role: 'RECRUITER',
        assigned_zone: '',
        can_view_hotels: true,
        can_view_employees: true,
        can_view_requests: true,
        can_view_applications: true,
        can_view_payroll: false,
        can_view_qa: false,
        can_view_reports: false,
        can_view_adoption: false,
        can_edit_hotels: false,
        can_edit_employees: false,
        can_edit_requests: false,
        can_approve_applications: false,
        can_manage_users: false,
      });
    }
    setOpenUserDialog(true);
  };

  const handleUserSubmit = async () => {
    try {
      const client = generateClient<Schema>();
      const dataToSave = { ...userFormData };

      if (editingUser) {
        await client.models.Profile.update({
          id: editingUser.id,
          ...dataToSave
        });
        setSnackbar({ open: true, message: 'Permisos actualizados correctamente', severity: 'success' });
      } else {
        await client.models.Profile.create(dataToSave);
        setSnackbar({ open: true, message: 'Usuario vinculado con éxito', severity: 'success' });
      }
      setOpenUserDialog(false);
      fetchUsers();
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Error: ' + error.message, severity: 'error' });
    }
  };

  const handlePositionSubmit = async () => {
    const cleanName = positionFormData.name.trim();
    if (!cleanName) return;
    const exists = positions.some(p => p.name.toLowerCase() === cleanName.toLowerCase());
    if (exists) {
      setSnackbar({ open: true, message: `El cargo "${cleanName}" ya existe.`, severity: 'error' });
      return;
    }
    try {
      await addPosition(cleanName, positionFormData.description);
      setSnackbar({ open: true, message: 'Cargo añadido', severity: 'success' });
      setOpenPositionDialog(false);
      setPositionFormData({ name: '', description: '' });
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Error al crear cargo', severity: 'error' });
    }
  };

  if (currentUser?.role !== 'ADMIN') {
    return <Box sx={{ p: 4 }}><Alert severity="error">No tienes permisos para acceder al Panel de Control.</Alert></Box>;
  }

  const handleRoleChange = (role: string) => {
    let newPerms = { ...userFormData, role };

    switch(role) {
      case 'ADMIN':
        newPerms = {
          ...newPerms,
          can_view_hotels: true, can_edit_hotels: true,
          can_view_employees: true, can_edit_employees: true,
          can_view_requests: true, can_edit_requests: true,
          can_view_applications: true, can_approve_applications: true,
          can_view_payroll: true, can_view_qa: true,
          can_view_reports: true, can_view_adoption: true,
          can_manage_users: true
        };
        break;
      case 'COORDINATOR':
        newPerms = {
          ...newPerms,
          can_view_hotels: true, can_edit_hotels: true,
          can_view_employees: true, can_edit_employees: true,
          can_view_requests: true, can_edit_requests: true,
          can_view_applications: true, can_approve_applications: true,
          can_view_payroll: false, can_view_qa: true,
          can_view_reports: true, can_view_adoption: false,
          can_manage_users: false
        };
        break;
      case 'RECRUITER':
        newPerms = {
          ...newPerms,
          can_view_hotels: true, can_edit_hotels: false,
          can_view_employees: true, can_edit_employees: false,
          can_view_requests: true, can_edit_requests: true,
          can_view_applications: true, can_approve_applications: true,
          can_view_payroll: false, can_view_qa: false,
          can_view_reports: false, can_view_adoption: false,
          can_manage_users: false
        };
        break;
      case 'INSPECTOR':
        newPerms = {
          ...newPerms,
          can_view_hotels: true, can_edit_hotels: false,
          can_view_employees: true, can_edit_employees: false,
          can_view_requests: true, can_edit_requests: false,
          can_view_applications: true, can_approve_applications: false,
          can_view_payroll: false, can_view_qa: true,
          can_view_reports: false, can_view_adoption: false,
          can_manage_users: false
        };
        break;
    }
    setUserFormData(newPerms);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-1px' }}>Panel de Control Admin</Typography>
          <Typography variant="body2" color="text.secondary">Gestión de accesos y permisos granulares de OranjeApp</Typography>
        </Box>
        <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}><ShieldIcon /></Avatar>
      </Box>

      <Paper sx={{ mb: 4, borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)' }}>
        <Tabs value={activeTab} onChange={(_e, val) => setActiveTab(val)} indicatorColor="primary" textColor="primary" variant="fullWidth">
          <Tab label="Usuarios y Autorizaciones" icon={<PersonAddIcon />} iconPosition="start" sx={{ fontWeight: 'bold' }} />
          <Tab label="Cargos Oficiales" icon={<WorkIcon />} iconPosition="start" sx={{ fontWeight: 'bold' }} />
        </Tabs>
      </Paper>

      {activeTab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => handleOpenUserDialog()} sx={{ borderRadius: 2, px: 3, fontWeight: 'bold' }}>Vincular Nuevo Usuario</Button>
          </Box>
          <TableContainer component={Paper} sx={{ borderRadius: 4, border: '1px solid rgba(0,0,0,0.05)' }}>
            <Table>
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Nombre del Usuario</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Email / ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Rol del Sistema</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Zona Asignada</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingUsers ? (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5 }}><CircularProgress size={30} /></TableCell></TableRow>
                ) : users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: 'primary.light' }}>{user.name?.[0]}</Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>{user.name || 'Sin nombre'}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell><Chip label={user.role} size="small" sx={{ fontWeight: 900, bgcolor: 'rgba(0,0,0,0.05)' }} /></TableCell>
                    <TableCell><Typography variant="caption" sx={{ fontWeight: 700 }}>{user.assigned_zone || 'Global'}</Typography></TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => handleOpenUserDialog(user)} sx={{ borderRadius: 1.5, fontWeight: 'bold', textTransform: 'none' }}>Configurar</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={() => setOpenPositionDialog(true)} sx={{ borderRadius: 2, fontWeight: 'bold' }}>Añadir Nuevo Cargo</Button>
          </Box>
          <TableContainer component={Paper} sx={{ borderRadius: 4, border: '1px solid rgba(0,0,0,0.05)' }}>
            <Table>
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Nombre del Cargo</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Gestión</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {positionsLoading ? (
                  <TableRow><TableCell colSpan={2} align="center" sx={{ py: 5 }}><CircularProgress size={30} /></TableCell></TableRow>
                ) : positions.map((pos) => (
                  <TableRow key={pos.id} hover>
                    <TableCell sx={{ fontWeight: 800 }}>{pos.name}</TableCell>
                    <TableCell align="right"><IconButton size="small" onClick={() => deletePosition(pos.id)} color="error" sx={{ bgcolor: 'rgba(244, 67, 54, 0.05)' }}><DeleteIcon fontSize="small" /></IconButton></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* DIÁLOGO DE USUARIO CON MATRIZ DE PERMISOS */}
      <Dialog open={openUserDialog} onClose={() => setOpenUserDialog(false)} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ p: 3, bgcolor: '#0F172A', color: 'white', display: 'flex', alignItems: 'center', gap: 2 }}>
          <ShieldIcon sx={{ color: 'primary.main' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>Gestión de Autorizaciones</Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>Control granular de accesos para {userFormData.email || 'nuevo usuario'}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, bgcolor: '#F8FAFC' }}>
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <TextField label="Nombre del Usuario" fullWidth size="small" value={userFormData.name} onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })} variant="filled" sx={{ bgcolor: 'white' }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Email (Cognito)" fullWidth size="small" value={userFormData.email} onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })} disabled={!!editingUser} variant="filled" sx={{ bgcolor: 'white' }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small" variant="filled">
                  <InputLabel>Rol Base</InputLabel>
                  <Select value={userFormData.role} label="Rol Base" onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as any })} sx={{ bgcolor: 'white' }}>
                    <MenuItem value="ADMIN">ADMIN (Acceso Total)</MenuItem>
                    <MenuItem value="RECRUITER">RECRUITER (Reclutamiento)</MenuItem>
                    <MenuItem value="INSPECTOR">INSPECTOR (Campo/GPS)</MenuItem>
                    <MenuItem value="BUSINESS_DEVELOPER">BUSINESS DEVELOPER</MenuItem>
                    <MenuItem value="COORDINATOR">COORDINADOR</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small" variant="filled">
                  <InputLabel>Zona Asignada</InputLabel>
                  <Select value={userFormData.assigned_zone} label="Zona Asignada" onChange={(e) => setUserFormData({ ...userFormData, assigned_zone: e.target.value })} sx={{ bgcolor: 'white' }}>
                    <MenuItem value="">Global (Todas)</MenuItem>
                    <MenuItem value="Centro">Centro</MenuItem>
                    <MenuItem value="Norte">Norte</MenuItem>
                    <MenuItem value="Noroeste">Noroeste</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2, mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ShieldIcon fontSize="small" color="primary" /> MATRIZ DE PERMISOS GRANULARES
                </Typography>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.05)', bgcolor: 'white' }}>
                  <Grid container spacing={4}>
                    {/* CATEGORÍA: OPERACIONES */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="overline" sx={{ fontWeight: 900, color: 'primary.main' }}>Operaciones y Hoteles</Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Stack spacing={1}>
                        <FormControlLabel control={<Switch checked={userFormData.can_view_hotels} onChange={(e) => setUserFormData({ ...userFormData, can_view_hotels: e.target.checked })} />} label={<Typography variant="body2">Ver Hoteles</Typography>} />
                        <FormControlLabel control={<Switch checked={userFormData.can_edit_hotels} onChange={(e) => setUserFormData({ ...userFormData, can_edit_hotels: e.target.checked })} />} label={<Typography variant="body2">Editar/Eliminar Hoteles</Typography>} />
                        <FormControlLabel control={<Switch checked={userFormData.can_view_employees} onChange={(e) => setUserFormData({ ...userFormData, can_view_employees: e.target.checked })} />} label={<Typography variant="body2">Ver Personal</Typography>} />
                        <FormControlLabel control={<Switch checked={userFormData.can_edit_employees} onChange={(e) => setUserFormData({ ...userFormData, can_edit_employees: e.target.checked })} />} label={<Typography variant="body2">Editar/Baja Personal</Typography>} />
                      </Stack>
                    </Grid>

                    {/* CATEGORÍA: RECLUTAMIENTO */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="overline" sx={{ fontWeight: 900, color: 'primary.main' }}>Reclutamiento</Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Stack spacing={1}>
                        <FormControlLabel control={<Switch checked={userFormData.can_view_requests} onChange={(e) => setUserFormData({ ...userFormData, can_view_requests: e.target.checked })} />} label={<Typography variant="body2">Ver Solicitudes</Typography>} />
                        <FormControlLabel control={<Switch checked={userFormData.can_edit_requests} onChange={(e) => setUserFormData({ ...userFormData, can_edit_requests: e.target.checked })} />} label={<Typography variant="body2">Crear/Editar Solicitudes</Typography>} />
                        <FormControlLabel control={<Switch checked={userFormData.can_view_applications} onChange={(e) => setUserFormData({ ...userFormData, can_view_applications: e.target.checked })} />} label={<Typography variant="body2">Ver Aplicaciones</Typography>} />
                        <FormControlLabel control={<Switch checked={userFormData.can_approve_applications} onChange={(e) => setUserFormData({ ...userFormData, can_approve_applications: e.target.checked })} />} label={<Typography variant="body2">Autorizar Alta (Aprobar)</Typography>} />
                      </Stack>
                    </Grid>

                    {/* CATEGORÍA: ADMINISTRACIÓN */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="overline" sx={{ fontWeight: 900, color: 'primary.main' }}>Finanzas y Calidad</Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Stack spacing={1}>
                        <FormControlLabel control={<Switch checked={userFormData.can_view_payroll} onChange={(e) => setUserFormData({ ...userFormData, can_view_payroll: e.target.checked })} />} label={<Typography variant="body2">Revisión de Nómina</Typography>} />
                        <FormControlLabel control={<Switch checked={userFormData.can_view_qa} onChange={(e) => setUserFormData({ ...userFormData, can_view_qa: e.target.checked })} />} label={<Typography variant="body2">Auditorías Calidad QA</Typography>} />
                        <FormControlLabel control={<Switch checked={userFormData.can_view_reports} onChange={(e) => setUserFormData({ ...userFormData, can_view_reports: e.target.checked })} />} label={<Typography variant="body2">Reportes Gerenciales</Typography>} />
                      </Stack>
                    </Grid>

                    {/* CATEGORÍA: SISTEMA */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="overline" sx={{ fontWeight: 900, color: 'primary.main' }}>Configuración</Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Stack spacing={1}>
                        <FormControlLabel control={<Switch checked={userFormData.can_manage_users} onChange={(e) => setUserFormData({ ...userFormData, can_manage_users: e.target.checked })} />} label={<Typography variant="body2">Gestionar Otros Usuarios</Typography>} />
                        <FormControlLabel control={<Switch checked={userFormData.can_view_adoption} onChange={(e) => setUserFormData({ ...userFormData, can_view_adoption: e.target.checked })} />} label={<Typography variant="body2">Panel de Adopción Digital</Typography>} />
                      </Stack>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: '#F8FAFC', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
          <Button onClick={() => setOpenUserDialog(false)} color="inherit" sx={{ fontWeight: 'bold' }}>Cancelar</Button>
          <Button onClick={handleUserSubmit} variant="contained" sx={{ borderRadius: 2, px: 4, fontWeight: 'bold', boxShadow: '0 4px 12px rgba(255, 87, 34, 0.2)' }}>Guardar Configuración de Acceso</Button>
        </DialogActions>
      </Dialog>

      {/* DIÁLOGO CARGO */}
      <Dialog open={openPositionDialog} onClose={() => setOpenPositionDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 'bold' }}>Añadir Nuevo Cargo</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}><TextField label="Nombre del Cargo" fullWidth value={positionFormData.name} onChange={(e) => setPositionFormData({ ...positionFormData, name: e.target.value })} /></Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenPositionDialog(false)}>Cancelar</Button>
          <Button onClick={handlePositionSubmit} variant="contained" color="secondary">Crear</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}><Alert severity={snackbar.severity}>{snackbar.message}</Alert></Snackbar>
    </Box>
  );
}
