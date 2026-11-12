import re

ACTION_VERBS = {
    'accelerated', 'achieved', 'administered', 'allocated', 'analyzed',
    'architected', 'automated', 'budgeted', 'built', 'calculated',
    'centralized', 'championed', 'collaborated', 'completed', 'composed',
    'computed', 'configured', 'constructed', 'coordinated', 'created',
    'decreased', 'delivered', 'deployed', 'designed', 'developed',
    'devised', 'directed', 'distributed', 'documented', 'doubled',
    'drafted', 'drove', 'eliminated', 'engineered', 'enhanced',
    'established', 'evaluated', 'executed', 'expanded', 'expedited',
    'facilitated', 'formulated', 'founded', 'generated', 'governed',
    'guided', 'headed', 'identified', 'implemented', 'improved',
    'increased', 'initiated', 'inspected', 'instituted', 'integrated',
    'introduced', 'investigated', 'launched', 'lead', 'led', 'managed',
    'maximized', 'mentored', 'migrated', 'minimized', 'modernized',
    'monitored', 'negotiated', 'operated', 'optimized', 'orchestrated',
    'organized', 'overhauled', 'oversaw', 'performed', 'pioneered',
    'planned', 'prepared', 'presented', 'produced', 'programmed',
    'published', 'rebuilt', 'reduced', 'refactored', 'reorganized',
    'resolved', 'restructured', 'revamped', 'scaled', 'scheduled',
    'simplified', 'spearheaded', 'standardized', 'streamlined', 'supervised',
    'trained', 'transformed', 'upgraded', 'validated'
}


