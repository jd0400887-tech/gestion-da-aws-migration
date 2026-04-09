import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Button, Chip, 
  IconButton, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, MenuItem, Select, FormControl, 
  InputLabel, Alert, Snackbar, CircularProgress, Tabs, Tab 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import WorkIcon from '@mui/icons-material/Work';
import AddIcon from '@mui/icons-material/Add';

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
  const [userFormData, setUserFormData] = useState({ email: '', name: '', role: 'RECRUITER' });
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
      setUserFormData({ email: user.email, name: user.name || '', role: user.role });
    } else {
      setEditingUser(null);
      setUserFormData({ email: '', name: '', role: 'RECRUITER' });
    }
    setOpenUserDialog(true);
  };

  const handleUserSubmit = async () => {
    try {
      const client = generateClient<Schema>();
      if (editingUser) {
        await client.models.Profile.update({
          id: editingUser.id,
          name: userFormData.name,
          role: userFormData.role as any
        });
        setSnackbar({ open: true, message: 'Usuario actualizado', severity: 'success' });
      } else {
        await client.models.Profile.create({
          email: userFormData.email,
          name: userFormData.name,
          role: userFormData.role as any
        });
        setSnackbar({ open: true, message: 'Usuario vinculado', severity: 'success' });
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

    // 1. VALIDACIÓN DE DUPLICADOS (Ignorando mayúsculas/minúsculas)
    const exists = positions.some(p => p.name.toLowerCase() === cleanName.toLowerCase());
    if (exists) {
      setSnackbar({ open: true, message: `El cargo "${cleanName}" ya existe en el sistema.`, severity: 'error' });
      return;
    }

    try {
      // 2. FORMATEO PROFESIONAL
      const formattedName = cleanName
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      await addPosition(formattedName, positionFormData.description);
      setSnackbar({ open: true, message: 'Cargo añadido correctamente', severity: 'success' });
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
        <Typography variant="body2" color="text.secondary">Gestión global de accesos y parámetros del sistema</Typography>
      </Box>

      <Paper sx={{ mb: 4, borderRadius: 3, overflow: 'hidden' }}>
        <Tabs value={activeTab} onChange={(_e, val) => setActiveTab(val)} indicatorColor="primary" textColor="primary" variant="fullWidth">
          <Tab label="Gestión de Usuarios" icon={<PersonAddIcon />} iconPosition="start" sx={{ fontWeight: 'bold' }} />
          <Tab label="Cargos de Personal" icon={<WorkIcon />} iconPosition="start" sx={{ fontWeight: 'bold' }} />
        </Tabs>
      </Paper>

      {/* CONTENIDO TAB 0: USUARIOS */}
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
                  <TableCell sx={{ fontWeight: 'bold' }}>Rol</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingUsers ? (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 5 }}><CircularProgress size={30} /></TableCell></TableRow>
                ) : users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell sx={{ fontWeight: 'bold' }}>{user.name || 'Sin nombre'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell><Chip label={user.role} size="small" color="primary" sx={{ fontWeight: 'bold' }} /></TableCell>
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

      {/* CONTENIDO TAB 1: CARGOS */}
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
                  <TableCell sx={{ fontWeight: 'bold' }}>Descripción</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {positionsLoading ? (
                  <TableRow><TableCell colSpan={3} align="center" sx={{ py: 5 }}><CircularProgress size={30} /></TableCell></TableRow>
                ) : positions.length > 0 ? (
                  positions.map((pos) => (
                    <TableRow key={pos.id} hover>
                      <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>{pos.name}</TableCell>
                      <TableCell color="text.secondary">{pos.description || 'Sin descripción'}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => deletePosition(pos.id)} color="error"><DeleteIcon /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={3} align="center" sx={{ py: 5 }}>No hay cargos definidos aún.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* DIALOGS */}
      <Dialog open={openUserDialog} onClose={() => setOpenUserDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 'bold' }}>{editingUser ? 'Editar Perfil' : 'Vincular Nuevo Usuario'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Email en Cognito" fullWidth value={userFormData.email} onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })} disabled={!!editingUser} />
            <TextField label="Nombre Completo" fullWidth value={userFormData.name} onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })} />
            <FormControl fullWidth>
              <InputLabel>Rol de Acceso</InputLabel>
              <Select value={userFormData.role} label="Rol de Acceso" onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}>
                <MenuItem value="ADMIN">ADMIN</MenuItem>
                <MenuItem value="RECRUITER">RECRUITER</MenuItem>
                <MenuItem value="INSPECTOR">INSPECTOR</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenUserDialog(false)}>Cancelar</Button>
          <Button onClick={handleUserSubmit} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openPositionDialog} onClose={() => setOpenPositionDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 'bold' }}>Añadir Nuevo Cargo</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Nombre del Cargo (Ej: Housekeeping)" fullWidth value={positionFormData.name} onChange={(e) => setPositionFormData({ ...positionFormData, name: e.target.value })} />
            <TextField label="Descripción (Opcional)" fullWidth multiline rows={2} value={positionFormData.description} onChange={(e) => setPositionFormData({ ...positionFormData, description: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenPositionDialog(false)}>Cancelar</Button>
          <Button onClick={handlePositionSubmit} variant="contained" color="secondary">Crear Cargo</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}><Alert severity={snackbar.severity}>{snackbar.message}</Alert></Snackbar>
    </Box>
  );
}
