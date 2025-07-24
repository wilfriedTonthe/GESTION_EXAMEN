from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from threading import Thread
import uvicorn

# Imports directs depuis le dossier principal
from remote_control_detector import RemoteControlDetector
from object_detector import CameraMonitor
from screen_monitor import ScreenProtector

app = FastAPI(
    title="Anti-Cheat API",
    description="API de sécurité pour la surveillance d'examens en ligne",
    version="1.0.0"
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instances des détecteurs
remote_detector = RemoteControlDetector()
camera_monitor = CameraMonitor()
screen_protector = ScreenProtector()

class SecurityStatus(BaseModel):
    remote_control_detected: bool = False
    camera_objects_detected: bool = False
    screen_capture_blocked: bool = False
    detected_processes: List[dict] = []
    detected_objects: List[str] = []

@app.get("/")
async def root():
    return {"message": "API de sécurité anti-triche active"}

@app.get("/status", response_model=SecurityStatus)
async def get_security_status():
    """Obtenir l'état actuel de la sécurité"""
    status = SecurityStatus()
    
    # Vérifier les logiciels de contrôle à distance
    processes = remote_detector.check_running_processes()
    status.remote_control_detected = len(processes) > 0
    status.detected_processes = processes
    
    # Vérifier la détection d'objets par caméra
    objects = camera_monitor.get_detected_objects()
    status.camera_objects_detected = len(objects) > 0
    status.detected_objects = objects
    
    # Vérifier l'état de la protection d'écran
    status.screen_capture_blocked = screen_protector.is_active()
    
    return status

@app.post("/start")
async def start_protection():
    """Démarrer toutes les protections"""
    try:
        remote_detector.start()
        camera_monitor.start()
        # Démarrer screen_protector dans un thread séparé
        Thread(target=screen_protector.start, daemon=True).start()
        return {"message": "Protection démarrée"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/stop")
async def stop_protection():
    """Arrêter toutes les protections"""
    try:
        remote_detector.stop()
        camera_monitor.stop()
        screen_protector.stop()
        return {"message": "Protection arrêtée"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # Démarrer la protection au démarrage du serveur
    start_protection()
    # Désactiver le rechargement automatique pour éviter les problèmes avec les threads
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=False)
