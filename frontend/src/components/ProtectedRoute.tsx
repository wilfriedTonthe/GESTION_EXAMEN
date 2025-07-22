import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireTeacher?: boolean;
  publicRoute?: boolean; // Si true, la route est accessible sans authentification
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireTeacher = false,
  publicRoute = false
}) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Afficher un spinner ou un indicateur de chargement
    return <div>Chargement...</div>;
  }

  // Si c'est une route publique, on affiche directement les enfants
  if (publicRoute) {
    return <>{children}</>;
  }

  // Vérification d'authentification uniquement pour les routes protégées
  if (!isAuthenticated) {
    // Rediriger vers la page de connexion si l'utilisateur n'est pas authentifié
    return <Navigate to={ROUTES.TEACHER_LOGIN} state={{ from: location }} replace />;
  }

  if (requireTeacher && !user?.is_teacher) {
    // Rediriger vers la page d'accueil si l'utilisateur n'est pas un enseignant
    return <Navigate to={ROUTES.HOME} replace />;
  }

  // Si tout est bon, afficher les enfants
  return <>{children}</>;
};
