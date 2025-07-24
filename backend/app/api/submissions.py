from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.models import Exam, Submission, User, Answer, Question
from app.schemas.schemas import SubmissionCreate, SubmissionResponse
from app.core.security import get_current_user
from app.db.database import get_db
from app.services.pdf_service import generate_results_pdf

router = APIRouter(tags=["submissions"])

@router.post("/", response_model=SubmissionResponse)
def submit_exam(submission: SubmissionCreate, db: Session = Depends(get_db)):
    print("Données de soumission reçues:", submission.model_dump())
    
    # Validation des données d'entrée
    if not submission.student_name or not submission.student_name.strip():
        raise HTTPException(status_code=400, detail="Le nom de l'étudiant est requis")
        
    if not submission.exam_password or not submission.exam_password.strip():
        raise HTTPException(status_code=400, detail="Le mot de passe de l'examen est requis")
        
    if not submission.answers:
        raise HTTPException(status_code=400, detail="Aucune réponse fournie")
    
    # Vérifier si l'examen existe avec le mot de passe fourni
    db_exam = db.query(Exam).filter(
        Exam.password == submission.exam_password,
        Exam.is_active == True
    ).first()
    
    if not db_exam:
        print(f"Examen non trouvé avec le mot de passe: {submission.exam_password}")
        raise HTTPException(status_code=404, detail="Examen non trouvé ou inactif")
        
    print(f"Examen trouvé: ID={db_exam.id}, Titre={db_exam.title}")
    
    # Vérifier si l'étudiant a déjà soumis cet examen
    existing_submission = db.query(Submission).filter(
        Submission.exam_id == db_exam.id,
        Submission.student_name == submission.student_name
    ).first()
    
    if existing_submission:
        print(f"Soumission existante trouvée pour l'étudiant: {submission.student_name}")
        raise HTTPException(
            status_code=400, 
            detail="Vous avez déjà soumis cet examen"
        )
    
    # Récupérer toutes les questions de l'examen avec leurs bonnes réponses
    questions = db.query(Question).filter(
        Question.exam_id == db_exam.id
    ).all()
    
    if not questions:
        raise HTTPException(status_code=400, detail="Aucune question trouvée pour cet examen")
    
    # Créer une soumission
    db_submission = Submission(
        exam_id=db_exam.id,
        student_name=submission.student_name,
        score=0,
        max_score=sum(q.points for q in questions)
    )
    db.add(db_submission)
    db.commit()
    db.refresh(db_submission)
    
    # Traiter chaque réponse
    correct_answers = 0
    total_questions = len(questions)
    
    for answer in submission.answers:
        # Trouver la question correspondante
        question = next((q for q in questions if q.id == answer.question_id), None)
        if not question:
            continue  # Ignorer les réponses à des questions qui n'existent pas
        
        # Vérifier si la réponse est correcte
        is_correct = False
        points_earned = 0
        
        if question.question_type == "true_false":
            # Pour les questions vrai/faux, vérifier si la réponse correspond à l'option correcte
            correct_option = next((opt for opt in question.options if opt.is_correct), None)
            if correct_option and correct_option.option_text.lower() == answer.answer_text.lower():
                is_correct = True
                points_earned = question.points
                correct_answers += 1
        else:
            # Pour les questions à choix multiples, vérifier si toutes les options sélectionnées sont correctes
            selected_options = [opt.strip() for opt in answer.answer_text.split(",") if opt.strip()]
            correct_options = [opt.option_text for opt in question.options if opt.is_correct]
            
            if set(selected_options) == set(correct_options):
                is_correct = True
                points_earned = question.points
                correct_answers += 1
        
        # Enregistrer la réponse
        db_answer = Answer(
            submission_id=db_submission.id,
            question_id=answer.question_id,
            answer_text=answer.answer_text,
            is_correct=is_correct,
            points_earned=points_earned
        )
        db.add(db_answer)
        db_submission.score += points_earned
    
    # Mettre à jour le score final de la soumission
    db.commit()
    db.refresh(db_submission)
    
    # Préparer la réponse
    percentage = (db_submission.score / db_submission.max_score) * 100 if db_submission.max_score > 0 else 0
    
    # Récupérer les réponses pour cette soumission
    db_answers = db.query(Answer).filter(
        Answer.submission_id == db_submission.id
    ).all()
    
    # Convertir les réponses en dictionnaires
    answers_data = [{
        "id": answer.id,
        "question_id": answer.question_id,
        "answer_text": answer.answer_text,
        "is_correct": answer.is_correct,
        "points_earned": answer.points_earned
    } for answer in db_answers]
    
    # Créer le dictionnaire de soumission
    submission_data = {
        "id": db_submission.id,
        "exam_id": db_submission.exam_id,
        "student_name": db_submission.student_name,
        "submitted_at": db_submission.submitted_at.isoformat(),
        "score": db_submission.score,
        "max_score": db_submission.max_score,
        "answers": answers_data
    }
    
    return {
        "submission": submission_data,
        "correct_answers": correct_answers,
        "total_questions": total_questions,
        "percentage": percentage
    }

@router.get("/{submission_id}", response_model=SubmissionResponse)
def get_submission(submission_id: int, db: Session = Depends(get_db)):
    db_submission = db.query(Submission).filter(
        Submission.id == submission_id
    ).first()
    
    if not db_submission:
        raise HTTPException(status_code=404, detail="Soumission non trouvée")
    
    return db_submission

@router.get("/exam/{exam_id}/results-pdf", response_class=Response)
async def download_exam_results_pdf(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Génère et télécharge les résultats de toutes les soumissions pour un examen au format PDF.
    """
    exam = db.query(Exam).options(joinedload(Exam.teacher)).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Examen non trouvé.")

    if not current_user.is_teacher or exam.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé.")

    submissions = db.query(Submission).options(joinedload(Submission.answers)).filter(Submission.exam_id == exam_id).all()
    
    # Même s'il n'y a pas de soumissions, générer un PDF avec un message informatif
    # au lieu de renvoyer une erreur 404
    pdf_bytes = generate_results_pdf(exam=exam, submissions=submissions)
    
    return Response(
        content=pdf_bytes,
        media_type='application/pdf',
        headers={"Content-Disposition": f"attachment; filename=resultats_examen_{exam.id}.pdf"}
    )

@router.get("/exam/{exam_id}", response_model=List[SubmissionResponse])
def get_submissions_by_exam(exam_id: int, db: Session = Depends(get_db)):
    # Vérifier si l'examen existe
    db_exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not db_exam:
        raise HTTPException(status_code=404, detail="Examen non trouvé")
    
    # Récupérer toutes les soumissions pour cet examen
    submissions = db.query(Submission).filter(
        Submission.exam_id == exam_id
    ).all()
    
    return submissions
