import logging
import os
from typing import List, Optional
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from anthropic import Anthropic
from pydantic import BaseModel

# ── Environment ──────────────────────────────────────────────────────────────
load_dotenv()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
if not ANTHROPIC_API_KEY:
    raise RuntimeError("ANTHROPIC_API_KEY is not set in .env")

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("medlegal")

# ── Anthropic client ──────────────────────────────────────────────────────────
claude = Anthropic(api_key=ANTHROPIC_API_KEY)
logger.info("Anthropic client initialized")

# ── Flask app ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)
logger.info("Flask app created with CORS enabled")


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class CaseSummary(BaseModel):
    client_name: Optional[str]
    incident_date: Optional[str]
    incident_type: Optional[str]
    injuries: List[str]
    providers: List[str]
    treatment_status: Optional[str]
    insurance_info: Optional[str]
    case_status: str


class FollowUpTask(BaseModel):
    task: str
    priority: str   # "low" | "medium" | "high"
    status: str     # "pending" | "completed"


class Metrics(BaseModel):
    completeness_score: int   # 0-100
    missing_fields: int
    generated_tasks: int
    high_priority_tasks: int
    providers_found: int


class CaseAnalysis(BaseModel):
    case_summary: CaseSummary
    missing_information: List[str]
    follow_up_tasks: List[FollowUpTask]
    metrics: Metrics


# ── System prompt ─────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are a med-legal intake specialist AI.

Your job is to analyze raw intake notes and extract structured case information.

Rules:
- Set any field to null if the information is not mentioned in the notes
- injuries and providers must be arrays (empty array if none found)
- completeness_score is 0-100 based on how many key fields are present
- priority is one of: low, medium, high
- status for all generated tasks is always: pending
- case_status should be one of: needs_follow_up, in_progress, complete
- missing_information should list specific field names that are null or unknown
"""


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    logger.debug("GET /health called")
    return jsonify({"status": "ok", "anthropic_key_loaded": bool(ANTHROPIC_API_KEY)})


@app.route("/test-claude", methods=["GET"])
def test_claude():
    logger.debug("GET /test-claude called")
    try:
        logger.info("Sending test prompt to Claude...")
        message = claude.messages.create(
            model="claude-opus-4-8",
            max_tokens=50,
            messages=[{"role": "user", "content": "Reply with exactly: API connection successful"}],
        )
        reply = message.content[0].text
        logger.info("Claude responded: %s", reply)
        return jsonify({"status": "ok", "claude_reply": reply})
    except Exception as e:
        logger.error("Claude call failed: %s", e)
        return jsonify({"status": "error", "detail": str(e)}), 500


@app.route("/cases/analyze", methods=["POST"])
def analyze_case():
    # ── Step 1: Validate input ────────────────────────────────────────────────
    logger.debug("POST /cases/analyze called")
    data = request.get_json(silent=True)

    if not data or not data.get("intake_notes", "").strip():
        logger.warning("Request missing intake_notes")
        return jsonify({"status": "error", "detail": "intake_notes is required"}), 400

    intake_notes = data["intake_notes"].strip()
    logger.info("Received intake notes (%d chars)", len(intake_notes))

    # ── Step 2: Call Claude with structured output ────────────────────────────
    try:
        logger.info("Sending intake notes to Claude for extraction...")

        response = claude.messages.parse(
            model="claude-opus-4-8",
            max_tokens=2048,
            system=SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": f"Analyze these med-legal intake notes and return structured data:\n\n{intake_notes}",
                }
            ],
            output_format=CaseAnalysis,
        )

        logger.info("Claude responded — stop_reason: %s", response.stop_reason)

    except Exception as e:
        logger.error("Claude API call failed: %s", e)
        return jsonify({"status": "error", "detail": str(e)}), 500

    # ── Step 3: Validate parsed output ───────────────────────────────────────
    result: CaseAnalysis = response.parsed_output

    if result is None:
        logger.error("Claude returned a refusal or could not parse the notes")
        return jsonify({"status": "error", "detail": "Claude could not parse the intake notes"}), 422

    logger.info(
        "Extraction complete — completeness: %d%%, missing fields: %d, tasks: %d",
        result.metrics.completeness_score,
        result.metrics.missing_fields,
        result.metrics.generated_tasks,
    )

    # ── Step 4: Return structured response ───────────────────────────────────
    return jsonify({
        "status": "ok",
        "data": result.model_dump(),
    })


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    logger.info("Starting Flask dev server on http://127.0.0.1:5001")
    app.run(debug=True, port=5001)
