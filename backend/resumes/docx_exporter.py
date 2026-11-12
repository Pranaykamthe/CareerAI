import io
from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH


def generate_sample_format_docx(draft) -> io.BytesIO:
    """Generates a clean, ATS-compliant DOCX matching the CareerAI sample resume layout."""
    doc = Document()

    for section in doc.sections:
        section.top_margin = Inches(0.55)
        section.bottom_margin = Inches(0.55)
        section.left_margin = Inches(0.65)
        section.right_margin = Inches(0.65)

    accent_blue = RGBColor(37, 99, 235)   # #2563EB
    dark_text = RGBColor(15, 23, 42)      # #0F172A
    muted_text = RGBColor(71, 85, 105)    # #475569

    p_info = draft.personal_info or {}

    # Header: Name & Title
    name_p = doc.add_paragraph()
    name_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    name_p.paragraph_format.space_after = Pt(2)
    name_run = name_p.add_run((p_info.get('full_name') or 'YOUR NAME').upper())
    name_run.bold = True
    name_run.font.size = Pt(18)
    name_run.font.color.rgb = dark_text

    role_p = doc.add_paragraph()
    role_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    role_p.paragraph_format.space_after = Pt(4)
    role_run = role_p.add_run((p_info.get('headline') or draft.title or 'SOFTWARE ENGINEER').upper())
    role_run.bold = True
    role_run.font.size = Pt(10)
    role_run.font.color.rgb = accent_blue

    contact_parts = [
        p_info.get('email'),
        p_info.get('phone'),
        p_info.get('location'),
        p_info.get('linkedin'),
        p_info.get('portfolio'),
    ]
    contact_line = "  |  ".join([c for c in contact_parts if c])
    if contact_line:
        c_p = doc.add_paragraph()
        c_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        c_p.paragraph_format.space_after = Pt(8)
        c_run = c_p.add_run(contact_line)
        c_run.font.size = Pt(9)
        c_run.font.color.rgb = muted_text

    def add_section_heading(title_text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(8)
        h.paragraph_format.space_after = Pt(3)
        r = h.add_run(title_text.upper())
        r.bold = True
        r.font.size = Pt(10.5)
        r.font.color.rgb = accent_blue

    # Professional Summary
    if draft.summary:
        add_section_heading("Professional Summary")
        s_p = doc.add_paragraph(draft.summary)
        s_p.paragraph_format.space_after = Pt(4)
        s_p.runs[0].font.size = Pt(9.5)

    # Skills
    if draft.skills:
        add_section_heading("Skills")
        for group in draft.skills:
            cat = group.get('category', '').strip()
            items = group.get('items', '').strip()
            if cat or items:
                sk_p = doc.add_paragraph()
                sk_p.paragraph_format.space_after = Pt(2)
                if cat:
                    r_cat = sk_p.add_run(f"{cat}: ")
                    r_cat.bold = True
                    r_cat.font.size = Pt(9.5)
                r_items = sk_p.add_run(items)
                r_items.font.size = Pt(9.5)

    # Work Experience
    if draft.work_experience:
        add_section_heading("Work Experience")
        for exp in draft.work_experience:
            top_p = doc.add_paragraph()
            top_p.paragraph_format.space_before = Pt(3)
            top_p.paragraph_format.space_after = Pt(1)
            r_role = top_p.add_run(exp.get('role', ''))
            r_role.bold = True
            r_role.font.size = Pt(10)
            if exp.get('duration'):
                r_dur = top_p.add_run(f"   ({exp.get('duration')})")
                r_dur.font.size = Pt(9)
                r_dur.font.color.rgb = muted_text

            sub_p = doc.add_paragraph()
            sub_p.paragraph_format.space_after = Pt(2)
            r_comp = sub_p.add_run(exp.get('company', ''))
            r_comp.font.size = Pt(9.5)
            r_comp.font.color.rgb = accent_blue
            if exp.get('location'):
                r_loc = sub_p.add_run(f" — {exp.get('location')}")
                r_loc.font.size = Pt(9)
                r_loc.font.color.rgb = muted_text

            for bullet in exp.get('bullets', []):
                if bullet.strip():
                    b_p = doc.add_paragraph(bullet.strip(), style='List Bullet')
                    b_p.paragraph_format.space_after = Pt(1.5)
                    b_p.runs[0].font.size = Pt(9.5)

    # Education
    if draft.education:
        add_section_heading("Education")
        for edu in draft.education:
            ed_p = doc.add_paragraph()
            ed_p.paragraph_format.space_after = Pt(1)
            r_deg = ed_p.add_run(edu.get('degree', ''))
            r_deg.bold = True
            r_deg.font.size = Pt(10)
            if edu.get('year'):
                r_yr = ed_p.add_run(f"   ({edu.get('year')})")
                r_yr.font.size = Pt(9)
                r_yr.font.color.rgb = muted_text

            sch_p = doc.add_paragraph()
            sch_p.paragraph_format.space_after = Pt(3)
            sch_txt = edu.get('school', '')
            if edu.get('location'):
                sch_txt += f" — {edu.get('location')}"
            r_sch = sch_p.add_run(sch_txt)
            r_sch.font.size = Pt(9.5)
            r_sch.font.color.rgb = muted_text

    # Projects
    if draft.projects:
        add_section_heading("Projects")
        for proj in draft.projects:
            pr_p = doc.add_paragraph()
            pr_p.paragraph_format.space_before = Pt(2)
            pr_p.paragraph_format.space_after = Pt(1)
            r_title = pr_p.add_run(proj.get('title', ''))
            r_title.bold = True
            r_title.font.size = Pt(10)
            if proj.get('link'):
                r_link = pr_p.add_run(f"  |  {proj.get('link')}")
                r_link.font.size = Pt(9)
                r_link.font.color.rgb = accent_blue

            if proj.get('description'):
                d_p = doc.add_paragraph(proj.get('description'))
                d_p.paragraph_format.space_after = Pt(1.5)
                d_p.runs[0].font.size = Pt(9.5)

            for bullet in proj.get('bullets', []):
                if bullet.strip():
                    pb_p = doc.add_paragraph(bullet.strip(), style='List Bullet')
                    pb_p.paragraph_format.space_after = Pt(1.5)
                    pb_p.runs[0].font.size = Pt(9.5)

    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer