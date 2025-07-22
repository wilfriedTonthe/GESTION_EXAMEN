import cv2
import numpy as np
import threading
import time
import face_recognition
from deepface import DeepFace

class CameraMonitor:
    def __init__(self):
        self.running = False
        self.thread = None
        self.cap = None
        self.lock = threading.Lock()

        # State for Facial Recognition
        self.exam_id = None
        self.student_name = None
        self.student_signature = None
        
        # Status properties that can be accessed externally
        self.identity_confirmed = False
        self.face_status = "pending"  # e.g., pending, confirmed, mismatch, no_face, multiple_faces
        self.emotion_status = "neutral"
        self.detected_objects = [] # Kept for API consistency, but will remain empty

    def initialize_camera(self):
        """Initialise la caméra."""
        if self.cap is None:
            # Try different camera indices if the default one fails
            for i in range(2, -1, -1):
                self.cap = cv2.VideoCapture(i)
                if self.cap.isOpened():
                    print(f"Caméra initialisée avec l'index {i}")
                    break
        
        if not self.cap or not self.cap.isOpened():
            print("ERREUR: Impossible d'ouvrir la caméra.")
            self.face_status = "error_no_camera"
            self.running = False

    def load_signatures(self):
        """Charge les signatures faciales pour l'examen en cours."""
        signature_file = os.path.join('uploads', 'signatures', f'signatures_exam_{self.exam_id}.npy')
        
        if not os.path.exists(signature_file):
            print(f"ERREUR: Fichier de signatures introuvable: {signature_file}")
            self.face_status = "error_no_signatures"
            return False

        known_signatures = np.load(signature_file, allow_pickle=True)
        
        for sig in known_signatures:
            name = sig[-1]
            if name == self.student_name:
                self.student_signature = np.array(sig[:-1]).astype(float)
                break
        
        if self.student_signature is None:
            print(f"ERREUR: Signature pour l'étudiant '{self.student_name}' non trouvée.")
            self.face_status = "error_student_not_found"
            return False
        
        print(f"Signatures pour l'examen {self.exam_id} chargées. Étudiant '{self.student_name}' identifié.")
        return True

    def analyze_frame(self, frame):
        """Analyse une seule image pour la reconnaissance faciale et l'analyse d'émotions."""
        rgb_small_frame = cv2.resize(frame, (0, 0), fx=0.5, fy=0.5)
        rgb_small_frame = cv2.cvtColor(rgb_small_frame, cv2.COLOR_BGR2RGB)

        face_locations = face_recognition.face_locations(rgb_small_frame)
        face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)

        if len(face_encodings) == 1:
            # Un seul visage détecté
            matches = face_recognition.compare_faces([self.student_signature], face_encodings[0])
            if matches[0]:
                self.face_status = "confirmed"
                self.identity_confirmed = True
                # Analyser l'émotion
                try:
                    (x, y, w, h) = face_locations[0]
                    face_img = frame[y*2:y*2+h*2, x*2:x*2+w*2] # Coordonnées sur l'image originale
                    emotion_result = DeepFace.analyze(face_img, actions=['emotion'], enforce_detection=False)
                    self.emotion_status = emotion_result[0]['dominant_emotion']
                except Exception as e:
                    self.emotion_status = "error_analysis"
            else:
                self.face_status = "mismatch"
                self.identity_confirmed = False
        elif len(face_encodings) > 1:
            self.face_status = "multiple_faces"
            self.identity_confirmed = False
        else:
            self.face_status = "no_face"
            self.identity_confirmed = False

        # --- Détection d'objets ---
        # Note: La détection d'objets est désactivée pour se concentrer sur la reconnaissance faciale
        # _, self.detected_objects = self.detect_objects(frame)
        self.detected_objects = [] # Vide pour l'instant

    def monitor_loop(self):
        """Boucle principale de surveillance."""
        self.initialize_camera()
        # self.initialize_model() # Le modèle YOLO n'est plus utilisé pour l'instant

        if not self.load_signatures():
            self.running = False
            print("Arrêt du moniteur en raison d'une erreur de chargement des signatures.")
            return

        while self.running:
            ret, frame = self.cap.read()
            if ret:
                self.analyze_frame(frame)
                
                # Log des statuts pour le débogage
                # print(f"Face: {self.face_status}, Emotion: {self.emotion_status}, Identity: {self.identity_confirmed}")

            time.sleep(0.5) # Ralentir la boucle pour ne pas surcharger le CPU

    def start(self, exam_id: int, student_name: str):
        """Démarre la surveillance pour un examen et un étudiant spécifiques."""
        if not self.running:
            self.exam_id = exam_id
            self.student_name = student_name
            self.running = True
            self.thread = threading.Thread(target=self.monitor_loop)
            self.thread.daemon = True
            self.thread.start()
            print(f"Moniteur de caméra démarré pour l'examen {exam_id}, étudiant {student_name}.")

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

    def get_status(self):
        """Retourne un dictionnaire complet de l'état de la surveillance."""
        with self.lock:
            return {
                "running": self.running,
                "face_status": self.face_status,
                "identity_confirmed": self.identity_confirmed,
                "emotion": self.emotion_status,
                "detected_objects": self.detected_objects
            }
