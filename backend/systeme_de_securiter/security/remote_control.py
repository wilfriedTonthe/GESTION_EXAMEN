import psutil
import os
import json
from pathlib import Path
import threading
import time

class RemoteControlDetector:
    def __init__(self):
        self.running = False
        self.detected_processes = []
        self.thread = None
        
    def kill_process(self, pid):
        """Arrête un processus en utilisant son PID"""
        try:
            process = psutil.Process(pid)
            process.terminate()
            return True
        except:
            return False

    def check_running_processes(self):
        """Vérifie les processus de contrôle à distance en cours d'exécution"""
        remote_control_keywords = [
            "anydesk",
            "teamviewer",
            "remote desktop",
            "quickassist",
            "vnc",
            "chrome remote",
            "msra.exe"
        ]
        
        detected = []
        
        for proc in psutil.process_iter(['name', 'pid']):
            try:
                process_name = proc.info['name'].lower()
                for keyword in remote_control_keywords:
                    if keyword in process_name:
                        detected.append({
                            'name': proc.info['name'],
                            'pid': proc.info['pid']
                        })
                        self.kill_process(proc.info['pid'])
            except:
                continue
                
        self.detected_processes = detected
        return detected

    def check_chrome_extensions(self):
        """Vérifie les extensions de contrôle à distance dans Chrome"""
        chrome_path = os.path.join(os.getenv('LOCALAPPDATA'), 
                                 'Google\\Chrome\\User Data\\Default\\Extensions')
        
        detected = []
        
        if os.path.exists(chrome_path):
            for ext_id in os.listdir(chrome_path):
                manifest_paths = Path(chrome_path).rglob('manifest.json')
                for manifest_path in manifest_paths:
                    try:
                        with open(manifest_path, 'r', encoding='utf-8') as f:
                            manifest = json.load(f)
                            name = manifest.get('name', '')
                            permissions = manifest.get('permissions', [])
                            
                            suspicious_permissions = ['desktopCapture', 'tabs', 'webNavigation']
                            if any(perm in permissions for perm in suspicious_permissions):
                                detected.append({
                                    'name': name,
                                    'id': ext_id,
                                    'permissions': [p for p in permissions if p in suspicious_permissions]
                                })
                    except:
                        continue
                        
        return detected

    def monitor_loop(self):
        """Boucle principale de surveillance"""
        while self.running:
            self.check_running_processes()
            time.sleep(2)

    def start(self):
        """Démarre la surveillance"""
        if not self.running:
            self.running = True
            self.thread = threading.Thread(target=self.monitor_loop)
            self.thread.daemon = True
            self.thread.start()

    def stop(self):
        """Arrête la surveillance"""
        self.running = False
        if self.thread:
            self.thread.join(timeout=1)
            self.thread = None
