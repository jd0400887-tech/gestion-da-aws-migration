import { Paper, Typography, Box, useTheme, LinearProgress, Stack } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

interface DashboardBarChartProps {
  data: { zone: string; count: number }[];
  title: string;
}

export function DashboardBarChart({ data, title }: DashboardBarChartProps) {
  const theme = useTheme();
  
  // Ordenar datos de mayor a menor y calcular total
  const sortedData = [...(data || [])].sort((a, b) => b.count - a.count);
  const totalRequests = sortedData.reduce((acc, curr) => acc + curr.count, 0);
  const maxCount = sortedData.length > 0 ? sortedData[0].count : 0;

  if (sortedData.length === 0) {
    return (
      <Paper sx={{
        p: 3, 
        height: '420px', 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: theme.palette.mode === 'light' ? '#FFFFFF' : 'rgba(15, 23, 42, 0.6)',
        borderRadius: 4,
        border: '1px solid rgba(255, 87, 34, 0.2)',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>{title}</Typography>
        <Typography color="text.secondary">Sin datos de zona disponibles</Typography>
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
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
      overflow: 'hidden'
    }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary', lineHeight: 1 }}>
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            RANKING DE CARGA POR REGIÓN
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h4" sx={{ fontWeight: 900, color: 'primary.main', lineHeight: 1 }}>
            {totalRequests}
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.6 }}>TOTAL</Typography>
        </Box>
      </Box>
      
      <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
        <Stack spacing={3}>
          {sortedData.map((item, index) => {
            const percentageOfTotal = totalRequests > 0 ? Math.round((item.count / totalRequests) * 100) : 0;
            const percentageOfMax = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
            
            return (
              <Box key={item.zone}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ 
                      width: 24, height: 24, borderRadius: 1, 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      bgcolor: index === 0 ? 'primary.main' : 'rgba(255,255,255,0.05)',
                      color: index === 0 ? 'white' : 'text.secondary',
                      fontSize: '0.75rem', fontWeight: 900
                    }}>
                      {index + 1}
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                      {item.zone.toUpperCase()}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" sx={{ fontWeight: 900 }}>
                      {item.count}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', opacity: 0.6 }}>
                      ({percentageOfTotal}%)
                    </Typography>
                  </Stack>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={percentageOfMax} 
                  sx={{ 
                    height: 6, 
                    borderRadius: 3, 
                    bgcolor: 'rgba(255,255,255,0.05)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      background: index === 0 
                        ? 'linear-gradient(90deg, #FF5722 0%, #FF8A65 100%)' 
                        : 'linear-gradient(90deg, rgba(255, 87, 34, 0.6) 0%, rgba(255, 87, 34, 0.3) 100%)'
                    }
                  }} 
                />
              </Box>
            );
          })}
        </Stack>
      </Box>

      <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 1 }}>
        <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
          La zona <strong>{sortedData[0]?.zone}</strong> lidera la demanda operativa.
        </Typography>
      </Box>
    </Paper>
  );
}