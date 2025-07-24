from fpdf import FPDF
from io import BytesIO
from fpdf import FPDF
from io import BytesIO
from typing import List
from app.models import Submission, Exam, Question

class PDF(FPDF):
    def __init__(self, exam_title):
        super().__init__()
        self.exam_title = exam_title

    def header(self):
        self.set_font('Arial', 'B', 15)
        self.cell(0, 10, 'Rapport de Résultats', 0, 1, 'C')
        self.set_font('Arial', 'I', 12)
        self.cell(0, 10, self.exam_title, 0, 1, 'C')
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

def generate_results_pdf(exam: Exam, submissions: List[Submission]) -> bytes:
    """
    Génère un PDF consolidé avec les résultats de toutes les soumissions pour un examen.
    Si aucune soumission n'est disponible, génère un PDF avec un message informatif.
    """
    pdf = PDF(exam_title=exam.title)
    pdf.add_page()

    # Page de résumé
    pdf.set_font('Arial', 'B', 16)
    pdf.cell(0, 10, 'Résumé des Soumissions', 0, 1, 'L')
    pdf.ln(5)
    
    # Vérifier s'il y a des soumissions
    if not submissions:
        pdf.set_font('Arial', 'I', 12)
        pdf.cell(0, 10, 'Aucune soumission n\'a été trouvée pour cet examen.', 0, 1, 'C')
        pdf.ln(5)
        pdf.set_font('Arial', '', 11)
        pdf.cell(0, 10, 'Les résultats apparaîtront ici une fois que des étudiants auront soumis leurs réponses.', 0, 1, 'C')
        # Générer le PDF en mémoire même s'il est vide
        return pdf.output(dest='S').encode('latin-1')

    pdf.set_font('Arial', 'B', 12)
    pdf.cell(90, 10, 'Nom de l\'étudiant', 1)
    pdf.cell(40, 10, 'Score', 1)
    pdf.cell(50, 10, 'Date de soumission', 1)
    pdf.ln()

    pdf.set_font('Arial', '', 12)
    for sub in submissions:
        pdf.cell(90, 10, sub.student_name, 1)
        pdf.cell(40, 10, f'{sub.score} / {sub.max_score}', 1)
        pdf.cell(50, 10, sub.submitted_at.strftime('%Y-%m-%d %H:%M'), 1)
        pdf.ln()

    # Détails par soumission
    for sub in submissions:
        pdf.add_page()
        pdf.set_font('Arial', 'B', 16)
        pdf.cell(0, 10, f'Détails pour : {sub.student_name}', 0, 1, 'L')
        pdf.ln(5)

        pdf.set_font('Arial', 'B', 12)
        pdf.cell(0, 10, f"Score final: {sub.score} / {sub.max_score}", 0, 1)
        pdf.ln(10)

        pdf.set_font('Arial', 'B', 12)
        pdf.cell(0, 10, "Détail des réponses :", 0, 1)
        pdf.ln(5)

        # Créer un mapping des questions pour un accès facile
        questions_map = {q.id: q for q in exam.questions}

        for answer in sub.answers:
            question = questions_map.get(answer.question_id)
            if not question:
                continue

            pdf.set_font('Arial', 'B', 11)
            pdf.multi_cell(0, 5, f"Q: {question.text} ({answer.points_earned} / {question.points} pts)")
            
            pdf.set_font('Arial', '', 10)
            correctness_text = "(Correct)" if answer.is_correct else "(Incorrect)"
            
            pdf.multi_cell(0, 5, f"Réponse: {answer.answer_text} {correctness_text}")

            if not answer.is_correct:
                correct_options = [opt.option_text for opt in question.options if opt.is_correct]
                correct_answer_text = ", ".join(correct_options)
                pdf.set_font('Arial', 'I', 10)
                pdf.multi_cell(0, 5, f"Réponse correcte: {correct_answer_text}")

            pdf.ln(5)

    # Générer le PDF en mémoire
    return pdf.output(dest='S').encode('latin-1')
