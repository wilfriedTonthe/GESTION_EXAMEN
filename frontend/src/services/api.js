import axios from 'axios';

import { authService } from './authService';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

const api = axios.create({
  baseURL: 'http://localhost:8005/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const isPublicRoute = [
      '/by-password/',
      '/login',
      '/register'
    ].some(route => config.url.includes(route));

    const token = authService.getToken();

    // Ne pas ajouter le token pour les routes publiques
    if (token && !isPublicRoute) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Déconnexion si le token est invalide ou expiré
      authService.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Gestion des erreurs
export const handleApiError = (error) => {
  if (error.response) {
    // La requête a été faite et le serveur a répondu avec un code d'erreur
    console.error('Erreur de réponse:', error.response.data);
    throw new Error(error.response.data.detail || 'Une erreur est survenue');
  } else if (error.request) {
    // La requête a été faite mais aucune réponse n'a été reçue
    console.error('Aucune réponse du serveur:', error.request);
    throw new Error('Le serveur ne répond pas. Veuillez réessayer plus tard.');
  } else {
    // Une erreur s'est produite lors de la configuration de la requête
    console.error('Erreur de configuration:', error.message);
    throw new Error('Erreur de configuration de la requête');
  }
};

// Gestion des examens
export const examService = {
  // Récupérer tous les examens de l'enseignant connecté
  async getExams() {
    try {
      const response = await api.get(`${API_ENDPOINTS.EXAMS}/me/`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  // Créer un nouvel examen
  createExam: async (examData) => {
    try {
      const response = await api.post(API_ENDPOINTS.EXAMS, examData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Récupérer un examen par son ID
  getExam: async (examId) => {
    try {
      const response = await api.get(`${API_ENDPOINTS.EXAMS}/${examId}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Récupérer un examen par son mot de passe
  getExamByPassword: async (password) => {
    try {
      console.log('Tentative de récupération de l\'examen avec le mot de passe:', password);
      
      // Encoder le mot de passe pour gérer les caractères spéciaux dans l'URL
      const encodedPassword = encodeURIComponent(password);
      console.log('Mot de passe encodé:', encodedPassword);
      
      const url = `${API_ENDPOINTS.EXAMS}/by-password/${encodedPassword}`;
      console.log('URL de la requête:', url);
      
      const response = await api.get(url);
      
      if (!response.data) {
        console.error('Aucune donnée dans la réponse');
        throw new Error('Aucune donnée reçue du serveur');
      }
      
      console.log('Réponse du serveur:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('Erreur dans getExamByPassword:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          params: error.config?.params
        }
      });
      
      // Propager l'erreur pour qu'elle soit gérée par le composant appelant
      throw error;
    }
  },

  // Ajouter une question à un examen
  addQuestion: async (examId, questionData) => {
    try {
      // S'assurer que les types de données sont corrects
      const formattedQuestion = {
        question_text: String(questionData.question_text || '').trim(),
        question_type: questionData.question_type === 'true_false' ? 'true_false' : 'multiple_choice',
        points: Number(questionData.points) || 1,
        options: (questionData.options || []).map(option => ({
          option_text: String(option.option_text || '').trim(),
          is_correct: Boolean(option.is_correct)
        })).filter(option => option.option_text) // Filtrer les options vides
      };

      // Valider que la question a du texte
      if (!formattedQuestion.question_text) {
        throw new Error('Le texte de la question ne peut pas être vide');
      }

      // Valider qu'il y a au moins deux options
      if (formattedQuestion.options.length < 2) {
        throw new Error('Une question doit avoir au moins deux options de réponse');
      }

      // Valider qu'il y a au moins une réponse correcte pour les questions à choix multiples
      if (formattedQuestion.question_type === 'multiple_choice' && 
          !formattedQuestion.options.some(opt => opt.is_correct)) {
        throw new Error('Une question à choix multiples doit avoir au moins une réponse correcte');
      }

      const response = await api.post(
        `${API_ENDPOINTS.EXAMS}/${examId}/questions/`,
        formattedQuestion
      );
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la question:', error);
      return handleApiError(error);
    }
  },

  // Récupérer les questions d'un examen
  getExamQuestions: async (examId) => {
    try {
      console.log(`Tentative de récupération des questions pour l'examen ID: ${examId}`);
      const url = `${API_ENDPOINTS.EXAMS}/${examId}/questions/`;
      console.log(`URL de la requête: ${url}`);
      
      const response = await api.get(url);
      console.log('Réponse du serveur pour les questions:', response);
      
      if (!response.data) {
        console.error('Aucune donnée dans la réponse du serveur');
        throw new Error('Aucune donnée reçue du serveur');
      }
      
      if (!Array.isArray(response.data)) {
        console.error('Format de données inattendu pour les questions:', response.data);
        throw new Error('Format de données invalide pour les questions');
      }
      
      console.log(`Nombre de questions reçues: ${response.data.length}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des questions:', error);
      return handleApiError(error);
    }
  },

  // Récupérer les résultats d'un examen
  getExamResults: async (examId) => {
    try {
      const response = await api.get(`${API_ENDPOINTS.EXAMS}/${examId}/results/`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Télécharger les résultats au format PDF
  downloadResultsPdf: async (examId) => {
    try {
      const response = await api.get(`${API_ENDPOINTS.SUBMISSIONS}/exam/${examId}/results-pdf`, {
        responseType: 'blob',
      });
      
      // Créer une URL pour le blob et déclencher le téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `resultats_examen_${examId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return true;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Télécharger la feuille d'émargement en PDF
  downloadSignaturesSheet: async (examId) => {
    try {
      const response = await api.get(`${API_ENDPOINTS.EXAMS}/${examId}/generate-signatures`, {
        responseType: 'blob', // Important pour recevoir un fichier
      });

      // Créer un lien pour télécharger le fichier
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `feuille_emargement_exam_${examId}.pdf`);
      document.body.appendChild(link);
      link.click();

      // Nettoyer
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Supprimer un examen
  deleteExam: async (examId) => {
    try {
      const response = await api.delete(`${API_ENDPOINTS.EXAMS}/${examId}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// Gestion des soumissions
export const submissionService = {
  // Soumettre un examen
  submitExam: async (submissionData) => {
    try {
      const formData = new FormData();
      formData.append('student_name', submissionData.student_name);
      formData.append('exam_password', submissionData.exam_password);
      // Les réponses sont envoyées comme une chaîne JSON
      formData.append('answers', JSON.stringify(submissionData.answers));
      // La photo est envoyée comme un fichier
      formData.append('photo', submissionData.photo);

      const response = await api.post(API_ENDPOINTS.SUBMISSIONS, formData, {
        headers: {
          // Le navigateur définit automatiquement le bon Content-Type avec la boundary
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Réponse du serveur:', response.data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Récupérer une soumission par son ID
  getSubmission: async (submissionId) => {
    try {
      const response = await api.get(`${API_ENDPOINTS.SUBMISSIONS}/${submissionId}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Récupérer toutes les soumissions d'un examen
  getExamSubmissions: async (examId) => {
    try {
      const response = await api.get(`${API_ENDPOINTS.SUBMISSIONS}/exam/${examId}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Services de sécurité pour l'examen
  startExamSecurity: async (sessionId) => {
    try {
      console.log('Démarrage des services de sécurité pour la session:', sessionId);
      console.log('URL:', `${API_ENDPOINTS.SECURITY}/exam/start`);
      const payload = { session_id: sessionId };
      console.log('Payload:', payload);
      const response = await api.post(`${API_ENDPOINTS.SECURITY}/exam/start`, payload);
      console.log('Réponse du service de sécurité:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors du démarrage des services de sécurité:', error);
      return handleApiError(error);
    }
  },

  stopExamSecurity: async (sessionId) => {
    try {
      console.log('Arrêt des services de sécurité pour la session:', sessionId);
      console.log('URL:', `${API_ENDPOINTS.SECURITY}/exam/stop`);
      const payload = { session_id: sessionId };
      console.log('Payload:', payload);
      const response = await api.post(`${API_ENDPOINTS.SECURITY}/exam/stop`, payload);
      console.log('Réponse du service de sécurité (arrêt):', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'arrêt des services de sécurité:', error);
      return handleApiError(error);
    }
  },

  getExamSecurityStatus: async (sessionId) => {
    try {
      const response = await api.get(`${API_ENDPOINTS.SECURITY}/exam/status?session_id=${sessionId}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

export default api;
