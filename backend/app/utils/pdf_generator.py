from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from typing import List, Dict, Any

async def generate_exam_results_pdf(exam_data: Dict[str, Any]) -> BytesIO:
    """
    Génère un PDF avec les résultats d'un examen
    
    Args:
        exam_data: Dictionnaire contenant les données de l'examen et des soumissions
            {
                'exam_title': str,
                'total_submissions': int,
                'average_score': float,
                'submissions': [
                    {
                        'student_name': str,
                        'submitted_at': datetime,
                        'score': int,
                        'max_score': int,
                        'percentage': float,
                        'answers': [
                            {
                                'question_text': str,
                                'answer_text': str,
                                'is_correct': bool,
                                'points_earned': int,
                                'max_points': int
                            }
                        ]
                    }
                ]
            }
    
    Returns:
        BytesIO: Un objet BytesIO contenant le PDF généré
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72,
                          topMargin=72, bottomMargin=72)
    
    styles = getSampleStyleSheet()
    elements = []
    
    # Style personnalisé pour le titre
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=20,
        alignment=1  # Centré
    )
    
    # Style pour les sous-titres
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=12,
        textColor=colors.HexColor('#2c3e50')
    )
    
    # Style pour le texte normal
    normal_style = styles['Normal']
    
    # Style pour les en-têtes de tableau
    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.white,
        alignment=1,
        fontName='Helvetica-Bold'
    )
    
    # Style pour les cellules de tableau
    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        spaceBefore=3,
        spaceAfter=3
    )
    
    # En-tête du document
    elements.append(Paragraph("Rapport des Résultats d'Examen", title_style))
    elements.append(Paragraph(f"Examen: {exam_data['exam_title']}", subtitle_style))
    
    # Résumé des résultats
    summary_data = [
        ["Nombre de participants", str(exam_data['total_submissions'])],
        ["Note moyenne", f"{exam_data['average_score']:.2f}%"],
    ]
    
    summary_table = Table(summary_data, colWidths=[doc.width/2.0]*2)
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3498db')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8f9fa')),
        ('GRID', (0, 0), (-1, -1), 1, colors.lightgrey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    
    elements.append(summary_table)
    elements.append(Spacer(1, 20))
    
    # Détails par étudiant
    for submission in exam_data['submissions']:
        # En-tête de la soumission
        student_header = f"Étudiant: {submission['student_name']} - " \
                       f"Note: {submission['score']}/{submission['max_score']} " \
                       f"({submission['percentage']:.1f}%)"
        
        elements.append(Paragraph(student_header, subtitle_style))
        
        # Tableau des réponses
        answer_data = [
            [
                Paragraph("Question", table_header_style),
                Paragraph("Réponse", table_header_style),
                Paragraph("Points", table_header_style),
                Paragraph("Statut", table_header_style)
            ]
        ]
        
        for answer in submission['answers']:
            status = "Correct" if answer['is_correct'] else "Incorrect"
            status_color = colors.green if answer['is_correct'] else colors.red
            
            answer_data.append([
                Paragraph(answer['question_text'], table_cell_style),
                Paragraph(str(answer['answer_text']), table_cell_style),
                Paragraph(f"{answer['points_earned']}/{answer['max_points']}", table_cell_style),
                Paragraph(status, table_cell_style)
            ])
        
        # Créer le tableau avec les données
        answer_table = Table(answer_data, colWidths=[
            doc.width * 0.45,  # Question
            doc.width * 0.25,  # Réponse
            doc.width * 0.1,   # Points
            doc.width * 0.2    # Statut
        ])
        
        # Appliquer le style au tableau
        answer_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c3e50')),  # En-tête
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 8),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('WORDWRAP', (0, 0), (-1, -1), True),  # Retour à la ligne automatique
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        
        # Colorer les lignes en fonction du statut (correct/incorrect)
        for i, answer in enumerate(submission['answers'], 1):
            if answer['is_correct']:
                answer_table.setStyle(TableStyle([
                    ('TEXTCOLOR', (0, i), (-1, i), colors.green),
                ]))
            else:
                answer_table.setStyle(TableStyle([
                    ('TEXTCOLOR', (0, i), (-1, i), colors.red),
                ]))
        
        elements.append(answer_table)
        elements.append(Spacer(1, 20))
    
    # Générer le PDF
    doc.build(elements)
    
    # Déplacer le curseur au début du buffer
    buffer.seek(0)
    return buffer
