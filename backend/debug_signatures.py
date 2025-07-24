import numpy as np
import os
import sys

def analyze_signatures(exam_id):
    """Analyse le fichier de signatures pour un examen donné et affiche des informations détaillées."""
    path = f'uploads/signatures/signatures_exam_{exam_id}.npy'
    
    try:
        # Charger le fichier de signatures
        data = np.load(path, allow_pickle=True)
        
        print(f"\n===== ANALYSE DU FICHIER DE SIGNATURES POUR L'EXAMEN {exam_id} =====")
        print(f"Chemin du fichier: {os.path.abspath(path)}")
        print(f"Le fichier existe: {os.path.exists(path)}")
        print(f"\nInformations sur le tableau:")
        print(f"  - Forme (dimensions): {data.shape}")
        print(f"  - Type de données: {data.dtype}")
        
        # Extraire les noms d'étudiants
        student_names = data[:, -1]
        print(f"\nNoms d'étudiants trouvés ({len(student_names)}):")
        for i, name in enumerate(student_names):
            print(f"  {i+1}. '{name}'")
        
        # Tester la vérification pour un nom spécifique
        test_name = "Wilfried_Tonthe"
        is_authorized = test_name in student_names
        print(f"\nTest de vérification pour '{test_name}':")
        print(f"  - Présent dans le fichier: {is_authorized}")
        
        # Vérifier la correspondance exacte (sensible à la casse)
        print(f"\nAnalyse de correspondance exacte (sensible à la casse):")
        for name in student_names:
            print(f"  - '{name}' == '{test_name}': {name == test_name}")
        
        # Vérifier la correspondance insensible à la casse
        print(f"\nAnalyse de correspondance insensible à la casse:")
        for name in student_names:
            print(f"  - '{name.lower()}' == '{test_name.lower()}': {name.lower() == test_name.lower()}")
        
    except FileNotFoundError:
        print(f"Erreur: Le fichier '{path}' n'a pas été trouvé.", file=sys.stderr)
    except Exception as e:
        print(f"Une erreur est survenue: {e}", file=sys.stderr)

if __name__ == "__main__":
    # Analyser le fichier de signatures pour l'examen ID 1
    analyze_signatures(1)
