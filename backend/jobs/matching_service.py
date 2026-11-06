import re

def normalize_skill(skill):
    return skill.strip().lower()

def compute_job_match(resume, job, candidate_profile=None):
    """
    Computes deterministic compatibility score between a candidate's resume and a target job.
    Weights:
      - Skill Overlap: 50%
      - Experience Alignment: 30%
      - Keyword Overlap: 20%
    """
    # 1. Candidate Skills Collection
    candidate_skills = set()
    
    # Extract from parsed resume data
    if hasattr(resume, 'parsed_data') and isinstance(resume.parsed_data, dict):
        skills_from_resume = resume.parsed_data.get('skills', [])
        for s in skills_from_resume:
            candidate_skills.add(normalize_skill(s))
            
    # Extract from resume analysis if present
    if hasattr(resume, 'analysis') and resume.analysis and resume.analysis.extracted_skills:
        for s in resume.analysis.extracted_skills:
            candidate_skills.add(normalize_skill(s))
            
    # Fallback/augmentation from candidate profile
    if candidate_profile and candidate_profile.skills_list:
        for s in candidate_profile.skills_list:
            candidate_skills.add(normalize_skill(s))

    # 2. Skill Overlap Calculation (50% Weight)
    req_skills = [normalize_skill(s) for s in (job.required_skills or [])]
    pref_skills = [normalize_skill(s) for s in (job.preferred_skills or [])]

    matched_req = [s for s in req_skills if s in candidate_skills]
    missing_req = [s for s in req_skills if s not in candidate_skills]
    matched_pref = [s for s in pref_skills if s in candidate_skills]

    if req_skills:
        base_skill_pct = (len(matched_req) / len(req_skills)) * 100
        # Bonus for preferred skills (up to 15% extra bonus capped at 100)
        pref_bonus = (len(matched_pref) / len(pref_skills) * 15) if pref_skills else 0
        skill_score = min(int(base_skill_pct + pref_bonus), 100)
    else:
        skill_score = 75  # Default baseline if job has no explicit required skills tag

    # 3. Experience Alignment Calculation (30% Weight)
    cand_exp_years = 0.0
    if candidate_profile and candidate_profile.experience_years:
        try:
            cand_exp_years = float(candidate_profile.experience_years)
        except (ValueError, TypeError):
            cand_exp_years = 0.0
    elif hasattr(resume, 'parsed_data') and isinstance(resume.parsed_data, dict):
        exp_entries = resume.parsed_data.get('sections', {}).get('experience', [])
        cand_exp_years = max(len(exp_entries) * 1.5, 1.0) if exp_entries else 1.0

    min_req_years = float(job.min_experience_years or 1)
    if cand_exp_years >= min_req_years:
        experience_score = 100
    elif cand_exp_years == 0:
        experience_score = 40
    else:
        experience_score = max(int((cand_exp_years / min_req_years) * 100), 40)

    # 4. Keyword Overlap Calculation (20% Weight)
    resume_text = (getattr(resume, 'raw_text', '') or '').lower()
    job_text = (job.description or '').lower()

    # Extract distinct alphanumeric tokens (length >= 4)
    job_words = set(re.findall(r'\b[a-z]{4,}\b', job_text))
    # Remove common filler words
    stopwords = {'with', 'this', 'that', 'from', 'have', 'will', 'your', 'about', 'team', 'work', 'years', 'role'}
    meaningful_job_words = job_words - stopwords

    if meaningful_job_words and resume_text:
        overlapping_words = [w for w in meaningful_job_words if w in resume_text]
        keyword_score = min(int((len(overlapping_words) / len(meaningful_job_words)) * 100), 100)
    else:
        keyword_score = 50

    # 5. Composite Weighted Score
    final_score = int(
        (skill_score * 0.50) +
        (experience_score * 0.30) +
        (keyword_score * 0.20)
    )
    final_score = max(10, min(final_score, 99))  # Bound between 10% and 99%

    # Match Level classification
    if final_score >= 80:
        match_level = 'High Match'
    elif final_score >= 60:
        match_level = 'Moderate Match'
    else:
        match_level = 'Low Match'

    # Human-readable summary
    summary = (
        f"Matches {len(matched_req)} of {len(req_skills)} mandatory skills. "
        f"Candidate experience ({cand_exp_years:.1f} yrs) evaluated against {min_req_years:.0f} yrs target requirement."
    )

    return {
        'match_score': final_score,
        'skill_score': skill_score,
        'experience_score': experience_score,
        'keyword_score': keyword_score,
        'matched_skills': [s.title() for s in matched_req],
        'missing_skills': [s.title() for s in missing_req],
        'preferred_matched_skills': [s.title() for s in matched_pref],
        'match_level': match_level,
        'summary': summary,
        'candidate_experience': cand_exp_years,
        'required_experience': min_req_years,
    }