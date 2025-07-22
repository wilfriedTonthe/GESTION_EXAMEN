# Créez un fichier check_user.py dans le dossier backend
from app.db.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

# Créer une session de base de données
db = SessionLocal()

# Vérifier si l'utilisateur existe
user = db.query(User).filter(User.email == "willytonthe1@gmail.com").first()
if user:
    print(f"L'utilisateur existe: {user.email}, {user.full_name}, est_enseignant: {user.is_teacher}")
else:
    print("L'utilisateur n'existe pas, création...")
    # Créer l'utilisateur s'il n'existe pas
    new_user = User(
        email="willytonthe1@gmail.com",
        hashed_password=get_password_hash("123456"),
        full_name="Willy Tonthe",
        is_teacher=True
    )
    db.add(new_user)
    db.commit()
    print("Utilisateur créé avec succès!")

db.close()