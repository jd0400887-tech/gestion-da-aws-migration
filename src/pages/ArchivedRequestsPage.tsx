import { useState, useMemo } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Chip, IconButton, Grid, TextField, Select, MenuItem, InputLabel, 
  FormControl, Button, InputAdornment, Avatar, Tooltip, Stack, Divider, CircularProgress
} from '@mui/material';

// Iconos
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import SearchIcon from '@mui/icons-material/Search';
import ApartmentIcon from '@mui/icons-material/Apartment';
import WorkIcon from '@mui/icons-material/Work';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CategoryIcon from '@mui/icons-material/Category';
import AssignmentIcon from '@mui/icons-material/Assignment';

import { useStaffingRequestsContext } from '../contexts/StaffingRequestsContext';
import { useHotels } from '../hooks/useHotels';
import { useAuth } from '../hooks/useAuth';
import type { StaffingRequest } from '../types';
import ConfirmationDialog from '../components/common/ConfirmationDialog';
import StaffingRequestDetailsDialog from '../components/staffing-requests/StaffingRequestDetailsDialog';

const statusColors: { [key in StaffingRequest['status'] | 'Archivada']: 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error' } = {
  'Pendiente': 'default',
  'Enviada a Reclutamiento': 'primary',
  'En Proceso': 'info',
  'Completada': 'success',
  'Completada Parcialmente': 'warning',
  'Cancelada por Hotel': 'error',
  'Candidato No Presentado': 'error',
  'Vencida': 'error',
  'Archivada': 'default'
};

const allStatuses: (StaffingRequest['status'] | 'Archivada')[] = ['Pendiente', 'Enviada a Reclutamiento', 'En Proceso', 'Completada', 'Completada Parcialmente', 'Candidato No Presentado', 'Cancelada por Hotel', 'Vencida', 'Archivada'];
const requestTypes = ['temporal', 'permanente'];

