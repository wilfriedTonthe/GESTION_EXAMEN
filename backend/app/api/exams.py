import os
import random
import shutil
import string
import tempfile
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from fastapi import (
    APIRouter, Depends, File, HTTPException, Path, Request, Response, UploadFile, status
)
from fastapi.responses import RedirectResponse, StreamingResponse
from jose import jwt
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

# Imports de l'application
from app.core.config import settings
from app.core.constants import (
    EXAM_INACTIVE, EXAM_NOT_FOUND, EXAM_NOT_FOUND_WITH_PASSWORD, INVALID_CREDENTIALS
)
from app.core.security import (
    create_access_token, get_password_hash, get_current_active_user, get_current_teacher_user, get_current_user
)
from app.db.database import get_db
from app.models.models import Exam, Question, QuestionOption, Submission, Answer, ExamSession, User
from app.schemas.schemas import (
    ExamCreate, ExamUpdate, Exam as ExamSchema,
    QuestionCreate, QuestionOptionCreate, Question as QuestionSchema,
    ExamSessionCreate, ExamSession as ExamSessionSchema
)
from app.security.face_recognition_service import FaceRecognitionService
from app.security.exam_security import exam_security


# Modèles Pydantic pour les requêtes et réponses
class ExamLoginResponse(BaseModel):
    exam_id: int
    title: str
    description: Optional[str] = None
    expires_at: Optional[datetime] = None

class ExamResponse(ExamSchema):
    questions: List[QuestionSchema] = []

class ExamListResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    created_at: datetime
    is_active: bool

class ExamDashboardResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    created_at: datetime
    is_active: bool
    password: str
    duration_minutes: Optional[int] = None
    questions_count: int
    submissions_count: int

    class Config:
        orm_mode = True

class MonitorRequest(BaseModel):
    student_name: str
    session_id: str

class MonitorStopRequest(BaseModel):
    session_id: str

class ExamAccessRequest(BaseModel):
    password: str

class StudentVerificationRequest(BaseModel):
    exam_id: int
    student_name: str
    
class CombinedVerificationRequest(BaseModel):
    password: str
    student_name: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    exam_id: Optional[int] = None  # Ajout de l'ID de l'examen comme champ optionnel

class ExamDetailsResponse(BaseModel):
    exam_id: int
    title: str
    description: Optional[str]

router = APIRouter(tags=["exams"])

# Initialiser le service de reconnaissance faciale
face_recognition_service = FaceRecognitionService()

