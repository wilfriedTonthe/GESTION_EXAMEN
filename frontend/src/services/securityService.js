import axios from 'axios';

// Utilisation de import.meta.env pour Vite au lieu de process.env
const API_URL = import.meta.env.VITE_API_URL;

class SecurityService {
  // Démarrer la surveillance de sécurité pour un examen
  static async startExamSecurity(examId) {
    try {
      const response = await axios.post(
        `${API_URL}/start_exam/${examId}`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors du démarrage de la sécurité:', error);
      throw error;
    }
  }

  // Soumettre un examen et arrêter la surveillance
  static async submitExam(examId, answers) {
    try {
      const response = await axios.post(
        `${API_URL}/submit_exam/${examId}`,
        { answers },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la soumission de l\'examen:', error);
      throw error;
    }
  }

  // Vérifier l'état de la sécurité
  static async checkSecurityStatus(examId) {
    try {
      const response = await axios.get(
        `${API_URL}/security/status/${examId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'état de sécurité:', error);
      throw error;
    }
  }

  // Arrêt d'urgence de la surveillance
  static async emergencyStop(examId) {
    try {
      const response = await axios.post(
        `${API_URL}/security/emergency_stop/${examId}`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'arrêt d\'urgence:', error);
      throw error;
    }
  }
}

export default SecurityService;
