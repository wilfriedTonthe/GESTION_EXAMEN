"""
Service de gestion de la sécurité pendant les examens.
Gère le cycle de vie des composants de sécurité.
"""
import threading
from typing import Optional

from .camera_monitor import CameraMonitor
from .remote_control import RemoteControlDetector
from .screen_protector import ScreenProtector

class ExamSecurityService:
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(ExamSecurityService, cls).__new__(cls)
                cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
            
        self._initialized = True
        self.camera_monitor = CameraMonitor()  # Conservé pour la reconnaissance faciale
        # self.remote_detector = RemoteControlDetector() # Désactivé
        # self.screen_protector = ScreenProtector()     # Désactivé

        self.active_sessions = {}
        self._lock = threading.Lock()
    
    def start_security(self, session_id: str):
        """Démarre les services de sécurité pour une session d'examen"""
        with self._lock:
            if session_id in self.active_sessions:
                return False
                
            # Démarrer uniquement le service de caméra pour la reconnaissance faciale
            try:
                self.camera_monitor.start()
                # self.remote_detector.start() # Désactivé
                # self.screen_protector.start() # Désactivé
                
                print(f"[SECURITY] Démarrage du service de caméra pour la session {session_id}")
                
                self.active_sessions[session_id] = {
                    'camera': True,
                    'remote': False, # Désactivé
                    'screen': False  # Désactivé
                }
                return True
                
            except Exception as e:
                self.stop_security(session_id)
                print(f"[ERROR] Échec du démarrage de la sécurité: {str(e)}")
                raise RuntimeError(f"Échec du démarrage de la sécurité: {str(e)}")
    
    def stop_security(self, session_id: str):
        """Arrête les services de sécurité pour une session d'examen"""
        with self._lock:
            if session_id in self.active_sessions:
                try:
                    self.camera_monitor.stop()
                except Exception as e:
                    print(f"Erreur lors de l'arrêt du moniteur de caméra: {str(e)}")
                # Les autres services ne sont pas démarrés, donc pas besoin de les arrêter.
                
                print(f"[SECURITY] Arrêt des services de sécurité pour la session {session_id} (mode simulation)")
                del self.active_sessions[session_id]
    
    def get_security_status(self, session_id: str) -> dict:
        """Retourne l'état actuel de la sécurité pour une session"""
        with self._lock:
            if session_id not in self.active_sessions:
                return {
                    'active': False,
                    'camera': False,
                    'remote': False,
                    'screen': False
                }
                
            return {
                'active': True,
                'camera': self.camera_monitor.running,
                'remote': False, # Service désactivé
                'screen': False  # Service désactivé
            }

# Instance globale du service de sécurité
exam_security = ExamSecurityService()