@router.post("/verify-password", response_model=ExamDetailsResponse)
async def verify_exam_password(
    request_data: ExamAccessRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticates a student for an exam with a password and returns an access token.
    The token is stored in an HTTPOnly cookie.
    """
    exam = db.query(Exam).filter(Exam.password == request_data.password).first()

    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=EXAM_NOT_FOUND_WITH_PASSWORD
        )

    if not exam.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=EXAM_INACTIVE
        )

    return {
        "exam_id": exam.id,
        "title": exam.title,
        "description": exam.description
    }

@router.post("/verify-student", response_model=Token)
async def verify_student_and_grant_access(
    response: Response,
    request_data: StudentVerificationRequest,
    db: Session = Depends(get_db)
):
    # Ici, nous devrions vérifier le nom de l'étudiant contre les signatures faciales.
    # Pour l'instant, nous allons simplement supposer que la vérification est réussie si un utilisateur avec ce nom existe.
    user = db.query(User).filter(User.full_name == request_data.student_name).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Étudiant non trouvé avec ce nom."
        )

    student_user = {
        "sub": f"student_{user.id}",
        "role": "student",
        "exam_id": request_data.exam_id
    }
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data=student_user, expires_delta=access_token_expires
    )

    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=int(access_token_expires.total_seconds()),
        expires=datetime.now(timezone.utc) + access_token_expires,
        samesite="lax",
        secure=False, # Mettre à True en production
    )
    
    return {"access_token": access_token, "token_type": "bearer", "exam_id": exam.id}

@router.post("/verify-access", response_model=Token)
async def verify_password_and_student(
    response: Response,
    request_data: CombinedVerificationRequest,
    db: Session = Depends(get_db),
    face_service: FaceRecognitionService = Depends(lambda: face_recognition_service)
):
    """Vérifie simultanément le mot de passe de l'examen et le nom de l'étudiant.
    Si les deux sont valides, génère un token d'accès pour l'examen."""
    
    # 1. Vérifier le mot de passe de l'examen
    exam = db.query(Exam).filter(Exam.password == request_data.password).first()
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=EXAM_NOT_FOUND_WITH_PASSWORD
        )

    if not exam.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=EXAM_INACTIVE
        )
        
    # 2. Vérifier le nom de l'étudiant dans le fichier de signatures
    student_authorized = face_service.verify_student(exam_id=exam.id, student_name=request_data.student_name)
    if not student_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Étudiant non autorisé à passer cet examen. Nom non trouvé dans la liste des signatures."
        )
    
    # Pour la vérification d'accès à l'examen, nous n'avons pas besoin de créer un utilisateur
    # Nous utilisons directement les informations de l'étudiant pour générer le token
    # Cela évite les problèmes liés à la création d'utilisateurs temporaires
    
    # Générer un ID unique pour cet étudiant basé sur son nom et l'ID de l'examen
    # Cela servira d'identifiant pour le token sans avoir besoin de créer un utilisateur en base
    student_id = f"temp_{hash(request_data.student_name + str(exam.id))}"
    
    # Nous n'avons pas besoin de récupérer ou créer un utilisateur pour cette simple vérification
    # Le nom de l'étudiant a déjà été vérifié dans le fichier de signatures
    
    # 4. Générer un token d'accès
    student_user = {
        "sub": student_id,
        "role": "student",
        "exam_id": exam.id,
        "student_name": request_data.student_name
    }
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data=student_user, expires_delta=access_token_expires
    )

    # 5. Stocker le token dans un cookie
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=int(access_token_expires.total_seconds()),
        expires=datetime.now(timezone.utc) + access_token_expires,
        samesite="lax",
        secure=False, # Mettre à True en production
    )
    
    # 6. Retourner les informations nécessaires
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "exam_id": exam.id
    }

# Créer un dossier pour stocker les signatures si ce n'est pas déjà fait
SIGNATURES_DIR = "uploads/signatures"
os.makedirs(SIGNATURES_DIR, exist_ok=True)

def generate_security_session_id(exam_id: int, user_id: int) -> str:
    """Génère un ID unique pour la session de sécurité"""
    return f"exam_{exam_id}_user_{user_id}_{uuid.uuid4()}"

@router.get("/me/", response_model=List[ExamDashboardResponse])
async def get_my_exams_for_dashboard(
    current_user: User = Depends(get_current_teacher_user),
    db: Session = Depends(get_db)
):
    """Récupère les examens de l'enseignant connecté avec les détails pour le tableau de bord."""
    if not current_user.is_teacher:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé"
        )

    exams = db.query(Exam).filter(Exam.teacher_id == current_user.id).options(
        joinedload(Exam.questions),
        joinedload(Exam.submissions)
    ).all()

    response_data = []
    for exam in exams:
        response_data.append(
            ExamDashboardResponse(
                id=exam.id,
                title=exam.title,
                description=exam.description,
                created_at=exam.created_at,
                is_active=exam.is_active,
                password=exam.password,
                duration_minutes=exam.duration_minutes,
                questions_count=len(exam.questions),
                submissions_count=len(exam.submissions)
            )
        )
    return response_data

