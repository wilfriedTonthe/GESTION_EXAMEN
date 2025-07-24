const API_BASE_URL = 'http://localhost:8004/api';

export const API_ENDPOINTS = {
  EXAMS: `${API_BASE_URL}/exams`,
  SUBMISSIONS: `${API_BASE_URL}/submissions`,
  SECURITY: `${API_BASE_URL}/security`,
};

export const ROUTES = {
  HOME: '/',
  EXAM: '/exam/:password',
  EXAM_ACCESS: '/exam/access',
  TEACHER: '/teacher',
  EXAM_RESULTS: '/exam/:examId/results',
  NOT_FOUND: '/404',
  TEACHER_LOGIN: '/teacher/login',
  TEACHER_REGISTER: '/teacher/register',
  DASHBOARD: '/dashboard',
};

export const EXAM_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  TRUE_FALSE: 'true_false',
};

export const QUESTION_TYPES = [
  { value: EXAM_TYPES.MULTIPLE_CHOICE, label: 'Choix multiple' },
  { value: EXAM_TYPES.TRUE_FALSE, label: 'Vrai/Faux' },
];
