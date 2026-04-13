import { Box, Typography, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button, ToggleButtonGroup, ToggleButton, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import StatCard from './StatCard';
import DashboardPieChart from './DashboardPieChart';
import { DashboardBarChart } from './DashboardBarChart';

// Icons
import PeopleIcon from '@mui/icons-material/People';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import AssignmentIcon from '@mui/icons-material/Assignment';
import WarningIcon from '@mui/icons-material/Warning';
import PublicIcon from '@mui/icons-material/Public';
import LocationOnIcon from '@mui/icons-material/LocationOn';

interface RecruiterDashboardProps {
  stats: any;
  selectedZone: string;
  onZoneChange: (zone: 'Todas' | 'Centro' | 'Norte' | 'Noroeste') => void;
}

export default function RecruiterDashboard({ stats, selectedZone, onZoneChange }: RecruiterDashboardProps) {
  const navigate = useNavigate();
  const theme = useTheme();

  const recruitmentStats = [
    { title: "Solicitudes Activas", value: stats.activeRequestsCount, icon: <AssignmentIcon />, color: 'primary.main' },
    { title: "Sin Gestionar", value: stats.pendingRequests, icon: <PendingActionsIcon />, color: '#ff9800' },
    { title: "Inician Hoy/Mañ", value: stats.urgentStarts, icon: <WarningIcon />, color: '#f44336' },
    { title: "% Cobertura", value: `${stats.coverageRate}%`, icon: <PeopleIcon />, color: '#4caf50' },
  ];

  const complianceData = [
    { name: 'A Tiempo (<24h)', value: stats.compliance72h.onTime, color: '#4caf50' },
    { name: 'En Riesgo (>48h)', value: stats.compliance72h.critical, color: '#ff9800' },
    { name: 'Vencidas (>72h)', value: stats.compliance72h.overdue, color: '#f44336' },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', textShadow: '0 0 10px rgba(255, 87, 34, 0.3)' }}>
          Panel de Reclutamiento
        </Typography>

        {/* Switcher Minimalista (Opción 1) */}
        <Paper sx={{ 
          p: 0.5, 
          display: 'flex', 
          backgroundColor: theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.4)', 
          borderRadius: '12px',
          border: '1px solid',
          borderColor: theme.palette.mode === 'light' ? 'rgba(255, 87, 34, 0.1)' : 'rgba(255, 87, 34, 0.3)',
          boxShadow: theme.palette.mode === 'light' ? '0 2px 10px rgba(0,0,0,0.05)' : '0 4px 20px rgba(0,0,0,0.5)'
        }}>
          <ToggleButtonGroup
            value={selectedZone}
            exclusive
            onChange={(_e, val) => val && onZoneChange(val)}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                border: 'none',
                borderRadius: '8px',
                color: theme.palette.text.secondary,
                px: 3,
                py: 0.5,
                mx: 0.5,
                transition: 'all 0.3s ease',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  boxShadow: '0 0 15px rgba(255, 87, 34, 0.5)',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  }
                },
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'light' ? 'rgba(255, 87, 34, 0.05)' : 'rgba(255, 255, 255, 0.05)',
                  color: 'primary.light'
                }
              }
            }}
          >
            <ToggleButton value="Todas">Todas</ToggleButton>
            <ToggleButton value="Centro">Centro</ToggleButton>
            <ToggleButton value="Norte">Norte</ToggleButton>
            <ToggleButton value="Noroeste">Noroeste</ToggleButton>
          </ToggleButtonGroup>
        </Paper>
      </Box>

      {/* Fila de KPIs */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {recruitmentStats.map((item, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard 
              title={item.title} 
              value={item.value} 
              icon={item.icon} 
              color={item.color}
              onClick={item.title.includes('Solicitudes') || item.title.includes('Gestionar') ? () => navigate('/solicitudes') : undefined}
            />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Gráfico 72h Restaurado */}
        <Grid item xs={12} md={6}>
          <DashboardPieChart 
            title="Cumplimiento Estándar 72h" 
            data={complianceData} 
          />
        </Grid>

        {/* Gráfico por Zonas Restaurado */}
        <Grid item xs={12} md={6}>
          <DashboardBarChart 
            title="Solicitudes por Zona" 
            data={stats.requestsByZone} 
          />
        </Grid>

        {/* Lista de Urgencias Rediseñada */}
        <Grid item xs={12}>
          <Paper sx={{ 
            p: 3, 
            backgroundColor: theme.palette.mode === 'light' ? '#FFFFFF' : 'rgba(15, 23, 42, 0.8)',
            borderRadius: 4,
            border: '1px solid rgba(255, 87, 34, 0.3)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary', lineHeight: 1 }}>
                  Solicitudes Críticas
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  PRIORIDAD MÁXIMA - SIN COBERTURA TOTAL
                </Typography>
              </Box>
              <Button 
                variant="contained" 
                size="small" 
                onClick={() => navigate('/solicitudes')}
                sx={{ 
                  borderRadius: 2, 
                  fontWeight: 800, 
                  textTransform: 'none',
                  background: 'linear-gradient(45deg, #FF5722 30%, #FF8A65 90%)'
                }}
              >
                Gestionar Todas
              </Button>
            </Box>

            <TableContainer>
              {stats.unfulfilledRequests.length > 0 ? (
                <Table size="medium">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, color: 'text.secondary', borderBottom: '2px solid rgba(255,255,255,0.05)' }}>HOTEL / UBICACIÓN</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: 'text.secondary', borderBottom: '2px solid rgba(255,255,255,0.05)' }}>CARGO REQUERIDO</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: 'text.secondary', borderBottom: '2px solid rgba(255,255,255,0.05)' }}>INICIA</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, color: 'text.secondary', borderBottom: '2px solid rgba(255,255,255,0.05)' }}>COBERTURA</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary', borderBottom: '2px solid rgba(255,255,255,0.05)' }}>ACCIÓN</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.unfulfilledRequests.slice(0, 6).map((req: any) => {
                      const coverage = Math.min(((req.candidate_count || 0) / req.num_of_people) * 100, 100);
                      return (
                        <TableRow 
                          key={req.id}
                          sx={{ 
                            '&:hover': { bgcolor: 'rgba(255, 87, 34, 0.03)' },
                            transition: 'background-color 0.2s'
                          }}
                        >
                          <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <Typography variant="body2" sx={{ fontWeight: 800 }}>{req.hotelName}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <LocationOnIcon sx={{ fontSize: 10 }} /> {req.zone || 'Zona N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <Chip 
                              label={req.role} 
                              size="small" 
                              sx={{ fontWeight: 700, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.05)' }} 
                            />
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {req.start_date ? new Date(req.start_date).toLocaleDateString() : 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center" sx={{ borderBottom: '1px solid rgba(255,255,255,0.03)', minWidth: 150 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Box sx={{ flexGrow: 1, height: 6, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                                <Box sx={{ width: `${coverage}%`, height: '100%', bgcolor: coverage === 100 ? '#4CAF50' : '#FF5722', transition: 'width 1s ease-in-out' }} />
                              </Box>
                              <Typography variant="caption" sx={{ fontWeight: 900, minWidth: 35 }}>
                                {req.candidate_count}/{req.num_of_people}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <Button 
                              variant="outlined" 
                              size="small" 
                              onClick={() => navigate('/solicitudes')}
                              sx={{ 
                                borderRadius: 1.5, 
                                fontWeight: 700, 
                                fontSize: '0.7rem',
                                borderColor: 'rgba(255,255,255,0.1)',
                                color: 'text.secondary',
                                '&:hover': { borderColor: 'primary.main', color: 'primary.main' }
                              }}
                            >
                              VER DETALLE
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <Avatar sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', color: '#4CAF50', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                    <PeopleIcon fontSize="large" />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>¡Todo al día!</Typography>
                  <Typography variant="body2" color="text.secondary">No hay solicitudes críticas pendientes de cobertura en este momento.</Typography>
                </Box>
              )}
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
