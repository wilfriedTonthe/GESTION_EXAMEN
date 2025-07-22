import { AxiosError, isAxiosError } from 'axios';
import api from './api';

// Fonction utilitaire pour gérer les erreurs
const handleApiError = (error: unknown): never => {
  if (isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    if (axiosError.response) {
      // Erreur du serveur avec une réponse
      const message = axiosError.response.data?.detail ?? 'Une erreur est survenue';
      throw new Error(message);
    } else if (axiosError.request) {
      // Pas de réponse du serveur
      throw new Error('Le serveur ne répond pas. Veuillez vérifier votre connexion.');
    }
  }
  // Autres types d'erreurs
  throw error instanceof Error ? error : new Error('Une erreur inconnue est survenue');
};

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  is_teacher: boolean;
  is_active: boolean;
}

const createAuthHeaders = (token: string | null): Record<string, string> => {
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Interface pour les données d'inscription
export interface RegisterData {
  full_name: string;
  email: string;
  password: string;
  is_teacher: boolean;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

            const response = await api.post<LoginResponse>(
        '/auth/token',
        formData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        // L'intercepteur dans api.js gérera l'ajout du token aux requêtes suivantes
      }
      
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  logout(): void {
    localStorage.removeItem('token');
  },

  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  },

  async getCurrentUser(): Promise<User> {
    try {
            const response = await api.get<User>('/auth/me');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async register(userData: RegisterData): Promise<LoginResponse> {
    try {
      const response = await api.post<LoginResponse>(
        '/auth/register',
        userData
      );
  
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
      }
  
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },  
};
