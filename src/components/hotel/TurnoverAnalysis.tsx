import { Paper, Typography, Box, CircularProgress, Tooltip } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import StatCard from '../dashboard/StatCard';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../../amplify/data/resource';

interface TurnoverAnalysisProps {
  hotelId: string;
}

export default function TurnoverAnalysis({ hotelId }: TurnoverAnalysisProps) {
  const [turnoverData, setTurnoverData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const client = generateClient<Schema>();

        // 1. Obtener empleados del hotel desde AWS RDS
        const { data: allEmployees } = await client.models.Employee.list();
        const hotelEmployees = allEmployees.filter(e => e.current_hotel_id === hotelId && e.employee_type === 'permanente');

        // 2. Obtener historial de estados desde AWS RDS
        const { data: history } = await client.models.EmployeeStatusChange.list();
        const separations = history.filter(h => h.new_is_active === false);

        // 3. Función para calcular tasas de rotación
        const calculateRate = (days: number) => {
          const periodEnd = new Date();
          const periodStart = new Date();
          periodStart.setDate(periodEnd.getDate() - days);

          const periodSeparations = separations.filter(h => {
            const changeDate = new Date(h.change_date);
            return hotelEmployees.some(e => e.id === h.employee_id) && 
                   changeDate >= periodStart && changeDate <= periodEnd;
          });

          const uniqueSeparatedCount = new Set(periodSeparations.map(e => e.employee_id)).size;
          const avgEmployees = hotelEmployees.length || 1;

          return {
            rate: (uniqueSeparatedCount / avgEmployees) * 100,
            separations: uniqueSeparatedCount,
            avgEmployees
          };
        };

        const turnover30 = calculateRate(30);
        const turnover365 = calculateRate(365);

        // 4. Tendencia mensual (simplificada para la migración)
        const monthlyTrend = Array.from({ length: 6 }).map((_, i) => {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          return {
            name: d.toLocaleString('es-ES', { month: 'short' }),
            rate: (Math.random() * 5).toFixed(1) // Placeholder hasta tener datos históricos reales
          };
        }).reverse();

        setTurnoverData({
          turnover30: turnover30.rate,
          separations30: turnover30.separations,
          avgEmployees30: turnover30.avgEmployees,
          turnover365: turnover365.rate,
          separations365: turnover365.separations,
          avgEmployees365: turnover365.avgEmployees,
          monthlyTrend
        });
      } catch (error) {
        console.error('Error al calcular rotación en AWS:', error);
      }
      setLoading(false);
    };

    fetchData();
  }, [hotelId]);

  if (loading) return <CircularProgress />;
  if (!turnoverData) return null;

  const tooltipText = `Tasa de rotación (365 días): ${turnoverData.turnover365.toFixed(1)}%`;

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>Análisis de Rotación (AWS Cloud)</Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, minWidth: '200px' }}>
          <Tooltip title={tooltipText}>
            <div>
              <StatCard
                title="Rotación Anual"
                value={`${turnoverData.turnover365.toFixed(1)}%`}
                icon={<TrendingDownIcon />}
              />
            </div>
          </Tooltip>
        </Box>
        <Box sx={{ flex: 2, height: 200, minWidth: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={turnoverData.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <RechartsTooltip />
              <Line type="monotone" dataKey="rate" name="Tasa %" stroke="#ff5722" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </Paper>
  );
}
