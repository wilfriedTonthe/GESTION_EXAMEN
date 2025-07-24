from fastapi import APIRouter, Depends
from . import exams, submissions, auth, security
from ..core.security import get_current_active_user
from . import auth
from . import security_routes

router = APIRouter()

# Routes d'authentification (publiques)
router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Routes de soumission (publiques)
router.include_router(
    submissions.router,
    prefix="/submissions",
    tags=["Submissions"]
)

# Routes de sécurité (accessibles sans authentification pour les étudiants)
router.include_router(
    security.router,
    prefix="/security",
    tags=["Security"]
)

# Routes de sécurité additionnelles (vérification étudiants, etc.)
router.include_router(
    security_routes.router,
    prefix="/security",
    tags=["Security"]
)

# Routes d'examens (certaines sont publiques, d'autres protégées)
router.include_router(
    exams.router,
    prefix="/exams",
    tags=["Exams"]
)

__all__ = ["router"]
