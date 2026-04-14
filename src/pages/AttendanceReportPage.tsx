import { useState, useMemo } from 'react';
import { 
  Box, Typography, ToggleButtonGroup, ToggleButton, Paper, Grid, 
  Avatar, Stack, Divider, Tooltip, CircularProgress, useTheme, Chip
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import DriveEtaIcon from '@mui/icons-material/DriveEta';
import HistoryIcon from '@mui/icons-material/History';
import MapIcon from '@mui/icons-material/Map';
import ApartmentIcon from '@mui/icons-material/Apartment';
import { subDays } from 'date-fns';

import { useAuth } from '../hooks/useAuth';
import { useAttendance } from '../hooks/useAttendance';
import type { DateRange } from '../hooks/useAttendance';

import EmptyState from '../components/EmptyState';
import AttendanceFilters from '../components/attendance/AttendanceFilters';
import AttendanceChart from '../components/attendance/AttendanceChart';
import AttendanceGroupedList from '../components/attendance/AttendanceGroupedList';
import AttendanceCalendar from '../components/attendance/AttendanceCalendar';
import MileageReport from '../components/attendance/MileageReport';

export default function AttendanceReportPage() {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const [viewMode, setViewMode] = useState('report'); // report or calendar
  const [dateRange, setDateRange] = useState<DateRange>({ start: subDays(new Date(), 30), end: new Date() });
  const [selectedHotelId, setSelectedHotelId] = useState<string | undefined>();

  const { profile, session } = useAuth();
  const { filteredRecords, visitsByHotel, hotels, hotelsLoading, deleteRecord } = useAttendance(dateRange, selectedHotelId);

  const isInspector = profile?.role === 'INSPECTOR';

  const homeLocation = useMemo(() => {
    const lat = session?.user?.user_metadata?.home_lat;
    const lng = session?.user?.user_metadata?.home_lng;
    if (lat && lng) return { lat: parseFloat(lat), lng: parseFloat(lng) };
    return null;
  }, [session]);

  const recordsWithHotels = useMemo(() => {
    return filteredRecords.map(record => ({
      ...record,
      hotel: hotels.find(h => h.id === record.hotelId),
    }));
  }, [filteredRecords, hotels]);

  const stats = useMemo(() => {
    const visitedHotelIds = new Set(filteredRecords.map(r => r.hotelId));
    const totalHotelsInZone = isInspector 
      ? hotels.filter(h => h.zone === profile?.assigned_zone).length 
      : hotels.length;
    
    const visitedCount = visitedHotelIds.size;
    const coverage = totalHotelsInZone > 0 ? (visitedCount / totalHotelsInZone) * 100 : 0;

    // Hoteles no visitados
    const pendingHotels = (isInspector 
      ? hotels.filter(h => h.zone === profile?.assigned_zone) 
      : hotels).filter(h => !visitedHotelIds.has(h.id));

    // Hotel más visitado
    const topHotel = visitsByHotel.length > 0 ? visitsByHotel[0] : null;

    return {
      totalVisits: filteredRecords.length,
      hotelsVisited: visitedCount,
      totalHotels: totalHotelsInZone,
      coverage,
      pendingHotels,
      topHotel
    };
  }, [filteredRecords, hotels, isInspector, profile, visitsByHotel]);

  const handleViewChange = (_event: React.MouseEvent<HTMLElement>, nextView: string | null) => {
    if (nextView !== null) setViewMode(nextView);
  };

  const renderSmartAnalysis = () => {
    if (hotelsLoading || filteredRecords.length === 0) return null;

    return (
      <Box sx={{ mb: 4, animation: 'fadeIn 0.8s ease-out' }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentIcon color="primary" /> Análisis Inteligente de Cobertura
        </Typography>
        
        <Grid container spacing={3}>
          {/* Cobertura de Zona */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 4, height: '100%', background: 'linear-gradient(135deg, rgba(255, 87, 34, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)', border: '1px solid rgba(255, 87, 34, 0.1)' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', mb: 1, display: 'block' }}>
                Alcance de la Zona
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, mb: 2 }}>
                <Typography variant="h3" sx={{ fontWeight: 900, color: 'primary.main', lineHeight: 1 }}>
                  {Math.round(stats.coverage)}%
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ pb: 0.5 }}>
                  de cobertura
                </Typography>
              </Box>
              <Box sx={{ width: '100%', height: 8, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                <Box sx={{ width: `${stats.coverage}%`, height: '100%', bgcolor: 'primary.main', borderRadius: 4, boxShadow: '0 0 10px rgba(255, 87, 34, 0.5)' }} />
              </Box>
              <Typography variant="caption" sx={{ mt: 1, display: 'block', fontWeight: 600 }}>
                {stats.hotelsVisited} de {stats.totalHotels} hoteles en tu radar.
              </Typography>
            </Paper>
          </Grid>

          {/* Hoteles Críticos (Sin Visita) */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, borderRadius: 4, height: '100%', bgcolor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>
                  Atención Requerida (Sin visitas en este periodo)
                </Typography>
                <Chip 
                  label={`${stats.pendingHotels.length} Pendientes`} 
                  size="small" 
                  color={stats.pendingHotels.length > 0 ? "error" : "success"}
                  sx={{ fontWeight: 800, fontSize: '0.65rem' }} 
                />
              </Stack>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {stats.pendingHotels.length > 0 ? (
                  stats.pendingHotels.map(hotel => (
                    <Chip 
                      key={hotel.id}
                      icon={<ApartmentIcon sx={{ fontSize: '1rem !important' }} />}
                      label={hotel.name}
                      variant="outlined"
                      sx={{ 
                        borderRadius: 2, 
                        borderColor: 'rgba(244, 67, 54, 0.3)',
                        color: 'error.light',
                        '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.05)' }
                      }}
                    />
                  ))
                ) : (
                  <Box sx={{ py: 1, textAlign: 'center', width: '100%' }}>
                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 700 }}>
                      ✅ ¡Excelente! Has cubierto todos los hoteles de tu zona.
                    </Typography>
                  </Box>
                )}
              </Box>

              {stats.topHotel && (
                <Box sx={{ mt: 3, pt: 2, borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    HOTEL CON MAYOR FRECUENCIA: 
                    <Box component="span" sx={{ color: 'primary.main', ml: 1, fontWeight: 900 }}>
                      {stats.topHotel.hotel?.name} ({stats.topHotel.count} visitas)
                    </Box>
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderContent = () => {
    if (filteredRecords.length === 0 && !hotelsLoading) {
      return (
        <EmptyState 
          icon={<AssessmentIcon />}
          title="Sin registros de visita"
          subtitle="No hemos encontrado visitas en este periodo. ¿Has registrado tu ubicación hoy?"
        />
      );
    }

    switch (viewMode) {
      case 'report':
        return (
          <Box sx={{ animation: 'fadeIn 0.5s ease-in-out' }}>
            {renderSmartAnalysis()}
            <AttendanceChart data={visitsByHotel.map(v => ({ hotelId: v.hotel?.id || '', hotelName: v.hotel?.name || '', visits: v.count }))} />
            <AttendanceGroupedList groupedData={visitsByHotel} allRecords={filteredRecords} deleteRecord={deleteRecord} />
          </Box>
        );
      case 'calendar':
        return <AttendanceCalendar records={filteredRecords} hotels={hotels} />;
      case 'mileage':
        return <MileageReport records={recordsWithHotels} homeLocation={homeLocation} />;
      default:
        return null;
    }
  };

  return (
    <Box component="main" sx={{ p: { xs: 1, md: 3 } }}>
      {/* ENCABEZADO PREMIUM */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, mb: 3, borderRadius: 3, 
          background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
          border: '1px solid rgba(33, 150, 243, 0.1)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ backgroundColor: 'info.main', p: 1, borderRadius: 2, display: 'flex', boxShadow: '0 4px 12px rgba(3, 169, 244, 0.3)' }}>
            <AssessmentIcon sx={{ color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-0.5px' }}>Reporte de Visitas</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
              {isInspector ? `ZONA: ${profile?.assigned_zone}` : 'HISTORIAL GLOBAL DE ASISTENCIA'}
            </Typography>
          </Box>
        </Box>

        <ToggleButtonGroup 
          value={viewMode} exclusive onChange={handleViewChange} size="small"
          sx={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, p: 0.5 }}
        >
          <ToggleButton value="report" sx={{ border: 'none', borderRadius: '8px !important', px: 2 }}>
            <EqualizerIcon sx={{ mr: 1, fontSize: 20 }} /> Reporte
          </ToggleButton>
          <ToggleButton value="calendar" sx={{ border: 'none', borderRadius: '8px !important', px: 2 }}>
            <CalendarMonthIcon sx={{ mr: 1, fontSize: 20 }} /> Calendario
          </ToggleButton>
          {/* Mantenemos mileage oculto por ahora a petición del usuario */}
          {/* <ToggleButton value="mileage" sx={{ border: 'none', borderRadius: '8px !important', px: 2 }}>
            <DriveEtaIcon sx={{ mr: 1, fontSize: 20 }} /> Kilometraje
          </ToggleButton> */}
        </ToggleButtonGroup>
      </Paper>

      {/* RESUMEN DE ESTADÍSTICAS RÁPIDAS */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Avatar sx={{ bgcolor: 'info.main', width: 48, height: 48 }}><HistoryIcon /></Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 900 }}>{stats.totalVisits}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>VISITAS TOTALES EN EL PERIODO</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}><MapIcon /></Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 900 }}>{stats.hotelsVisited}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>HOTELES VISITADOS ({Math.round(stats.coverage)}%)</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* FILTROS ESTILIZADOS */}
      <Box sx={{ mb: 4 }}>
        <AttendanceFilters 
          hotels={hotels.filter(h => !isInspector || h.zone === profile?.assigned_zone)}
          hotelsLoading={hotelsLoading}
          dateRange={dateRange}
          onDateChange={setDateRange}
          selectedHotelId={selectedHotelId}
          onHotelChange={setSelectedHotelId}
        />
      </Box>

      {/* CONTENIDO PRINCIPAL */}
      {hotelsLoading ? (
        <Box sx={{ textAlign: 'center', py: 10 }}><CircularProgress /></Box>
      ) : (
        renderContent()
      )}
    </Box>
  );
}
