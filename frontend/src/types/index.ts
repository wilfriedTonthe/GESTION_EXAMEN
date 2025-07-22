declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.svg' {
  import React = require('react');
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

// Définition du statut de la surveillance
export interface MonitoringStatus {
  running: boolean;
  face_status: 'active' | 'inactive' | 'not_detected';
  identity_confirmed: boolean;
  emotion: string;
  error?: string;
}

export interface ExamLoginResponse {
  exam_id: number;
  title: string;
  description?: string;
  expires_at?: string; 
}
