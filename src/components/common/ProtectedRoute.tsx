import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Box, CircularProgress } from '@mui/material';
import { PATHS } from '../../routes/paths';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('ADMIN' | 'COORDINATOR' | 'INSPECTOR' | 'RECRUITER')[];
}

/**
 * COMPONENTE DE PROTECCIÓN DE RUTAS (AWS CLOUD)
 * Asegura que el usuario tenga una sesión activa y los permisos correctos.
 */
export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { profile, loading, user } = useAuth();
  const location = useLocation();

  // Si AWS está consultando la sesión, mostramos cargador
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#f5f5f5' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Si no hay usuario en AWS Cognito, el Authenticator en App.tsx debería manejarlo,
  // pero por seguridad retornamos null aquí si llegamos a este punto sin sesión.
  if (!user) {
    return null; 
  }

  // Verificación de roles (opcional)
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    console.warn('Acceso denegado por rol:', profile.role);
    return <Navigate to={PATHS.DASHBOARD} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
