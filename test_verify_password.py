import requests
import json
import sys

# URL de l'API
api_url = "http://localhost:8005/api/exams/verify-password"

# Mot de passe à tester
password = "jNfvKUlQ"  # Le mot de passe qui a été utilisé dans les logs

# Faire la requête
headers = {
    "Content-Type": "application/json"
}
payload = {
    "password": password
}

print(f"Envoi de la requête à {api_url} avec le mot de passe: {password}")

try:
    response = requests.post(api_url, headers=headers, data=json.dumps(payload))
    
    # Afficher les résultats
    print(f"Status code: {response.status_code}")
    print("Headers:")
    for key, value in response.headers.items():
        print(f"  {key}: {value}")
    
    print("\nResponse body (raw):")
    raw_response = response.text
    print(repr(raw_response))  # Utiliser repr pour voir les caractères spéciaux
    
    print("\nResponse body (parsed):")
    try:
        response_json = response.json()
        print(json.dumps(response_json, indent=2))
        
        # Vérifier la présence des champs attendus
        if "exam_id" in response_json:
            print(f"\nExam ID trouvé: {response_json['exam_id']}")
        else:
            print("\nAucun exam_id trouvé dans la réponse!")
            
    except json.JSONDecodeError as e:
        print(f"Erreur lors du parsing de la réponse JSON: {e}")
        print(f"Position de l'erreur: {e.pos}")
        print(f"Ligne de l'erreur: {e.lineno}, Colonne: {e.colno}")
        print(f"Extrait du document: {e.doc[max(0, e.pos-20):e.pos+20]}")
        
    except Exception as e:
        print(f"Autre erreur: {e}")

except requests.exceptions.RequestException as e:
    print(f"Erreur lors de la requête: {e}")
    sys.exit(1)
