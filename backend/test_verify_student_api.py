import requests
import sys

def test_verify_student_api(exam_id, student_names):
    """
    Teste l'API de vérification étudiant avec différentes variantes du nom.
    """
    base_url = "http://localhost:8005/api/security/verify-student"
    
    print(f"\n===== TEST DE L'API DE VÉRIFICATION ÉTUDIANT =====")
    print(f"URL de base: {base_url}")
    print(f"ID de l'examen: {exam_id}")
    
    for name in student_names:
        url = f"{base_url}/{exam_id}/{name}"
        print(f"\nTest avec le nom: '{name}'")
        print(f"URL complète: {url}")
        
        try:
            response = requests.get(url)
            print(f"Code de statut: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"Réponse: {data}")
                print(f"Autorisation: {data.get('authorized', False)}")
                print(f"Message: {data.get('message', 'Pas de message')}")
            else:
                print(f"Erreur: {response.text}")
        
        except Exception as e:
            print(f"Exception: {str(e)}")

if __name__ == "__main__":
    # ID de l'examen à tester
    exam_id = 1
    
    # Différentes variantes du nom à tester
    student_names = [
        "Wilfried_Tonthe",      # Format exact du fichier
        "wilfried_tonthe",      # Minuscules
        "WILFRIED_TONTHE",      # Majuscules
        "Wilfried Tonthe",      # Avec espace
        "wilfried tonthe",      # Minuscules avec espace
        "Wilfried",             # Prénom seulement
        "Tonthe",               # Nom seulement
    ]
    
    test_verify_student_api(exam_id, student_names)
