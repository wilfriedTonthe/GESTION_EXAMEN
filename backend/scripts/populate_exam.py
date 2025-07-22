import requests
import random
import json

# --- Configuration ---
# Remplacez par l'URL de votre API et les identifiants d'un enseignant existant
API_BASE_URL = "http://localhost:8005/api"
TEACHER_EMAIL = "teacher.test@example.com"  # Assurez-vous que cet utilisateur existe et a le rôle 'teacher'
TEACHER_PASSWORD = "123456"

# --- Banque de questions de culture générale ---
questions_pool = [
    {
        "text": "Quelle est la capitale de l'Australie ?",
        "question_type": "multiple_choice",
        "points": 5,
        "options": [
            {"text": "Sydney", "is_correct": False},
            {"text": "Melbourne", "is_correct": False},
            {"text": "Canberra", "is_correct": True},
            {"text": "Perth", "is_correct": False}
        ]
    },
    {
        "text": "Le Nil est le plus long fleuve du monde.",
        "question_type": "true_false",
        "points": 10,
        "options": [
            {"text": "Vrai", "is_correct": True},
            {"text": "Faux", "is_correct": False}
        ]
    },
    {
        "text": "Qui a peint la 'Mona Lisa' (La Joconde) ?",
        "question_type": "multiple_choice",
        "points": 10,
        "options": [
            {"text": "Vincent van Gogh", "is_correct": False},
            {"text": "Léonard de Vinci", "is_correct": True},
            {"text": "Pablo Picasso", "is_correct": False},
            {"text": "Michel-Ange", "is_correct": False}
        ]
    },
    {
        "text": "La tomate est un légume.",
        "question_type": "true_false",
        "points": 5,
        "options": [
            {"text": "Vrai", "is_correct": False},
            {"text": "Faux", "is_correct": True} # Botaniquement, c'est un fruit
        ]
    },
    {
        "text": "Combien de planètes y a-t-il dans notre système solaire ?",
        "question_type": "multiple_choice",
        "points": 5,
        "options": [
            {"text": "7", "is_correct": False},
            {"text": "8", "is_correct": True},
            {"text": "9", "is_correct": False},
            {"text": "10", "is_correct": False}
        ]
    },
    {
        "text": "L'Everest est la plus haute montagne du monde.",
        "question_type": "true_false",
        "points": 5,
        "options": [
            {"text": "Vrai", "is_correct": True},
            {"text": "Faux", "is_correct": False}
        ]
    },
        {
        "text": "Quel pays est célèbre pour ses tulipes et ses moulins à vent ?",
        "question_type": "multiple_choice",
        "points": 10,
        "options": [
            {"text": "Belgique", "is_correct": False},
            {"text": "Allemagne", "is_correct": False},
            {"text": "Pays-Bas", "is_correct": True},
            {"text": "Danemark", "is_correct": False}
        ]
    },
    {
        "text": "Le corps humain adulte a 206 os.",
        "question_type": "true_false",
        "points": 15,
        "options": [
            {"text": "Vrai", "is_correct": True},
            {"text": "Faux", "is_correct": False}
        ]
    },
    {
        "text": "Quel est le plus grand désert du monde ?",
        "question_type": "multiple_choice",
        "points": 15,
        "options": [
            {"text": "Le Sahara", "is_correct": False},
            {"text": "Le désert d'Arabie", "is_correct": False},
            {"text": "Le désert de Gobi", "is_correct": False},
            {"text": "L'Antarctique", "is_correct": True} # C'est un désert polaire
        ]
    }
]

def get_auth_token():
    """Récupère le token JWT pour l'enseignant."""
    try:
        response = requests.post(
            f"{API_BASE_URL}/auth/token",
            data={"username": TEACHER_EMAIL, "password": TEACHER_PASSWORD}
        )
        response.raise_for_status() # Lève une exception pour les erreurs HTTP
        return response.json()["access_token"]
    except requests.exceptions.RequestException as e:
        print(f"Erreur lors de l'authentification : {e}")
        if 'response' in locals() and e.response is not None:
            print(f"Réponse du serveur : {e.response.text}")
        return None

def create_exam(token):
    """Crée un nouvel examen et retourne son ID."""
    exam_data = {
        "title": f"Examen de Culture Générale (Automatique)",
        "description": "Un examen généré automatiquement avec des questions variées.",
        "duration_minutes": 30
    }
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.post(f"{API_BASE_URL}/exams", headers=headers, json=exam_data)
        response.raise_for_status()
        exam_id = response.json()["id"]
        print(f"Examen créé avec succès ! ID: {exam_id}")
        return exam_id
    except requests.exceptions.RequestException as e:
        print(f"Erreur lors de la création de l'examen : {e}")
        print(f"Réponse du serveur : {e.response.text}")
        return None

def add_question_to_exam(token, exam_id, question_data):
    """Ajoute une question à un examen existant."""
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.post(f"{API_BASE_URL}/exams/{exam_id}/questions", headers=headers, json=question_data)
        response.raise_for_status()
        print(f"  -> Question ajoutée : '{question_data['text']}'")
        return True
    except requests.exceptions.RequestException as e:
        print(f"Erreur lors de l'ajout de la question : {e}")
        print(f"Réponse du serveur : {e.response.text}")
        return False

def main():
    print("--- Début du script de création d'examen ---")
    
    token = get_auth_token()
    if not token:
        print("Impossible de continuer sans authentification. Arrêt du script.")
        return

    exam_id = create_exam(token)
    if not exam_id:
        print("Impossible de continuer sans examen. Arrêt du script.")
        return

    # Sélectionner un nombre aléatoire de questions à ajouter
    # Sélectionner un nombre aléatoire de questions, sans dépasser le total disponible
    max_questions = len(questions_pool)
    num_questions_to_add = random.randint(min(5, max_questions), max_questions)
    selected_questions = random.sample(questions_pool, num_questions_to_add)

    print(f"\nAjout de {num_questions_to_add} questions à l'examen {exam_id}...")
    success_count = 0
    for question in selected_questions:
        if add_question_to_exam(token, exam_id, question):
            success_count += 1
    
    print(f"\n--- Fin du script ---")
    print(f"{success_count}/{num_questions_to_add} questions ont été ajoutées avec succès.")

if __name__ == "__main__":
    main()
