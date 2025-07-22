import psutil
import os
import time
import logging
import win32gui
import win32con
import win32process
from typing import List, Dict, Any, Optional
import threading

logger = logging.getLogger(__name__)

class ScreenProtector:
    def __init__(self):
        # Liste des processus de capture d'écran connus
        self.recording_tools = {
            'obs64.exe': 'OBS Studio',
            'obs32.exe': 'OBS Studio',
            'streamlabs.exe': 'Streamlabs',
            'xsplit.core.exe': 'XSplit',
            'fraps.exe': 'Fraps',
            'bandicam.exe': 'Bandicam',
            'action.exe': 'Action!',
            'screenrec.exe': 'ScreenRec',
            'camtasia.exe': 'Camtasia',
            'sharex.exe': 'ShareX',
            'lightshot.exe': 'Lightshot',
            'snipaste.exe': 'Snipaste',
            'snippingtool.exe': 'Outil Capture',
            'screensketch.exe': 'Capture d\'écran',
            'snagit.exe': 'Snagit',
            'greenshot.exe': 'Greenshot',
            'picpick.exe': 'PicPick',
            'gyazo.exe': 'Gyazo',
            'share.exe': 'Windows Share',
            'msedge.exe': 'Microsoft Edge',  # Peut être utilisé pour la capture d'écran
            'chrome.exe': 'Google Chrome',   # Peut être utilisé pour la capture d'écran
            'firefox.exe': 'Mozilla Firefox' # Peut être utilisé pour la capture d'écran
        }
        
        # État du protecteur
        self.running = False
        self.protection_active = False
        self.detected_processes = []
        self.monitor_thread = None
        self.lock = threading.Lock()
        
    def is_screen_capture_active(self) -> bool:
        """Vérifie si une capture d'écran est en cours"""
        try:
            # Vérifier les fenêtres avec des titres suspects
            def enum_windows_callback(hwnd, results):
                if not win32gui.IsWindowVisible(hwnd):
                    return
                    
                window_title = win32gui.GetWindowText(hwnd)
                suspicious_titles = ['capture', 'enregistrement', 'recording', 'screenshot', 'screen shot']
                
                if any(title in window_title.lower() for title in suspicious_titles):
                    results.append(hwnd)
                    
            windows = []
            win32gui.EnumWindows(enum_windows_callback, windows)
            return len(windows) > 0
            
        except Exception as e:
            logger.error(f"Erreur lors de la vérification des fenêtres: {e}")
            return False
    
    def check_processes(self) -> List[Dict[str, Any]]:
        """Vérifie les processus de capture en cours d'exécution"""
        detected = []
        
        for proc in psutil.process_iter(['name', 'pid', 'exe', 'cmdline']):
            try:
                proc_name = proc.info['name'].lower()
                proc_cmd = ' '.join(proc.info['cmdline']).lower() if proc.info['cmdline'] else ''
                
                # Vérifier si le nom du processus correspond à un outil connu
                for tool_name, display_name in self.recording_tools.items():
                    if (tool_name in proc_name or 
                        tool_name in proc_cmd or
                        (proc.info['exe'] and tool_name in proc.info['exe'].lower())):
                        
                        detected_info = {
                            'name': display_name,
                            'pid': proc.info['pid'],
                            'process_name': proc_name,
                            'exe': proc.info['exe']
                        }
                        
                        # Vérifier si ce processus a déjà été détecté
                        with self.lock:
                            if not any(d['pid'] == detected_info['pid'] for d in self.detected_processes):
                                logger.warning(f"Détection d'un outil de capture: {detected_info}")
                                self.detected_processes.append(detected_info)
                        
                        detected.append(detected_info)
                        
                        # Tenter d'arrêter le processus
                        self.terminate_process(proc.info['pid'])
                        
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue
                
        return detected
        
    def terminate_process(self, pid: int) -> bool:
        """Tente de terminer un processus"""
        try:
            process = psutil.Process(pid)
            process.terminate()
            return True
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.TimeoutExpired) as e:
            logger.warning(f"Impossible d'arrêter le processus {pid}: {e}")
            return False
    
    def monitor_loop(self):
        """Boucle principale de surveillance"""
        check_interval = 1.0  # Vérifier toutes les secondes
        
        while self.running:
            try:
                # Vérifier les processus suspects
                detected = self.check_processes()
                
                # Vérifier les captures d'écran actives
                screen_capture_active = self.is_screen_capture_active()
                
                # Mettre à jour l'état de protection
                with self.lock:
                    threat_detected = len(detected) > 0 or screen_capture_active
                    
                    if threat_detected and not self.protection_active:
                        logger.warning("Menace détectée, activation de la protection")
                        self.protect_screen(True)
                        self.protection_active = True
                    elif not threat_detected and self.protection_active:
                        logger.info("Aucune menace détectée, désactivation de la protection")
                        self.protect_screen(False)
                        self.protection_active = False
                        
            except Exception as e:
                logger.error(f"Erreur dans la boucle de surveillance: {e}")
                
            # Attendre avant la prochaine vérification
            time.sleep(check_interval)
    
    def protect_screen(self, enable: bool):
        """Active ou désactive la protection d'écran"""
        # Cette méthode peut être étendue pour implémenter des mesures de protection plus avancées
        if enable:
            logger.warning("Protection d'écran activée")
            # Ici, vous pourriez implémenter des mesures comme :
            # - Afficher un écran noir
            # - Désactiver les captures d'écran système
            # - Notifier l'utilisateur
        else:
            logger.info("Protection d'écran désactivée")
    
    def start(self):
        """Démarre la protection d'écran"""
        if self.running:
            return
            
        self.running = True
        self.monitor_thread = threading.Thread(target=self.monitor_loop, daemon=True)
        self.monitor_thread.start()
        logger.info("Protecteur d'écran démarré")
        
    def stop(self):
        """Arrête la protection d'écran"""
        if not self.running:
            return
            
        self.running = False
        
        if self.monitor_thread and self.monitor_thread.is_alive():
            self.monitor_thread.join(timeout=2.0)
            
        # Désactiver la protection si elle était active
        if self.protection_active:
            self.protect_screen(False)
            self.protection_active = False
            
        logger.info("Protecteur d'écran arrêté")
        
    def get_status(self) -> Dict[str, Any]:
        """Retourne l'état actuel du protecteur d'écran"""
        with self.lock:
            return {
                'running': self.running,
                'protection_active': self.protection_active,
                'detected_processes': self.detected_processes.copy(),
                'threat_detected': self.protection_active
            }