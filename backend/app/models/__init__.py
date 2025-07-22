# Fichier __init__.py pour le package des modèles
# Importe tous les modèles depuis le fichier central models.py pour qu'ils soient découvrables par SQLAlchemy

from .models import (
    User,
    Exam,
    Question,
    QuestionOption,
    Submission,
    Answer,
    ExamSession,
    FacialSignature
)