export default function ArchivedRequestsPage() {
  const { profile } = useAuth();
  const { deleteRequest, updateRequest, archivedRequests, loading } = useStaffingRequestsContext();
  const { hotels } = useHotels();

  const isAdmin = profile?.role === 'ADMIN';

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<StaffingRequest | null>(null);

  const [filters, setFilters] = useState({
    hotelName: '',
    role: '',
    status: '',
    request_type: '',
    startDate: '',
    endDate: '',
  });

  const handleFilterChange = (e: any) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name as string]: value as string }));
  };

  const handleClearFilters = () => {
    setFilters({
      hotelName: '',
      role: '',
      status: '',
      request_type: '',
      startDate: '',
      endDate: '',
    });
  };

  // Enriquecemos los datos con los nombres de hoteles
  const enrichedArchivedRequests = useMemo(() => {
    return archivedRequests.map(req => {
      const hotel = hotels.find(h => h.id === req.hotel_id);
      return {
        ...req,
        hotelName: hotel ? hotel.name : 'Hotel no encontrado'
      };
    });
  }, [archivedRequests, hotels]);

  const filteredRequests = useMemo(() => {
    return enrichedArchivedRequests.filter(req => {
      // 1. Filtro de Fechas (Precisión por día)
      const startDate = filters.startDate ? new Date(filters.startDate + 'T00:00:00') : null;
      const endDate = filters.endDate ? new Date(filters.endDate + 'T23:59:59') : null;
      const reqDate = new Date(req.start_date + 'T00:00:00');

      if (startDate && reqDate < startDate) return false;
      if (endDate && reqDate > endDate) return false;

      // 2. Normalización de textos para evitar errores con null/undefined
      const hotelMatch = (req.hotelName || '').toLowerCase().includes(filters.hotelName.toLowerCase());
      const roleMatch = (req.role || '').toLowerCase().includes(filters.role.toLowerCase());
      const statusMatch = filters.status === '' || req.status === filters.status;
      const typeMatch = filters.request_type === '' || req.request_type === filters.request_type;

      return hotelMatch && roleMatch && statusMatch && typeMatch;
    });
  }, [enrichedArchivedRequests, filters]);

  const handleUnarchive = async (id: string) => {
    // Restauramos a Pendiente (o podrías restaurar al último estado conocido si lo guardáramos)
    await updateRequest(id, { status: 'Pendiente' });
  };

  const handleDeleteClick = (id: string) => {
    setRequestToDelete(id);
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (requestToDelete) {
      await deleteRequest(requestToDelete);
    }
    setIsConfirmDialogOpen(false);
    setRequestToDelete(null);
  };

  const handleRowClick = (request: StaffingRequest) => {
    setSelectedRequest(request);
    setIsDetailsDialogOpen(true);
  };

  return (
    <Box sx={{ p: 0 }}>
      {/* SECCIÓN DE FILTROS */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 2, 
          mb: 3, 
          borderRadius: 3, 
          backgroundColor: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)'
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <SearchIcon color="primary" fontSize="small" />
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Búsqueda en Histórico</Typography>
        </Stack>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Hotel"
              name="hotelName"
              value={filters.hotelName}
              onChange={handleFilterChange}
              size="small"
              InputProps={{
                startAdornment: <InputAdornment position="start"><ApartmentIcon fontSize="small" color="primary" /></InputAdornment>,
                sx: { borderRadius: 2 }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Cargo"
              name="role"
              value={filters.role}
              onChange={handleFilterChange}
              size="small"
              InputProps={{
                startAdornment: <InputAdornment position="start"><WorkIcon fontSize="small" color="primary" /></InputAdornment>,
                sx: { borderRadius: 2 }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                label="Estado"
                startAdornment={<InputAdornment position="start"><AssignmentIcon fontSize="small" color="primary" /></InputAdornment>}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value=""><em>Todos</em></MenuItem>
                {allStatuses.map(status => (
                  <MenuItem key={status} value={status}>{status}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo</InputLabel>
              <Select
                name="request_type"
                value={filters.request_type}
                onChange={handleFilterChange}
                label="Tipo"
                startAdornment={<InputAdornment position="start"><CategoryIcon fontSize="small" color="primary" /></InputAdornment>}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value=""><em>Todos</em></MenuItem>
                {requestTypes.map(type => (
                  <MenuItem key={type} value={type}>{type.toUpperCase()}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button
              variant="outlined"
              onClick={handleClearFilters}
              fullWidth
              startIcon={<FilterAltOffIcon />}
              sx={{ borderRadius: 2, height: 40 }}
            >
              Limpiar
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Desde"
              name="startDate"
              type="date"
              value={filters.startDate}
              onChange={handleFilterChange}
              InputLabelProps={{ shrink: true }}
              size="small"
              InputProps={{
                startAdornment: <InputAdornment position="start"><CalendarMonthIcon fontSize="small" color="primary" /></InputAdornment>,
                sx: { borderRadius: 2 }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Hasta"
              name="endDate"
              type="date"
              value={filters.endDate}
              onChange={handleFilterChange}
              InputLabelProps={{ shrink: true }}
              size="small"
              InputProps={{
                startAdornment: <InputAdornment position="start"><CalendarMonthIcon fontSize="small" color="primary" /></InputAdornment>,
                sx: { borderRadius: 2 }
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* TABLA DE RESULTADOS */}
      <TableContainer 
        component={Paper} 
        sx={{ 
          borderRadius: 3,
          backgroundColor: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          maxHeight: 'calc(100vh - 350px)',
          '&::-webkit-scrollbar': { width: '8px' },
          '&::-webkit-scrollbar-thumb': { backgroundColor: 'primary.main', borderRadius: '4px' },
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ backgroundColor: 'background.paper', fontWeight: 'bold' }}>Hotel</TableCell>
              <TableCell sx={{ backgroundColor: 'background.paper', fontWeight: 'bold' }}>Cargo y Tipo</TableCell>
              <TableCell sx={{ backgroundColor: 'background.paper', fontWeight: 'bold' }}>Estado</TableCell>
              <TableCell sx={{ backgroundColor: 'background.paper', fontWeight: 'bold', textAlign: 'center' }}>Personal</TableCell>
              <TableCell sx={{ backgroundColor: 'background.paper', fontWeight: 'bold' }}>Fecha</TableCell>
              <TableCell sx={{ backgroundColor: 'background.paper', fontWeight: 'bold', textAlign: 'right' }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} sx={{ textAlign: 'center', py: 5 }}><CircularProgress size={30} /></TableCell></TableRow>
            ) : filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: 'center', py: 10 }}>
                  <AssignmentIcon sx={{ fontSize: 40, opacity: 0.2, mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">No se encontraron solicitudes archivadas</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((req) => (
                <TableRow 
                  key={req.id} 
                  hover 
                  onClick={() => handleRowClick(req)} 
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(255,255,255,0.03)' } }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ bgcolor: 'rgba(255, 87, 34, 0.1)', color: 'primary.main', width: 32, height: 32, fontSize: '0.9rem' }}>
                        {req.hotelName?.[0] || 'H'}
                      </Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{req.hotelName}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{req.role}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>{req.request_type}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={req.status} 
                      color={statusColors[req.status]} 
                      size="small" 
                      variant="outlined"
                      sx={{ fontWeight: 'bold', fontSize: '0.7rem' }} 
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{req.num_of_people}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{new Date(req.start_date).toLocaleDateString()}</Typography>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="Restaurar al Kanban">
                        <IconButton 
                          onClick={(e) => { e.stopPropagation(); handleUnarchive(req.id); }} 
                          size="small" 
                          sx={{ color: 'info.main', backgroundColor: 'rgba(2, 136, 209, 0.1)' }}
                        >
                          <UnarchiveIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {isAdmin && (
                        <Tooltip title="Eliminar Permanentemente">
                          <IconButton 
                            onClick={(e) => { e.stopPropagation(); handleDeleteClick(req.id); }} 
                            size="small" 
                            sx={{ color: 'error.main', backgroundColor: 'rgba(211, 47, 47, 0.1)' }}
                          >
                            <DeleteForeverIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <ConfirmationDialog 
        open={isConfirmDialogOpen} 
        onClose={() => setIsConfirmDialogOpen(false)} 
        onConfirm={handleConfirmDelete} 
        title="Eliminar Permanentemente" 
        message="¿Estás seguro de que quieres eliminar esta solicitud? Esta acción es definitiva y no se puede deshacer." 
      />
      
      <StaffingRequestDetailsDialog 
        open={isDetailsDialogOpen} 
        onClose={() => setIsDetailsDialogOpen(false)} 
        request={selectedRequest} 
      />
    </Box>
  );
}
