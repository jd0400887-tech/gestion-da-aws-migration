import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Paper, Typography, Box, useTheme, Stack } from '@mui/material';

// Iconos
import SpeedIcon from '@mui/icons-material/Speed';
import TimerIcon from '@mui/icons-material/Timer';
import NewReleasesIcon from '@mui/icons-material/NewReleases';

interface DashboardPieChartProps {
  data: { name: string; value: number; color?: string }[];
  title: string;
}

export default function DashboardPieChart({ data, title }: DashboardPieChartProps) {
  const theme = useTheme();
  
  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  const onTimeData = data.find(d => d.name.includes('A Tiempo'))?.value || 0;
  const efficiencyRate = total > 0 ? Math.round((onTimeData / total) * 100) : 0;

  if (!data || data.length === 0 || total === 0) {
    return (
      <Paper sx={{
        p: 3,
        height: '420px',
        backgroundColor: theme.palette.mode === 'light' ? '#FFFFFF' : 'rgba(15, 23, 42, 0.6)',
        borderRadius: 4,
        border: '1px solid rgba(255, 87, 34, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>{title}</Typography>
        <Typography color="text.secondary">Sin solicitudes activas para medir</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{
      p: 3,
      backgroundColor: theme.palette.mode === 'light' ? '#FFFFFF' : 'rgba(15, 23, 42, 0.6)',
      borderRadius: 4,
      border: '1px solid rgba(255, 87, 34, 0.2)',
      height: '420px',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
    }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 800, color: 'text.primary' }}>
        {title}
      </Typography>

      <Box sx={{ position: 'relative', flexGrow: 1, display: 'flex', alignItems: 'center' }}>
        <Box sx={{ width: '60%', height: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || '#ccc'} stroke="none" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1E293B', 
                  border: '1px solid #FF5722',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          {/* INDICADOR CENTRAL */}
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '30%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}>
            <Typography variant="h3" sx={{ fontWeight: 900, color: efficiencyRate > 70 ? '#4CAF50' : '#FF5722', lineHeight: 1 }}>
              {efficiencyRate}%
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
              EFICIENCIA
            </Typography>
          </Box>
        </Box>

        {/* LEYENDA DETALLADA */}
        <Box sx={{ width: '40%', pl: 2 }}>
          <Stack spacing={2.5}>
            {data.map((item, idx) => (
              <Box key={idx}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: item.color }} />
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                    {item.name.toUpperCase()}
                  </Typography>
                </Stack>
                <Typography variant="h6" sx={{ fontWeight: 900, pl: 2.5, lineHeight: 1 }}>
                  {item.value} <Typography component="span" variant="caption" sx={{ opacity: 0.6 }}>solicitudes</Typography>
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      </Box>
      
      <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: 'rgba(255, 87, 34, 0.05)', border: '1px dashed rgba(255, 87, 34, 0.2)' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <TimerIcon sx={{ fontSize: 14, color: 'primary.main' }} />
          Meta de cumplimiento: Gestionar el 100% en menos de 24h.
        </Typography>
      </Box>
    </Paper>
  );
}
