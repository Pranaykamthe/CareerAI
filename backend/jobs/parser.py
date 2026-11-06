import re

COMMON_SKILLS_TAXONOMY = [
    'Python', 'Django', 'Flask', 'FastAPI', 'JavaScript', 'TypeScript', 'React', 'React.js',
    'Vue.js', 'Angular', 'Node.js', 'Express', 'HTML5', 'CSS3', 'Bootstrap', 'Tailwind CSS',
    'PostgreSQL', 'MySQL', 'SQLite', 'MongoDB', 'Redis', 'GraphQL', 'REST APIs', 'Docker',
    'Kubernetes', 'AWS', 'Azure', 'GCP', 'Git', 'GitHub', 'CI/CD', 'Linux', 'Microservices',
    'Agile', 'Scrum', 'Unit Testing', 'Jest', 'Pytest', 'System Design', 'Kafka', 'Celery'
]

def extract_job_requirements(raw_text: str) -> dict:
    """
    Parses unstructured job description text using rule-based keyword matching and regex.
    """
    text_clean = re.sub(r'\s+', ' ', raw_text).strip()
    text_lower = text_clean.lower()

    # 1. Skill Extraction
    extracted_skills = []
    for skill in COMMON_SKILLS_TAXONOMY:
        pattern = r'(?<![a-zA-Z0-9])' + re.escape(skill.lower()) + r'(?![a-zA-Z0-9])'
        if re.search(pattern, text_lower):
            extracted_skills.append(skill)

    # 2. Experience Extraction
    exp_pattern = r'(\d+)\s*(?:\+|-|\s*to\s*\d+)?\s*(?:years?|yrs?)(?:\s+of)?\s+experience'
    exp_match = re.search(exp_pattern, text_lower)
    min_exp = 1
    if exp_match:
        try:
            min_exp = int(exp_match.group(1))
        except (ValueError, IndexError):
            min_exp = 1

    # Classify experience level
    if min_exp <= 2:
        exp_level = 'Entry Level'
    elif min_exp <= 5:
        exp_level = 'Mid Level'
    elif min_exp <= 8:
        exp_level = 'Senior Level'
    else:
        exp_level = 'Expert Level'

    # 3. Responsibilities Heuristic
    responsibilities = []
    lines = raw_text.split('\n')
    for line in lines:
        cleaned_line = line.strip('-•* \t\r')
        if len(cleaned_line) > 25 and any(kw in cleaned_line.lower() for kw in ['responsible', 'design', 'develop', 'build', 'collaborate', 'lead', 'maintain', 'optimize', 'ensure']):
            responsibilities.append(cleaned_line)
        if len(responsibilities) >= 5:
            break

    return {
        "extracted_skills": extracted_skills,
        "min_experience_years": min_exp,
        "experience_level": exp_level,
        "responsibilities": responsibilities,
        "word_count": len(text_clean.split())
    }