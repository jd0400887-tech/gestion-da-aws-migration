import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Button, Chip, 
  IconButton, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, MenuItem, Select, FormControl, 
  InputLabel, Alert, Snackbar, CircularProgress, Tabs, Tab,
  FormControlLabel, Switch, Divider, Stack, Grid
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
    can_view_hotels: true,
    can_view_employees: true,
    can_view_requests: true,
    can_view_applications: true,
    can_view_payroll: false,
    can_view_qa: false,
    can_view_reports: false,
    can_view_adoption: false
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
        can_view_hotels: user.can_view_hotels ?? true,
        can_view_employees: user.can_view_employees ?? true,
        can_view_requests: user.can_view_requests ?? true,
        can_view_applications: user.can_view_applications ?? true,
        can_view_payroll: user.can_view_payroll ?? false,
        can_view_qa: user.can_view_qa ?? false,
        can_view_reports: user.can_view_reports ?? false,
        can_view_adoption: user.can_view_adoption ?? false
      });
    } else {
      setEditingUser(null);
      setUserFormData({ 
        email: '', 
        name: '', 
        role: 'RECRUITER',
        can_view_hotels: true,
        can_view_employees: true,
        can_view_requests: true,
        can_view_applications: true,
        can_view_payroll: false,
        can_view_qa: false,
        can_view_reports: false,
        can_view_adoption: false
      });
    }
    setOpenUserDialog(true);
  };

  const handleUserSubmit = async () => {
    try {
      const client = generateClient<Schema>();
      const dataToSave = {
        email: userFormData.email,
        name: userFormData.name,
        role: userFormData.role,
        can_view_hotels: userFormData.can_view_hotels,
        can_view_employees: userFormData.can_view_employees,
        can_view_requests: userFormData.can_view_requests,
        can_view_applications: userFormData.can_view_applications,
        can_view_payroll: userFormData.can_view_payroll,
        can_view_qa: userFormData.can_view_qa,
        can_view_reports: userFormData.can_view_reports,
        can_view_adoption: userFormData.can_view_adoption
      };

      if (editingUser) {
        await client.models.Profile.update({
          id: editingUser.id,
          ...dataToSave
        });
        setSnackbar({ open: true, message: 'Permisos actualizados correctamente', severity: 'success' });
      } else {
        await client.models.Profile.create(dataToSave);
        setSnackbar({ open: true, message: 'Usuario vinculado con permisos', severity: 'success' });
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

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 900 }}>Panel de Control Admin</Typography>
        <Typography variant="body2" color="text.secondary">Gestión de accesos y permisos granulares</Typography>
      </Box>

      <Paper sx={{ mb: 4, borderRadius: 3, overflow: 'hidden' }}>
        <Tabs value={activeTab} onChange={(_e, val) => setActiveTab(val)} indicatorColor="primary" textColor="primary" variant="fullWidth">
          <Tab label="Usuarios y Permisos" icon={<PersonAddIcon />} iconPosition="start" sx={{ fontWeight: 'bold' }} />
          <Tab label="Cargos de Personal" icon={<WorkIcon />} iconPosition="start" sx={{ fontWeight: 'bold' }} />
        </Tabs>
      </Paper>

      {activeTab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => handleOpenUserDialog()} sx={{ borderRadius: 2 }}>Vincular Usuario</Button>
          </Box>
          <TableContainer component={Paper} sx={{ borderRadius: 4 }}>
            <Table>
              <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Rol Base</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Módulos</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingUsers ? (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5 }}><CircularProgress size={30} /></TableCell></TableRow>
                ) : users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell sx={{ fontWeight: 'bold' }}>{user.name || 'Sin nombre'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell><Chip label={user.role} size="small" color="primary" sx={{ fontWeight: 'bold' }} /></TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {user.can_view_hotels && <Chip label="Hoteles" size="small" variant="outlined" />}
                        {user.can_view_payroll && <Chip label="Nómina" size="small" color="success" variant="outlined" />}
                        {user.can_view_qa && <Chip label="QA" size="small" color="secondary" variant="outlined" />}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleOpenUserDialog(user)} color="primary"><EditIcon /></IconButton>
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
            <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={() => setOpenPositionDialog(true)} sx={{ borderRadius: 2 }}>Añadir Nuevo Cargo</Button>
          </Box>
          <TableContainer component={Paper} sx={{ borderRadius: 4 }}>
            <Table>
              <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Nombre del Cargo</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {positionsLoading ? (
                  <TableRow><TableCell colSpan={2} align="center" sx={{ py: 5 }}><CircularProgress size={30} /></TableCell></TableRow>
                ) : positions.map((pos) => (
                  <TableRow key={pos.id} hover>
                    <TableCell sx={{ fontWeight: 800 }}>{pos.name}</TableCell>
                    <TableCell align="right"><IconButton size="small" onClick={() => deletePosition(pos.id)} color="error"><DeleteIcon /></IconButton></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* DIÁLOGO DE USUARIO CON PERMISOS GRANULARES */}
      <Dialog open={openUserDialog} onClose={() => setOpenUserDialog(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ShieldIcon color="primary" /> {editingUser ? 'Ajustar Permisos' : 'Vincular Usuario y Autorizar'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField label="Email en Cognito" fullWidth size="small" value={userFormData.email} onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })} disabled={!!editingUser} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Nombre Completo" fullWidth size="small" value={userFormData.name} onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Rol Base</InputLabel>
                  <Select value={userFormData.role} label="Rol Base" onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as any })}>
                    <MenuItem value="ADMIN">ADMIN (Control Total)</MenuItem>
                    <MenuItem value="RECRUITER">RECRUITER (Gestión Operativa)</MenuItem>
                    <MenuItem value="INSPECTOR">INSPECTOR (Campo)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}><Divider><Chip label="AUTORIZACIONES DE MÓDULO" size="small" sx={{ fontWeight: 800 }} /></Divider></Grid>

              {[
                { key: 'can_view_hotels', label: 'Ver Módulo Hoteles' },
                { key: 'can_view_employees', label: 'Ver Módulo Personal' },
                { key: 'can_view_requests', label: 'Ver Solicitudes' },
                { key: 'can_view_applications', label: 'Ver Aplicaciones' },
                { key: 'can_view_payroll', label: 'Autorizar Revisión Nómina' },
                { key: 'can_view_qa', label: 'Autorizar Auditorías QA' },
                { key: 'can_view_reports', label: 'Ver Reportes Gerenciales' },
                { key: 'can_view_adoption', label: 'Ver Estadísticas Adopción' },
              ].map((perm) => (
                <Grid item xs={12} sm={6} key={perm.key}>
                  <FormControlLabel
                    control={<Switch checked={(userFormData as any)[perm.key]} onChange={(e) => setUserFormData({ ...userFormData, [perm.key]: e.target.checked })} color="primary" />}
                    label={<Typography variant="body2" sx={{ fontWeight: 600 }}>{perm.label}</Typography>}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenUserDialog(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleUserSubmit} variant="contained" sx={{ borderRadius: 2, fontWeight: 'bold' }}>Guardar Autorizaciones</Button>
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
