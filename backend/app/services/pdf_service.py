from fpdf import FPDF
from io import BytesIO
from app.models import Submission, User, Exam

class PDF(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 12)
        self.cell(0, 10, 'Rapport de Résultats d\'Examen', 0, 1, 'C')
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

def generate_results_pdf(submission: Submission, student: User, exam: Exam) -> bytes:
    """
    Génère un PDF avec les résultats détaillés d'une soumission d'examen.
    """
    pdf = PDF()
    pdf.add_page()
    pdf.set_font('Arial', '', 12)

    # Informations générales
    pdf.set_font('Arial', 'B', 14)
    pdf.cell(0, 10, f"Examen: {exam.title}", 0, 1)
    pdf.set_font('Arial', '', 12)
    pdf.cell(0, 10, f"Étudiant: {student.full_name} ({student.email})", 0, 1)
    pdf.cell(0, 10, f"Date de soumission: {submission.submitted_at.strftime('%Y-%m-%d %H:%M')}", 0, 1)
    pdf.ln(5)

    # Score final
    pdf.set_font('Arial', 'B', 12)
    pdf.cell(0, 10, f"Score final: {submission.score} / {submission.total_points_possible}", 0, 1)
    pdf.ln(10)

    # Détail des réponses
    pdf.set_font('Arial', 'B', 12)
    pdf.cell(0, 10, "Détail des réponses :", 0, 1)
    pdf.ln(5)

    for answer in submission.answers:
        question = answer.question
        pdf.set_font('Arial', 'B', 11)
        pdf.multi_cell(0, 5, f"Q: {question.text} ({answer.points_awarded} / {question.points} pts)")
        
        pdf.set_font('Arial', '', 10)
        is_correct = answer.points_awarded > 0
        correctness_text = "(Correct)" if is_correct else "(Incorrect)"
        
        # Afficher la réponse de l'étudiant
        student_answer_text = ""
        if question.question_type == 'true_false':
            student_answer_text = answer.selected_option.text if answer.selected_option else "Non répondu"
        elif question.question_type == 'multiple_choice':
            student_answer_text = answer.selected_option.text if answer.selected_option else "Non répondu"
        elif question.question_type == 'short_answer':
            student_answer_text = answer.answer_text if answer.answer_text else "Non répondu"

        pdf.multi_cell(0, 5, f"Votre réponse: {student_answer_text} {correctness_text}")

        # Si la réponse est incorrecte, montrer la bonne réponse
        if not is_correct:
            correct_options = [opt.text for opt in question.options if opt.is_correct]
            correct_answer_text = ", ".join(correct_options)
            pdf.set_font('Arial', 'I', 10)
            pdf.multi_cell(0, 5, f"Réponse correcte: {correct_answer_text}")

        pdf.ln(5)

    # Générer le PDF en mémoire
    pdf_bytes = pdf.output(dest='S').encode('latin-1')
    return pdf_bytes
