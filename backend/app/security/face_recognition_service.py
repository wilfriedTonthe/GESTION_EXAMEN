"""
Service de reconnaissance faciale pour la sécurité des examens.
Permet de vérifier l'identité des étudiants pendant les examens.
"""
import os
import cv2
import numpy as np
import face_recognition
from typing import List, Dict, Optional, Tuple
import threading
import time
from .camera_monitor import CameraMonitor

class FaceRecognitionService:
    """Service de reconnaissance faciale pour les examens"""
    
    def __init__(self):
        self.signatures_path = os.path.join(os.path.dirname(__file__), '..', '..', 'uploads', 'signatures')
        self.active_monitors = {}
        self._lock = threading.Lock()
        
        # Créer le répertoire de signatures s'il n'existe pas
        os.makedirs(self.signatures_path, exist_ok=True)
    
    def _get_safe_student_name(self, student_name: str) -> str:
        """Nettoie le nom de l'étudiant pour correspondre au format du nom de fichier."""
        return student_name.replace(' ', '_').replace('/', '_').replace('\\', '_')

    def get_signature_file_path(self, exam_id: int) -> str:
        """Retourne le chemin du fichier de signatures pour un examen donné."""
        # Correction du nom de fichier pour correspondre à ce qui est généré
        return os.path.join(self.signatures_path, f"signatures_exam_{exam_id}.npy")
    
    def extract_signatures(self, exam_id: int, images_folder: str) -> bool:
        """
        Extrait les signatures faciales à partir des images d'un dossier et les enregistre.
        Le nom de l'étudiant est dérivé du nom du fichier image.
        """
        try:
            if not os.path.exists(images_folder):
                print(f"Le dossier {images_folder} n'existe pas")
                return False
                
            list_image = []
            list_nom = []
            
            # Parcourir les fichiers d'images
            for nom_fichier in os.listdir(images_folder):
                if nom_fichier.lower().endswith(('.png', '.jpg', '.jpeg')):
                    image_path = os.path.join(images_folder, nom_fichier)
                    image = cv2.imread(image_path)
                    
                    if image is not None:
                        list_image.append(image)
                        # Extraction et nettoyage du nom pour correspondre à la logique de sauvegarde
                        nom_sans_ext = os.path.splitext(nom_fichier)[0]
                        nom_nettoye = self._get_safe_student_name(nom_sans_ext)
                        list_nom.append(nom_nettoye)
            
            if not list_image:
                print("Aucune image valide trouvée dans le dossier")
                return False
                
            # Extraction des caractéristiques faciales
            liste_caracteristiques = []
            compteur = 1
            
            for image, nom in zip(list_image, list_nom):
                try:
                    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                    # Détecter les visages et extraction
                    face_locations = face_recognition.face_locations(image_rgb)
                    
                    if not face_locations:
                        print(f"Aucun visage détecté dans l'image {nom}")
                        continue
                        
                    encodage = face_recognition.face_encodings(image_rgb, face_locations)[0]
                    encodage_list = encodage.tolist() + [nom]
                    liste_caracteristiques.append(encodage_list)
                    
                    progression = (compteur / len(list_image)) * 100
                    print(f"Progression: {progression:.2f}%")
                    compteur += 1
                    
                except Exception as e:
                    print(f"Erreur lors du traitement de l'image {nom}: {str(e)}")
            
            if not liste_caracteristiques:
                print("Aucune caractéristique faciale n'a pu être extraite")
                return False
                
            # Enregistrement des signatures
            if liste_caracteristiques:
                arry_caracteristiques = np.array(liste_caracteristiques, dtype=object)
                signature_file = self.get_signature_file_path(exam_id)
                np.save(signature_file, arry_caracteristiques)
            print(f"Extraction terminée. {len(liste_caracteristiques)} signatures enregistrées pour l'examen {exam_id}")
            return True
            
        except Exception as e:
            print(f"Erreur lors de l'extraction des signatures: {str(e)}")
            return False
    
    def verify_student(self, exam_id: int, student_name: str) -> bool:
        """
        Vérifie si un étudiant est autorisé à passer un examen
        en comparant son nom avec les signatures enregistrées
        """
        try:
            signature_file = self.get_signature_file_path(exam_id)
            
            if not os.path.exists(signature_file):
                print(f"Aucune signature trouvée pour l'examen {exam_id}")
                return False
                
            signatures = np.load(signature_file)
            noms = signatures[:, -1]
            
            # Vérifier si le nom de l'étudiant est dans la liste
            return student_name in noms
            
        except Exception as e:
            print(f"Erreur lors de la vérification de l'étudiant: {str(e)}")
            return False
    
    def start_monitoring(self, session_id: str, exam_id: int, student_name: str) -> bool:
        """Démarre un CameraMonitor pour une session d'examen spécifique."""
        with self._lock:
            if session_id in self.active_monitors:
                print(f"Le moniteur pour la session {session_id} est déjà actif.")
                return True

            print(f"Démarrage de la surveillance pour la session {session_id}...")
            monitor = CameraMonitor()
            self.active_monitors[session_id] = monitor
            
            # Le démarrage du moniteur se fait dans un thread séparé
            monitor.start(exam_id=exam_id, student_name=student_name)
            return True
    
    def stop_monitoring(self, session_id: str) -> bool:
        """Arrête le CameraMonitor pour une session donnée."""
        with self._lock:
            if session_id in self.active_monitors:
                print(f"Arrêt de la surveillance pour la session {session_id}.")
                monitor = self.active_monitors.pop(session_id)
                monitor.stop()
                return True
            print(f"Aucun moniteur actif trouvé pour la session {session_id}.")
            return False
    
    def get_monitoring_status(self, session_id: str) -> Dict:
        """Récupère le statut du CameraMonitor pour une session donnée."""
        with self._lock:
            if session_id in self.active_monitors:
                monitor = self.active_monitors[session_id]
                return monitor.get_status()
            return {
                'running': False, 
                'face_status': 'inactive', 
                'identity_confirmed': False, 
                'emotion': 'unknown',
                'detected_objects': []
            }