@router.post("/{exam_id}/signatures", status_code=status.HTTP_201_CREATED)
def upload_facial_signatures(
    exam_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher_user),
    face_service: FaceRecognitionService = Depends(lambda: face_recognition_service)
):
    """
    Téléverse les photos des étudiants pour un examen, génère et sauvegarde
    le fichier de signatures faciales en utilisant le FaceRecognitionService.
    Traite tous les fichiers fournis et crée une signature pour chaque image valide.
    """
    # Vérifier que l'examen existe et appartient à l'enseignant
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.teacher_id == current_user.id).first()
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Examen non trouvé ou vous n'avez pas les droits pour le modifier."
        )

    # Vérifier qu'il y a des fichiers à traiter
    if not files or len(files) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucun fichier n'a été fourni. Veuillez téléverser au moins une image."
        )

    # Créer un répertoire temporaire pour stocker les images
    temp_dir = tempfile.mkdtemp()
    uploaded_files = []

    try:
        # Sauvegarder les fichiers uploadés dans le répertoire temporaire
        for file in files:
            # Vérifier le type de fichier
            if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                continue
                
            file_path = os.path.join(temp_dir, file.filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
                uploaded_files.append(file.filename)

        if not uploaded_files:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Aucun fichier image valide n'a été fourni. Formats acceptés: .jpg, .jpeg, .png"
            )

        print(f"Traitement de {len(uploaded_files)} fichiers pour l'examen {exam_id}")
        
        # Appeler le service pour extraire les signatures
        success = face_service.extract_signatures(exam_id=exam.id, images_folder=temp_dir)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="L'extraction des signatures faciales a échoué. Vérifiez que les images contiennent des visages clairement visibles."
            )

        # Mettre à jour le chemin du fichier de signatures dans la base de données
        signature_path = face_service.get_signature_file_path(exam_id=exam.id)
        exam.signature_file_path = signature_path
        db.commit()

        return {
            "message": f"Les signatures faciales pour l'examen '{exam.title}' ont été créées avec succès.",
            "signature_file": signature_path,
            "processed_files": len(uploaded_files),
            "exam_id": exam_id,
            "exam_title": exam.title
        }

    finally:
        # Nettoyer le répertoire temporaire
        shutil.rmtree(temp_dir)

@router.post("/", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
async def create_exam(
    exam_data: ExamCreate,
    current_user: User = Depends(get_current_teacher_user),
    db: Session = Depends(get_db)
):
    """Crée un nouvel examen"""
    # Vérifier si un examen avec le même titre existe déjà pour cet enseignant
    existing_exam = db.query(Exam).filter(
        Exam.title == exam_data.title,
        Exam.teacher_id == current_user.id
    ).first()
    
    if existing_exam:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Un examen avec ce titre existe déjà."
        )

    # Générer un mot de passe aléatoire pour l'examen
    password = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
    
    # Créer l'examen
    db_exam = Exam(
        title=exam_data.title,
        description=exam_data.description,
        password=password,
        is_active=True,
        teacher_id=current_user.id,
        duration_minutes=exam_data.duration_minutes
    )
    
    db.add(db_exam)
    db.commit()
    db.refresh(db_exam)
    
    return db_exam

@router.get("/{exam_id}", response_model=ExamResponse)
async def get_exam(
    exam_id: int = Path(..., title="L'ID de l'examen"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Récupère les détails d'un examen spécifique"""
    exam = db.query(Exam).options(joinedload(Exam.questions).joinedload(Question.options))\
        .filter(Exam.id == exam_id).first()
    
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=EXAM_NOT_FOUND
        )
    
    # Vérifier que l'utilisateur a accès à cet examen
    if exam.teacher_id != current_user.id:
        # Vérifier si l'utilisateur a une session active pour cet examen
        session = db.query(ExamSession).filter(
            ExamSession.exam_id == exam_id,
            ExamSession.user_id == current_user.id,
            ExamSession.is_active == True
        ).first()
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous n'avez pas accès à cet examen"
            )
    
    return exam

