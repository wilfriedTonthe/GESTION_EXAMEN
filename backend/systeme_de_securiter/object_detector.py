import cv2
import numpy as np
import mss
import threading
from pynput import keyboard, mouse
from ultralytics import YOLO
import time

class ObjectDetector:
    def __init__(self):
        self.model = YOLO("yolov8m.pt")
        self.target_objects = ['cell phone', 'laptop', 'tv', 'remote', 'camera']
        self.cap = cv2.VideoCapture(0)
        self.protection_active = False
        self.locked = False
        self.listener_keyboard = None
        self.listener_mouse = None

    def detect_objects(self, frame):
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
        if self.listener_keyboard:
            self.listener_keyboard.stop()
        if self.listener_mouse:
            self.listener_mouse.stop()

    def flouter_ecran(self):
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
        cv2.destroyWindow("Blocage")

    def run(self):
        print("Surveillance activée (Esc pour forcer la fermeture)")
        try:
            while True:
                ret, frame = self.cap.read()
                if not ret:
                    break
                frame = cv2.resize(frame, (416, 416))
                detected, objs = self.detect_objects(frame)

                if detected:
                    if not self.protection_active:
                        print(f"Objets détectés : {objs}")
                        self.protection_active = True
                        self.lock_input()
                    self.flouter_ecran()
                else:
                    if self.protection_active:
                        print("Plus d'objet détecté")
                        self.protection_active = False
                        self.unlock_input()
                        self.retirer_flou()

                if cv2.waitKey(1) & 0xFF == 27:  # Escape = forcer la fermeture
                    break

        except KeyboardInterrupt:
            pass
        finally:
            self.unlock_input()
            self.cap.release()
            cv2.destroyAllWindows()

if __name__ == "__main__":
    ObjectDetector().run()
