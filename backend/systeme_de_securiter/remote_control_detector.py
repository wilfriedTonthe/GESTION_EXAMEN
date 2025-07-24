import psutil
import os
import winreg
import json
from pathlib import Path

def kill_process(pid):
    """Arrête un processus en utilisant son PID"""
    try:
        process = psutil.Process(pid)
        process.terminate()  # Essaie d'arrêter proprement
        print(f"Processus {pid} arrêté avec succès")
    except psutil.NoSuchProcess:
        print(f"Processus {pid} introuvable")
    except psutil.AccessDenied:
        print(f"Accès refusé pour arrêter le processus {pid}")
    except Exception as e:
        print(f"Erreur lors de l'arrêt du processus {pid}: {e}")

def check_running_processes():
    """Vérifie les processus de contrôle à distance en cours d'exécution"""
    remote_control_keywords = [
        "anydesk",
        "teamviewer",
        "remote desktop",
        "quickassist",
        "vnc",
        "chrome remote",
        "msra.exe"  # Assistance à distance Windows
    ]
    
    detected_processes = []
    
    for proc in psutil.process_iter(['name', 'pid']):
        try:
            process_name = proc.info['name'].lower()
            for keyword in remote_control_keywords:
                if keyword in process_name:
                    detected_processes.append({
                        'name': proc.info['name'],
                        'pid': proc.info['pid']
                    })
                    # Arrêter immédiatement le processus
                    kill_process(proc.info['pid'])
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
            
    return detected_processes

def check_chrome_extensions():
    """Vérifie les extensions de contrôle à distance dans Chrome"""
    remote_control_extensions = []
    
    # Chemin par défaut des extensions Chrome
    chrome_path = os.path.join(os.getenv('LOCALAPPDATA'), 
                             'Google\\Chrome\\User Data\\Default\\Extensions')
    
    if os.path.exists(chrome_path):
        for ext_id in os.listdir(chrome_path):
            manifest_paths = Path(chrome_path).rglob('manifest.json')
            for manifest_path in manifest_paths:
                try:
                    with open(manifest_path, 'r', encoding='utf-8') as f:
                        manifest = json.load(f)
                        name = manifest.get('name', '')
                        permissions = manifest.get('permissions', [])
                        
                        # Vérifier les permissions suspectes
                        suspicious_permissions = ['desktopCapture', 'tabs', 'webNavigation']
                        if any(perm in permissions for perm in suspicious_permissions):
                            remote_control_extensions.append({
                                'name': name,
                                'id': ext_id,
                                'permissions': [p for p in permissions if p in suspicious_permissions]
                            })
                except:
                    continue
                    
    return remote_control_extensions

def main():
    print("Programme de protection contre le contrôle à distance démarré...")
    print("Appuyez sur Ctrl+C pour arrêter")
    
    try:
        while True:
            # Vérifier et arrêter les processus
            processes = check_running_processes()
            if processes:
                print("\nProcessus de contrôle à distance détectés et arrêtés :")
                for proc in processes:
                    print(f"- {proc['name']} (PID: {proc['pid']})")    
            
            # Vérifier les extensions toutes les 10 secondes
            extensions = check_chrome_extensions()
            if extensions:
                print("\nExtensions de contrôle à distance potentielles détectées :")
                for ext in extensions:
                    print(f"- {ext['name']}")
                    print(f"  Permissions suspectes : {', '.join(ext['permissions'])}")
            
            # Attendre 2 secondes avant la prochaine vérification
            import time
            time.sleep(2)
            
    except KeyboardInterrupt:
        print("\nArrêt du programme de protection...")

if __name__ == "__main__":
    main()
