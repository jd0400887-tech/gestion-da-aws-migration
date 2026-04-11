import { useParams, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { 
  Box, Typography, Paper, Grid, List, ListItem, ListItemText, Chip, 
  IconButton, Avatar, Stack, Divider, Button, Tooltip, CircularProgress, 
  useTheme, TextField, InputAdornment, FormControlLabel, Switch
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ApartmentIcon from '@mui/icons-material/Apartment';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';
import MapIcon from '@mui/icons-material/Map';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BadgeIcon from '@mui/icons-material/Badge';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import SearchIcon from '@mui/icons-material/Search';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SmartToyIcon from '@mui/icons-material/SmartToy';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useEmployees } from '../hooks/useEmployees';
import L from 'leaflet';
import { useHotels } from '../hooks/useHotels';
import TurnoverAnalysis from '../components/hotel/TurnoverAnalysis';
import S3Image from '../components/common/S3Image';

// Leaflet icon fix
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function HotelDetailPage() {
  const { hotelId } = useParams<{ hotelId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  
  const { hotels, loading } = useHotels();
  const { employees } = useEmployees();
  
  const [showOnlyPermanent, setShowOnlyPermanent] = useState(false);
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  const [employeeSearch, setEmployeeSearch] = useState('');

  const hotel = hotels.find(h => h.id === hotelId);

  const assignedEmployees = employees.filter(emp => emp.hotelId === hotelId);
  
  const displayedEmployees = useMemo(() => {
    return assignedEmployees.filter(employee => {
      const matchesPermanent = showOnlyPermanent ? employee.employeeType === 'permanente' : true;
      const matchesActive = showOnlyActive ? employee.isActive : true;
      const matchesSearch = employee.name.toLowerCase().includes(employeeSearch.toLowerCase());
      return matchesPermanent && matchesActive && matchesSearch;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [assignedEmployees, showOnlyPermanent, showOnlyActive, employeeSearch]);

  const stats = useMemo(() => ({
    total: assignedEmployees.length,
    active: assignedEmployees.filter(emp => emp.isActive && !emp.isBlacklisted).length,
    inactive: assignedEmployees.filter(emp => !emp.isActive && !emp.isBlacklisted).length,
    blocked: assignedEmployees.filter(emp => emp.isBlacklisted).length
  }), [assignedEmployees]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  if (!hotel) return <Box sx={{ p: 4, textAlign: 'center' }}><Typography variant="h5" color="error">Hotel no encontrado</Typography></Box>;

  const mapCenter = useMemo((): [number, number] | null => {
    if (hotel?.latitude != null && hotel?.longitude != null) {
      return [Number(hotel.latitude), Number(hotel.longitude)];
    }
    return null;
  }, [hotel?.latitude, hotel?.longitude]);

  return (
    <Box sx={{ pb: 5 }}>
      {/* 1. BANNER HERO */}
      <Box sx={{ 
        height: 280, 
        width: '100%', 
        position: 'relative', 
        overflow: 'hidden',
        mb: 4
      }}>
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
          <S3Image path={hotel.imageUrl} alt={hotel.name} height={280} />
        </Box>

        <Box sx={{ 
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.3) 100%)',
          zIndex: 1
        }} />
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/hoteles')}
          sx={{ position: 'absolute', top: 20, left: 20, color: 'white', bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
        >
          Volver
        </Button>

        <Box sx={{ position: 'relative', zIndex: 1, p: { xs: 3, md: 5 }, width: '100%', display: 'flex', alignItems: 'center', gap: 3 }}>
          <Avatar variant="rounded" sx={{ width: 100, height: 100, bgcolor: 'primary.main', border: '4px solid white', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}><ApartmentIcon sx={{ fontSize: 60 }} /></Avatar>
          <Box sx={{ color: 'white' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Chip label={hotel.hotelCode} size="small" sx={{ bgcolor: 'white', color: 'primary.main', fontWeight: 900 }} />
              <Chip label={hotel.zone} size="small" sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 900 }} />
              <Chip label={hotel.city} size="small" variant="outlined" sx={{ color: 'white', borderColor: 'white' }} />
            </Stack>
            <Typography variant="h2" sx={{ fontWeight: 900, textShadow: '0 2px 10px rgba(0,0,0,0.5)', mb: 0.5 }}>{hotel.name}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.8 }}><LocationOnIcon fontSize="small" /><Typography variant="body1">{hotel.address}</Typography></Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ px: { xs: 2, md: 4 } }}>
        <Paper elevation={0} sx={{ p: 2, mb: 4, borderRadius: 3, bgcolor: isLight ? '#f8fafc' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><PersonIcon color="primary" fontSize="small" /><Typography variant="body2" sx={{ fontWeight: 'bold' }}>Gerente: <Typography component="span" variant="body2" color="text.secondary">{hotel.managerName || 'No asignado'}</Typography></Typography></Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><PhoneIcon color="primary" fontSize="small" /><Typography variant="body2" sx={{ fontWeight: 'bold' }}>Tel: <Typography component="span" variant="body2" color="text.secondary">{hotel.phone || 'N/A'}</Typography></Typography></Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><EmailIcon color="primary" fontSize="small" /><Typography variant="body2" sx={{ fontWeight: 'bold' }}>Email: <Typography component="span" variant="body2" color="text.secondary">{hotel.email || 'N/A'}</Typography></Typography></Box>
        </Paper>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            { label: 'Total Personal', val: stats.total, color: 'primary.main', icon: <PeopleIcon /> },
            { label: 'Activos', val: stats.active, color: 'success.main', icon: <TrendingUpIcon /> },
            { label: 'Inactivos', val: stats.inactive, color: 'text.secondary', icon: <PeopleIcon /> },
            { label: 'Restringidos', val: stats.blocked, color: 'error.main', icon: <BadgeIcon /> },
          ].map((s) => (
            <Grid item xs={6} md={3} key={s.label}>
              <Paper sx={{ p: 2, borderRadius: 3, textAlign: 'center', border: '1px solid rgba(0,0,0,0.05)', bgcolor: isLight ? 'white' : 'rgba(255,255,255,0.02)' }}>
                <Box sx={{ color: s.color, mb: 1, display: 'flex', justifyContent: 'center' }}>{s.icon}</Box>
                <Typography variant="h4" sx={{ fontWeight: 900 }}>{s.val}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>{s.label}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={4}>
          <Grid item xs={12} lg={5}>
            <Stack spacing={3}>
              <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)', height: 350 }}>
                {mapCenter ? (
                  <MapContainer key={`map-${mapCenter[0]}`} center={mapCenter} zoom={16} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={mapCenter}><Popup>{hotel.name}</Popup></Marker>
                  </MapContainer>
                ) : (
                  <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.05)' }}>
                    <MapIcon sx={{ fontSize: 40, opacity: 0.2 }} /><Typography color="text.secondary">Mapa no disponible</Typography>
                  </Box>
                )}
              </Paper>
              <Typography variant="caption" sx={{ textAlign: 'center', opacity: 0.3 }}>ID TÉCNICO: {hotel.id}</Typography>
            </Stack>
          </Grid>

          <Grid item xs={12} lg={7}>
            <Stack spacing={3}>
              {/* PANEL DE ORANJEBOT */}
              <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid rgba(0, 136, 204, 0.1)', bgcolor: isLight ? '#f0f9ff' : 'rgba(0, 136, 204, 0.05)' }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#0088cc', width: 40, height: 40 }}><SmartToyIcon /></Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>OranjeBot</Typography>
                    <Typography variant="caption" color="text.secondary">Integración con Telegram</Typography>
                  </Box>
                </Stack>
                
                {hotel.telegram_chat_id ? (
                  <Box>
                    <Chip 
                      icon={<SmartToyIcon style={{ color: 'white' }} />} 
                      label={`Vinculado: ${hotel.telegram_chat_id}`} 
                      sx={{ bgcolor: '#0088cc', color: 'white', fontWeight: 'bold', width: '100%', mb: 1 }} 
                    />
                    <Typography variant="caption" display="block" sx={{ textAlign: 'center', opacity: 0.7 }}>
                      El hotel ya puede gestionar vacantes vía Telegram.
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
                      INVITACIÓN PARA EL HOTEL
                    </Typography>
                    <Typography variant="caption" sx={{ mb: 2, display: 'block', opacity: 0.8 }}>
                      Envía este enlace al gerente para activar su bot:
                    </Typography>
                    
                    <Stack spacing={1}>
                      <Button 
                        variant="contained" 
                        fullWidth
                        onClick={() => {
                          const link = `https://t.me/OranjeAssistant_bot?start=${hotel.id}`;
                          navigator.clipboard.writeText(link);
                          alert("¡Enlace copiado al portapapeles!");
                        }}
                        startIcon={<ContentCopyIcon />}
                        sx={{ bgcolor: '#0088cc', borderRadius: 2, fontWeight: 'bold' }}
                      >
                        Copiar Enlace Mágico
                      </Button>

                      <Button 
                        variant="outlined" 
                        fullWidth
                        component="a"
                        href={`https://wa.me/?text=${encodeURIComponent(`Hello! Here is your activation link for OranjeBot: https://t.me/OranjeAssistant_bot?start=${hotel.id}`)}`}
                        target="_blank"
                        startIcon={<PhoneIcon />}
                        sx={{ borderColor: '#25D366', color: '#25D366', '&:hover': { bgcolor: 'rgba(37, 211, 102, 0.05)', borderColor: '#128C7E' }, borderRadius: 2, fontWeight: 'bold' }}
                      >
                        Enviar por WhatsApp
                      </Button>
                    </Stack>

                    <Typography variant="caption" sx={{ mt: 1.5, display: 'block', fontSize: '0.65rem', opacity: 0.5, fontStyle: 'italic' }}>
                      El gerente solo debe pulsar "Iniciar" en Telegram.
                    </Typography>
                  </Box>
                )}
              </Paper>

              <TurnoverAnalysis hotelId={hotel.id} />
              
              <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid rgba(0,0,0,0.05)', bgcolor: isLight ? 'white' : 'rgba(255,255,255,0.02)' }}>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>Lista de Personal</Typography>
                    <Chip label={`${displayedEmployees.length} empleados`} size="small" color="primary" variant="outlined" sx={{ fontWeight: 800 }} />
                  </Box>
                  
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6}>
                      <TextField 
                        fullWidth size="small" 
                        placeholder="Buscar por nombre..." 
                        value={employeeSearch}
                        onChange={(e) => setEmployeeSearch(e.target.value)}
                        InputProps={{ 
                          startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                          sx: { borderRadius: 2 }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <FormControlLabel
                          control={<Switch size="small" checked={showOnlyActive} onChange={(e) => setShowOnlyActive(e.target.checked)} color="success" />}
                          label={<Typography variant="caption" sx={{ fontWeight: 800 }}>ACTIVOS</Typography>}
                        />
                        <FormControlLabel
                          control={<Switch size="small" checked={showOnlyPermanent} onChange={(e) => setShowOnlyPermanent(e.target.checked)} />}
                          label={<Typography variant="caption" sx={{ fontWeight: 800 }}>PERMANENTES</Typography>}
                        />
                      </Stack>
                    </Grid>
                  </Grid>
                </Box>

                <Divider sx={{ mb: 2, opacity: 0.05 }} />

                <List sx={{ px: 0 }}>
                  {displayedEmployees.map(employee => (
                    <ListItem 
                      key={employee.id} 
                      divider 
                      sx={{ 
                        px: 1, py: 1.5, borderRadius: 3, mb: 1, transition: 'all 0.2s',
                        '&:hover': { bgcolor: 'rgba(255, 87, 34, 0.03)', transform: 'translateX(5px)' }
                      }}
                      secondaryAction={
                        <Tooltip title="Ver Ficha Completa">
                          <IconButton edge="end" onClick={() => navigate('/empleados')} color="primary" size="small">
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      }
                    >
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 42, height: 42, fontWeight: 900, fontSize: '0.9rem' }}>{employee.name[0]}</Avatar>
                      <ListItemText
                        primary={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Typography variant="body2" sx={{ fontWeight: 800 }}>{employee.name}</Typography>{!employee.isActive && <Chip label="INACTIVO" size="small" sx={{ height: 16, fontSize: '0.55rem', fontWeight: 900 }} />}</Box>}
                        secondary={<Typography variant="caption" color="text.secondary">{employee.role} • ID: {employee.employeeNumber}</Typography>}
                      />
                    </ListItem>
                  ))}
                  {displayedEmployees.length === 0 && (
                    <Box sx={{ py: 6, textAlign: 'center', opacity: 0.3 }}>
                      <PeopleIcon sx={{ fontSize: 50, mb: 1 }} /><Typography variant="body2" sx={{ fontWeight: 'bold' }}>No hay personal que coincida</Typography>
                    </Box>
                  )}
                </List>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
