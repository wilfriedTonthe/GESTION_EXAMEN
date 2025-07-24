import sys
import psutil
import time
import tkinter as tk
from tkinter import messagebox
import threading
import win32gui
import win32con
import win32process
import keyboard

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
            'screensketch.exe': 'Capture d\'écran',
        }
        
        self.root = tk.Tk()
        self.root.withdraw()  # Cacher la fenêtre principale
        
        # Créer la fenêtre de protection
        self.overlay = tk.Toplevel(self.root)
        self.overlay.withdraw()  # Cacher la fenêtre de protection au démarrage
        
        # Configurer la fenêtre de protection
        self.overlay.attributes('-alpha', 0.9)  # Semi-transparent
        self.overlay.attributes('-topmost', True)  # Toujours au premier plan
        self.overlay.attributes('-fullscreen', True)  # Plein écran
        self.overlay.configure(bg='black')
        
        # Rendre la fenêtre non interactive
        self.overlay.overrideredirect(True)
        
        # État de la protection
        self.protection_active = False
        
        # Démarrer le thread de surveillance
        self.monitoring = True
        self.monitor_thread = threading.Thread(target=self.monitor_recording_tools)
        self.monitor_thread.daemon = True
        self.monitor_thread.start()
        
        # Raccourci clavier pour activer/désactiver la protection
        keyboard.add_hotkey('ctrl+alt+d', self.toggle_protection)
        
    def show_warning(self, tool_name):
        """Affiche un message d'avertissement"""
        messagebox.showwarning(
            "Protection Activée",
            f"Le logiciel {tool_name} a été détecté et arrêté !\n\n"
            "L'utilisation d'outils de capture d'écran n'est pas autorisée.",
            parent=self.root
        )
        
    def monitor_recording_tools(self):
        """Surveille les processus de capture d'écran"""
        while self.monitoring:
            for proc in psutil.process_iter(['name', 'pid']):
                try:
                    proc_name = proc.info['name'].lower()
                    for tool_name, tool_display_name in self.recording_tools.items():
                        if tool_name.lower() in proc_name:
                            try:
                                # Terminer le processus
                                process = psutil.Process(proc.info['pid'])
                                process.terminate()
                                
                                # Activer la protection
                                self.root.after(0, lambda: self.show_warning(tool_display_name))
                                self.activate_protection()
                                
                            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.TimeoutExpired):
                                pass
                                
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
                    
            time.sleep(1)  # Vérifier toutes les secondes
            
    def activate_protection(self):
        """Active la protection (écran noir)"""
        if not self.protection_active:
            self.overlay.deiconify()
            self.protection_active = True
            # Désactiver après 2 secondes
            self.root.after(2000, self.deactivate_protection)
            
    def deactivate_protection(self):
        """Désactive la protection"""
        self.overlay.withdraw()
        self.protection_active = False
        
    def toggle_protection(self):
        """Active/désactive manuellement la protection"""
        if self.protection_active:
            self.deactivate_protection()
        else:
            self.activate_protection()
            
    def run(self):
        """Démarre l'application"""
        print("Protection contre les captures d'écran activée")
        print("Le programme surveille et bloque les outils de capture d'écran")
        print("Utilisez Ctrl+Alt+D pour activer/désactiver l'écran noir")
        print("Appuyez sur Ctrl+C dans la console pour quitter")
        
        try:
            self.root.mainloop()
        except KeyboardInterrupt:
            self.stop()
            
    def stop(self):
        """Arrête l'application"""
        self.monitoring = False
        self.root.quit()

if __name__ == "__main__":
    protector = ScreenProtector()
    protector.run()
