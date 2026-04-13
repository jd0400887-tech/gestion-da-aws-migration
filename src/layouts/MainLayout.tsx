import { useState, useEffect } from 'react';
import { 
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, 
  Toolbar, Typography, AppBar, IconButton, Stack, Badge, Popover, Avatar, 
  Divider, Tooltip, useTheme, Paper 
} from '@mui/material';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';

// Iconos
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import ApartmentIcon from '@mui/icons-material/Apartment';
import MenuIcon from '@mui/icons-material/Menu';
import AssessmentIcon from '@mui/icons-material/Assessment';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

import { useAuth } from '../hooks/useAuth';
import { useDashboardStats } from '../hooks/useDashboardStats';

const drawerWidth = 260;

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  
  const { isMobile } = { isMobile: window.innerWidth < 900 }; // Simplificado
  const [open, setOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const { signOut, profile } = useAuth();
  const { stats: dashboardStats } = useDashboardStats();

  const handleDrawerToggle = () => setOpen(!open);

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/', visible: true },
    { text: 'Usuarios', icon: <SupervisorAccountIcon />, path: '/usuarios', visible: profile?.role === 'ADMIN' },
    { text: 'Hoteles', icon: <ApartmentIcon />, path: '/hoteles', visible: !!profile?.can_view_hotels || profile?.role === 'ADMIN' },
    { text: 'Personal', icon: <PeopleIcon />, path: '/empleados', visible: !!profile?.can_view_employees || profile?.role === 'ADMIN' },
    { text: 'Solicitudes', icon: <AssignmentIcon />, path: '/solicitudes', visible: !!profile?.can_view_requests || profile?.role === 'ADMIN' },
    { text: 'Aplicaciones', icon: <PlaylistAddCheckIcon />, path: '/aplicaciones', visible: !!profile?.can_view_applications || profile?.role === 'ADMIN' },
    { text: 'Calidad QA', icon: <VerifiedUserIcon />, path: '/calidad', visible: !!profile?.can_view_qa || profile?.role === 'ADMIN' },
    { text: 'Reporte Asistencia', icon: <AssessmentIcon />, path: '/reporte-asistencia', visible: !!profile?.can_view_reports || profile?.role === 'ADMIN' },
    { text: 'Revisión de Nómina', icon: <FactCheckIcon />, path: '/revision-nomina', visible: !!profile?.can_view_payroll || profile?.role === 'ADMIN' },
    { text: 'Adopción', icon: <QueryStatsIcon />, path: '/adoption-tracker', visible: !!profile?.can_view_adoption || profile?.role === 'ADMIN' },
  ].filter(item => item.visible);

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0F172A' }}>
      <Box sx={{ minHeight: 80, display: 'flex', alignItems: 'center', px: 2, position: 'relative' }}>
        <IconButton 
          onClick={handleDrawerToggle} 
          sx={{ 
            color: 'rgba(255,255,255,0.3)', 
            position: 'absolute', 
            left: 8,
            '&:hover': { color: 'primary.main', bgcolor: 'rgba(255, 87, 34, 0.1)' } 
          }}
        >
          <MenuIcon />
        </IconButton>
        <Typography 
          variant="h4" 
          sx={{ 
            flexGrow: 1,
            fontWeight: 900, 
            background: 'linear-gradient(45deg, #FF5722 30%, #FF8A65 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-2.5px',
            fontFamily: '"Inter", "Montserrat", sans-serif',
            textTransform: 'none',
            lineHeight: 1,
            textAlign: 'center',
            ml: 2 // Espacio para equilibrar el botón de la izquierda
          }}
        >
          Oranje
        </Typography>
      </Box>
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.05)', mb: 2 }} />
      <Box sx={{ px: 3, mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Badge 
          overlap="circular" 
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          variant="dot"
          sx={{ 
            '& .MuiBadge-badge': { 
              bgcolor: '#4caf50', 
              color: '#4caf50', 
              boxShadow: '0 0 0 2px #0F172A',
              '&::after': {
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                borderRadius: '50%', animation: 'ripple 1.2s infinite ease-in-out',
                border: '1px solid currentColor', content: '""',
              },
            },
            '@keyframes ripple': {
              '0%': { transform: 'scale(.8)', opacity: 1 },
              '100%': { transform: 'scale(2.4)', opacity: 0 },
            },
          }}
        >
          <Avatar 
            sx={{ 
              background: 'linear-gradient(135deg, #FF5722 0%, #FF8A65 100%)', 
              fontWeight: 800,
              width: 42,
              height: 42,
              boxShadow: '0 4px 12px rgba(255, 87, 34, 0.4)'
            }}
          >
            {profile?.name?.[0] || 'U'}
          </Avatar>
        </Badge>
        <Box sx={{ overflow: 'hidden' }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'primary.main', 
              fontWeight: 900, 
              display: 'block', 
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              fontSize: '0.6rem',
              opacity: 0.8
            }}
          >
            {profile?.role}
          </Typography>
          <Typography 
            variant="body2" 
            noWrap 
            sx={{ 
              color: 'white', 
              fontWeight: 700,
              fontSize: '0.9rem',
              letterSpacing: '-0.2px'
            }}
          >
            {profile?.name || profile?.email?.split('@')[0]}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ flexGrow: 1, px: 1, overflowY: 'auto' }}>
        <List>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: 3, py: 1.2, px: 2,
                    backgroundColor: isActive ? 'rgba(255, 87, 34, 0.15)' : 'transparent',
                    borderLeft: isActive ? '4px solid #FF5722' : '4px solid transparent',
                    color: isActive ? '#FF5722' : 'rgba(255,255,255,0.6)',
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white' }
                  }}
                >
                  <ListItemIcon sx={{ color: isActive ? '#FF5722' : 'rgba(255,255,255,0.4)', minWidth: 40 }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: isActive ? 800 : 500 }} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
      <Box sx={{ p: 2, mt: 'auto' }}>
        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.05)', mb: 2 }} />
        <ListItemButton 
          onClick={handleLogout} 
          sx={{ 
            borderRadius: 3, 
            color: 'rgba(255,255,255,0.5)',
            transition: 'all 0.2s ease',
            '&:hover': { 
              bgcolor: 'rgba(244, 67, 54, 0.1)', 
              color: '#f44336',
              transform: 'translateX(4px)'
            } 
          }}
        >
          <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary="Cerrar Sesión" 
            primaryTypographyProps={{ 
              fontSize: '0.85rem', 
              fontWeight: 600 
            }} 
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.background.default }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer - 1, backgroundColor: isLight ? 'rgba(255, 255, 255, 0.8)' : 'rgba(30, 30, 30, 0.8)', backdropFilter: 'blur(12px)', color: isLight ? '#0F172A' : '#FFFFFF', left: 0, width: '100%' }}>
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: 70, position: 'relative' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 1, '&:hover': { color: 'primary.main', bgcolor: 'rgba(255, 87, 34, 0.1)' } }}>
              <MenuIcon />
            </IconButton>
          </Box>

          <Box sx={{ 
            position: 'absolute', 
            left: '50%', 
            transform: 'translateX(-50%)',
            textAlign: 'center',
            display: { xs: 'none', sm: 'block' } 
          }}>
            <Typography variant="h5" sx={{ fontWeight: 400, color: 'text.secondary', lineHeight: 1, letterSpacing: '-0.5px' }}>
              Bienvenido, <Box component="span" sx={{ fontWeight: 900, color: 'primary.main' }}>{profile?.name || 'Usuario'}</Box>
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '2px', mt: 0.5, display: 'block' }}>
              SISTEMA DE GESTIÓN ORANJE
            </Typography>
          </Box>

          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ color: 'primary.main' }}>
            <Badge badgeContent={dashboardStats?.unfulfilledRequestsCount || 0} color="error"><NotificationsIcon fontSize="small" /></Badge>
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer variant={window.innerWidth < 900 ? "temporary" : "persistent"} open={open} onClose={handleDrawerToggle} sx={{ width: open ? drawerWidth : 0, flexShrink: 0, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', bgcolor: '#0F172A', borderRight: 'none', transition: 'all 0.3s ease' } }}>{drawerContent}</Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, mt: 8, width: '100%', transition: 'margin 0.3s ease' }}><Outlet /></Box>
    </Box>
  );
}
