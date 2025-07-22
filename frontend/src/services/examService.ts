import axios, { AxiosResponse } from 'axios';

// Configuration de l'instance Axios
const apiClient = axios.create({
  baseURL: 'http://localhost:8005/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Service pour la gestion des examens
const examService = {
  verifyPassword: async (password: string): Promise<any> => {
    const response = await apiClient.post('/exams/verify-password', { password });
    return response.data;
  },

  startMonitoring: async (examId: number | string, studentName: string, sessionId: string): Promise<any> => {
    const response = await apiClient.post(`/exams/${examId}/monitor/start`, {
      student_name: studentName,
      session_id: sessionId,
    });
    return response.data;
  },

  stopMonitoring: async (examId: number | string, sessionId: string): Promise<any> => {
    const response = await apiClient.post(`/exams/${examId}/monitor/stop`, {
      session_id: sessionId,
    });
    return response.data;
  },

  getMonitoringStatus: async (examId: number | string, sessionId: string): Promise<any> => {
    const response = await apiClient.get(`/exams/${examId}/monitor/status`, {
      params: { session_id: sessionId },
    });
    return response.data;
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

    const response = await apiClient.post('/submissions/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  },
};

export default examService;
