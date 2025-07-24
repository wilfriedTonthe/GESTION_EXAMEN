import axios from 'axios';

// Utilisation de import.meta.env pour Vite au lieu de process.env
const API_URL = import.meta.env.VITE_API_URL;

class SecurityService {
  // Démarrer la surveillance de sécurité pour un examen
  static async startExamSecurity(examId) {
    try {
      console.log(`Appel à startExamSecurity avec examId: ${examId}`);
      const response = await axios.post(
        `${API_URL}/security/exam/start`,
        { session_id: examId.toString() },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      console.log('Réponse de startExamSecurity:', response.data);
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

  // Vérifier si un étudiant est autorisé à passer un examen
  static async verifyStudentForExam(examId, studentName) {
    // Vérifier si examId est défini
    if (!examId) {
      console.error('Erreur: examId est undefined ou null');
      return {
        authorized: false,
        message: "Impossible de vérifier l'autorisation: identifiant d'examen manquant."
      };
    }

    try {
      console.log(`Vérification de l'étudiant ${studentName} pour l'examen ${examId}`);
      const response = await axios.get(
        `${API_URL}/security/verify-student/${examId}/${encodeURIComponent(studentName)}`
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'autorisation de l\'étudiant:', error);
      return {
        authorized: false,
        message: `Erreur lors de la vérification: ${error.response?.data?.detail || error.message}`
      };
    }
  }
}

export default SecurityService;
