# Plateforme d'Évaluation en Ligne

Une application web complète pour créer, gérer et passer des examens en ligne avec correction automatique et génération de rapports.

## Fonctionnalités

### Pour les enseignants
- Création et gestion d'examens avec des questions à choix multiples et vrai/faux
- Génération automatique de mots de passe pour chaque examen
- Tableau de bord pour suivre les performances des étudiants
- Export des résultats au format PDF
- Interface intuitive pour la création et la gestion des questions

### Pour les étudiants
- Accès aux examens avec un mot de passe
- Interface conviviale pour répondre aux questions
- Résultats immédiats après soumission
- Consultation des réponses correctes et des points obtenus

## Technologies utilisées

### Backend
- **Framework**: FastAPI (Python)
- **Base de données**: SQLite (avec SQLAlchemy ORM)
- **Authentification**: JWT (JSON Web Tokens)
- **Génération de PDF**: ReportLab

### Frontend
- **Framework**: React.js avec Vite
- **UI/UX**: Chakra UI
- **Gestion d'état**: React Query
- **Routage**: React Router
- **Icônes**: React Icons

## Installation

### Prérequis
- Python 3.8+
- Node.js 16+
- npm ou yarn

### Configuration du backend

1. Clonez le dépôt :
   ```bash
   git clone [URL_DU_REPO]
   cd wilA/backend
   ```

2. Créez un environnement virtuel et activez-le :
   ```bash
   python -m venv venv
   source venv/bin/activate  # Sur Windows: .\venv\Scripts\activate
   ```

3. Installez les dépendances :
   ```bash
   pip install -r requirements.txt
   ```

4. Initialisez la base de données :
   ```bash
   python -c "from app.db.database import Base, engine; Base.metadata.create_all(bind=engine)"
   ```

5. Lancez le serveur de développement :
   ```bash
   uvicorn app.main:app --reload
   ```

Le serveur sera accessible à l'adresse : http://localhost:8005

### Configuration du frontend

1. Dans un nouveau terminal, accédez au dossier du frontend :
   ```bash
   cd ../frontend
   ```

2. Installez les dépendances :
   ```bash
   npm install
   ```

3. Lancez l'application en mode développement :
   ```bash
   npm run dev
   ```

L'application sera accessible à l'adresse : http://localhost:5173

## Structure du projet

```
wilA/
├── backend/                  # Code source du backend
│   ├── app/
│   │   ├── api/             # Points de terminaison de l'API
│   │   ├── db/              # Configuration de la base de données
│   │   ├── models/          # Modèles de données
│   │   ├── schemas/         # Schémas Pydantic
│   │   ├── utils/           # Utilitaires
│   │   ├── __init__.py
│   │   └── main.py          # Point d'entrée de l'application
│   ├── requirements.txt     # Dépendances Python
│   └── run.py              # Script pour lancer l'application
│
└── frontend/                # Code source du frontend
    ├── public/             # Fichiers statiques
    └── src/
        ├── components/     # Composants réutilisables
        ├── pages/         # Pages de l'application
        ├── services/      # Services API
        ├── theme/         # Configuration du thème
        ├── App.jsx        # Composant racine
        └── main.jsx       # Point d'entrée
```

## Points d'API (Backend)

### Examens
- `GET /api/exams/` - Liste tous les examens
- `POST /api/exams/` - Crée un nouvel examen
- `GET /api/exams/{exam_id}` - Récupère un examen par son ID
- `GET /api/exams/password/{password}` - Récupère un examen par son mot de passe
- `POST /api/exams/{exam_id}/questions/` - Ajoute une question à un examen
- `GET /api/exams/{exam_id}/questions/` - Récupère les questions d'un examen

### Soumissions
- `POST /api/submissions/` - Soumet les réponses à un examen
- `GET /api/submissions/{submission_id}` - Récupère une soumission
- `GET /api/submissions/exam/{exam_id}` - Récupère toutes les soumissions d'un examen
- `GET /api/submissions/exam/{exam_id}/results-pdf` - Télécharge les résultats au format PDF

## Guide de démarrage rapide

1. **Pour les enseignants** :
   - Connectez-vous au tableau de bord enseignant
   - Créez un nouvel examen
   - Ajoutez des questions et définissez les bonnes réponses
   - Partagez le mot de passe généré avec vos étudiants

2. **Pour les étudiants** :
   - Accédez à la page d'accès à l'examen
   - Entrez votre nom et le mot de passe fourni par l'enseignant
   - Répondez aux questions et soumettez vos réponses
   - Consultez vos résultats immédiatement après soumission

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.
