import { useAuthContext } from '../contexts/AuthContext';

/**
 * HOOK DE AUTENTICACIÓN (AWS COGNITO)
 * Proporciona acceso al perfil del usuario y funciones de sesión.
 */
export function useAuth() {
  const context = useAuthContext();
  
  return {
    session: context.session, // Usamos 'session' que es lo que tiene el Contexto
    user: context.session,    // Mapeamos 'user' a 'session' para compatibilidad con ProtectedRoute
    profile: context.profile,
    loading: context.loading,
    signIn: context.signIn,
    signOut: context.signOut,
    updateUser: async (data: any) => {
      console.info('📡 [AWS] Actualización de perfil solicitada:', data);
    },
  };
}
