import psutil
import time
import win32gui
import win32con
import win32process
import ctypes
from threading import Thread, Lock
from pynput import mouse, keyboard
from pynput.mouse import Button
from pynput.keyboard import Key, KeyCode

class ScreenProtector:
    def __init__(self):
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
            'screensketch.exe': 'Capture d\'\u00e9cran',
            'quickassist.exe': 'Assistance rapide',
            'msra.exe': 'Assistance rapide'
        }
        self.running = True
        self.lock = Lock()
        self.detected_processes = set()
        
        # Initialiser le message de notification
        self.user32 = ctypes.windll.user32
        
        # Initialiser les listeners pour le clavier et la souris
        self.keyboard_listener = keyboard.Listener(on_press=self._on_key_press)
        self.mouse_listener = mouse.Listener(
            on_move=self._on_mouse_move,
            on_click=self._on_mouse_click,
            on_scroll=self._on_mouse_scroll
        )
        
        # Démarrer les listeners
        self.keyboard_listener.start()
        self.mouse_listener.start()
        
    def check_and_kill_processes(self):
        """Vérifie et arrête les processus de capture d'écran"""
        while self.running:
            try:
                detected = False
                for proc in psutil.process_iter(['name', 'pid']):
                    try:
                        process_name = proc.info['name'].lower()
                        for tool_name, display_name in self.recording_tools.items():
                            if tool_name.lower() in process_name:
                                detected = True
                                with self.lock:
                                    self.detected_processes.add(proc.info['pid'])
                                
                                try:
                                    # Récupérer le processus
                                    process = psutil.Process(proc.info['pid'])
                                    
                                    # Récupérer le handle de la fenêtre
                                    def callback(hwnd, hwnds):
                                        if win32gui.IsWindowVisible(hwnd):
                                            _, pid = win32process.GetWindowThreadProcessId(hwnd)
                                            if pid == proc.info['pid']:
                                                hwnds.append(hwnd)
                                        return True
                                    
                                    hwnds = []
                                    win32gui.EnumWindows(callback, hwnds)
                                    
                                    # Fermer la fenêtre proprement
                                    for hwnd in hwnds:
                                        win32gui.PostMessage(hwnd, win32con.WM_CLOSE, 0, 0)
                                    
                                    # Terminer le processus
                                    process.terminate()
                                    print(f"Processus arrêté : {display_name}")
                                    
                                except (psutil.NoSuchProcess, psutil.AccessDenied):
                                    continue
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        continue
                
                # Afficher une notification si un processus est détecté
                if detected:
                    Thread(target=self.show_overlay, daemon=True).start()
                else:
                    with self.lock:
                        self.detected_processes.clear()
                
                time.sleep(0.5)  # Vérifier plus fréquemment
            except Exception as e:
                print(f"Erreur lors de la vérification des processus : {e}")
                time.sleep(1)

    def _on_key_press(self, key):
        """Gestionnaire d'événements pour les touches du clavier"""
        with self.lock:
            if len(self.detected_processes) > 0:
                # Bloquer toutes les touches sauf Alt+F4
                if isinstance(key, KeyCode):
                    return False
                if key == Key.alt_l or key == Key.alt_r or key == Key.f4:
                    return True
                return False
        return True
    
    def _on_mouse_move(self, x, y):
        """Gestionnaire d'événements pour le mouvement de la souris"""
        with self.lock:
            return len(self.detected_processes) == 0
    
    def _on_mouse_click(self, x, y, button, pressed):
        """Gestionnaire d'événements pour les clics de souris"""
        with self.lock:
            return len(self.detected_processes) == 0
    
    def _on_mouse_scroll(self, x, y, dx, dy):
        """Gestionnaire d'événements pour la molette de la souris"""
        with self.lock:
            return len(self.detected_processes) == 0
    
    def show_overlay(self):
        """Affiche un message d'avertissement"""
        self.user32.MessageBoxW(0, 
            "Capture d'écran détectée\nFermeture en cours...", 
            "Alerte de Sécurité", 
            0x40000)
    
    def hide_overlay(self):
        """Ne fait rien car le message se ferme automatiquement"""
        pass
    
    def start(self):
        """Démarre la surveillance"""
        self.running = True
        # Démarrer le thread de surveillance
        self.monitor_thread = Thread(target=self.check_and_kill_processes)
        self.monitor_thread.daemon = True
        self.monitor_thread.start()
    
    def stop(self):
        """Arrête la surveillance"""
        self.running = False
        if hasattr(self, 'monitor_thread'):
            self.monitor_thread.join(timeout=1)
        # Arrêter les listeners
        self.keyboard_listener.stop()
        self.mouse_listener.stop()

    def is_active(self):
        """Vérifie si la protection est active"""
        with self.lock:
            return len(self.detected_processes) > 0
