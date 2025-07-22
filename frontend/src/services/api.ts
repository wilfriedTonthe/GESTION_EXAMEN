import axios from 'axios';
import { authService } from './authService';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Ajouter le token JWT à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs réseau et de réponse
api.interceptors.response.use(
  (response) => response,
  (error) => {
    try {
      handleApiError(error);
    } catch (err) {
      return Promise.reject(err);
    }
    return Promise.reject(new Error('Erreur inconnue'));
  }
);

// Gérer les réponses d'erreur
export const handleApiError = (error: unknown): never => {
  // Convertir en Error si ce n'en est pas déjà une
  if (error instanceof Error) {
    console.error('Erreur:', error.message);
    throw error;
  }
  
  // Gestion spécifique des erreurs Axios
  if (axios.isAxiosError(error)) {
    if (error.response) {
      // La requête a été faite et le serveur a répondu avec un code d'erreur
      console.error('Erreur API:', error.response.data);
      console.error('Status:', error.response.status);
      
      // Gérer les erreurs d'authentification
      if (error.response.status === 401) {
        // Déconnexion si le token est invalide
        authService.logout();
        window.location.href = '/login';
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      
      const responseData = error.response.data as { detail?: unknown };
      const errorDetail = responseData?.detail;
      const errorMessage = typeof errorDetail === 'string' 
        ? errorDetail 
        : `Erreur serveur (${error.response.status})`;
        
      throw new Error(errorMessage);
    } else if (error.request) {
      // La requête a été faite mais aucune réponse n'a été reçue
      console.error('Erreur de connexion:', error.request);
      throw new Error('Impossible de se connecter au serveur');
    }
  }
  
  // Erreur inconnue
  console.error('Erreur inconnue:', error);
  throw new Error('Une erreur inconnue est survenue');
};

export default api;
