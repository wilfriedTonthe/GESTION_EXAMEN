import psutil
import os
import json
from pathlib import Path
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class RemoteControlDetector:
    def __init__(self):
        self.remote_control_keywords = [
            'anydesk',
            'teamviewer',
            'remote desktop',
            'quickassist',
            'vnc',
            'chrome remote',
            'msra.exe',
            'splashtop',
            'logmein',
            'gotomypc',
            'supremocontrol',
            'supremocontrol64',
            'supremocontrol32',
            'supremo',
            'supremo service',
            'supremocontrol service'
        ]
        
        self.running = False
        self.detected_processes = []
        
    def kill_process(self, pid: int) -> bool:
        """Arrête un processus en utilisant son PID"""
        try:
            process = psutil.Process(pid)
            process.terminate()
            return True
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.TimeoutExpired) as e:
            logger.warning(f"Impossible d'arrêter le processus {pid}: {e}")
            return False
            
    def check_running_processes(self) -> List[Dict[str, Any]]:
        """Vérifie les processus de contrôle à distance en cours d'exécution"""
        detected = []
        
        for proc in psutil.process_iter(['name', 'exe', 'cmdline', 'pid']):
            try:
                process_name = proc.info['name'].lower()
                process_cmd = ' '.join(proc.info['cmdline']).lower() if proc.info['cmdline'] else ''
                
                for keyword in self.remote_control_keywords:
                    if (keyword in process_name or 
                        keyword in process_cmd or
                        (proc.info['exe'] and keyword in proc.info['exe'].lower())):
                        
                        detected_info = {
                            'name': proc.info['name'],
                            'pid': proc.info['pid'],
                            'exe': proc.info['exe'],
                            'cmdline': proc.info['cmdline']
                        }
                        
                        if detected_info not in self.detected_processes:
                            logger.warning(f"Détection d'un logiciel de contrôle à distance: {detected_info}")
                            self.detected_processes.append(detected_info)
                            
                        detected.append(detected_info)
                        
                        # Tenter d'arrêter le processus
                        self.kill_process(proc.info['pid'])
                        
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
                
        return detected
    
    def check_chrome_extensions(self) -> List[Dict[str, Any]]:
        """Vérifie les extensions Chrome suspectes"""
        suspicious_extensions = []
        chrome_paths = [
            os.path.join(os.getenv('LOCALAPPDATA', ''), 'Google', 'Chrome', 'User Data'),
            os.path.join(os.getenv('ProgramFiles', ''), 'Google', 'Chrome', 'Application'),
            os.path.join(os.getenv('ProgramFiles(x86)', ''), 'Google', 'Chrome', 'Application')
        ]
        
        for chrome_path in chrome_paths:
            if not os.path.exists(chrome_path):
                continue
                
            # Vérifier les extensions installées
            extensions_path = os.path.join(chrome_path, 'Default', 'Extensions')
            if not os.path.exists(extensions_path):
                continue
                
            for ext_id in os.listdir(extensions_path):
                ext_dir = os.path.join(extensions_path, ext_id)
                if not os.path.isdir(ext_dir):
                    continue
                    
                # Vérifier chaque version de l'extension
                for version in os.listdir(ext_dir):
                    manifest_path = os.path.join(ext_dir, version, 'manifest.json')
                    if not os.path.exists(manifest_path):
                        continue
                        
                    try:
                        with open(manifest_path, 'r', encoding='utf-8') as f:
                            manifest = json.load(f)
                            
                            # Vérifier les permissions suspectes
                            suspicious_perms = [
                                'desktopCapture', 'tabs', 'webNavigation', 'debugger',
                                'nativeMessaging', 'proxy', 'management', 'privacy'
                            ]
                            
                            permissions = manifest.get('permissions', [])
                            if not isinstance(permissions, list):
                                permissions = []
                                
                            dangerous_perms = [p for p in permissions if p in suspicious_perms]
                            
                            if dangerous_perms:
                                ext_info = {
                                    'id': ext_id,
                                    'name': manifest.get('name', 'Unknown'),
                                    'version': manifest.get('version', 'Unknown'),
                                    'permissions': dangerous_perms
                                }
                                suspicious_extensions.append(ext_info)
                                
                    except (json.JSONDecodeError, KeyError) as e:
                        logger.error(f"Erreur lors de la lecture du manifeste {manifest_path}: {e}")
                        continue
                        
        return suspicious_extensions
        
    def start(self):
        """Démarre la surveillance en arrière-plan"""
        self.running = True
        logger.info("Démarrage de la surveillance des contrôles à distance")
        
    def stop(self):
        """Arrête la surveillance"""
        self.running = False
        logger.info("Arrêt de la surveillance des contrôles à distance")
        
    def get_status(self) -> Dict[str, Any]:
        """Retourne l'état actuel du détecteur"""
        processes = self.check_running_processes()
        extensions = self.check_chrome_extensions()
        
        return {
            'running': self.running,
            'detected_processes': processes,
            'detected_extensions': extensions,
            'threat_detected': len(processes) > 0 or len(extensions) > 0
        }
