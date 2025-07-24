import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, User } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, navigate: (path: string, options?: { replace: boolean }) => void, from: string) => Promise<User>;
  logout: () => void;
  register: (data: any) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const register = async (data: any) => {
    await authService.register(data);
  };

  const login = async (email: string, password: string, navigate: (path: string, options?: { replace: boolean }) => void, from: string) => {
    try {
      // Appeler le service de connexion
      await authService.login(email, password);
      
      // Récupérer les informations de l'utilisateur
      const userData = await authService.getCurrentUser();
      
      // Mettre à jour l'état de l'utilisateur
      setUser(userData);

      // Rediriger après la mise à jour de l'état
      navigate(from, { replace: true });
      
      // Retourner les données de l'utilisateur pour une utilisation ultérieure
      return userData;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      // Réinitialiser l'état en cas d'erreur
      setUser(null);
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const contextValue = React.useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      register,
      isAuthenticated: !!user,
    }),
    [user, loading, login, logout, register, !!user]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
