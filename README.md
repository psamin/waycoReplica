# Med-Legal Intake Dashboard

**Demo Video:** [Watch the YouTube Demo](https://youtu.be/o-id4jpo5ho)

An AI-powered operations tool that converts raw med-legal intake notes into structured case data, missing-information checks, follow-up tasks, and dashboard metrics — keeping a human in the loop through editable fields before anything is saved.

---

## Architecture

```
Browser (Next.js 16)
        │
        │  POST /api/cases/analyze
        │  (rewrites to :5001 via next.config.ts)
        ▼
Flask Backend (Python)
        │
        │  messages.parse()
        │  Pydantic schema validation
        ▼
Anthropic Claude API
```

The frontend never calls Claude directly. All AI requests go through the Flask backend, which owns prompt construction, schema validation, and error handling.

---

## Project Structure

```
waycoReplica/
├── backend/
│   └── app.py              # Flask API — all routes and Claude integration
└── frontend/
    ├── next.config.ts       # Rewrites /api/* → localhost:5001/*
    ├── src/
    │   ├── app/
    │   │   └── page.tsx     # Entry point (server component)
    │   ├── components/
    │   │   ├── Dashboard.tsx       # State management, API calls
    │   │   ├── IntakeForm.tsx      # Textarea + mic button (Web Speech API)
    │   │   ├── MetricsBar.tsx      # Completeness score, task counts
    │   │   └── CaseDashboard.tsx   # Editable case fields, missing info, tasks
    │   └── types/
    │       └── index.ts     # Shared TypeScript types
```

---

## Backend Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/health` | Server status + API key check |
| GET | `/test-claude` | Smoke test — verifies Claude connectivity |
| POST | `/cases/analyze` | Main workflow: intake notes → structured case data |

### `POST /cases/analyze`

**Input:**
```json
{ "intake_notes": "raw text or voice transcript" }
```

**Output:**
```json
{
  "status": "ok",
  "data": {
    "case_summary": { "client_name": null, "incident_date": "2025-04-12", ... },
    "missing_information": ["client_name", "insurance_info"],
    "follow_up_tasks": [{ "task": "...", "priority": "high", "status": "pending" }],
    "metrics": { "completeness_score": 65, "missing_fields": 3, ... }
  }
}
```

Claude extracts the structured fields using a Pydantic schema passed as `output_format`. Fields not present in the notes are returned as `null` rather than hallucinated.

---

## Data Flow

```
1. User pastes or speaks intake notes
2. Browser POSTs to /api/cases/analyze (proxied to Flask)
3. Flask sends notes to Claude with a system prompt + Pydantic schema
4. Claude returns structured JSON validated against the schema
5. Frontend renders editable fields pre-filled with extracted data
6. Staff reviews, edits any incorrect fields, marks tasks complete
```

Voice input uses the browser's built-in Web Speech API (`SpeechRecognition`) with `continuous: true` so staff can speak notes in any order — Claude reorganizes the content during extraction.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Backend | Python, Flask, Flask-CORS |
| AI | Anthropic Claude (`claude-opus-4-8`) via `messages.parse()` |
| Schema validation | Pydantic v2 |
| Voice input | Web Speech API (browser-native) |

---

## Running Locally

**Backend**
```bash
cd backend
source venv/bin/activate
pip install flask flask-cors anthropic pydantic python-dotenv
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env
python app.py
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

---

## Room for Improvement

### Wispr Flow Integration
The current voice input uses the browser's Web Speech API, which requires Chrome and sends audio through Google. A more reliable path for a production med-legal tool would be native integration with [Wispr Flow](https://www.flowvoice.ai/), which provides local macOS dictation with higher accuracy for medical and legal terminology. If Wispr Flow exposes a programmatic API or webhook, intake notes could be pushed directly to the backend as soon as dictation finishes — no browser required.

### Multi-Step AI Workflow with Test Cases and Rubric
The current system is a single Claude call. A more rigorous workflow would be:

```
Step 1: Extraction       — extract structured fields from raw notes
Step 2: Validation       — verify extracted data against known patterns
                            (e.g. date format, injury terminology)
Step 3: Completeness     — score against a rubric of required fields
                            per case type (auto, slip-and-fall, etc.)
Step 4: Task generation  — generate follow-up tasks weighted by
                            missing fields and case urgency
Step 5: Document draft   — generate legal document from validated data
```

Each step would have its own prompt, its own Pydantic schema, and its own test cases — making the pipeline testable and auditable rather than a single opaque AI call.

### Legal Document Generation (Downloadable PDF)
The natural endpoint of this workflow is generating a pre-filled legal document — a demand letter, lien acknowledgment, or medical records request — based on the validated case data. The document generation step would:

1. Take the validated `CaseAnalysis` as input
2. Apply a case-type-specific template
3. Score the draft against a rubric (completeness, required clauses, accuracy)
4. Iterate via Claude if the rubric is not satisfied
5. Render to PDF using a library like `WeasyPrint` or `pdfkit` on the backend
6. Return the PDF as a downloadable file from a `GET /cases/:id/document` endpoint

This turns the dashboard from an intake organizer into a full document generation pipeline — which is the core value of a med-legal operations tool.
