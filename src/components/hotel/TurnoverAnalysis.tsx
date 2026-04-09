import { Paper, Typography, Box, CircularProgress, Tooltip, useTheme, Chip, Grid, Stack } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../dashboard/StatCard';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../../amplify/data/resource';
import { subMonths, format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

interface TurnoverAnalysisProps {
  hotelId: string;
}

export default function TurnoverAnalysis({ hotelId }: TurnoverAnalysisProps) {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const [turnoverData, setTurnoverData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const client = generateClient<Schema>();

        // 1. Obtener empleados del hotel
        const { data: hotelEmployees } = await client.models.Employee.list({
          filter: { current_hotel_id: { eq: hotelId } }
        });
        
        const activeCount = hotelEmployees.filter(e => e.is_active).length || 1;

        // 2. Obtener historial de cambios de estado de AWS RDS
        const { data: history } = await client.models.EmployeeStatusChange.list();
        
        // 3. Calcular datos para los últimos 6 meses reales
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
          const monthDate = subMonths(new Date(), i);
          const monthStart = startOfMonth(monthDate);
          const monthEnd = endOfMonth(monthDate);

          const monthSeparations = history.filter(h => {
            const changeDate = new Date(h.change_date);
            return hotelEmployees.some(e => e.id === h.employee_id) && 
                   h.new_is_active === false &&
                   changeDate >= monthStart && changeDate <= monthEnd;
          }).length;

          monthlyData.push({
            name: format(monthDate, 'MMM', { locale: es }).toUpperCase(),
            bajas: monthSeparations,
            rate: ((monthSeparations / activeCount) * 100).toFixed(1)
          });
        }

        // 4. Calcular rotación anual (365 días)
        const yearAgo = subMonths(new Date(), 12);
        const totalYearSeparations = history.filter(h => {
          const changeDate = new Date(h.change_date);
          return hotelEmployees.some(e => e.id === h.employee_id) && 
                 h.new_is_active === false &&
                 changeDate >= yearAgo;
        }).length;

        setTurnoverData({
          annualRate: ((totalYearSeparations / activeCount) * 100).toFixed(1),
          totalBajas: totalYearSeparations,
          monthlyTrend: monthlyData
        });
      } catch (error) {
        console.error('Error al calcular rotación en AWS:', error);
      }
      setLoading(false);
    };

    fetchData();
  }, [hotelId]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>;
  if (!turnoverData) return null;

  return (
    <Paper elevation={0} sx={{ 
      p: 3, borderRadius: 4, 
      bgcolor: isLight ? 'white' : 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(0,0,0,0.05)',
      boxShadow: isLight ? '0 4px 20px rgba(0,0,0,0.05)' : 'none'
    }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary' }}>Análisis de Rotación</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>Histórico de bajas - AWS RDS</Typography>
        </Box>
        <Chip 
          icon={<TrendingDownIcon style={{ color: 'white' }} />} 
          label={`${turnoverData.annualRate}% Anual`} 
          color="primary" 
          sx={{ fontWeight: 900, borderRadius: 2 }} 
        />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, textAlign: 'center', bgcolor: 'rgba(255, 87, 34, 0.03)', border: '1px solid rgba(255, 87, 34, 0.1)' }}>
              <Typography variant="h3" sx={{ fontWeight: 900, color: 'primary.main' }}>{turnoverData.totalBajas}</Typography>
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>Bajas este año</Typography>
            </Paper>
            <Box sx={{ p: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.75rem' }}>
                * El índice de rotación se calcula dividiendo las bajas mensuales entre el personal activo actual.
              </Typography>
            </Box>
          </Stack>
        </Grid>

        <Grid item xs={12} md={8}>
          <Box sx={{ height: 180, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={turnoverData.monthlyTrend}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF5722" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF5722" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                <YAxis hide />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 800 }}
                  itemStyle={{ color: '#FF5722' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="#FF5722" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorRate)" 
                  name="Tasa de Rotación (%)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}
