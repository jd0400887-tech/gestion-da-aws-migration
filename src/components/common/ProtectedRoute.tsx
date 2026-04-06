import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { PATHS } from '../../routes/paths';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ('ADMIN' | 'COORDINATOR' | 'INSPECTOR' | 'RECRUITER')[];
}

/**
 * Componente de orden superior para proteger rutas basado en sesión y roles.
 * Centraliza la lógica de control de acceso (RBAC).
 */
export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { session, profile, loading } = useAuth();

  // Si está cargando, no redirigir todavía (el App.tsx maneja el spinner global)
  if (loading) return null;

  // Si no hay sesión, al login
  if (!session) {
    return <Navigate to={PATHS.LOGIN} replace />;
  }

  // Si hay roles permitidos y el perfil del usuario no coincide, al dashboard
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    console.warn(`Acceso denegado: El rol ${profile.role} no tiene permiso para esta ruta.`);
    return <Navigate to={PATHS.DASHBOARD} replace />;
  }

  return <>{children}</>;
};
