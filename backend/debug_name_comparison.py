import numpy as np
import sys

def debug_name_comparison(exam_id, test_name):
    """Débogue la comparaison de noms dans le fichier de signatures."""
    path = f'uploads/signatures/signatures_exam_{exam_id}.npy'
    
    try:
        # Charger le fichier de signatures
        data = np.load(path, allow_pickle=True)
        
        print(f"\n===== DÉBOGAGE DE LA COMPARAISON DE NOMS POUR L'EXAMEN {exam_id} =====")
        
        # Extraire les noms d'étudiants
        student_names = data[:, -1]
        print(f"\nNoms d'étudiants trouvés ({len(student_names)}):")
        for i, name in enumerate(student_names):
            print(f"  {i+1}. '{name}' (type: {type(name)}, longueur: {len(name)})")
        
        # Analyse détaillée du nom à tester
        print(f"\nAnalyse du nom à tester: '{test_name}' (type: {type(test_name)}, longueur: {len(test_name)})")
        
        # Comparaison exacte (sensible à la casse)
        print(f"\nComparaison exacte (sensible à la casse):")
        for name in student_names:
            match = name == test_name
            print(f"  - '{name}' == '{test_name}': {match}")
            if not match:
                # Analyse caractère par caractère
                if len(name) == len(test_name):
                    print(f"    Analyse caractère par caractère:")
                    for i, (c1, c2) in enumerate(zip(name, test_name)):
                        print(f"      Pos {i}: '{c1}' (ord={ord(c1)}) vs '{c2}' (ord={ord(c2)}) - Match: {c1 == c2}")
        
        # Comparaison insensible à la casse
        print(f"\nComparaison insensible à la casse:")
        for name in student_names:
            match = name.lower() == test_name.lower()
            print(f"  - '{name.lower()}' == '{test_name.lower()}': {match}")
        
        # Vérification avec strip() pour éliminer les espaces
        print(f"\nComparaison avec strip() (espaces supprimés):")
        for name in student_names:
            match = name.strip() == test_name.strip()
            print(f"  - '{name.strip()}' == '{test_name.strip()}': {match}")
        
        # Test final: est-ce que le nom est dans la liste?
        is_in_list = test_name in student_names
        print(f"\nRésultat final: '{test_name}' est dans la liste: {is_in_list}")
        
    except FileNotFoundError:
        print(f"Erreur: Le fichier '{path}' n'a pas été trouvé.", file=sys.stderr)
    except Exception as e:
        print(f"Une erreur est survenue: {e}", file=sys.stderr)

if __name__ == "__main__":
    # Déboguer la comparaison pour l'examen ID 1 et le nom "Wilfried_Tonthe"
    debug_name_comparison(1, "Wilfried_Tonthe")
