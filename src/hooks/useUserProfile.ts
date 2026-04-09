import { useAuth } from './useAuth';

/**
 * HOOK DE PERFIL DE USUARIO (AWS CLOUD)
 * Obtiene los detalles extendidos del usuario logueado en AWS.
 */
export function useUserProfile() {
  const { profile, loading, user } = useAuth();

  return { 
    profile, 
    loading,
    userId: user?.userId || null,
    email: user?.signInDetails?.loginId || null
  };
}
