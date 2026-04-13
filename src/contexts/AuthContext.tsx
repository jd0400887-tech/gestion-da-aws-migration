import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getCurrentUser, signOut as amplifySignOut } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';
import type { Profile } from '../types';

interface AuthContextType {
  session: any | null;
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (data: any) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (user: any) => {
    const userEmail = user.signInDetails?.loginId || '';
    
    // SEGURIDAD: CUENTA MAESTRA ADMIN
    if (userEmail === 'admin@oranjeapp.com') {
      console.info('👑 Acceso de Administrador Maestro detectado.');
      setProfile({
        id: user.userId,
        email: userEmail,
        name: 'Administrador Maestro',
        role: 'ADMIN',
        can_view_hotels: true,
        can_view_employees: true,
        can_view_requests: true,
        can_view_applications: true,
        can_view_payroll: true,
        can_view_qa: true,
        can_view_reports: true,
        can_view_adoption: true
      });
      setLoading(false); // Detenemos la carga
      return; // RESTAURAMOS EL RETURN PREMATURO
    }

    try {
      const client = generateClient<Schema>();
      console.info('📡 [AWS Auth] Intentando recuperar perfil de base de datos para:', userEmail);
      
      const { data: profiles, errors } = await client.models.Profile.list({
        filter: { email: { eq: userEmail } }
      });

      if (errors) {
        console.warn('⚠️ [AWS Auth] Error de permisos al leer perfil (Unauthorized?):', errors);
      }

      if (profiles && profiles.length > 0) {
        const p = profiles[0];
        setProfile({
          id: p.id,
          email: p.email,
          name: p.name || '',
          role: (p.role as any) || 'RECRUITER',
          can_view_hotels: p.can_view_hotels ?? true,
          can_view_employees: p.can_view_employees ?? true,
          can_view_requests: p.can_view_requests ?? true,
          can_view_applications: p.can_view_applications ?? true,
          can_view_payroll: p.can_view_payroll ?? false,
          can_view_qa: p.can_view_qa ?? false,
          can_view_reports: p.can_view_reports ?? false,
          can_view_adoption: p.can_view_adoption ?? false
        });
      } else {
        setProfile({
          id: user.userId,
          email: userEmail,
          name: 'Usuario Nuevo',
          role: 'RECRUITER',
          can_view_hotels: true,
          can_view_employees: true,
          can_view_requests: true,
          can_view_applications: true,
          can_view_payroll: false,
          can_view_qa: false,
          can_view_reports: false,
          can_view_adoption: false
        });
      }
    } catch (error) {
      console.error('Error fetching profile from AWS RDS:', error);
    }
  }, []);

  const checkUser = useCallback(async () => {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      if (user) {
        setSession(user);
        await fetchProfile(user);
      } else {
        setSession(null);
        setProfile(null);
      }
    } catch (error) {
      setSession(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [fetchProfile]);

  useEffect(() => {
    checkUser();
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signedIn') checkUser();
      if (payload.event === 'signedOut') { setSession(null); setProfile(null); }
    });
    return () => unsubscribe();
  }, [checkUser]);

  const signOut = async () => {
    try {
      await amplifySignOut();
      setSession(null);
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user: session, profile, loading, signIn: checkUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuthContext error');
  return context;
};
