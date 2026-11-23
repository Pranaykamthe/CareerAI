# CareerAI — AI Resume & Job Matching Platform with AI Mock Interview System

CareerAI is a full-stack career readiness web application that helps job seekers parse and score resumes against ATS criteria, build AI-optimized resumes, generate tailored cover letters, match with suitable jobs, identify skill gaps, track applications on a Kanban board, and practice AI-evaluated mock interviews.

---

## Tech Stack

- **Frontend:** React.js, HTML5, CSS3, Bootstrap 5, Chart.js, Axios
- **Backend:** Python, Django, Django REST Framework (DRF)
- **Authentication & Security:** JSON Web Tokens (SimpleJWT) with Candidate & Admin role access, plus DRF `UserRateThrottle` (30 requests/hour on AI endpoints)
- **Database:** SQLite (via Django ORM)
- **Document & Image Processing:** PyPDF2, python-docx, Pillow
- **AI Integration:** Groq Cloud LLM API with deterministic local fallback scoring

---

## Key Features

- **Resume Management & Parsing:** Upload `.pdf` and `.docx` resumes to extract contact info, skills, and sections automatically.
- **ATS Resume Analyzer:** Get an overall 0–100 ATS score, breakdown metrics, strengths, weaknesses, and actionable improvement tips.
- **AI Resume Builder & One-Click Tailoring:** Build and edit resumes with live A4 preview, Groq AI section improvements, automated ATS issue fixes, direct job-to-resume skill tailoring, and `.docx` export.
- **AI Cover Letter Generator:** Generate role-specific cover letters tailored to your resume and target job description using Groq AI.
- **Smart Profile & Groq Resume Auto-Fill:** Upload a resume to auto-populate profile details (headline, summary, skills, education, experience) and manage Candidate/Admin profile photos.
- **Smart Job Matching & Skill Gap Analysis:** Calculate weighted compatibility scores (50% skill overlap, 30% experience alignment, 20% keyword match) and view matched vs. missing skills. Admin-created jobs are public, while external job descriptions pasted by candidates remain private to their account.
- **Application Tracker:** Track job applications across 6 Kanban stages (Saved, Applied, Screening, Interview, Offer, Rejected).
- **AI Mock Interview & Prep Hub:** Practice Technical, HR, and Behavioral (STAR) interviews with instant AI feedback and detailed post-interview reports.
- **Global Command Palette (`Ctrl+K` / `⌘K`):** Quickly search and jump across saved jobs, resumes, applications, and interview sessions from anywhere in the app.
- **Candidate & Admin Dashboards:** View personal readiness analytics or manage platform users, jobs, and question banks as an admin.

---

## Prerequisites

- Python 3.10+
- Node.js 18+ and npm
- Groq API Key *(optional — the built-in deterministic fallback engine handles offline scoring if no key is provided)*

---

## Setup & Installation

### 1. Clone the Repository

    git clone https://github.com/<your-username>/CareerAI.git
    cd CareerAI

### 2. Backend Setup (Django)

Open a terminal in the project root and run:

    python -m venv venv

Activate the virtual environment:

- **Windows (PowerShell):**

    .\venv\Scripts\Activate.ps1

- **macOS / Linux:**

    source venv/bin/activate

Install Python dependencies:

    pip install -r backend/requirements.txt

Create a `.env` file inside the `backend/` folder (or copy `backend/.env.example`) and add:

    SECRET_KEY=django-insecure-careerai-development-key
    DEBUG=True
    ALLOWED_HOSTS=localhost,127.0.0.1
    CORS_ALLOWED_ORIGINS=http://localhost:3000
    GROQ_API_KEY=your_groq_api_key_here

Run migrations, seed the demo data, and start the backend server:

    cd backend
    python manage.py migrate
    python seed_demo.py
    python manage.py runserver 8000

### 3. Frontend Setup (React)

Open a second terminal in the project root and run:

    cd frontend
    npm install
    npm start

The application will open at `http://localhost:3000`.

---

## Demo Login Credentials

- **Candidate Login (`http://localhost:3000/login`):**
  - Email: `demo@careerai.com`
  - Password: `DemoPassword123!`

- **Admin Login (`http://localhost:3000/admin-login`):**
  - Email: `admin@careerai.com`
  - Password: `AdminPassword123!`

---

## Running Backend Tests

    cd backend
    python manage.py test core

---

## Core API Endpoints

- **Health Check:** `GET /api/health/`
- **Register & Login:** `POST /api/auth/register/` | `POST /api/auth/login/`
- **Candidate & Admin Profile:** `GET, PUT /api/auth/profile/` | `POST, DELETE /api/auth/profile/photo/`
- **Resumes & ATS Analysis:** `GET, POST /api/resumes/` | `POST /api/resumes/<id>/analyze/`
- **Groq Resume-to-Profile Auto-Fill:** `POST /api/resumes/autofill-profile/`
- **AI Resume Builder:** `GET, POST /api/resumes/builder/` | `POST /api/resumes/builder/ai-improve/` | `POST /api/resumes/builder/auto-fix-ats/` | `POST /api/resumes/builder/export-docx/`
- **AI Cover Letter Generator:** `POST /api/resumes/cover-letter/`
- **Jobs & Matching:** `GET, POST /api/jobs/` | `POST /api/jobs/match/`
- **Application Tracker & Skill Gaps:** `GET, POST /api/applications/` | `GET /api/applications/gap/<job_id>/`
- **Mock Interviews & Reports:** `POST /api/interviews/sessions/start/` | `GET /api/interviews/sessions/<id>/report/`
- **Dashboards:** `GET /api/dashboard/candidate/` | `GET /api/dashboard/admin/overview/`