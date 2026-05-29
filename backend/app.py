import logging
import os
from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
from anthropic import Anthropic

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


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    """Verify the server is up and the API key is loaded."""
    logger.debug("GET /health called")
    return jsonify({
        "status": "ok",
        "anthropic_key_loaded": bool(ANTHROPIC_API_KEY),
    })


@app.route("/test-claude", methods=["GET"])
def test_claude():
    """Send a minimal request to Claude to confirm the key and connection work."""
    logger.debug("GET /test-claude called")
    try:
        logger.info("Sending test prompt to Claude...")
        message = claude.messages.create(
            model="claude-opus-4-8",
            max_tokens=50,
            messages=[
                {"role": "user", "content": "Reply with exactly: API connection successful"}
            ],
        )
        reply = message.content[0].text
        logger.info("Claude responded: %s", reply)
        return jsonify({"status": "ok", "claude_reply": reply})
    except Exception as e:
        logger.error("Claude call failed: %s", e)
        return jsonify({"status": "error", "detail": str(e)}), 500


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    logger.info("Starting Flask dev server on http://127.0.0.1:5001")
    app.run(debug=True, port=5001)
