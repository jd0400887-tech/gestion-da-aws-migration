import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Button, Chip, 
  IconButton, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, MenuItem, Select, FormControl, 
  InputLabel, Alert, Snackbar, CircularProgress 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';
import { useAuth } from '../hooks/useAuth';

export default function UsersPage() {
  const { profile: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({ email: '', name: '', role: 'RECRUITER' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const client = generateClient<Schema>();
      const { data } = await client.models.Profile.list();
      setUsers(data || []);
    } catch (error) {
      console.error('Error al cargar usuarios de AWS:', error);
      setSnackbar({ open: true, message: 'Error al cargar usuarios', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenDialog = (user: any = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({ email: user.email, name: user.name || '', role: user.role });
    } else {
      setEditingUser(null);
      setFormData({ email: '', name: '', role: 'RECRUITER' });
    }
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    try {
      const client = generateClient<Schema>();
      if (editingUser) {
        await client.models.Profile.update({
          id: editingUser.id,
          name: formData.name,
          role: formData.role as any
        });
        setSnackbar({ open: true, message: 'Usuario actualizado en AWS', severity: 'success' });
      } else {
        await client.models.Profile.create({
          email: formData.email,
          name: formData.name,
          role: formData.role as any
        });
        setSnackbar({ open: true, message: 'Usuario vinculado en AWS con éxito', severity: 'success' });
      }
      setOpenDialog(false);
      fetchUsers();
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Error: ' + error.message, severity: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este perfil de acceso?')) return;
    try {
      const client = generateClient<Schema>();
      await client.models.Profile.delete({ id });
      setSnackbar({ open: true, message: 'Perfil eliminado correctamente', severity: 'success' });
      fetchUsers();
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al eliminar perfil', severity: 'error' });
    }
  };

  if (currentUser?.role !== 'ADMIN') {
    return (
      <Box sx={{ p: 4 }}><Alert severity="error">No tienes permisos para acceder a esta sección.</Alert></Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>Gestión de Accesos</Typography>
          <Typography variant="body2" color="text.secondary">Control de roles y perfiles en AWS Cognito/RDS</Typography>
        </Box>
        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => handleOpenDialog()} sx={{ borderRadius: 2 }}>Vincular Usuario</Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
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
            {loading ? (
              <TableRow><TableCell colSpan={4} align="center" sx={{ py: 5 }}><CircularProgress size={30} /></TableCell></TableRow>
            ) : users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell sx={{ fontWeight: 'bold' }}>{user.name || 'Sin nombre'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip label={user.role} size="small" color={user.role === 'ADMIN' ? 'primary' : (user.role === 'RECRUITER' ? 'info' : 'secondary')} sx={{ fontWeight: 'bold' }} />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenDialog(user)} color="primary"><EditIcon /></IconButton>
                    <IconButton size="small" onClick={() => handleDelete(user.id)} color="error"><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={4} align="center" sx={{ py: 5 }}>No hay usuarios vinculados en AWS.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>{editingUser ? 'Editar Perfil' : 'Vincular Nuevo Usuario'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Email en Cognito" fullWidth value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} disabled={!!editingUser} />
            <TextField label="Nombre Completo" fullWidth value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            <FormControl fullWidth>
              <InputLabel>Rol de Acceso</InputLabel>
              <Select value={formData.role} label="Rol de Acceso" onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                <MenuItem value="ADMIN">ADMIN (Control Total)</MenuItem>
                <MenuItem value="RECRUITER">RECRUITER (Gestión Personal)</MenuItem>
                <MenuItem value="INSPECTOR">INSPECTOR (Auditoría/Campo)</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">Guardar en AWS</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}><Alert severity={snackbar.severity}>{snackbar.message}</Alert></Snackbar>
    </Box>
  );
}