def generate_exam_password():
    """Génère un mot de passe aléatoire pour un examen"""
    length = 8
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

@router.get("/by-password/{password}", 
           response_model=ExamSchema, 
           dependencies=[],
           status_code=200,
           responses={
               404: {"description": "Examen non trouvé"},
               400: {"description": "Examen inactif ou expiré"}
           })
async def read_exam_by_password(password: str, db: Session = Depends(get_db)):
    """Récupère un examen par son mot de passe."""
    exam = db.query(Exam).filter(Exam.password == password).first()
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Examen non trouvé avec ce mot de passe"
        )
    if not exam.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Examen inactif"
        )
    return exam

@router.post("/{exam_id}/questions/", response_model=QuestionSchema)
def create_question(
    exam_id: int, 
    question: QuestionCreate, 
    db: Session = Depends(get_db)
):
    # Vérifier si l'examen existe
    db_exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not db_exam:
        raise HTTPException(status_code=404, detail=EXAM_NOT_FOUND)
    
    # Créer la question
    db_question = Question(
        exam_id=exam_id,
        text=question.text,
        question_type=question.question_type,
        points=question.points
    )
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    
    # Ajouter les options de réponse
    for option in question.options:
        db_option = QuestionOption(
            question_id=db_question.id,
            text=option.text,
            is_correct=option.is_correct
        )
        db.add(db_option)
    
    db.commit()
    db.refresh(db_question)
    return db_question

@router.get("/{exam_id}/questions/", response_model=List[QuestionSchema])
def read_questions(exam_id: int, db: Session = Depends(get_db)):
    print(f"Début de la récupération des questions pour l'examen ID: {exam_id}")
    
    # Vérifier si l'examen existe
    db_exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not db_exam:
        error_msg = f"Examen avec ID {exam_id} non trouvé"
        print(error_msg)
        raise HTTPException(status_code=404, detail=EXAM_NOT_FOUND)
    
    print(f"Examen trouvé: ID={db_exam.id}, Titre={db_exam.title}")
    
    # Récupérer toutes les questions avec leurs options
    questions = (
        db.query(Question)
        .filter(Question.exam_id == exam_id)
        .options(joinedload(Question.options))
        .all()
    )
    
    print(f"Nombre de questions trouvées: {len(questions)}")
    for i, q in enumerate(questions, 1):
        print(f"Question {i}: ID={q.id}, Texte={q.text[:50]}..., Options={len(q.options)}")
    
    # S'assurer que les relations sont chargées correctement
    for q in questions:
        if not hasattr(q, 'options'):
            print(f"Attention: la question ID={q.id} n'a pas d'options chargées")
    
    return questions

@router.get("/{exam_id}/results/", response_model=List[Dict[str, Any]])
async def get_exam_results(exam_id: int, db: Session = Depends(get_db)):
    # Vérifier si l'examen existe
    db_exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not db_exam:
        raise HTTPException(status_code=404, detail=EXAM_NOT_FOUND)
    
    # Récupérer toutes les soumissions avec leurs réponses
    submissions = (
        db.query(Submission)
        .filter(Submission.exam_id == exam_id)
        .options(joinedload(Submission.answers))
        .all()
    )
    
    # Préparer les résultats
    results = []
    for submission in submissions:
        # Calculer les statistiques
        correct_answers = sum(1 for answer in submission.answers if answer.is_correct)
        total_questions = len(submission.answers)
        percentage = round((correct_answers / total_questions * 100), 2) if total_questions > 0 else 0
        
        # Créer un dictionnaire pour la réponse
        result = {
            "submission": {
                "id": submission.id,
                "exam_id": submission.exam_id,
                "student_name": submission.student_name,
                "submitted_at": submission.submitted_at.isoformat(),
                "score": submission.score,
                "max_score": submission.max_score
            },
            "correct_answers": correct_answers,
            "total_questions": total_questions,
            "percentage": percentage
        }
        results.append(result)
    
    return results

