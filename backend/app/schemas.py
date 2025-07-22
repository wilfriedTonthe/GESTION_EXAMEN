from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any, List

class SecurityViolationBase(BaseModel):
    """Schéma de base pour une violation de sécurité"""
    violation_type: str
    timestamp: Optional[datetime] = None
    url: Optional[str] = None
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    additional_info: Optional[Dict[str, Any]] = {}

class SecurityViolationCreate(SecurityViolationBase):
    """Schéma pour la création d'une violation de sécurité"""
    pass

class SecurityViolation(SecurityViolationBase):
    """Schéma complet pour une violation de sécurité (lecture seule)"""
    id: int

    class Config:
        orm_mode = True

class SecurityViolationList(BaseModel):
    """Schéma pour une liste de violations de sécurité"""
    items: List[SecurityViolation]
    total: int
    skip: int
    limit: int
