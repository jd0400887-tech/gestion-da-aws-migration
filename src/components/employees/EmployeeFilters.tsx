import { Paper, TextField, InputAdornment, ToggleButtonGroup, ToggleButton, Box, FormControl, InputLabel, Select, MenuItem, Stack, Typography, Divider, Grid, Button, Tooltip, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MapIcon from '@mui/icons-material/Map';
import ApartmentIcon from '@mui/icons-material/Apartment';
import BadgeIcon from '@mui/icons-material/Badge';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import { useAuth } from '../../hooks/useAuth';
import type { Hotel } from '../../types';
import { useSearchParams } from 'react-router-dom';

interface EmployeeFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusChange: (filter: string) => void;
  hotels: Hotel[];
  zoneFilter: string;
  onZoneChange: (zone: string) => void;
  hotelFilter: string;
  onHotelChange: (hotelId: string) => void;
}

export default function EmployeeFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  hotels,
  zoneFilter,
  onZoneChange,
  hotelFilter,
  onHotelChange,
}: EmployeeFiltersProps) {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isInspector = profile?.role === 'INSPECTOR';

  const isIncompleteDocs = searchParams.get('documentation') === 'incomplete';

  const toggleDocsFilter = () => {
    if (isIncompleteDocs) {
      searchParams.delete('documentation');
    } else {
      searchParams.set('documentation', 'incomplete');
    }
    setSearchParams(searchParams);
  };

  const handleClearFilters = () => {
    onSearchChange('');
    onStatusChange('active');
    if (!isInspector) onZoneChange('all');
    onHotelChange('');
    searchParams.delete('documentation');
    setSearchParams(searchParams);
  };

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 2.5, 
        mb: 3, 
        borderRadius: 4, 
        backgroundColor: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.05) 100%)',
      }}
    >
      <Stack spacing={2.5}>
        {/* FILA SUPERIOR: TÍTULO Y ESTADOS */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ bgcolor: 'primary.main', p: 0.8, borderRadius: 1.5, display: 'flex' }}>
              <BadgeIcon sx={{ color: 'white', fontSize: 18 }} />
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Filtros Avanzados</Typography>
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center">
            <Tooltip title="Filtrar documentación pendiente">
              <Button
                variant={isIncompleteDocs ? "contained" : "outlined"}
                color="warning"
                size="small"
                startIcon={<AssignmentLateIcon />}
                onClick={toggleDocsFilter}
                sx={{ borderRadius: 2, fontWeight: 'bold', height: 36 }}
              >
                Docs. Pendientes
              </Button>
            </Tooltip>

            <ToggleButtonGroup
              color="primary"
              value={statusFilter}
              exclusive
              onChange={(_e, newFilter) => newFilter && onStatusChange(newFilter)}
              size="small"
              sx={{ bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 2, p: 0.5 }}
            >
              <ToggleButton value="active" sx={{ border: 'none', borderRadius: '6px !important', px: 2, fontWeight: 700 }}>Activos</ToggleButton>
              <ToggleButton value="inactive" sx={{ border: 'none', borderRadius: '6px !important', px: 2, fontWeight: 700 }}>Inactivos</ToggleButton>
              <ToggleButton value="blacklisted" sx={{ border: 'none', borderRadius: '6px !important', px: 2, fontWeight: 700, color: 'error.main' }}>Lista Negra</ToggleButton>
            </ToggleButtonGroup>

            <Tooltip title="Limpiar todos los filtros">
              <IconButton onClick={handleClearFilters} sx={{ bgcolor: 'rgba(255,255,255,0.05)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
                <FilterAltOffIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        <Divider sx={{ opacity: 0.05 }} />

        {/* FILA INFERIOR: SELECTORES Y BÚSQUEDA */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Tooltip title={isInspector ? `Su acceso está restringido a la zona: ${profile?.assigned_zone || 'Centro'}` : "Filtrar por zona geográfica"}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontWeight: 600 }}>Zona Operativa</InputLabel>
                <Select
                  value={zoneFilter}
                  onChange={(e) => onZoneChange(e.target.value)}
                  label="Zona Operativa"
                  disabled={isInspector}
                  startAdornment={<InputAdornment position="start"><MapIcon fontSize="small" color={isInspector ? "warning" : "primary"} /></InputAdornment>}
                  sx={{ 
                    borderRadius: 2, 
                    fontWeight: 600,
                    bgcolor: isInspector ? 'rgba(255, 87, 34, 0.05)' : 'transparent'
                  }}
                >
                  <MenuItem value="all">Todas las Zonas</MenuItem>
                  <MenuItem value="Centro">Centro</MenuItem>
                  <MenuItem value="Norte">Norte</MenuItem>
                  <MenuItem value="Noroeste">Noroeste</MenuItem>
                </Select>
              </FormControl>
            </Tooltip>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontWeight: 600 }}>Hotel Específico</InputLabel>
              <Select
                value={hotelFilter}
                onChange={(e) => onHotelChange(e.target.value)}
                label="Hotel Específico"
                startAdornment={<InputAdornment position="start"><ApartmentIcon fontSize="small" color="primary" /></InputAdornment>}
                sx={{ borderRadius: 2, fontWeight: 600 }}
              >
                <MenuItem value=""><em>Cualquier Hotel</em></MenuItem>
                {hotels
                  .filter(h => {
                    const activeZone = isInspector ? (profile?.assigned_zone || 'Centro') : zoneFilter;
                    return activeZone === 'all' || h.zone === activeZone;
                  })
                  .map((hotel) => (
                    <MenuItem key={hotel.id} value={hotel.id}>{hotel.name}</MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Buscar por nombre de empleado..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="primary" /></InputAdornment>,
                sx: { borderRadius: 2, fontWeight: 600 }
              }}
            />
          </Grid>
        </Grid>
      </Stack>
    </Paper>
  );
}
