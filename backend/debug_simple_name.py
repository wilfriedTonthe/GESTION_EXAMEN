import numpy as np
import os

# Chemin du fichier de signatures
path = 'uploads/signatures/signatures_exam_1.npy'

try:
    # Charger le fichier de signatures
    data = np.load(path, allow_pickle=True)
    
    # Extraire les noms d'étudiants
    student_names = data[:, -1]
    print("Noms d'étudiants trouvés:")
    for name in student_names:
        print(f"  - '{name}'")
    
    # Test avec le nom exact
    test_name = "Wilfried_Tonthe"
    is_in_list = test_name in student_names
    print(f"\nTest 1: '{test_name}' est dans la liste: {is_in_list}")
    
    # Test avec une version en minuscules
    test_name_lower = "wilfried_tonthe"
    is_in_list_lower = test_name_lower in student_names
    print(f"Test 2: '{test_name_lower}' est dans la liste: {is_in_list_lower}")
    
    # Test avec une version sans underscore
    test_name_no_underscore = "Wilfried Tonthe"
    is_in_list_no_underscore = test_name_no_underscore in student_names
    print(f"Test 3: '{test_name_no_underscore}' est dans la liste: {is_in_list_no_underscore}")
    
    # Vérification manuelle avec une boucle
    print("\nVérification manuelle:")
    for name in student_names:
        print(f"  - '{name}' == '{test_name}': {name == test_name}")
    
except FileNotFoundError:
    print(f"Erreur: Le fichier '{path}' n'a pas été trouvé.")
except Exception as e:
    print(f"Une erreur est survenue: {e}")
