import cv2
import numpy as np
import threading
import time
import mss
from pynput import keyboard, mouse
from ultralytics import YOLO

class CameraMonitor:
    def __init__(self):
        self.running = False
        self.thread = None
        self.detected_objects = []
        self.model = None
        self.cap = None
        self.protection_active = False
        self.locked = False
        self.listener_keyboard = None
        self.listener_mouse = None
        
        # Liste des objets à détecter
        self.target_objects = [
            'cell phone',
            'laptop',
            'tv',
            'remote',
            'camera'
        ]
        
    def initialize_camera(self):
        """Initialise la caméra"""
        if self.cap is None:
            self.cap = cv2.VideoCapture(1, cv2.CAP_DSHOW)
            if not self.cap.isOpened():
                self.cap = cv2.VideoCapture(0)
                
        if not self.cap.isOpened():
            raise Exception("Impossible d'ouvrir la caméra")
            
    def initialize_model(self):
        """Initialise le modèle YOLO"""
        if self.model is None:
            self.model = YOLO('yolov8n.pt')

    def detect_objects(self, frame):
        """Détecte les objets dans une image"""
        if self.model is None:
            return False, []
            
        results = self.model.predict(source=frame, stream=True, verbose=False)
        detected = []
        
        for result in results:
            for box in result.boxes:
                name = result.names[int(box.cls[0])]
                conf = float(box.conf[0])
                if name in self.target_objects and conf > 0.5:
                    detected.append(name)
                    
        return len(detected) > 0, detected
        
    def lock_input(self):
        """Bloque le clavier et la souris"""
        # Bloque le clavier
        def on_press(key): return False
        self.listener_keyboard = keyboard.Listener(on_press=on_press)
        self.listener_keyboard.start()

        # Bloque la souris
        def on_move(x, y): return False
        def on_click(x, y, button, pressed): return False
        self.listener_mouse = mouse.Listener(on_move=on_move, on_click=on_click)
        self.listener_mouse.start()
        
    def unlock_input(self):
        """Débloque le clavier et la souris"""
        if self.listener_keyboard:
            self.listener_keyboard.stop()
        if self.listener_mouse:
            self.listener_mouse.stop()
            
    def flouter_ecran(self):
        """Floute l'écran et affiche un avertissement"""
        with mss.mss() as sct:
            monitor = sct.monitors[1]
            screenshot = sct.grab(monitor)
            img = np.array(screenshot)
            img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
            flou = cv2.GaussianBlur(img, (51, 51), 0)
            cv2.putText(flou, "⚠️ APPAREIL INTERDIT DETECTÉ ⚠️", (100, 100),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 255), 4)
            cv2.namedWindow("Blocage", cv2.WND_PROP_FULLSCREEN)
            cv2.setWindowProperty("Blocage", cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)
            cv2.imshow("Blocage", flou)
            cv2.waitKey(1)
            
    def retirer_flou(self):
        """Retire le flou de l'écran"""
        cv2.destroyWindow("Blocage")

    def monitor_loop(self):
        """Boucle principale de surveillance"""
        self.initialize_camera()
        self.initialize_model()
        
        while self.running:
            ret, frame = self.cap.read()
            if ret:
                frame = cv2.resize(frame, (416, 416))
                detected, objs = self.detect_objects(frame)
                
                if detected:
                    if not self.protection_active:
                        print(f"Objets détectés : {objs}")
                        self.protection_active = True
                        self.lock_input()
                        self.detected_objects = objs
                    self.flouter_ecran()
                else:
                    if self.protection_active:
                        print("Plus d'objet détecté")
                        self.protection_active = False
                        self.unlock_input()
                        self.retirer_flou()
                        self.detected_objects = []
                        
            time.sleep(0.1)

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
            
        if self.cap:
            self.cap.release()
            self.cap = None
            
        self.unlock_input()
        cv2.destroyAllWindows()

    def get_detected_objects(self):
        """Retourne la liste des objets détectés"""
        return self.detected_objects
