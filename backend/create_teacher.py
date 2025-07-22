import requests
import json

# --- Configuration ---
# L'URL de votre API backend. Assurez-vous que le port est correct.
BASE_URL = "http://localhost:8005"
REGISTER_ENDPOINT = "/api/auth/register"

# --- Données de l'enseignant à créer ---
# Modifiez ces informations si nécessaire
teacher_data = {
    "full_name": "Enseignant Test",
    "email": "teacher.test@example.com",
    "password": "123456",
    "is_teacher": True
}

# --- Script ---
def create_teacher_account():
    """
    Envoie une requête POST pour créer un compte enseignant.
    """
    url = BASE_URL + REGISTER_ENDPOINT
    headers = {"Content-Type": "application/json"}

    print(f"Tentative de création d'un compte enseignant avec les données suivantes :")
    print(json.dumps(teacher_data, indent=2))
    print(f"Envoi de la requête à : {url}")

    try:
        response = requests.post(url, json=teacher_data, headers=headers)

        print("\n--- Réponse du serveur ---")
        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            print("Succès ! Le compte enseignant a été créé.")
            print("Données de l'utilisateur créé :")
            print(response.json())
        else:
            print("Échec. Le serveur a répondu avec une erreur.")
            try:
                # Essaye d'afficher le détail de l'erreur si c'est du JSON
                print("Détail de l'erreur :")
                print(response.json())
            except json.JSONDecodeError:
                # Si la réponse n'est pas du JSON, affiche le texte brut
                print("Réponse brute du serveur :")
                print(response.text)

    except requests.exceptions.ConnectionError as e:
        print("\n--- ERREUR DE CONNEXION ---")
        print(f"Impossible de se connecter au serveur à l'adresse {url}.")
        print("Veuillez vous assurer que votre serveur backend est bien démarré et accessible sur le port 8004.")
        print(f"Détail de l'erreur système : {e}")

if __name__ == "__main__":
    create_teacher_account()
