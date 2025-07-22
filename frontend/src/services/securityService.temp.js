import axios from 'axios';

// Utilisation de import.meta.env pour Vite au lieu de process.env
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8004/api';
const SECURITY_API_URL = `${API_URL}/security`;

class SecurityService {
  // Démarrer la surveillance de sécurité pour un examen
  static async startExamSecurity(sessionId, examId, studentName) {
    try {
      const response = await axios.post(
        `${SECURITY_API_URL}/start`,
        {
          session_id: sessionId,
          exam_id: examId,
          student_name: studentName
        },
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
  static async checkSecurityStatus(sessionId) {
    try {
      const response = await axios.get(
        `${SECURITY_API_URL}/exam/status?session_id=${sessionId}`,
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

  // Arrêter la surveillance de sécurité
  static async stopExamSecurity(sessionId) {
    try {
      const response = await axios.post(
        `${SECURITY_API_URL}/exam/stop`,
        {
          session_id: sessionId
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'arrêt de la sécurité:', error);
      throw error;
    }
  }

  // Téléverser une image d'étudiant pour la reconnaissance faciale
  static async uploadStudentImage(examId, studentName, imageFile) {
    try {
      const formData = new FormData();
      formData.append('exam_id', examId);
      formData.append('student_name', studentName);
      formData.append('image', imageFile);

      const response = await axios.post(
        `${SECURITY_API_URL}/upload-student-image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors du téléversement de l\'image:', error);
      throw error;
    }
  }

  // Téléverser plusieurs images d'étudiants
  static async uploadExamImages(examId, imageFiles) {
    try {
      const formData = new FormData();
      formData.append('exam_id', examId);
      
      // Ajouter chaque fichier à formData
      for (let i = 0; i < imageFiles.length; i++) {
        formData.append('images', imageFiles[i]);
      }

      const response = await axios.post(
        `${SECURITY_API_URL}/upload-exam-images`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors du téléversement des images:', error);
      throw error;
    }
  }

  // Générer les signatures faciales pour un examen
  static async generateExamSignatures(examId) {
    try {
      const response = await axios.post(
        `${SECURITY_API_URL}/generate-signatures/${examId}`,
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
      console.error('Erreur lors de la génération des signatures:', error);
      throw error;
    }
  }

  // Vérifier si un étudiant est autorisé à passer un examen
  static async verifyStudentForExam(examId, studentName) {
    try {
      const response = await axios.get(
        `${SECURITY_API_URL}/verify-student/${examId}/${studentName}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'étudiant:', error);
      throw error;
    }
  }
}

export default SecurityService;