@router.post("/{exam_id}/signatures", status_code=status.HTTP_200_OK)
async def upload_exam_signatures(
    exam_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher_user)
):
    """
    Téléverse les photos de signature pour un examen spécifique.
    Crée un dossier unique pour l'examen, y enregistre les fichiers,
    puis lance l'extraction des signatures faciales.
    """
    db_exam = db.query(Exam).filter(Exam.id == exam_id).first()

    if not db_exam:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Examen non trouvé.")

    if db_exam.teacher_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Vous n'êtes pas autorisé à modifier cet examen.")

    exam_signature_dir = os.path.join(SIGNATURES_DIR, str(exam_id))
    os.makedirs(exam_signature_dir, exist_ok=True)

    # Sauvegarder les nouvelles photos
    for file in files:
        file_path = os.path.join(exam_signature_dir, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    
    # Lancer l'extraction des signatures faciales
    success = face_recognition_service.extract_signatures(exam_id=exam_id, images_folder=exam_signature_dir)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Une erreur est survenue lors de la création du fichier de signatures. Vérifiez les logs du serveur."
        )

    # Mettre à jour le chemin dans la base de données (vers le fichier .npy cette fois)
    db_exam.signature_file_path = face_recognition_service.get_signature_file_path(exam_id)
    db.commit()

    return {"message": f"{len(files)} signatures traitées avec succès pour l'examen {exam_id}."}

@router.put("/{exam_id}", response_model=ExamDashboardResponse)
def update_exam(
    exam_id: int,
    exam_data: ExamUpdate,
    current_user: User = Depends(get_current_teacher_user),
    db: Session = Depends(get_db)
):
    """Met à jour les détails d'un examen existant."""
    db_exam = db.query(Exam).filter(Exam.id == exam_id, Exam.teacher_id == current_user.id).first()

    if not db_exam:
        raise HTTPException(status_code=404, detail=EXAM_NOT_FOUND)

    # Mettre à jour les champs fournis
    update_data = exam_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_exam, key, value)

    db.add(db_exam)
    db.commit()
    db.refresh(db_exam)
    
    # Recharger les relations pour obtenir les comptes à jour
    db.refresh(db_exam, attribute_names=['questions', 'submissions'])

    # Retourner la réponse complète pour mettre à jour l'UI
    return ExamDashboardResponse(
        id=db_exam.id,
        title=db_exam.title,
        description=db_exam.description,
        created_at=db_exam.created_at,
        is_active=db_exam.is_active,
        password=db_exam.password,
        duration_minutes=db_exam.duration_minutes,
        questions_count=len(db_exam.questions),
        submissions_count=len(db_exam.submissions)
    )

@router.delete("/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exam(
    exam_id: int,
    current_user: User = Depends(get_current_teacher_user),
    db: Session = Depends(get_db)
):
    """Supprime un examen et toutes ses données associées (questions, soumissions)."""
    # Récupérer l'examen pour vérifier que l'enseignant en est bien le propriétaire
    db_exam = db.query(Exam).filter(Exam.id == exam_id, Exam.teacher_id == current_user.id).first()
    
    if db_exam is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Examen non trouvé ou vous n'avez pas les droits pour le supprimer."
        )
    
    # La suppression en cascade devrait être gérée par la base de données si configurée.
    # Sinon, il faudrait supprimer manuellement les questions, soumissions, etc.
    db.delete(db_exam)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.get("/{exam_id}/generate-signatures", response_model=None)
