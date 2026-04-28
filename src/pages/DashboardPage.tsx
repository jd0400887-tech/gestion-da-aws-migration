import { useState, useMemo, lazy, Suspense, useEffect } from 'react';
import { 
  Box, Toolbar, Button, Snackbar, Alert, CircularProgress, Typography, 
  Grid, Paper, Stack, Fab, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, ToggleButton, ToggleButtonGroup, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Chip, Avatar, Tooltip 
} from '@mui/material';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';

// Iconos
import MyLocationIcon from '@mui/icons-material/MyLocation';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PeopleIcon from '@mui/icons-material/People';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

import { useHotels } from '../hooks/useHotels';
import { useAuth } from '../hooks/useAuth';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useAttendance } from '../hooks/useAttendance';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';
import { importMasterData } from '../services/importService';

// Lazy load components
const LazyMapContainer = lazy(() => import('react-leaflet').then(module => ({ default: module.MapContainer })));
const LazyTileLayer = lazy(() => import('react-leaflet').then(module => ({ default: module.TileLayer })));
const LazyMarker = lazy(() => import('react-leaflet').then(module => ({ default: module.Marker })));
const LazyPopup = lazy(() => import('react-leaflet').then(module => ({ default: module.Popup })));

import StatCard from '../components/dashboard/StatCard';
import RecruiterDashboard from '../components/dashboard/RecruiterDashboard';

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

function DashboardPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [selectedZone, setSelectedZone] = useState<'Todas' | 'Centro' | 'Norte' | 'Noroeste'>('Todas');
  const [qaScore, setQaScore] = useState<number | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Inicializar zona según el perfil del usuario
  useEffect(() => {
    if (profile?.assigned_zone) {
      setSelectedZone(profile.assigned_zone as any);
    }
  }, [profile]);

  const { hotels } = useHotels();
  const { addRecord } = useAttendance({ start: null, end: null });
  
  const statsFilter = useMemo(() => ({ zone: selectedZone }), [selectedZone]);
  const { stats: globalStats, loading: statsLoading } = useDashboardStats(statsFilter);

  useEffect(() => {
    const fetchQaScore = async () => {
      try {
        const client = generateClient<Schema>();
        const { data } = await client.models.QAAudit.list();
        const zoneHotelIds = hotels
          .filter(h => selectedZone === 'Todas' || h.zone === selectedZone)
          .map(h => h.id);
        const zoneAudits = data.filter(audit => zoneHotelIds.includes(audit.hotel_id || ''));
        if (zoneAudits && zoneAudits.length > 0) {
          const avg = Math.round(zoneAudits.reduce((acc, curr) => acc + curr.score, 0) / zoneAudits.length);
          setQaScore(avg);
        } else {
          setQaScore(null);
        }
      } catch (e) {
        console.error("Error al cargar score QA de AWS:", e);
      }
    };
    if (profile && hotels.length > 0) fetchQaScore();
  }, [profile, selectedZone, hotels]);

  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [snackbarInfo, setSnackbarInfo] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' | 'info' });

  const isAdmin = profile?.role === 'ADMIN';
  const isInspector = profile?.role === 'INSPECTOR';
  const isRecruiter = profile?.role === 'RECRUITER';

  const filteredHotels = hotels.filter(h => selectedZone === 'Todas' || h.zone === selectedZone);
  const hotelsWithLocation = filteredHotels.filter(h => h.latitude != null && h.longitude != null);
  
  const mapCenter = useMemo((): [number, number] => {
    if (hotelsWithLocation.length > 0) {
      return [hotelsWithLocation[0].latitude!, hotelsWithLocation[0].longitude!];
    }
    return [33.7490, -84.3880]; // Atlanta, GA por defecto
  }, [hotelsWithLocation]);

  const handleImportData = async () => {
    if (!window.confirm('¿Deseas iniciar la carga masiva de los hoteles y empleados detectados en el PDF?')) return;
    setIsImporting(true);
    try {
      const results = await importMasterData();
      setSnackbarInfo({ 
        open: true, 
        message: `¡Carga exitosa! ${results.hotelsCreated} hoteles y ${results.employeesCreated} empleados inyectados.`, 
        severity: 'success' 
      });
    } catch (err: any) {
      setSnackbarInfo({ open: true, message: `Error en carga: ${err.message}`, severity: 'error' });
    } finally {
      setIsImporting(false);
    }
  };

  const handleCheckIn = async () => {
    setIsCheckingIn(true);
    try {
      if (!navigator.geolocation) throw new Error("Geolocalización no soportada");
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const result = await addRecord(latitude, longitude);
          setSnackbarInfo({ open: true, message: `¡Visita registrada en ${result.hotelName}!`, severity: 'success' });
        } catch (err: any) {
          setSnackbarInfo({ open: true, message: err.message, severity: 'error' });
        } finally {
          setIsCheckingIn(false);
        }
      }, (error) => {
        setSnackbarInfo({ open: true, message: "Error de ubicación.", severity: 'error' });
        setIsCheckingIn(false);
      });
    } catch (error: any) {
      setSnackbarInfo({ open: true, message: error.message, severity: 'error' });
      setIsCheckingIn(false);
    }
  };

  const renderInspectorDashboard = () => (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 900, color: 'primary.main', mb: 4 }}>Panel de Inspección</Typography>
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Hoteles" value={globalStats.totalHotels} icon={<ApartmentIcon />} onClick={() => navigate('/hoteles')} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Personal" value={globalStats.activeEmployees} icon={<PeopleIcon />} onClick={() => navigate('/empleados')} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Aplicaciones" value={globalStats.pendingApplications} icon={<PendingActionsIcon />} onClick={() => navigate('/aplicaciones')} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Calidad QA" value={qaScore !== null ? `${qaScore}%` : '--'} icon={<VerifiedUserIcon />} onClick={() => navigate('/calidad')} /></Grid>
      </Grid>
      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ borderRadius: 4, overflow: 'hidden', height: '400px' }}>
            <Suspense fallback={<CircularProgress />}>
              <LazyMapContainer center={mapCenter} zoom={8} style={{ height: '100%', width: '100%' }}>
                <LazyTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {hotelsWithLocation.map((hotel) => (
                  <LazyMarker key={hotel.id} position={[hotel.latitude!, hotel.longitude!]}>
                    <LazyPopup>{hotel.name}</LazyPopup>
                  </LazyMarker>
                ))}
              </LazyMapContainer>
            </Suspense>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  const renderAdminDashboard = () => (
    <Box sx={{ p: 2 }}>
      <Box sx={{ mb: 3, p: 3, borderRadius: 3, background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Carga Maestra de Datos</Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>Inyectar información de hoteles y empleados desde el PDF procesado.</Typography>
        </Box>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleImportData} 
          disabled={isImporting}
          startIcon={isImporting ? <CircularProgress size={20} color="inherit" /> : <PendingActionsIcon />}
          sx={{ borderRadius: 2, fontWeight: 'bold' }}
        >
          {isImporting ? 'Inyectando...' : 'Iniciar Carga Masiva'}
        </Button>
      </Box>

      <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>Panel Administrativo</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Hoteles" value={globalStats.totalHotels} icon={<ApartmentIcon />} onClick={() => navigate('/hoteles')} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Personal Activo" value={globalStats.activeEmployees} icon={<PeopleIcon />} onClick={() => navigate('/empleados')} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Aplicaciones" value={globalStats.pendingApplications} icon={<PendingActionsIcon />} onClick={() => navigate('/aplicaciones')} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Calidad QA" value={qaScore !== null ? `${qaScore}%` : '--'} icon={<VerifiedUserIcon />} onClick={() => navigate('/calidad')} /></Grid>
      </Grid>
    </Box>
  );

  return (
    <>
      <Box component="main" sx={{ p: 1 }}>
        {isRecruiter ? (
          <RecruiterDashboard stats={globalStats} selectedZone={selectedZone} onZoneChange={setSelectedZone as any} />
        ) : isInspector ? (
          renderInspectorDashboard()
        ) : (
          renderAdminDashboard()
        )}
      </Box>
      {isInspector && (
        <Fab color="primary" sx={{ position: 'fixed', bottom: 32, right: 32 }} onClick={handleCheckIn} disabled={isCheckingIn}>
          {isCheckingIn ? <CircularProgress color="inherit" size={24} /> : <MyLocationIcon />}
        </Fab>
      )}
      <Snackbar open={snackbarInfo.open} autoHideDuration={6000} onClose={() => setSnackbarInfo({ ...snackbarInfo, open: false })}><Alert severity={snackbarInfo.severity}>{snackbarInfo.message}</Alert></Snackbar>
    </>
  );
}

export default DashboardPage;
