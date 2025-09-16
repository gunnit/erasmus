from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
import os
import tempfile
from datetime import datetime
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

class ProposalPDFGenerator:
    """
    Generate comprehensive PDF for Erasmus+ proposals including workplan
    """

    def __init__(self):
        self.styles = self._setup_styles()

    def _setup_styles(self):
        """Setup custom styles for the PDF"""
        styles = getSampleStyleSheet()

        styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#003399'),
            spaceAfter=30,
            alignment=TA_CENTER
        ))

        styles.add(ParagraphStyle(
            name='CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#003399'),
            spaceAfter=12,
            spaceBefore=12
        ))

        styles.add(ParagraphStyle(
            name='CustomSubHeading',
            parent=styles['Heading3'],
            fontSize=12,
            textColor=colors.HexColor('#666666'),
            spaceAfter=6
        ))

        styles.add(ParagraphStyle(
            name='CustomNormal',
            parent=styles['Normal'],
            fontSize=10,
            alignment=TA_JUSTIFY
        ))

        styles.add(ParagraphStyle(
            name='WorkPackageTitle',
            parent=styles['Heading3'],
            fontSize=14,
            textColor=colors.HexColor('#003399'),
            spaceAfter=8,
            spaceBefore=12,
            bold=True
        ))

        return styles

    async def generate_proposal_pdf(self, proposal) -> str:
        """Generate PDF for a complete proposal with workplan"""
        # Create temporary directory for PDFs
        pdf_dir = os.path.join(tempfile.gettempdir(), 'erasmus_pdfs')
        os.makedirs(pdf_dir, exist_ok=True)

        # Create PDF file path
        pdf_path = os.path.join(pdf_dir, f"proposal_{proposal.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf")

        # Create the PDF document
        doc = SimpleDocTemplate(pdf_path, pagesize=A4)
        story = []

        # Add title page
        story.extend(self._create_title_page(proposal))
        story.append(PageBreak())

        # Add project overview
        story.extend(self._create_project_overview(proposal))
        story.append(PageBreak())

        # Add answers sections
        if proposal.answers:
            story.extend(self._create_answers_sections(proposal.answers))
            story.append(PageBreak())

        # Add workplan if available
        if proposal.workplan:
            story.extend(self._create_workplan_section(proposal.workplan))

        # Build the PDF
        doc.build(story)
        logger.info(f"Generated PDF for proposal {proposal.id} at {pdf_path}")

        return pdf_path

    def _create_title_page(self, proposal):
        """Create the title page"""
        elements = []

        elements.append(Paragraph("Erasmus+ KA220-ADU", self.styles['CustomTitle']))
        elements.append(Spacer(1, 0.5 * inch))
        elements.append(Paragraph("Cooperation Partnerships in Adult Education", self.styles['CustomHeading']))
        elements.append(Spacer(1, 1 * inch))

        elements.append(Paragraph(proposal.title, self.styles['CustomTitle']))
        elements.append(Spacer(1, 1 * inch))

        # Metadata table
        metadata = [
            ['Application ID:', str(proposal.id)],
            ['Status:', proposal.status.upper()],
            ['Created:', proposal.created_at.strftime('%Y-%m-%d')],
            ['Last Updated:', proposal.updated_at.strftime('%Y-%m-%d')],
            ['Generated:', datetime.now().strftime('%Y-%m-%d %H:%M')]
        ]

        t = Table(metadata, colWidths=[2 * inch, 4 * inch])
        t.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(t)

        return elements

    def _create_project_overview(self, proposal):
        """Create project overview section"""
        elements = []

        elements.append(Paragraph("Project Overview", self.styles['CustomHeading']))
        elements.append(Spacer(1, 0.2 * inch))

        # Project details
        if proposal.project_idea:
            elements.append(Paragraph("<b>Project Idea:</b>", self.styles['CustomSubHeading']))
            elements.append(Paragraph(proposal.project_idea, self.styles['CustomNormal']))
            elements.append(Spacer(1, 0.2 * inch))

        # Duration and budget
        details = []
        if proposal.duration_months:
            details.append(['Duration:', f"{proposal.duration_months} months"])
        if proposal.budget:
            details.append(['Budget:', f"€{int(proposal.budget):,}"])

        if details:
            t = Table(details, colWidths=[2 * inch, 4 * inch])
            t.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
            ]))
            elements.append(t)
            elements.append(Spacer(1, 0.2 * inch))

        # Priorities
        if proposal.priorities:
            elements.append(Paragraph("<b>Selected Priorities:</b>", self.styles['CustomSubHeading']))
            for priority in proposal.priorities:
                elements.append(Paragraph(f"• {priority}", self.styles['CustomNormal']))
            elements.append(Spacer(1, 0.2 * inch))

        # Partners
        if proposal.partners:
            elements.append(Paragraph("<b>Partner Organizations:</b>", self.styles['CustomSubHeading']))
            for i, partner in enumerate(proposal.partners, 1):
                if isinstance(partner, dict):
                    partner_text = f"• {partner.get('name', 'Partner ' + str(i))}"
                    if partner.get('country'):
                        partner_text += f" ({partner['country']})"
                    if partner.get('type'):
                        partner_text += f" - {partner['type']}"
                else:
                    partner_text = f"• {partner}"
                elements.append(Paragraph(partner_text, self.styles['CustomNormal']))
            elements.append(Spacer(1, 0.2 * inch))

        return elements

    def _create_answers_sections(self, answers):
        """Create sections for all answers"""
        elements = []

        section_titles = {
            'project_summary': 'Project Summary',
            'relevance': 'Relevance of the Project',
            'needs_analysis': 'Needs Analysis',
            'partnership': 'Partnership and Cooperation',
            'impact': 'Impact',
            'project_management': 'Project Management'
        }

        for section_key, section_title in section_titles.items():
            if section_key in answers and answers[section_key]:
                elements.append(Paragraph(section_title, self.styles['CustomHeading']))
                elements.append(Spacer(1, 0.1 * inch))

                section_answers = answers[section_key]
                if isinstance(section_answers, dict):
                    for field, answer in section_answers.items():
                        if answer:
                            # Format field name
                            field_title = field.replace('_', ' ').title()
                            elements.append(Paragraph(f"<b>{field_title}</b>", self.styles['CustomSubHeading']))

                            # Add answer
                            answer_text = str(answer).replace('\n', '<br/>')
                            elements.append(Paragraph(answer_text, self.styles['CustomNormal']))
                            elements.append(Spacer(1, 0.2 * inch))

                elements.append(PageBreak())

        return elements

    def _create_workplan_section(self, workplan):
        """Create workplan section with work packages"""
        elements = []

        elements.append(Paragraph("Project Workplan", self.styles['CustomHeading']))
        elements.append(Spacer(1, 0.2 * inch))

        # Workplan metadata
        if workplan.get('metadata'):
            meta = workplan['metadata']
            elements.append(Paragraph(
                f"Total Duration: {meta.get('total_duration_months', 'N/A')} months | "
                f"Work Packages: {meta.get('total_work_packages', 'N/A')} | "
                f"Deliverables: {meta.get('total_deliverables', 'N/A')}",
                self.styles['CustomNormal']
            ))
            elements.append(Spacer(1, 0.3 * inch))

        # Work packages
        if workplan.get('work_packages'):
            for wp in workplan['work_packages']:
                # Work package header
                elements.append(Paragraph(
                    f"{wp['id']}: {wp['title']}",
                    self.styles['WorkPackageTitle']
                ))

                # WP details table
                wp_details = [
                    ['Lead Partner:', wp.get('lead_partner', 'TBD')],
                    ['Duration:', f"Month {wp.get('start_month', 1)} - Month {wp.get('end_month', 24)}"],
                    ['Effort:', f"{wp.get('effort_pm', 0)} person-months"]
                ]
                t = Table(wp_details, colWidths=[1.5 * inch, 4.5 * inch])
                t.setStyle(TableStyle([
                    ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
                ]))
                elements.append(t)
                elements.append(Spacer(1, 0.1 * inch))

                # Objectives
                if wp.get('objectives'):
                    elements.append(Paragraph("<b>Objectives:</b>", self.styles['CustomSubHeading']))
                    for obj in wp['objectives']:
                        elements.append(Paragraph(f"• {obj}", self.styles['CustomNormal']))
                    elements.append(Spacer(1, 0.1 * inch))

                # Activities
                if wp.get('activities'):
                    elements.append(Paragraph("<b>Activities:</b>", self.styles['CustomSubHeading']))
                    activities_data = []
                    for act in wp['activities']:
                        activities_data.append([
                            act['id'],
                            act['name'],
                            act.get('responsible', ''),
                            f"M{act.get('start_month', '')}-M{act.get('end_month', '')}"
                        ])

                    if activities_data:
                        activities_table = Table(
                            [['ID', 'Activity', 'Responsible', 'Timeline']] + activities_data,
                            colWidths=[0.5 * inch, 2.5 * inch, 1.5 * inch, 1 * inch]
                        )
                        activities_table.setStyle(TableStyle([
                            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                            ('FONTSIZE', (0, 0), (-1, -1), 8),
                            ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
                            ('GRID', (0, 0), (-1, -1), 1, colors.black),
                        ]))
                        elements.append(activities_table)
                    elements.append(Spacer(1, 0.1 * inch))

                # Deliverables
                if wp.get('deliverables'):
                    elements.append(Paragraph("<b>Deliverables:</b>", self.styles['CustomSubHeading']))
                    deliverables_data = []
                    for deliv in wp['deliverables']:
                        deliverables_data.append([
                            deliv['id'],
                            deliv['title'],
                            deliv.get('responsible', ''),
                            f"Month {deliv.get('due_month', '')}"
                        ])

                    if deliverables_data:
                        deliverables_table = Table(
                            [['ID', 'Deliverable', 'Responsible', 'Due']] + deliverables_data,
                            colWidths=[0.5 * inch, 2.5 * inch, 1.5 * inch, 1 * inch]
                        )
                        deliverables_table.setStyle(TableStyle([
                            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                            ('FONTSIZE', (0, 0), (-1, -1), 8),
                            ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
                            ('GRID', (0, 0), (-1, -1), 1, colors.black),
                        ]))
                        elements.append(deliverables_table)

                elements.append(Spacer(1, 0.3 * inch))

        # Partner allocation
        if workplan.get('partner_allocation'):
            elements.append(PageBreak())
            elements.append(Paragraph("Partner Effort Allocation (Person-Months)", self.styles['CustomHeading']))
            elements.append(Spacer(1, 0.1 * inch))

            # Create allocation table
            partners = list(workplan['partner_allocation'].keys())
            wp_ids = [wp['id'] for wp in workplan.get('work_packages', [])]

            # Header row
            header = ['Partner'] + wp_ids + ['Total']
            table_data = [header]

            # Data rows
            for partner in partners:
                row = [partner]
                total = 0
                for wp_id in wp_ids:
                    value = workplan['partner_allocation'][partner].get(wp_id, 0)
                    row.append(f"{value:.1f}")
                    total += value
                row.append(f"{total:.1f}")
                table_data.append(row)

            allocation_table = Table(table_data)
            allocation_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTNAME', (-1, 0), (-1, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            elements.append(allocation_table)

        return elements