def generate_signatures_sheet(exam_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Génère une feuille d'émargement en PDF pour un examen donné.
    Inclut le nom et la photo de chaque étudiant ayant soumis une photo.
    """
    db_exam = db.query(Exam).filter(Exam.id == exam_id).first()

    if not db_exam:
        raise HTTPException(status_code=404, detail=EXAM_NOT_FOUND)

    if db_exam.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas autorisé à accéder à cet examen")

    submissions = db.query(Submission).filter(
        Submission.exam_id == exam_id,
        Submission.student_photo_path.isnot(None)
    ).order_by(Submission.student_name).all()

    if not submissions:
        raise HTTPException(status_code=404, detail="Aucune soumission avec photo trouvée pour cet examen.")

    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    p.setFont("Helvetica-Bold", 16)
    p.drawCentredString(width / 2.0, height - inch, f"Feuille d'émargement - {db_exam.title}")

    p.setFont("Helvetica", 10)
    p.drawString(inch, height - 1.5 * inch, f"Date: {db_exam.created_at.strftime('%d/%m/%Y')}")
    p.drawString(width - 2.5 * inch, height - 1.5 * inch, f"Enseignant: {current_user.username}")

    # Table Header
    y_position = height - 2 * inch
    p.setFont("Helvetica-Bold", 12)
    p.drawString(inch, y_position, "Nom de l'étudiant")
    p.drawString(inch * 3, y_position, "Photo")
    p.drawString(inch * 5.5, y_position, "Signature")
    p.line(inch, y_position - 0.1 * inch, width - inch, y_position - 0.1 * inch)

    y_position -= 0.5 * inch
    p.setFont("Helvetica", 11)

    for sub in submissions:
        if y_position < 2 * inch:
            p.showPage()
            p.setFont("Helvetica", 11)
            y_position = height - inch

        p.drawString(inch, y_position, sub.student_name)

        # Draw photo
        if sub.student_photo_path and os.path.exists(sub.student_photo_path):
            try:
                img = Image.open(sub.student_photo_path)
                img_width, img_height = img.size
                aspect = img_height / float(img_width)
                p.drawImage(sub.student_photo_path, inch * 3, y_position - 0.5 * inch, width=1.5*inch, height=(1.5*aspect)*inch, preserveAspectRatio=True, mask='auto')
            except Exception:
                p.drawString(inch * 3, y_position, "(Image invalide)")

        # Signature line
        p.line(inch * 5.5, y_position, width - inch, y_position)

        y_position -= 1.5 * inch

    p.save()
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type='application/pdf',
        headers={"Content-Disposition": f"attachment; filename=signatures_exam_{exam_id}.pdf"}
    )

# --- Routes pour la surveillance par caméra --- 

@router.post("/{exam_id}/monitor/start", status_code=status.HTTP_200_OK)
def start_exam_monitoring(
    exam_id: int,
    request_data: MonitorRequest,
    face_service: FaceRecognitionService = Depends(lambda: face_recognition_service)
):
    """Démarre la surveillance par caméra pour une session d'examen."""
    success = face_service.start_monitoring(
        session_id=request_data.session_id,
        exam_id=exam_id,
        student_name=request_data.student_name
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible de démarrer la surveillance. Assurez-vous que la session n'est pas déjà active."
        )
    return {"message": "La surveillance a démarré avec succès."}

@router.post("/{exam_id}/monitor/stop", status_code=status.HTTP_200_OK)
def stop_exam_monitoring(
    request_data: MonitorStopRequest,
    face_service: FaceRecognitionService = Depends(lambda: face_recognition_service)
):
    """Arrête la surveillance par caméra pour une session d'examen."""
    success = face_service.stop_monitoring(session_id=request_data.session_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Impossible d'arrêter la surveillance. Session non trouvée."
        )
    return {"message": "La surveillance a été arrêtée."}

@router.get("/{exam_id}/monitor/status", status_code=status.HTTP_200_OK)
def get_exam_monitoring_status(
    session_id: str,
    face_service: FaceRecognitionService = Depends(lambda: face_recognition_service)
):
    """Récupère le statut en temps réel de la surveillance par caméra."""
    status = face_service.get_monitoring_status(session_id=session_id)
    return status