def analyze_resume_text(raw_text, parsed_data):
    """
    Computes deterministic ATS score and categorized feedback based on:
    1. Formatting & Readability (15%)
    2. Section Completeness (25%)
    3. Keyword & Skill Breadth (25%)
    4. Action Verbs & Content Quality (20%)
    5. Measurable Impact & Metrics (15%)
    """
    text_lower = raw_text.lower()
    words = re.findall(r'\b[a-zA-Z0-9_\-\.\#\+]+\b', raw_text)
    word_count = len(words)

    # 1. Formatting & Readability (Target: 350 - 1200 words)
    formatting_score = 100
    formatting_issues = []

    if word_count < 200:
        formatting_score -= 40
        formatting_issues.append("Resume content is too short (under 200 words). Add more details regarding your projects and experience.")
    elif word_count < 350:
        formatting_score -= 20
        formatting_issues.append("Resume is somewhat brief (under 350 words). Expanding your bullet points will help pass automated ATS filters.")
    elif word_count > 1200:
        formatting_score -= 25
        formatting_issues.append("Resume exceeds 1,200 words. Condense your experience to maintain a concise 1-2 page structure.")

    # Check for presence of contact details
    contact_info = parsed_data.get('contact', {})
    if not contact_info.get('email'):
        formatting_score -= 15
        formatting_issues.append("Missing or unparseable email address in header.")
    if not contact_info.get('phone'):
        formatting_score -= 10
        formatting_issues.append("Missing phone number in contact information.")

    formatting_score = max(20, min(100, formatting_score))

    # 2. Section Completeness
    sections_found = parsed_data.get('sections', {})
    section_score = 0
    missing_critical_sections = []

    if sections_found.get('summary') or 'summary' in text_lower or 'objective' in text_lower:
        section_score += 20
    else:
        missing_critical_sections.append("Professional Summary / Objective")

    if sections_found.get('experience') or 'experience' in text_lower or 'employment' in text_lower:
        section_score += 30
    else:
        missing_critical_sections.append("Work Experience")

    if sections_found.get('education') or 'education' in text_lower:
        section_score += 25
    else:
        missing_critical_sections.append("Education")

    if sections_found.get('skills') or 'skills' in text_lower:
        section_score += 25
    else:
        missing_critical_sections.append("Skills")

    # Bonus for projects or certifications
    if sections_found.get('projects') or 'projects' in text_lower:
        section_score = min(100, section_score + 10)
    if sections_found.get('certifications') or 'certifications' in text_lower:
        section_score = min(100, section_score + 10)

    ats_compatibility_score = max(25, min(100, section_score))

    # 3. Keyword & Skill Breadth
    extracted_skills = parsed_data.get('skills', [])
    num_skills = len(extracted_skills)

    if num_skills >= 12:
        keyword_score = 95
    elif num_skills >= 8:
        keyword_score = 85
    elif num_skills >= 5:
        keyword_score = 70
    elif num_skills >= 3:
        keyword_score = 55
    else:
        keyword_score = 35

    # 4. Content Quality & Action Verbs
    words_set = set(w.lower() for w in words)
    matched_verbs = words_set.intersection(ACTION_VERBS)
    verb_count = len(matched_verbs)

    if verb_count >= 10:
        content_quality_score = 92
    elif verb_count >= 6:
        content_quality_score = 80
    elif verb_count >= 3:
        content_quality_score = 65
    else:
        content_quality_score = 45

    # 5. Measurable Impact (Metrics, numbers, dollar signs, percentages)
    metrics_patterns = re.findall(
        r'(\d+[\%|\+k|m|x]|\$\d+|\d+\s*(?:users|clients|percent|increase|reduction|saved))',
        raw_text,
        re.IGNORECASE
    )
    metrics_count = len(metrics_patterns)

    if metrics_count >= 6:
        measurable_impact_score = 95
    elif metrics_count >= 4:
        measurable_impact_score = 82
    elif metrics_count >= 2:
        measurable_impact_score = 68
    elif metrics_count >= 1:
        measurable_impact_score = 52
    else:
        measurable_impact_score = 35

    # Weighted Overall Score Formula
    overall_score = round(
        (ats_compatibility_score * 0.25) +
        (keyword_score * 0.25) +
        (content_quality_score * 0.20) +
        (measurable_impact_score * 0.15) +
        (formatting_score * 0.15)
    )

    # Compile Strengths, Weaknesses, and Actionable Recommendations
    strengths = []
    weaknesses = []
    recommendations = []

    # Strengths
    if ats_compatibility_score >= 80:
        strengths.append("Standard ATS section headers are well-organized and easily parsed.")
    if num_skills >= 8:
        strengths.append(f"Strong skill breadth identified ({num_skills} technical & domain skills detected).")
    if verb_count >= 6:
        strengths.append(f"Effective use of active verbs ({verb_count} distinct power verbs utilized).")
    if metrics_count >= 3:
        strengths.append(f"Good quantitative evidence of accomplishment ({metrics_count} measurable achievements found).")
    if not strengths:
        strengths.append("Standard contact and basic structure detected.")

    # Weaknesses
    if missing_critical_sections:
        weaknesses.append(f"Missing core section headers: {', '.join(missing_critical_sections)}.")
    if num_skills < 6:
        weaknesses.append("Low keyword and skill density. Core industry keywords may be filtered out by ATS.")
    if verb_count < 4:
        weaknesses.append("Passive wording detected. Insufficient strong action verbs in experience descriptions.")
    if metrics_count < 2:
        weaknesses.append("Lack of quantifiable metrics (percentages, revenues, scale of users).")
    for issue in formatting_issues:
        weaknesses.append(issue)

    # Actionable Recommendations
    if missing_critical_sections:
        recommendations.append({
            "category": "Structure",
            "title": "Add Missing Standard Sections",
            "suggestion": f"Explicitly add labeled sections for: {', '.join(missing_critical_sections)}. ATS crawlers look for exact headings."
        })

    if metrics_count < 3:
        recommendations.append({
            "category": "Impact",
            "title": "Quantify Your Achievements",
            "suggestion": "Rewrite experience bullet points using the XYZ formula: 'Accomplished [X], as measured by [Y], by doing [Z]'. Include percentages, dollar savings, or team sizes."
        })

    if verb_count < 6:
        recommendations.append({
            "category": "Content",
            "title": "Incorporate Dynamic Action Verbs",
            "suggestion": "Begin bullet points with high-impact power verbs such as 'Spearheaded', 'Orchestrated', 'Refactored', or 'Accelerated' rather than 'Responsible for'."
        })

    if num_skills < 10:
        recommendations.append({
            "category": "Keywords",
            "title": "Expand Core Technical Skills",
            "suggestion": "Add relevant tooling, libraries, cloud platforms (e.g., Docker, AWS, PostgreSQL, CI/CD) and soft skills matching your target job descriptions."
        })

    if not recommendations:
        recommendations.append({
            "category": "Refinement",
            "title": "Tailor to Specific Role Descriptions",
            "suggestion": "Align your skills and keywords closely with each specific job posting for maximum ATS match percentage."
        })

    metrics_summary = {
        "word_count": word_count,
        "skills_detected": num_skills,
        "action_verbs_count": verb_count,
        "measurable_metrics_count": metrics_count,
        "has_contact_email": bool(contact_info.get('email')),
        "has_contact_phone": bool(contact_info.get('phone')),
    }

    return {
        "overall_score": overall_score,
        "ats_compatibility_score": ats_compatibility_score,
        "keyword_score": keyword_score,
        "content_quality_score": content_quality_score,
        "measurable_impact_score": measurable_impact_score,
        "formatting_score": formatting_score,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "recommendations": recommendations,
        "metrics_summary": metrics_summary,
    }