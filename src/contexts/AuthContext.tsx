import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getCurrentUser, fetchUserAttributes, signOut as amplifySignOut } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { Profile } from '../types';

interface AuthContextType {
  session: any | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      
      setSession(user);
      setProfile({
        id: user.userId,
        email: attributes.email || '',
        role: (attributes['custom:role'] as any) || 'ADMIN',
        assigned_zone: null,
        permissions: ['ALL']
      });
    } catch (error) {
      setSession(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 1. Carga inicial
    loadUser();

    // 2. Escuchar eventos de AWS (Login/Logout) en tiempo real
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
          loadUser();
          break;
        case 'signedOut':
          setSession(null);
          setProfile(null);
          break;
      }
    });

    return () => unsubscribe();
  }, [loadUser]);

  const signOut = async () => {
    try {
      setLoading(true);
      await amplifySignOut();
      localStorage.clear();
      sessionStorage.clear();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading, signOut, refreshUser: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
