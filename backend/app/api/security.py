from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

from app.db.database import get_db
from app.models import models
from app.schemas.schemas import SecurityViolation
from app.core.security import get_current_active_user
from app.security.exam_security import exam_security

router = APIRouter(tags=["security"])

class ExamSecuritySession(BaseModel):
    session_id: str = Field(..., description="Identifiant unique de la session d'examen")
    
    class Config:
        # Permettre la conversion des noms de champs snake_case -> camelCase
        alias_generator = lambda string: string
        populate_by_name = True

class SecurityStatus(BaseModel):
    active: bool
    camera: bool
    remote: bool
    screen: bool

class SecurityViolationCreate(BaseModel):
    violation_type: str
    timestamp: str
    url: Optional[str] = None
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    additional_info: dict = {}
    exam_session_id: Optional[int] = None

@router.post("/violations/", response_model=SecurityViolation, status_code=status.HTTP_201_CREATED)
async def log_security_violation(
    violation: SecurityViolationCreate,
    db: Session = Depends(get_db)
):
    """
    Enregistre une violation de sécurité détectée par le système anti-triche
    """
    try:
        db_violation = models.SecurityViolation(
            violation_type=violation.violation_type,  # Correction du nom de l'attribut
            timestamp=datetime.fromisoformat(violation.timestamp),
            url=violation.url,
            user_agent=violation.user_agent,
            ip_address=violation.ip_address,
            additional_info=violation.additional_info,
            exam_session_id=violation.exam_session_id
        )
        
        db.add(db_violation)
        db.commit()
        db.refresh(db_violation)
        
        return db_violation
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'enregistrement de la violation: {str(e)}"
        )

@router.post("/exam/start", response_model=SecurityStatus, status_code=status.HTTP_200_OK)
async def start_exam_security(session: ExamSecuritySession):
    """
    Démarre les services de sécurité pour une session d'examen
    """
    try:
        success = exam_security.start_security(session.session_id)
        if not success:
            return SecurityStatus(
                active=False,
                camera=False,
                remote=False,
                screen=False
            )
        
        return exam_security.get_security_status(session.session_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du démarrage des services de sécurité: {str(e)}"
        )

@router.post("/exam/stop", response_model=SecurityStatus, status_code=status.HTTP_200_OK)
async def stop_exam_security(session: ExamSecuritySession):
    """
    Arrête les services de sécurité pour une session d'examen
    """
    try:
        exam_security.stop_security(session.session_id)
        return SecurityStatus(
            active=False,
            camera=False,
            remote=False,
            screen=False
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'arrêt des services de sécurité: {str(e)}"
        )

@router.get("/exam/status", response_model=SecurityStatus)
async def get_exam_security_status(session_id: str):
    """
    Récupère l'état actuel des services de sécurité pour une session d'examen
    """
    return exam_security.get_security_status(session_id)

@router.get("/violations/", response_model=List[SecurityViolation])
async def get_security_violations(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Récupère l'historique des violations de sécurité
    (Accès restreint aux administrateurs)
    """
    violations = db.query(models.SecurityViolation)\
                 .order_by(models.SecurityViolation.timestamp.desc())\
                 .offset(skip)\
                 .limit(limit)\
                 .all()
    return violations
