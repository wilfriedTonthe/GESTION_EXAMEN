from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum

class QuestionType(str, Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"

# Schemas pour les questions
class QuestionOptionBase(BaseModel):
    text: str
    is_correct: bool = False

class QuestionOptionCreate(QuestionOptionBase):
    pass

class QuestionOption(QuestionOptionBase):
    id: int

    class Config:
        from_attributes = True

class QuestionBase(BaseModel):
    text: str
    question_type: QuestionType
    points: int = 1
    options: List[QuestionOptionCreate] = []

class QuestionCreate(QuestionBase):
    pass

class Question(QuestionBase):
    id: int
    exam_id: int
    options: List[QuestionOption] = []

    class Config:
        from_attributes = True

# Schemas pour les examens
class ExamBase(BaseModel):
    title: str
    description: Optional[str] = None
    duration_minutes: int = 60

class ExamCreate(ExamBase):
    pass

class ExamUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    is_active: Optional[bool] = None

class Exam(ExamBase):
    id: int
    password: str
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
    teacher_id: Optional[int] = None
    questions: List[Question] = []

    class Config:
        from_attributes = True

class ExamResponse(ExamBase):
    id: int
    password: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    teacher_id: int

    class Config:
        from_attributes = True

class ExamWithQuestionsResponse(ExamResponse):
    questions: List["Question"] = []

    class Config:
        from_attributes = True

class ExamSimpleResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    duration_minutes: int
    is_active: bool

    class Config:
        from_attributes = True


# Schemas pour les réponses
class AnswerBase(BaseModel):
    question_id: int
    answer_text: str

class AnswerCreate(AnswerBase):
    pass

class Answer(AnswerBase):
    id: int
    is_correct: bool
    points_earned: int

    class Config:
        from_attributes = True

# Schemas pour les soumissions
class SubmissionBase(BaseModel):
    student_name: str
    exam_password: str
    answers: List[AnswerCreate] = []

class SubmissionCreate(SubmissionBase):
    pass

class SubmissionResponse(SubmissionBase):
    id: int
    score: float
    submitted_at: datetime
    answers: List[AnswerCreate] = []

    class Config:
        from_attributes = True

class Submission(SubmissionBase):
    id: int
    exam_id: int
    submitted_at: datetime
    score: int
    max_score: int
    answers: List[Answer] = []

    class Config:
        from_attributes = True
        
    def model_dump(self, **kwargs):
        # Exclure le mot de passe lors de la sérialisation
        data = super().model_dump(**kwargs)
        data.pop('exam_password', None)
        return data

class SubmissionResult(BaseModel):
    submission: dict
    correct_answers: int
    total_questions: int
    percentage: float

# Schema pour la génération de PDF
class ExamResultsPDF(BaseModel):
    exam_title: str
    total_submissions: int
    average_score: float
    submissions: List[Submission] = []

# Schémas pour les sessions d'examen
class ExamSessionBase(BaseModel):
    exam_id: int
    user_id: int
    session_id: str
    is_active: bool = True

class ExamSessionCreate(ExamSessionBase):
    pass

class ExamSession(ExamSessionBase):
    id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    security_violations: List[dict] = []

    class Config:
        from_attributes = True

class ExamSessionResponse(ExamSession):
    exam: Optional[Exam] = None
    user: Optional[dict] = None

# Schéma pour la soumission d'examen
class AnswerSubmission(BaseModel):
    question_id: int
    answer_text: str

class ExamSubmission(BaseModel):
    answers: List[AnswerSubmission] = []

# Schéma pour les violations de sécurité
class SecurityViolationBase(BaseModel):
    violation_type: str
    timestamp: datetime
    url: Optional[str] = None
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    additional_info: dict = {}

class SecurityViolationCreate(SecurityViolationBase):
    pass

class SecurityViolation(SecurityViolationBase):
    id: int
    exam_session_id: Optional[int] = None

    class Config:
        from_attributes = True
