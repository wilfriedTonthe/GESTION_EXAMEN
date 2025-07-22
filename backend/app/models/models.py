from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Table, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base # Utiliser la Base centrale

# --- Modèle Utilisateur ---
class User(Base):
    __tablename__ = "users"
    # __table_args__ = {'extend_existing': True} # Supprimé car ce n'est plus nécessaire

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_teacher = Column(Boolean, default=False)

    # Relations
    exams = relationship("Exam", back_populates="teacher")
    submissions = relationship("Submission", back_populates="student")
    exam_sessions = relationship("ExamSession", back_populates="student")
    facial_signatures = relationship("FacialSignature", back_populates="user")

# --- Modèle Examen ---
class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String, nullable=True)
    password = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)
    duration_minutes = Column(Integer, default=60)
    signature_file_path = Column(String, nullable=True)
    
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    teacher = relationship("User", back_populates="exams")

    questions = relationship("Question", back_populates="exam", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="exam", cascade="all, delete-orphan")
    sessions = relationship("ExamSession", back_populates="exam", cascade="all, delete-orphan")

# --- Modèle Question ---
class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    text = Column(Text, nullable=False)
    question_type = Column(String, nullable=False) # e.g., 'multiple_choice', 'true_false', 'short_answer'
    points = Column(Integer, default=1)

    exam = relationship("Exam", back_populates="questions")
    options = relationship("QuestionOption", back_populates="question", cascade="all, delete-orphan")
    answers = relationship("Answer", back_populates="question", cascade="all, delete-orphan")

# --- Modèle Option de Question ---
class QuestionOption(Base):
    __tablename__ = "question_options"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    text = Column(String, nullable=False)
    is_correct = Column(Boolean, default=False)

    question = relationship("Question", back_populates="options")
    answers = relationship("Answer", back_populates="selected_option")

# --- Modèle Soumission ---
class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    score = Column(Float, default=0)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    total_points_possible = Column(Integer, default=0)

    exam = relationship("Exam", back_populates="submissions")
    student = relationship("User", back_populates="submissions")
    answers = relationship("Answer", back_populates="submission", cascade="all, delete-orphan")

# --- Modèle Réponse ---
class Answer(Base):
    __tablename__ = "answers"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    selected_option_id = Column(Integer, ForeignKey("question_options.id"), nullable=True)
    answer_text = Column(Text, nullable=True)
    points_awarded = Column(Float, default=0)

    submission = relationship("Submission", back_populates="answers")
    question = relationship("Question", back_populates="answers")
    selected_option = relationship("QuestionOption", back_populates="answers")

# --- Modèle Session d'Examen ---
class ExamSession(Base):
    __tablename__ = 'exam_sessions'

    id = Column(String, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey('exams.id'), nullable=False)
    student_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    start_time = Column(DateTime, default=func.now)
    end_time = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)

    exam = relationship("Exam", back_populates="sessions")
    student = relationship("User", back_populates="exam_sessions")

# --- Modèle de Signature Faciale ---
class FacialSignature(Base):
    __tablename__ = "facial_signatures"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    signature_data = Column(Text, nullable=False) # Ou LargeBinary si stocké sous forme binaire
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="facial_signatures")
