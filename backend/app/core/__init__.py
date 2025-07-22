"""
Package core - Contient les composants de base de l'application
"""

# Export des composants principaux
from .config import Settings, settings
from .security import (
    get_current_user,
    get_current_active_user,
    get_current_teacher_user,
    pwd_context,
    oauth2_scheme
)

__all__ = [
    'Settings',
    'settings',
    'get_current_user',
    'get_current_active_user',
    'get_current_teacher_user',
    'pwd_context',
    'oauth2_scheme'
]
