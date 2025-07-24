import { AxiosResponse } from 'axios';
import api from './api';

// Service pour la gestion des examens
const examService = {
  verifyPassword: async (password: string): Promise<any> => {
    try {
      const response = await api.post('/exams/verify-password', { password });
      console.log('Verify password response:', response.data);
      
      // Vérifier que la réponse contient bien un ID d'examen
      if (!response.data?.exam_id) {
        console.error('Réponse invalide: pas d\'ID d\'examen dans la réponse', response.data);
        throw new Error("Impossible de récupérer les informations de l'examen.");
      }
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la vérification du mot de passe:', error);
      throw error;
    }
  },
  
  // Méthode pour récupérer un examen par son mot de passe
  getExamByPassword: async (password: string): Promise<any> => {
    try {
      console.log('getExamByPassword appelé avec le mot de passe:', password);
      
      // D'abord vérifier le mot de passe pour obtenir l'ID de l'examen
      const verifyResponse = await examService.verifyPassword(password);
      console.log('Mot de passe vérifié, ID de l\'examen:', verifyResponse.exam_id);
      
      // Ensuite récupérer les détails de l'examen avec l'ID
      const examResponse = await api.get(`/exams/${verifyResponse.exam_id}`);
      console.log('Détails de l\'examen récupérés:', examResponse.data);
      
      return examResponse.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'examen par mot de passe:', error);
      throw error;
    }
  },

  verifyStudent: async (examId: number, studentName: string): Promise<any> => {
    try {
      const response = await api.post('/exams/verify-student', {
        exam_id: examId,
        student_name: studentName,
      });
      // Le backend devrait maintenant renvoyer un token si la vérification réussit
      if (!response.data?.access_token) {
        throw new Error("La vérification de l'étudiant a échoué. Le token est manquant.");
      }
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la vérification de l'étudiant:", error);
      throw error;
    }
  },

  startMonitoring: async (examId: number | string, studentName: string, sessionId: string): Promise<any> => {
    const response = await api.post(`/exams/${examId}/monitor/start`, {
      student_name: studentName,
      session_id: sessionId,
    });
    return response.data;
  },

  stopMonitoring: async (examId: number | string, sessionId: string): Promise<any> => {
    const response = await api.post(`/exams/${examId}/monitor/stop`, {
      session_id: sessionId,
    });
    return response.data;
  },

  getMonitoringStatus: async (examId: number | string, sessionId: string): Promise<any> => {
    const response = await api.get(`/exams/${examId}/monitor/status`, {
      params: { session_id: sessionId },
    });
    return response.data;
  },
  
  // Nouvelle méthode qui combine la vérification du mot de passe et du nom de l'étudiant
  verifyPasswordAndStudent: async (password: string, studentName: string): Promise<any> => {
    try {
      // Appel API unique pour vérifier à la fois le mot de passe et le nom de l'étudiant
      const response = await api.post('/exams/verify-access', { 
        password, 
        student_name: studentName 
      });
      
      console.log('Verify password and student response:', response.data);
      
      // Vérifier que la réponse contient les informations nécessaires
      if (!response.data?.exam_id || !response.data?.access_token) {
        console.error('Réponse invalide: informations manquantes dans la réponse', response.data);
        throw new Error("Impossible de vérifier l'accès à l'examen.");
      }
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'accès:', error);
      throw error;
    }
  },

  // Méthode pour récupérer un examen par mot de passe et nom d'étudiant
  getExamByPasswordAndStudent: async (password: string, studentName: string): Promise<any> => {
    try {
      console.log('getExamByPasswordAndStudent appelé avec:', { password, studentName });
      
      // Vérifier simultanément le mot de passe et le nom de l'étudiant
      const verifyResponse = await api.post('/exams/verify-access', { 
        password, 
        student_name: studentName 
      });
      
      // Accéder aux données de la réponse
      const verifyData = verifyResponse.data;
      console.log('Accès vérifié, données reçues (brut):', verifyResponse);
      console.log('Accès vérifié, données reçues (data):', verifyData);
      console.log('Accès vérifié, exam_id présent?', verifyData.exam_id);
      
      // Au lieu de faire une seconde requête qui pourrait échouer,
      // nous utilisons directement les données de la vérification
      // et nous créons un objet avec les informations minimales nécessaires
      return {
        id: verifyData.exam_id,  // Utiliser exam_id comme id pour compatibilité
        exam_id: verifyData.exam_id,  // Garder aussi exam_id
        access_token: verifyData.access_token,
        token_type: verifyData.token_type
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'examen:', error);
      throw error;
    }
  },
};

// Service pour la soumission des examens
export const submissionService = {
  submitExam: async (submissionData: any, studentPhoto: File | null): Promise<AxiosResponse> => {
    const formData = new FormData();
    formData.append('submission_data', new Blob([JSON.stringify(submissionData)], { type: 'application/json' }));
    
    if (studentPhoto) {
      formData.append('student_photo', studentPhoto);
    }

    const response = await api.post('/submissions/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  },
  
  // Nouvelle méthode qui combine la vérification du mot de passe et du nom de l'étudiant
  verifyPasswordAndStudent: async (password: string, studentName: string): Promise<any> => {
    try {
      // Appel API unique pour vérifier à la fois le mot de passe et le nom de l'étudiant
      const response = await api.post('/exams/verify-access', { 
        password, 
        student_name: studentName 
      });
      
      console.log('Verify password and student response:', response.data);
      
      // Vérifier que la réponse contient les informations nécessaires
      if (!response.data?.exam_id || !response.data?.access_token) {
        console.error('Réponse invalide: informations manquantes dans la réponse', response.data);
        throw new Error("Impossible de vérifier l'accès à l'examen.");
      }
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'accès:', error);
      throw error;
    }
  },

  // Méthode pour récupérer un examen par mot de passe et nom d'étudiant
  getExamByPasswordAndStudent: async (password: string, studentName: string): Promise<any> => {
    try {
      console.log('getExamByPasswordAndStudent appelé avec:', { password, studentName });
      
      // Vérifier simultanément le mot de passe et le nom de l'étudiant
      const verifyResponse = await api.post('/exams/verify-access', { 
        password, 
        student_name: studentName 
      });
      
      // Accéder aux données de la réponse
      const verifyData = verifyResponse.data;
      console.log('Accès vérifié, ID de l\'examen:', verifyData.exam_id);
      
      // Récupérer les détails de l'examen avec l'ID
      const examResponse = await api.get(`/exams/${verifyData.exam_id}`, {
        headers: {
          'Authorization': `Bearer ${verifyData.access_token}`
        }
      });
      
      console.log('Détails de l\'examen récupérés:', examResponse.data);
      
      // Ajouter le token d'accès aux données de l'examen pour l'utiliser plus tard
      return {
        ...examResponse.data,
        access_token: verifyData.access_token
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'examen:', error);
      throw error;
    }
  }
};

// Le service de soumission est déjà défini plus haut, pas besoin de le redéfinir ici

export default examService;
