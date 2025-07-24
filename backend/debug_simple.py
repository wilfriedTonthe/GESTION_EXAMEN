import numpy as np
import sys

path = r'uploads/signatures/signatures_exam_1.npy'

try:
    data = np.load(path, allow_pickle=True)
    print("Contenu du fichier .npy :")
    print(data)
    
    # Extraire les noms d'étudiants
    student_names = data[:, -1]
    print("\nNoms d'étudiants trouvés :")
    for name in student_names:
        print(f"  - '{name}'")
    
    # Vérifier si Wilfried_Tonthe est présent
    test_name = "Wilfried_Tonthe"
    is_present = test_name in student_names
    print(f"\nWilfried_Tonthe est présent: {is_present}")
    
except FileNotFoundError:
    print(f"Erreur : Le fichier '{path}' n'a pas été trouvé.", file=sys.stderr)
except Exception as e:
    print(f"Une erreur est survenue : {e}", file=sys.stderr)
