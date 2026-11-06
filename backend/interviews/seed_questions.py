from .models import QuestionBank

DEFAULT_QUESTIONS = [
    # --- TECHNICAL ---
    {
        "category": "Technical",
        "role_target": "Python / Django Developer",
        "difficulty": "Easy",
        "question_text": "Explain the difference between mutable and immutable types in Python with practical examples.",
        "ideal_points": [
            "Definition of mutability (in-place modification vs creating new objects in memory).",
            "Examples of immutable types: int, float, str, tuple, frozenset.",
            "Examples of mutable types: list, dict, set.",
            "Passing mutable objects as default function arguments pitfall."
        ],
        "sample_answer": "In Python, an object is mutable if its internal state or contents can be modified after creation without altering its identity (memory address `id()`). Lists, dictionaries, and sets are mutable. An immutable object cannot be altered once instantiated; any modification creates a completely new object. Strings, integers, floats, and tuples are immutable. A common mistake occurs when using mutable defaults like `def append_to(val, arr=[])`, which reuses the same list across invocations."
    },
    {
        "category": "Technical",
        "role_target": "Full Stack Developer",
        "difficulty": "Medium",
        "question_text": "What is the N+1 database queries problem in Django ORM and how do `select_related` and `prefetch_related` resolve it?",
        "ideal_points": [
            "Root cause: Iterating over N objects and executing an additional database query for each related record.",
            "select_related: Performs an SQL JOIN; best for ForeignKey and OneToOne (single-valued relationships).",
            "prefetch_related: Executes a separate query with an IN clause; best for ManyToMany and reverse ForeignKey relationships.",
            "Performance impact on latency and database connection pool."
        ],
        "sample_answer": "The N+1 problem occurs when an application executes 1 initial query to fetch N parent records, and subsequently triggers N separate SQL queries to fetch related child records inside a loop. In Django ORM, `select_related` solves this by issuing an SQL JOIN in a single query, suitable for single-valued relationships like ForeignKey and OneToOne. For ManyToMany or reverse relationships, `prefetch_related` executes two queries in batch and performs the lookup in Python memory, drastically cutting database round-trips."
    },
    {
        "category": "Technical",
        "role_target": "Frontend Engineer / React",
        "difficulty": "Medium",
        "question_text": "Explain the React Component Lifecycle in Functional Components using the `useEffect` hook.",
        "ideal_points": [
            "Mounting phase: empty dependency array `[]` runs once after paint.",
            "Updating phase: dependencies listed `[dep1, dep2]` trigger re-runs when values change.",
            "Unmounting / Cleanup: returning a cleanup function to prevent memory leaks and teardown subscriptions/timers."
        ],
        "sample_answer": "`useEffect` combines mounting, updating, and unmounting into a single unified API. Passing an empty dependency array `[]` runs the effect once after the component mounts. Omitting the dependency array causes the effect to execute after every render. Adding specific state or prop variables re-runs the effect only when those dependencies change. Returning a cleanup function from the callback handles unmounting and cleanup before the next execution, ideal for cancelling HTTP requests or clearing timers."
    },
    {
        "category": "Technical",
        "role_target": "Backend Engineer",
        "difficulty": "Hard",
        "question_text": "How do database indexes work (B-Tree structure), and what trade-offs do they introduce during high-write workloads?",
        "ideal_points": [
            "B-Tree / B+Tree structure provides logarithmic search time O(log N).",
            "Speed up SELECT queries with WHERE, JOIN, and ORDER BY clauses.",
            "Trade-offs: Slower INSERT, UPDATE, and DELETE operations due to index tree re-balancing.",
            "Additional disk storage and buffer pool memory overhead."
        ],
        "sample_answer": "Database indexes operate predominantly on balanced tree (B-Tree) data structures that keep keys sorted and allow binary search in O(log N) time instead of full table scans O(N). While indexes dramatically accelerate reading operations (such as WHERE, JOIN, and ORDER BY clauses), they introduce overhead during writes: every INSERT, UPDATE, or DELETE must re-balance nodes, split pages, and update the index tree on disk. Consequently, over-indexing tables impairs write throughput and increases disk footprint."
    },

    # --- HR & CULTURE ---
    {
        "category": "HR",
        "role_target": "General",
        "difficulty": "Easy",
        "question_text": "Tell me about yourself and walk me through your career journey so far.",
        "ideal_points": [
            "Present: Current role, primary skills, and notable technical achievements.",
            "Past: Educational background and key milestone projects.",
            "Future: Why you are interested in this specific role and organization."
        ],
        "sample_answer": "I am a software engineer focused on building robust full-stack applications with Python, Django, and React. Recently, I built an end-to-end career assistance platform that handles automated resume parsing and intelligent job matching. Prior to that, I graduated with an engineering background where I sharpened my problem-solving and algorithmic foundations. I am eager to bring my practical full-stack experience to your team, where I can build scalable features and continue learning from senior engineers."
    },
    {
        "category": "HR",
        "role_target": "General",
        "difficulty": "Easy",
        "question_text": "Why do you want to join our organization specifically?",
        "ideal_points": [
            "Demonstrate concrete knowledge of company mission, culture, or recent products.",
            "Align company engineering challenges with personal career aspirations.",
            "Avoid generic answers like 'good salary' or 'famous brand'."
        ],
        "sample_answer": "I have been following your engineering team's work on scalable distributed systems and developer tooling. Your commitment to high-quality code reviews, collaborative problem solving, and modern CI/CD practices directly aligns with how I like to build software. I am excited to contribute to a product that directly impacts thousands of users while advancing my architectural skills."
    },
    {
        "category": "HR",
        "role_target": "General",
        "difficulty": "Medium",
        "question_text": "Where do you see yourself professionally in the next 3 to 5 years?",
        "ideal_points": [
            "Growth in technical depth and system design responsibility.",
            "Earning mentorship and leadership opportunities.",
            "Demonstrating commitment to continuous professional growth."
        ],
        "sample_answer": "Over the next three to five years, I aim to master distributed backend architecture and cloud deployment practices, transitioning from executing feature specifications to driving architectural decisions. I also want to mentor junior engineers, conduct code reviews, and help lead core platform initiatives."
    },

    # --- BEHAVIORAL (STAR) ---
    {
        "category": "Behavioral",
        "role_target": "General Software Engineer",
        "difficulty": "Medium",
        "question_text": "Describe a situation where you had a disagreement with a team member over a technical decision. How did you resolve it?",
        "ideal_points": [
            "Situation & Task: Context of the technical disagreement (e.g., choice of library or database schema).",
            "Action: Kept communication objective, backed arguments with data/benchmarks, and listened actively.",
            "Result: Reached a consensus without friction; delivered the milestone successfully."
        ],
        "sample_answer": "During a group project, a teammate wanted to use MongoDB for relational user and invoice tracking, while I advocated for PostgreSQL. Rather than arguing subjectively, I created a quick prototype benchmarking schema joins and transactional integrity. We reviewed the criteria together: our data had strict relational constraints and required ACID compliance, which PostgreSQL offered natively. We collectively agreed on PostgreSQL, avoiding data anomalies later in development."
    },
    {
        "category": "Behavioral",
        "role_target": "General Software Engineer",
        "difficulty": "Hard",
        "question_text": "Give an example of a time when a critical bug occurred in production or before a major demo. How did you handle it?",
        "ideal_points": [
            "Composure under pressure and systematic root cause analysis.",
            "Immediate mitigation (hotfix, rollback, or graceful fallback).",
            "Long-term preventive measures (unit tests, logging, or monitoring)."
        ],
        "sample_answer": "Right before an academic demo, an unhandled NullPointerException occurred during document uploads whenever a candidate submitted a file without optional phone fields. Rather than panicking, I inspected the Django server logs to locate the exact trace, implemented fallback dictionary `.get('phone', '')` checks in the serializer, verified the upload workflow locally, and pushed a patch. Following the demo, I added unit tests covering sparse document scenarios to prevent regression."
    },

    # --- PROJECT-BASED ---
    {
        "category": "Project-based",
        "role_target": "Full Stack Engineer",
        "difficulty": "Medium",
        "question_text": "Can you walk through the high-level architecture of your most challenging project and explain how data flows through it?",
        "ideal_points": [
            "Clear separation of concerns: Client SPA, REST API backend, and relational database.",
            "Security mechanisms: JWT tokens in Authorization headers, CORS restrictions, and input validation.",
            "Handling file uploads and asynchronous or computational operations."
        ],
        "sample_answer": "In CareerAI, the frontend is built in React as a Single Page Application communicating over REST APIs with a Django REST Framework backend. When a candidate uploads a resume, the document is sent via `multipart/form-data` to a guarded endpoint. Django validates the MIME type and size, stores the file securely, and invokes a parsing pipeline using PyPDF2 to extract structured text and skills. Matching results are computed via weighted algorithms and returned as JSON to update React dashboards."
    },
    {
        "category": "Project-based",
        "role_target": "Backend / AI Engineer",
        "difficulty": "Hard",
        "question_text": "How did you design fault tolerance and handle potential rate-limiting or downtime when integrating external third-party services in your project?",
        "ideal_points": [
            "Pluggable service layer (adapter pattern) isolating provider-specific code.",
            "Local deterministic fallback engine when API calls time out or exceed quota.",
            "Preserving user state and submitted data during exceptions."
        ],
        "sample_answer": "I designed an abstract BaseLLMService interface that wraps provider calls. If an external API reaches rate limits, times out, or disconnects, the exception is caught safely and routed to an internal deterministic evaluation engine. This heuristic evaluator inspects length, keyword density, and clarity to generate scoring and feedback. The candidate's submitted answer is always safely persisted in the database so progress is never lost."
    }
]

def seed_default_questions():
    created_count = 0
    for q_data in DEFAULT_QUESTIONS:
        obj, created = QuestionBank.objects.get_or_update(
            question_text=q_data["question_text"],
            defaults={
                "category": q_data["category"],
                "role_target": q_data["role_target"],
                "difficulty": q_data["difficulty"],
                "ideal_points": q_data["ideal_points"],
                "sample_answer": q_data["sample_answer"],
                "is_active": True,
            }
        ) if hasattr(QuestionBank.objects, 'get_or_update') else (None, False)

        if not obj:
            existing = QuestionBank.objects.filter(question_text=q_data["question_text"]).first()
            if not existing:
                QuestionBank.objects.create(**q_data)
                created_count += 1
            else:
                existing.category = q_data["category"]
                existing.role_target = q_data["role_target"]
                existing.difficulty = q_data["difficulty"]
                existing.ideal_points = q_data["ideal_points"]
                existing.sample_answer = q_data["sample_answer"]
                existing.save()
    return created_count