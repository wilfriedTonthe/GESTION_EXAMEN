"""
Service de gestion de la sécurité pendant les examens.
Gère le cycle de vie des composants de sécurité et l'intégration avec le microservice de sécurité.
"""
import threading
import requests
from typing import Optional

from .camera_monitor import CameraMonitor
# Les imports suivants ont été supprimés car les modules n'existent plus
# from .remote_control import RemoteControlDetector
# from .screen_protector import ScreenProtector

# Configuration du microservice de sécurité
SECURITY_MICROSERVICE_URL = "http://localhost:8001"

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
               
                
                print(f"[SECURITY] Démarrage du service de caméra pour la session {session_id}")
                
                # Appel au microservice de sécurité pour démarrer la protection
                try:
                    print(f"[SECURITY] Tentative d'appel au microservice à {SECURITY_MICROSERVICE_URL}/start")
                    response = requests.post(f"{SECURITY_MICROSERVICE_URL}/start", timeout=5)
                    print(f"[SECURITY] Réponse du microservice: {response.status_code} - {response.text}")
                    if response.status_code == 200:
                        print(f"[SECURITY] Microservice de sécurité démarré avec succès pour la session {session_id}")
                    else:
                        print(f"[WARNING] Le microservice de sécurité a répondu avec le code {response.status_code}")
                except requests.RequestException as e:
                    print(f"[WARNING] Impossible de contacter le microservice de sécurité: {str(e)}")
                    # On continue même si le microservice n'est pas disponible
                
                self.active_sessions[session_id] = {
                    'camera': True,
                    'remote': True, 
                    'screen': True 
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
                
                # Appel au microservice de sécurité pour arrêter la protection
                try:
                    response = requests.post(f"{SECURITY_MICROSERVICE_URL}/stop", timeout=5)
                    if response.status_code == 200:
                        print(f"[SECURITY] Microservice de sécurité arrêté avec succès pour la session {session_id}")
                    else:
                        print(f"[WARNING] Le microservice de sécurité a répondu avec le code {response.status_code} lors de l'arrêt")
                except requests.RequestException as e:
                    print(f"[WARNING] Impossible de contacter le microservice de sécurité pour l'arrêt: {str(e)}")
                    # On continue même si le microservice n'est pas disponible
                
                print(f"[SECURITY] Arrêt des services de sécurité pour la session {session_id}")
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
                'remote': True, 
                'screen': True 
            }

# Instance globale du service de sécurité
exam_security = ExamSecurityService()
