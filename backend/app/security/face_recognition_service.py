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
        Traite tous les fichiers d'images fournis et génère un fichier de signatures unique.
        """
        try:
            if not os.path.exists(images_folder):
                print(f"Le dossier {images_folder} n'existe pas")
                return False
                
            list_image = []
            list_nom = []
            skipped_files = []
            processed_files = []
            
            # Parcourir les fichiers d'images
            print(f"Analyse du dossier {images_folder}...")
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
                        processed_files.append(nom_fichier)
                        print(f"Fichier ajouté pour traitement: {nom_fichier}")
                    else:
                        skipped_files.append(nom_fichier)
                        print(f"Image non valide ignorée: {nom_fichier}")
                else:
                    skipped_files.append(nom_fichier)
                    print(f"Fichier ignoré (format non supporté): {nom_fichier}")
            
            if not list_image:
                print("Aucune image valide trouvée dans le dossier")
                return False
                
            print(f"Début de l'extraction des caractéristiques faciales pour {len(list_image)} images...")
            # Extraction des caractéristiques faciales
            liste_caracteristiques = []
            compteur = 1
            failed_images = []
            successful_images = []
            
            for image, nom, fichier in zip(list_image, list_nom, processed_files):
                try:
                    print(f"Traitement de l'image {compteur}/{len(list_image)}: {fichier}")
                    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                    # Détecter les visages et extraction
                    face_locations = face_recognition.face_locations(image_rgb)
                    
                    if not face_locations:
                        print(f"⚠️ Aucun visage détecté dans l'image {fichier}")
                        failed_images.append(fichier)
                        continue
                        
                    if len(face_locations) > 1:
                        print(f"⚠️ Plusieurs visages détectés dans l'image {fichier}, utilisation du premier visage")
                    
                    encodage = face_recognition.face_encodings(image_rgb, face_locations)[0]
                    encodage_list = encodage.tolist() + [nom]
                    liste_caracteristiques.append(encodage_list)
                    successful_images.append(fichier)
                    
                    progression = (compteur / len(list_image)) * 100
                    print(f"Progression: {progression:.2f}% - Signature extraite pour {nom}")
                    compteur += 1
                    
                except Exception as e:
                    print(f"❌ Erreur lors du traitement de l'image {fichier}: {str(e)}")
                    failed_images.append(fichier)
            
            if not liste_caracteristiques:
                print("❌ Aucune caractéristique faciale n'a pu être extraite")
                return False
                
            # Enregistrement des signatures
            if liste_caracteristiques:
                arry_caracteristiques = np.array(liste_caracteristiques, dtype=object)
                signature_file = self.get_signature_file_path(exam_id)
                np.save(signature_file, arry_caracteristiques)
                print(f"✅ Extraction terminée. {len(liste_caracteristiques)} signatures enregistrées pour l'examen {exam_id}")
                print(f"✅ Fichier de signatures créé: {signature_file}")
                
                # Résumé du traitement
                print("\n--- RÉSUMÉ DU TRAITEMENT ---")
                print(f"Total des fichiers traités: {len(processed_files)}")
                print(f"Signatures extraites avec succès: {len(successful_images)}")
                print(f"Fichiers échoués: {len(failed_images)}")
                print(f"Fichiers ignorés: {len(skipped_files)}")
                
                if failed_images:
                    print("\nFichiers échoués:")
                    for f in failed_images:
                        print(f" - {f}")
                
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
                
            signatures = np.load(signature_file, allow_pickle=True)
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
# Créer une instance unique du service de reconnaissance faciale
face_recognition_service = FaceRecognitionService()

