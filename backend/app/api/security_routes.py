"""
Routes pour la gestion de la sécurité des examens.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user, get_password_hash
from app.db.database import get_db
from app.models import ExamSession, User
from app.security.exam_security import exam_security
from app.schemas.auth import UserCreate, UserResponse, Token

router = APIRouter(tags=["security"])

@router.get("/status/{exam_id}")
async def get_security_status(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Récupère l'état actuel de la sécurité pour une session d'examen
    """
    # Trouver la session d'examen active
    session = db.query(ExamSession).filter(
        ExamSession.exam_id == exam_id,
        ExamSession.user_id == current_user.id,
        ExamSession.status == "in_progress"
    ).first()
    
    if not session or not session.security_session_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune session de sécurité active trouvée"
        )
    
    return exam_security.get_security_status(session.security_session_id)

@router.post("/emergency_stop/{exam_id}")
async def emergency_stop(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Arrête d'urgence la surveillance de sécurité
    (À utiliser uniquement en cas de problème technique)
    """
    # Trouver la session d'examen active
    session = db.query(ExamSession).filter(
        ExamSession.exam_id == exam_id,
        ExamSession.user_id == current_user.id,
        ExamSession.status == "in_progress"
    ).first()
    
    if not session or not session.security_session_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune session de sécurité active trouvée"
        )
    
    # Arrêter la sécurité
    exam_security.stop_security(session.security_session_id)
    
    # Marquer la session comme terminée avec un statut d'erreur
    session.status = "error"
    session.notes = "Arrêt d'urgence de la surveillance de sécurité"
    db.commit()
    
    return {"status": "success", "message": "Surveillance de sécurité arrêtée"}

@router.get("/verify-student/{exam_id}/{student_name}")
async def verify_student_for_exam(
    exam_id: int,
    student_name: str,
    db: Session = Depends(get_db)
):
    """
    Vérifie si un étudiant est autorisé à passer un examen en vérifiant
    si son nom existe dans le fichier de signatures faciales de l'examen.
    """
    from app.security.face_recognition_service import face_recognition_service
    
    print(f"DEBUG - Vérification de l'étudiant: '{student_name}' pour l'examen {exam_id}")
    
    # Nettoyer le nom de l'étudiant pour correspondre au format utilisé dans les signatures
    cleaned_student_name = student_name.replace(' ', '_').replace('/', '_').replace('\\', '_')
    print(f"DEBUG - Nom nettoyé: '{cleaned_student_name}'")
    
    # Charger le fichier de signatures pour vérification manuelle
    try:
        import numpy as np
        import os
        signature_file = face_recognition_service.get_signature_file_path(exam_id)
        if os.path.exists(signature_file):
            signatures = np.load(signature_file, allow_pickle=True)
            noms = signatures[:, -1]
            print(f"DEBUG - Noms dans le fichier: {noms}")
            print(f"DEBUG - Vérification manuelle: '{cleaned_student_name}' in noms = {cleaned_student_name in noms}")
    except Exception as e:
        print(f"DEBUG - Erreur lors de la vérification manuelle: {str(e)}")
    
    # Vérifier si l'étudiant est autorisé
    is_authorized = face_recognition_service.verify_student(exam_id, cleaned_student_name)
    
    if is_authorized:
        return {
            "authorized": True,
            "message": f"L'étudiant {student_name} est autorisé à passer cet examen."
        }
    else:
        return {
            "authorized": False,
            "message": f"L'étudiant {student_name} n'est pas autorisé à passer cet examen. Vérifiez que votre nom correspond exactement à celui utilisé lors de l'inscription."
        }


router_auth = APIRouter(prefix="/auth", tags=["auth"])

@router_auth.post("/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # Vérifier si l'utilisateur existe déjà
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Un utilisateur avec cet email existe déjà.",
        )
    
    # Hacher le mot de passe et créer l'utilisateur
    hashed_password = get_password_hash(user.password)
    new_user = User(email=user.email, hashed_password=hashed_password, full_name=user.full_name, is_teacher=user.is_teacher)
