# CareerAI — AI Resume & Job Matching Platform with AI Mock Interview System

CareerAI is a full-stack career readiness web application that helps job seekers parse and score resumes against ATS criteria, build AI-optimized resumes, match with suitable jobs, identify skill gaps, track applications on a Kanban board, and practice AI-evaluated mock interviews.

---

## Tech Stack

- **Frontend:** React.js, HTML5, CSS3, Bootstrap 5, Chart.js, Axios
- **Backend:** Python, Django, Django REST Framework (DRF)
- **Authentication:** JSON Web Tokens (SimpleJWT) with Candidate & Admin role access
- **Database:** SQLite (via Django ORM)
- **Document & Image Processing:** PyPDF2, python-docx, Pillow
- **AI Integration:** Groq Cloud LLM API with deterministic local fallback scoring

---

## Key Features

- **Resume Management & Parsing:** Upload `.pdf` and `.docx` resumes, extract contact info, skills, and sections automatically.
- **ATS Resume Analyzer:** Get an overall ATS score, breakdown metrics, strengths, weaknesses, and improvement tips.
- **AI Resume Builder:** Build and edit resumes with live A4 preview, Groq AI section improvements, automated ATS issue fixes, and `.docx` export.
- **Smart Profile & Groq Resume Auto-Fill:** Upload a resume to auto-populate profile details (headline, summary, skills, education, experience) and manage Candidate/Admin profile photos.
- **Smart Job Matching & Skill Gap Analysis:** Calculate compatibility percentages against job postings and view matched vs. missing skills.
- **Application Tracker:** Track job applications across stages (Saved, Applied, Screening, Interview, Offer, Rejected).
- **AI Mock Interview & Prep Hub:** Practice Technical, HR, and Behavioral (STAR) interviews with instant AI feedback and detailed post-interview reports.
- **Candidate & Admin Dashboards:** View personal readiness analytics or manage platform users, jobs, and question banks as an admin.

---

## Setup & Installation

### 1. Clone the Repository

    git clone https://github.com/<your-username>/CareerAI.git
    cd CareerAI

### 2. Backend Setup (Django)

Open a terminal in the project root and run:

    python -m venv venv
    .\venv\Scripts\Activate.ps1
    pip install -r backend/requirements.txt
    pip install Pillow

Create a `.env` file inside the `backend/` folder and add:

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
- **AI Resume Builder:** `GET, POST /api/resumes/builder/` | `POST /api/resumes/builder/ai-improve/` | `POST /api/resumes/builder/export-docx/`
- **Jobs & Matching:** `GET, POST /api/jobs/` | `POST /api/jobs/match/`
- **Application Tracker:** `GET, POST /api/applications/`
- **Mock Interviews & Reports:** `POST /api/interviews/sessions/start/` | `GET /api/interviews/sessions/<id>/report/`
- **Dashboards:** `GET /api/dashboard/candidate/` | `GET /api/dashboard/admin/overview/`