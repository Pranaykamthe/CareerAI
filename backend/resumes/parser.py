import os
import re
import docx
from PyPDF2 import PdfReader


class ResumeParser:
    """
    Deterministic extraction engine for PDF and DOCX resumes.
    Extracts raw text, identifies contact metadata, segments structural
    sections, and isolates candidate skills.
    """

    # Core technical and domain skill dictionary for matching
    SKILL_DATABASE = [
        # Programming Languages
        "python", "javascript", "typescript", "java", "c++", "c#", "c", "ruby", "php", 
        "swift", "kotlin", "go", "golang", "rust", "scala", "r", "dart", "sql", "html", "html5", "css", "css3",
        
        # Frameworks & Libraries
        "react", "react.js", "next.js", "vue", "vue.js", "angular", "node.js", "express", "express.js",
        "django", "django rest framework", "drf", "flask", "fastapi", "spring", "spring boot", 
        "asp.net", "laravel", "rails", "jquery", "bootstrap", "tailwind", "tailwind css",
        
        # Databases & Caching
        "postgresql", "postgres", "mysql", "sqlite", "mongodb", "redis", "elasticsearch",
        "cassandra", "dynamodb", "oracle", "firebase", "supabase",
        
        # Cloud, DevOps & Tools
        "aws", "amazon web services", "azure", "google cloud", "gcp", "docker", "kubernetes",
        "git", "github", "gitlab", "ci/cd", "jenkins", "linux", "nginx", "apache", "terraform",
        "ansible", "jira", "postman", "vite", "webpack",
        
        # AI / Data Science / ML
        "machine learning", "deep learning", "nlp", "computer vision", "tensorflow", "pytorch",
        "scikit-learn", "pandas", "numpy", "opencv", "data analysis", "artificial intelligence",
        
        # Methodologies & Soft Skills
        "agile", "scrum", "rest api", "restful apis", "graphql", "microservices", "unit testing",
        "system design", "object-oriented programming", "oop", "problem solving", "leadership", 
        "communication", "team collaboration", "critical thinking"
    ]

    COMMON_SECTIONS = {
        "summary": ["summary", "professional summary", "about me", "profile", "objective", "career objective"],
        "experience": ["experience", "work experience", "employment history", "work history", "internships"],
        "education": ["education", "academic background", "qualifications", "academics"],
        "skills": ["skills", "technical skills", "core competencies", "technologies", "proficiencies"],
        "projects": ["projects", "personal projects", "academic projects", "key projects"],
        "certifications": ["certifications", "certificates", "licenses", "courses"]
    }

    def __init__(self, file_path):
        self.file_path = file_path
        self.raw_text = ""
        self.cleaned_text = ""

    def extract_text(self):
        """Extracts text based on file extension."""
        ext = os.path.splitext(self.file_path)[1].lower()
        if ext == ".pdf":
            self.raw_text = self._extract_from_pdf()
        elif ext == ".docx":
            self.raw_text = self._extract_from_docx()
        else:
            raise ValueError(f"Unsupported file format: {ext}")
            
        self.cleaned_text = self._clean_text(self.raw_text)
        return self.raw_text

    def _extract_from_pdf(self):
        text_content = []
        try:
            reader = PdfReader(self.file_path)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_content.append(page_text)
        except Exception as e:
            raise RuntimeError(f"Error reading PDF file: {str(e)}")
        return "\n".join(text_content)

    def _extract_from_docx(self):
        try:
            doc = docx.Document(self.file_path)
            full_text = [para.text for para in doc.paragraphs if para.text.strip()]
            for table in doc.tables:
                for row in table.rows:
                    for cell in row.cells:
                        if cell.text.strip():
                            full_text.append(cell.text.strip())
            return "\n".join(full_text)
        except Exception as e:
            raise RuntimeError(f"Error reading DOCX file: {str(e)}")

    def _clean_text(self, text):
        """Normalizes whitespaces, removes non-printable characters."""
        text = re.sub(r'[\r\t]', ' ', text)
        text = re.sub(r'\n+', '\n', text)
        text = re.sub(r' +', ' ', text)
        return text.strip()

    def extract_contact_info(self):
        """Extracts candidate email, phone numbers, and web profiles."""
        email_pattern = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
        phone_pattern = r'(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}'
        linkedin_pattern = r'(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+'
        github_pattern = r'(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+'

        emails = re.findall(email_pattern, self.raw_text)
        phones = re.findall(phone_pattern, self.raw_text)
        linkedin = re.findall(linkedin_pattern, self.raw_text)
        github = re.findall(github_pattern, self.raw_text)

        cleaned_phones = []
        for p in re.finditer(phone_pattern, self.raw_text):
            val = p.group(0).strip()
            if len(re.sub(r'\D', '', val)) >= 10:
                cleaned_phones.append(val)

        return {
            "email": emails[0] if emails else None,
            "phone": cleaned_phones[0] if cleaned_phones else None,
            "linkedin": linkedin[0] if linkedin else None,
            "github": github[0] if github else None,
        }

    def extract_skills(self):
        """Identifies skills using boundary-safe regex matching."""
        found_skills = set()
        lowered_text = f" {self.cleaned_text.lower()} "

        for skill in self.SKILL_DATABASE:
            pattern = r'(?:^|[^a-zA-Z0-9])' + re.escape(skill) + r'(?:$|[^a-zA-Z0-9])'
            if re.search(pattern, lowered_text):
                found_skills.add(skill.title() if len(skill) > 4 else skill.upper())

        return sorted(list(found_skills))

    def segment_sections(self):
        """Splits resume text into recognized standard sections."""
        lines = [line.strip() for line in self.cleaned_text.split('\n') if line.strip()]
        sections = {k: [] for k in self.COMMON_SECTIONS.keys()}
        current_section = "summary"

        for line in lines:
            line_lower = line.lower().strip(':').strip()
            
            matched_header = None
            if len(line.split()) <= 4:
                for section_name, aliases in self.COMMON_SECTIONS.items():
                    if line_lower in aliases:
                        matched_header = section_name
                        break
            
            if matched_header:
                current_section = matched_header
            else:
                sections[current_section].append(line)

        return {k: "\n".join(v) for k, v in sections.items() if v}

    def parse(self):
        """Executes full parsing pipeline and returns structured data."""
        self.extract_text()
        return {
            "contact": self.extract_contact_info(),
            "skills": self.extract_skills(),
            "sections": self.segment_sections(),
            "word_count": len(self.cleaned_text.split()),
            "character_count": len(self.cleaned_text)
        }


def extract_resume_data(file_path, file_type=None):
    """
    Helper function expected by views.py.
    Initializes ResumeParser, runs parsing pipeline, and includes raw_text.
    """
    parser = ResumeParser(file_path)
    data = parser.parse()
    data['raw_text'] = parser.raw_text
    return data