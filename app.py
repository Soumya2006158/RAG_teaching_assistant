import os
import json
import math
import re
import requests

from pathlib import Path
from flask import Flask, request, jsonify, render_template_string

# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
JSON_DIR = BASE_DIR / "jsons"

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
EMBED_MODEL = os.getenv("EMBED_MODEL", "bge-m3")
LLM_MODEL = os.getenv("LLM_MODEL", "llama3.2")

app = Flask(__name__)

# Loaded transcript chunks + embeddings
CHUNKS = []
EMBEDDINGS = []

# Simple session-like progress for this local application
QUIZ_HISTORY = []


# ============================================================
# UTILITY FUNCTIONS
# ============================================================

def clean_text(text):
    if text is None:
        return ""

    if isinstance(text, str):
        return text.strip()

    if isinstance(text, dict):
        for key in [
            "text",
            "content",
            "chunk",
            "transcript",
            "transcription",
            "sentence"
        ]:
            value = text.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()

        return " ".join(
            str(v) for v in text.values()
            if isinstance(v, (str, int, float))
        ).strip()

    return str(text).strip()


def extract_chunks_from_json(data, filename):
    """
    Supports your current JSON structure:

    {
        "chunks": [
            {
                "number": "1",
                "title": "videoplayback (1)",
                "start": 0.0,
                "end": 9.6,
                "text": "..."
            }
        ]
    }
    """

    result = []

    if isinstance(data, dict):
        raw_chunks = data.get("chunks", [])

        if isinstance(raw_chunks, list):
            for index, chunk in enumerate(raw_chunks):

                if isinstance(chunk, dict):
                    text = clean_text(chunk)

                    if not text:
                        continue

                    result.append({
                        "id": f"{filename}_{index}",
                        "source": filename,
                        "number": chunk.get("number", index + 1),
                        "title": chunk.get(
                            "title",
                            Path(filename).stem
                        ),
                        "start": chunk.get("start"),
                        "end": chunk.get("end"),
                        "text": text
                    })

                elif isinstance(chunk, str):
                    result.append({
                        "id": f"{filename}_{index}",
                        "source": filename,
                        "number": index + 1,
                        "title": Path(filename).stem,
                        "start": None,
                        "end": None,
                        "text": chunk.strip()
                    })

    elif isinstance(data, list):
        for index, item in enumerate(data):

            text = clean_text(item)

            if text:
                result.append({
                    "id": f"{filename}_{index}",
                    "source": filename,
                    "number": index + 1,
                    "title": Path(filename).stem,
                    "start": None,
                    "end": None,
                    "text": text
                })

    return result


# ============================================================
# LOAD JSON TRANSCRIPTS
# ============================================================

def load_transcripts():
    global CHUNKS

    CHUNKS = []

    if not JSON_DIR.exists():
        print("JSON directory does not exist:")
        print(JSON_DIR)
        return

    files = sorted(JSON_DIR.glob("*.json"))

    print(f"JSON directory: {JSON_DIR}")
    print(f"Found {len(files)} JSON files")

    for json_file in files:
        try:
            with open(
                json_file,
                "r",
                encoding="utf-8"
            ) as f:
                data = json.load(f)

            chunks = extract_chunks_from_json(
                data,
                json_file.name
            )

            CHUNKS.extend(chunks)

            print(
                f"Loaded {json_file.name}: "
                f"{len(chunks)} chunks"
            )

        except Exception as e:
            print(
                f"Could not load {json_file.name}: {e}"
            )

    print(
        f"Total transcript chunks loaded: {len(CHUNKS)}"
    )


# ============================================================
# OLLAMA EMBEDDINGS
# ============================================================

def create_embeddings(texts):
    """
    Uses Ollama's /api/embed endpoint.

    BGE-M3 supports multiple inputs in one request.
    """

    if not texts:
        return []

    try:
        response = requests.post(
            f"{OLLAMA_URL}/api/embed",
            json={
                "model": EMBED_MODEL,
                "input": texts
            },
            timeout=300
        )

        response.raise_for_status()

        data = response.json()

        embeddings = data.get("embeddings")

        if embeddings:
            return embeddings

        # Compatibility with older Ollama endpoint
        if "embedding" in data:
            return [data["embedding"]]

        raise RuntimeError(
            "Ollama did not return embeddings."
        )

    except Exception as e:
        print("Embedding error:", e)
        raise


def build_embedding_index():
    global EMBEDDINGS

    EMBEDDINGS = []

    if not CHUNKS:
        print("No chunks available for embedding.")
        return

    print(
        f"Creating embeddings for "
        f"{len(CHUNKS)} chunks..."
    )

    # Process in batches to avoid very large requests
    batch_size = 32

    for start in range(
        0,
        len(CHUNKS),
        batch_size
    ):
        batch = CHUNKS[
            start:start + batch_size
        ]

        texts = [
            chunk["text"]
            for chunk in batch
        ]

        embeddings = create_embeddings(texts)

        EMBEDDINGS.extend(embeddings)

        print(
            f"Embedded "
            f"{min(start + batch_size, len(CHUNKS))}"
            f"/{len(CHUNKS)}"
        )

    print(
        f"Embedding index ready: "
        f"{len(EMBEDDINGS)} vectors"
    )


# ============================================================
# VECTOR SEARCH
# ============================================================

def cosine_similarity(a, b):
    if not a or not b:
        return 0.0

    length = min(len(a), len(b))

    dot = 0.0
    norm_a = 0.0
    norm_b = 0.0

    for i in range(length):
        x = float(a[i])
        y = float(b[i])

        dot += x * y
        norm_a += x * x
        norm_b += y * y

    if norm_a == 0 or norm_b == 0:
        return 0.0

    return dot / (
        math.sqrt(norm_a) *
        math.sqrt(norm_b)
    )


def retrieve(query, top_k=5):
    if not CHUNKS or not EMBEDDINGS:
        return []

    query_embedding = create_embeddings([query])[0]

    scores = []

    for index, embedding in enumerate(EMBEDDINGS):

        if index >= len(CHUNKS):
            break

        score = cosine_similarity(
            query_embedding,
            embedding
        )

        scores.append({
            "chunk": CHUNKS[index],
            "score": score
        })

    scores.sort(
        key=lambda x: x["score"],
        reverse=True
    )

    return scores[:top_k]


# ============================================================
# LLM GENERATION
# ============================================================

def generate_llm(prompt, temperature=0.2):
    try:
        response = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": LLM_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": temperature
                }
            },
            timeout=300
        )

        response.raise_for_status()

        data = response.json()

        return data.get(
            "response",
            ""
        ).strip()

    except Exception as e:
        print("LLM error:", e)

        raise RuntimeError(
            f"Could not generate response from Ollama: {e}"
        )


# ============================================================
# RAG ANSWERING
# ============================================================

def answer_question(question):
    results = retrieve(
        question,
        top_k=5
    )

    if not results:
        return {
            "answer": (
                "I could not find any transcript "
                "chunks to answer this question."
            ),
            "sources": []
        }

    context_parts = []

    for item in results:
        chunk = item["chunk"]

        context_parts.append(
            f"""
Source: {chunk['source']}
Chunk: {chunk['number']}
Timestamp: {chunk.get('start')} - {chunk.get('end')}

Transcript:
{chunk['text']}
"""
        )

    context = "\n".join(context_parts)

    prompt = f"""
You are an AI Teaching Assistant.

Answer the student's question using ONLY the
provided lecture transcript context.

If the answer is not supported by the transcript,
clearly say that the information is not available
in the provided lecture material.

Do not invent facts.

Explain the answer clearly and in a student-friendly
manner.

Student question:
{question}

Lecture transcript context:
{context}

Answer:
"""

    answer = generate_llm(
        prompt,
        temperature=0.2
    )

    sources = []

    for item in results:
        chunk = item["chunk"]

        sources.append({
            "source": chunk["source"],
            "chunk": chunk["number"],
            "title": chunk["title"],
            "start": chunk.get("start"),
            "end": chunk.get("end"),
            "score": round(
                item["score"],
                4
            ),
            "text": chunk["text"]
        })

    return {
        "answer": answer,
        "sources": sources
    }


# ============================================================
# QUIZ GENERATOR
# ============================================================

def generate_quiz(
    number_of_questions=5,
    difficulty="medium"
):

    if not CHUNKS:
        raise RuntimeError(
            "No lecture transcript chunks are loaded."
        )

    # Use a representative selection of chunks.
    #
    # This keeps the prompt from becoming excessively large.
    max_context_chunks = min(
        len(CHUNKS),
        20
    )

    selected_chunks = CHUNKS[
        :max_context_chunks
    ]

    context = "\n\n".join(
        chunk["text"]
        for chunk in selected_chunks
    )

    prompt = f"""
You are an educational quiz generator.

Generate exactly {number_of_questions}
multiple-choice questions from the lecture
transcript below.

Difficulty:
{difficulty}

Rules:

1. Questions must be based ONLY on the transcript.
2. Each question must have exactly four options.
3. Only one option can be correct.
4. Avoid ambiguous questions.
5. Do not repeat questions.
6. Return ONLY valid JSON.
7. Do not use markdown.
8. Use this exact structure:

[
  {{
    "question": "Question text",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "answer": 0,
    "explanation": "Short explanation"
  }}
]

The answer field must be the zero-based
index of the correct option.

Lecture transcript:

{context}
"""

    raw = generate_llm(
        prompt,
        temperature=0.4
    )

    # Remove accidental markdown fences
    raw = re.sub(
        r"```json\s*",
        "",
        raw,
        flags=re.IGNORECASE
    )

    raw = re.sub(
        r"```\s*",
        "",
        raw
    )

    raw = raw.strip()

    # Find JSON array if LLM added text
    start = raw.find("[")
    end = raw.rfind("]")

    if start != -1 and end != -1:
        raw = raw[start:end + 1]

    try:
        quiz = json.loads(raw)

    except json.JSONDecodeError as e:

        print("Invalid quiz JSON:")
        print(raw)

        raise RuntimeError(
            f"LLM returned invalid quiz JSON: {e}"
        )

    # Validate and normalize
    validated = []

    for item in quiz:

        if not isinstance(item, dict):
            continue

        question = str(
            item.get("question", "")
        ).strip()

        options = item.get(
            "options",
            []
        )

        explanation = str(
            item.get("explanation", "")
        ).strip()

        try:
            answer = int(
                item.get("answer", 0)
            )
        except:
            answer = 0

        if (
            question
            and isinstance(options, list)
            and len(options) == 4
        ):

            answer = max(
                0,
                min(3, answer)
            )

            validated.append({
                "question": question,
                "options": [
                    str(option)
                    for option in options
                ],
                "answer": answer,
                "explanation": explanation
            })

    return validated[:number_of_questions]


# ============================================================
# API ROUTES
# ============================================================

@app.route("/api/health")
def health():

    ollama_status = False

    try:
        r = requests.get(
            f"{OLLAMA_URL}/api/tags",
            timeout=5
        )

        ollama_status = r.status_code == 200

    except:
        ollama_status = False

    return jsonify({
        "status": "ok",
        "ollama": ollama_status,
        "embedding_model": EMBED_MODEL,
        "llm_model": LLM_MODEL,
        "chunks": len(CHUNKS),
        "embeddings": len(EMBEDDINGS)
    })


@app.route("/api/stats")
def stats():

    return jsonify({
        "chunks": len(CHUNKS),
        "embeddings": len(EMBEDDINGS),
        "json_files": len(
            list(JSON_DIR.glob("*.json"))
        ) if JSON_DIR.exists() else 0,
        "quiz_attempts": len(QUIZ_HISTORY)
    })


@app.route("/api/ask", methods=["POST"])
@app.route("/api/query", methods=["POST"])
def ask():

    data = request.get_json(
        silent=True
    ) or {}

    question = str(
        data.get("question", "")
    ).strip()

    if not question:
        return jsonify({
            "error": "Please enter a question."
        }), 400

    try:

        result = answer_question(
            question
        )

        return jsonify(result)

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


@app.route("/api/quiz", methods=["POST"])
def quiz():

    data = request.get_json(
        silent=True
    ) or {}

    try:
        count = int(
            data.get(
                "count",
                data.get(
                    "number_of_questions",
                    5
                )
            )
        )

    except:
        count = 5

    count = max(
        1,
        min(15, count)
    )

    difficulty = str(
        data.get(
            "difficulty",
            "medium"
        )
    ).lower()

    if difficulty not in [
        "easy",
        "medium",
        "hard"
    ]:
        difficulty = "medium"

    try:

        questions = generate_quiz(
            count,
            difficulty
        )

        return jsonify({
            "questions": questions,
            "count": len(questions),
            "difficulty": difficulty
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


@app.route("/api/quiz/result", methods=["POST"])
def quiz_result():

    data = request.get_json(
        silent=True
    ) or {}

    score = int(
        data.get("score", 0)
    )

    total = int(
        data.get("total", 0)
    )

    percentage = (
        round(
            score / total * 100,
            2
        )
        if total > 0
        else 0
    )

    attempt = {
        "score": score,
        "total": total,
        "percentage": percentage
    }

    QUIZ_HISTORY.append(
        attempt
    )

    return jsonify({
        "success": True,
        **attempt
    })


@app.route("/api/reload", methods=["POST"])
def reload_data():

    try:

        load_transcripts()
        build_embedding_index()

        return jsonify({
            "success": True,
            "chunks": len(CHUNKS),
            "embeddings": len(EMBEDDINGS)
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# ============================================================
# FRONTEND
# ============================================================

HTML = r"""
<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta name="viewport"
      content="width=device-width, initial-scale=1.0">

<title>RAG Teaching Assistant</title>

<style>

* {
    box-sizing: border-box;
}

body {
    margin: 0;
    font-family:
        Inter,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

    background: #f5f7fb;
    color: #172033;
}

button,
input,
select {
    font: inherit;
}

button {
    cursor: pointer;
}

.app {
    display: flex;
    min-height: 100vh;
}

/* SIDEBAR */

.sidebar {
    width: 245px;
    background: #101827;
    color: white;
    padding: 28px 18px;
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
}

.brand {
    padding: 8px 12px 30px;
}

.brand h1 {
    margin: 0;
    font-size: 22px;
}

.brand p {
    margin: 5px 0 0;
    color: #aab4c7;
    font-size: 13px;
}

.nav {
    display: flex;
    flex-direction: column;
    gap: 7px;
}

.nav button {
    border: 0;
    background: transparent;
    color: #dce3ef;
    text-align: left;
    padding: 13px 14px;
    border-radius: 10px;
    font-size: 14px;
}

.nav button:hover,
.nav button.active {
    background: #202d40;
    color: white;
}

/* MAIN */

.main {
    margin-left: 245px;
    width: calc(100% - 245px);
    padding: 35px;
}

.page {
    max-width: 1200px;
    margin: auto;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 25px;
}

.header h2 {
    margin: 0;
    font-size: 31px;
}

.header p {
    margin: 6px 0 0;
    color: #69758a;
}

.status {
    background: #eeedff;
    color: #5146df;
    padding: 9px 14px;
    border-radius: 30px;
    font-size: 13px;
}

/* HERO */

.hero {
    background:
        linear-gradient(
            135deg,
            #171d3d,
            #34328a
        );

    border-radius: 18px;
    padding: 38px;
    color: white;
    margin-bottom: 20px;
}

.hero h1 {
    margin: 0 0 12px;
    font-size: 34px;
}

.hero p {
    color: #d8dbf5;
    max-width: 800px;
    line-height: 1.5;
}

.ask-box {
    display: flex;
    gap: 10px;
    margin-top: 22px;
}

.ask-box input {
    flex: 1;
    border: 0;
    border-radius: 11px;
    padding: 16px;
    outline: none;
}

.primary {
    border: 0;
    border-radius: 10px;
    background: #5547e8;
    color: white;
    padding: 13px 20px;
    font-weight: 600;
}

.primary:hover {
    background: #4638d7;
}

/* CARDS */

.cards {
    display: grid;
    grid-template-columns:
        repeat(3, 1fr);
    gap: 18px;
}

.card {
    background: white;
    border: 1px solid #e4e8ef;
    border-radius: 16px;
    padding: 25px;
    box-shadow:
        0 8px 30px
        rgba(20, 30, 50, 0.04);
}

.card h3 {
    margin-top: 0;
}

.card p {
    color: #69758a;
    line-height: 1.5;
}

/* CONTENT */

.content-card {
    background: white;
    border: 1px solid #e4e8ef;
    border-radius: 16px;
    padding: 28px;
}

.answer {
    margin-top: 25px;
    white-space: pre-wrap;
    line-height: 1.7;
    font-size: 16px;
}

.source {
    border-left: 3px solid #5547e8;
    background: #f7f7ff;
    padding: 13px;
    margin-top: 12px;
    border-radius: 6px;
    font-size: 13px;
}

.source small {
    color: #69758a;
}

/* QUIZ */

.quiz-settings {
    display: flex;
    gap: 15px;
    margin-bottom: 25px;
}

.quiz-settings select {
    padding: 12px;
    border: 1px solid #dce1e9;
    border-radius: 9px;
    background: white;
}

.quiz-question {
    margin-bottom: 25px;
}

.quiz-question h3 {
    margin-bottom: 15px;
}

.option {
    display: block;
    width: 100%;
    text-align: left;
    padding: 14px;
    margin: 9px 0;
    background: white;
    border: 1px solid #dce1e9;
    border-radius: 9px;
}

.option:hover {
    border-color: #5547e8;
}

.option.selected {
    background: #eeedff;
    border-color: #5547e8;
}

.option.correct {
    background: #e8f8ee;
    border-color: #2b9b57;
}

.option.wrong {
    background: #fff0f0;
    border-color: #dc4d4d;
}

.explanation {
    padding: 12px;
    background: #f6f8fa;
    border-radius: 8px;
    margin-top: 10px;
    color: #566176;
}

.result {
    padding: 25px;
    border-radius: 12px;
    background: #f0efff;
    margin-top: 20px;
}

/* PROFILE / SETTINGS */

.form-row {
    margin-bottom: 18px;
}

.form-row label {
    display: block;
    margin-bottom: 7px;
    font-weight: 600;
}

.form-row input,
.form-row select {
    width: 100%;
    padding: 12px;
    border: 1px solid #dce1e9;
    border-radius: 9px;
}

/* LOADING */

.loading {
    color: #5547e8;
    font-weight: 600;
    margin-top: 20px;
}

.error {
    color: #c43d3d;
    background: #fff1f1;
    padding: 12px;
    border-radius: 8px;
    margin-top: 15px;
}

.hidden {
    display: none;
}

/* RESPONSIVE */

@media (max-width: 900px) {

    .sidebar {
        width: 190px;
    }

    .main {
        margin-left: 190px;
        width: calc(100% - 190px);
        padding: 20px;
    }

    .cards {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 650px) {

    .sidebar {
        position: static;
        width: 100%;
        min-height: auto;
    }

    .app {
        flex-direction: column;
    }

    .main {
        margin-left: 0;
        width: 100%;
    }

    .ask-box {
        flex-direction: column;
    }

    .header {
        flex-direction: column;
        gap: 15px;
    }
}

</style>

</head>

<body>

<div class="app">

<aside class="sidebar">

<div class="brand">
    <h1>RAG Tutor</h1>
    <p>AI Teaching Assistant</p>
</div>

<div class="nav">

<button class="active"
        onclick="showPage('dashboard', this)">
    ⌂ Dashboard
</button>

<button onclick="showPage('tutor', this)">
    ✦ AI Tutor
</button>

<button onclick="showPage('quiz', this)">
    ✓ Quiz Generator
</button>

<button onclick="showPage('progress', this)">
    ◴ Progress
</button>

<button onclick="showPage('profile', this)">
    ○ Profile
</button>

<button onclick="showPage('settings', this)">
    ⚙ Settings
</button>

</div>

</aside>


<main class="main">

<!-- DASHBOARD -->

<section id="dashboard"
         class="page">

<div class="header">

<div>
<h2>Dashboard</h2>
<p>
Learn from your lecture transcripts
with retrieval-augmented AI.
</p>
</div>

<div class="status"
     id="status">
Checking RAG...
</div>

</div>


<div class="hero">

<h1>Your AI Teaching Assistant</h1>

<p>
Ask questions from your lecture transcripts
or generate practice quizzes from the same
RAG knowledge base.
</p>

<div class="ask-box">

<input
    id="dashboardQuestion"
    placeholder="Ask something about your lectures..."
    onkeydown="
        if(event.key === 'Enter')
        askFromDashboard()
    "
>

<button
    class="primary"
    onclick="askFromDashboard()">
    Ask AI
</button>

</div>

</div>


<div class="cards">

<div class="card">

<h3>AI Tutor</h3>

<p>
Ask questions and retrieve relevant transcript
chunks before generating an answer.
</p>

<button
    class="primary"
    onclick="
        showPage(
            'tutor',
            document.querySelectorAll('.nav button')[1]
        )
    ">
    Open Tutor
</button>

</div>


<div class="card">

<h3>Quiz Generator</h3>

<p>
Generate MCQs from your lecture material
and test yourself.
</p>

<button
    class="primary"
    onclick="
        showPage(
            'quiz',
            document.querySelectorAll('.nav button')[2]
        )
    ">
    Create Quiz
</button>

</div>


<div class="card">

<h3>Indexed Chunks</h3>

<h1 id="chunkCount">
    0
</h1>

<p>
Transcript chunks available to the RAG system.
</p>

</div>

</div>

</section>


<!-- TUTOR -->

<section id="tutor"
         class="page hidden">

<div class="header">

<div>
<h2>AI Tutor</h2>

<p>
Ask questions from your lecture transcripts.
</p>

</div>

</div>


<div class="content-card">

<div class="ask-box">

<input
    id="tutorQuestion"
    placeholder="Ask your question..."
    onkeydown="
        if(event.key === 'Enter')
        askTutor()
    "
>

<button
    class="primary"
    onclick="askTutor()">
    Ask AI
</button>

</div>

<div id="tutorLoading"
     class="loading hidden">
    Searching lecture material and generating answer...
</div>

<div id="tutorError"
     class="error hidden">
</div>

<div id="answer"
     class="answer">
</div>

<div id="sources">
</div>

</div>

</section>


<!-- QUIZ -->

<section id="quiz"
         class="page hidden">

<div class="header">

<div>
<h2>Quiz Generator</h2>

<p>
Test your understanding using your lecture material.
</p>

</div>

</div>


<div class="content-card">

<div class="quiz-settings">

<select id="quizCount">

<option value="5">5 Questions</option>
<option value="10">10 Questions</option>
<option value="15">15 Questions</option>

</select>


<select id="difficulty">

<option value="easy">Easy</option>
<option value="medium" selected>
    Medium
</option>
<option value="hard">Hard</option>

</select>


<button
    class="primary"
    onclick="generateQuiz()">
    Generate Quiz
</button>

</div>


<div id="quizLoading"
     class="loading hidden">
    Generating questions from your lectures...
</div>


<div id="quizError"
     class="error hidden">
</div>


<div id="quizContainer">
</div>

</div>

</section>


<!-- PROGRESS -->

<section id="progress"
         class="page hidden">

<div class="header">

<div>
<h2>Progress</h2>

<p>
Your quiz performance.
</p>

</div>

</div>


<div class="cards">

<div class="card">

<h3>Quiz Attempts</h3>

<h1 id="attemptCount">
0
</h1>

</div>


<div class="card">

<h3>Best Score</h3>

<h1 id="bestScore">
0%
</h1>

</div>


<div class="card">

<h3>Average Score</h3>

<h1 id="averageScore">
0%
</h1>

</div>

</div>

</section>


<!-- PROFILE -->

<section id="profile"
         class="page hidden">

<div class="header">

<div>
<h2>Profile</h2>

<p>
Your learning profile.
</p>

</div>

</div>


<div class="content-card">

<div class="form-row">

<label>Name</label>

<input
    id="profileName"
    placeholder="Enter your name"
>

</div>


<div class="form-row">

<label>Course</label>

<input
    id="profileCourse"
    placeholder="Enter your course"
>

</div>


<button
    class="primary"
    onclick="saveProfile()">
    Save Profile
</button>

<p id="profileMessage"></p>

</div>

</section>


<!-- SETTINGS -->

<section id="settings"
         class="page hidden">

<div class="header">

<div>
<h2>Settings</h2>

<p>
Configure your local RAG Teaching Assistant.
</p>

</div>

</div>


<div class="content-card">

<div class="form-row">

<label>Language</label>

<select id="language">

<option>English</option>
<option>Hindi</option>
</select>

</div>


<div class="form-row">

<label>Answer style</label>

<select id="answerStyle">

<option>Student Friendly</option>
<option>Detailed</option>
<option>Concise</option>

</select>

</div>


<button
    class="primary"
    onclick="saveSettings()">
    Save Settings
</button>

<p id="settingsMessage"></p>

</div>

</section>

</main>

</div>


<script>

/* ============================================================
   NAVIGATION
============================================================ */

function showPage(page, button) {

    document
        .querySelectorAll(".page")
        .forEach(
            p => p.classList.add("hidden")
        );

    document
        .getElementById(page)
        .classList.remove("hidden");

    document
        .querySelectorAll(".nav button")
        .forEach(
            b => b.classList.remove("active")
        );

    if (button) {
        button.classList.add("active");
    }

    if (page === "progress") {
        loadProgress();
    }
}


/* ============================================================
   HEALTH
============================================================ */

async function loadHealth() {

    try {

        const response =
            await fetch("/api/health");

        const data =
            await response.json();

        document.getElementById(
            "chunkCount"
        ).textContent =
            data.chunks;

        if (
            data.ollama &&
            data.chunks > 0 &&
            data.embeddings > 0
        ) {

            document.getElementById(
                "status"
            ).textContent =
                "RAG Ready";

        } else if (
            data.ollama &&
            data.chunks > 0
        ) {

            document.getElementById(
                "status"
            ).textContent =
                "Loading embeddings...";

        } else {

            document.getElementById(
                "status"
            ).textContent =
                "Check RAG setup";
        }

    } catch (error) {

        document.getElementById(
            "status"
        ).textContent =
            "Backend unavailable";
    }
}


/* ============================================================
   DASHBOARD ASK
============================================================ */

function askFromDashboard() {

    const input =
        document.getElementById(
            "dashboardQuestion"
        );

    const question =
        input.value.trim();

    if (!question) return;

    document
        .getElementById("tutorQuestion")
        .value = question;

    showPage(
        "tutor",
        document.querySelectorAll(
            ".nav button"
        )[1]
    );

    askTutor();
}


/* ============================================================
   AI TUTOR
============================================================ */

async function askTutor() {

    const question =
        document
            .getElementById("tutorQuestion")
            .value
            .trim();

    if (!question) return;

    const loading =
        document.getElementById(
            "tutorLoading"
        );

    const error =
        document.getElementById(
            "tutorError"
        );

    const answer =
        document.getElementById(
            "answer"
        );

    const sources =
        document.getElementById(
            "sources"
        );

    loading.classList.remove("hidden");
    error.classList.add("hidden");

    answer.textContent = "";
    sources.innerHTML = "";

    try {

        const response =
            await fetch(
                "/api/ask",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        question: question
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.error ||
                "Request failed"
            );
        }

        answer.textContent =
            data.answer;

        if (data.sources) {

            let html =
                "<h3>Retrieved Lecture Context</h3>";

            data.sources.forEach(
                source => {

                    html += `
                    <div class="source">

                        <strong>
                            ${escapeHtml(
                                source.source
                            )}
                        </strong>

                        <br>

                        <small>
                            Chunk ${escapeHtml(
                                source.chunk
                            )}
                            · Similarity:
                            ${source.score}
                        </small>

                        <p>
                            ${escapeHtml(
                                source.text
                            )}
                        </p>

                    </div>
                    `;
                }
            );

            sources.innerHTML = html;
        }

    } catch (err) {

        error.textContent =
            err.message;

        error.classList.remove(
            "hidden"
        );

    } finally {

        loading.classList.add(
            "hidden"
        );
    }
}


/* ============================================================
   QUIZ
============================================================ */

let currentQuiz = [];
let selectedAnswers = [];


async function generateQuiz() {

    const count =
        parseInt(
            document.getElementById(
                "quizCount"
            ).value
        );

    const difficulty =
        document.getElementById(
            "difficulty"
        ).value;

    const loading =
        document.getElementById(
            "quizLoading"
        );

    const error =
        document.getElementById(
            "quizError"
        );

    const container =
        document.getElementById(
            "quizContainer"
        );

    loading.classList.remove(
        "hidden"
    );

    error.classList.add(
        "hidden"
    );

    container.innerHTML = "";

    try {

        const response =
            await fetch(
                "/api/quiz",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        count: count,
                        difficulty: difficulty
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.error ||
                "Quiz generation failed"
            );
        }

        currentQuiz =
            data.questions || [];

        selectedAnswers =
            new Array(
                currentQuiz.length
            ).fill(null);

        renderQuiz();

    } catch (err) {

        error.textContent =
            err.message;

        error.classList.remove(
            "hidden"
        );

    } finally {

        loading.classList.add(
            "hidden"
        );
    }
}


function renderQuiz() {

    const container =
        document.getElementById(
            "quizContainer"
        );

    container.innerHTML = "";

    if (!currentQuiz.length) {

        container.innerHTML =
            "<p>No questions generated.</p>";

        return;
    }

    currentQuiz.forEach(
        (item, questionIndex) => {

            const div =
                document.createElement(
                    "div"
                );

            div.className =
                "quiz-question";

            let html = `
                <h3>
                    ${questionIndex + 1}.
                    ${escapeHtml(
                        item.question
                    )}
                </h3>
            `;

            item.options.forEach(
                (option, optionIndex) => {

                    html += `
                    <button
                        class="option"
                        onclick="
                            selectAnswer(
                                ${questionIndex},
                                ${optionIndex},
                                this
                            )
                        "
                    >
                        ${escapeHtml(option)}
                    </button>
                    `;
                }
            );

            div.innerHTML = html;

            container.appendChild(div);
        }
    );

    const submit =
        document.createElement(
            "button"
        );

    submit.className =
        "primary";

    submit.textContent =
        "Submit Quiz";

    submit.onclick =
        submitQuiz;

    container.appendChild(
        submit
    );
}


function selectAnswer(
    questionIndex,
    optionIndex,
    button
) {

    selectedAnswers[
        questionIndex
    ] = optionIndex;

    button
        .parentElement
        .querySelectorAll(
            ".option"
        )
        .forEach(
            b => b.classList.remove(
                "selected"
            )
        );

    button.classList.add(
        "selected"
    );
}


async function submitQuiz() {

    let score = 0;

    currentQuiz.forEach(
        (question, index) => {

            const selected =
                selectedAnswers[index];

            const buttons =
                document
                    .getElementById(
                        "quizContainer"
                    )
                    .children[index]
                    .querySelectorAll(
                        ".option"
                    );

            buttons.forEach(
                (button, optionIndex) => {

                    button.disabled =
                        true;

                    if (
                        optionIndex ===
                        question.answer
                    ) {

                        button.classList.add(
                            "correct"
                        );
                    }

                    if (
                        selected ===
                        optionIndex &&
                        selected !==
                        question.answer
                    ) {

                        button.classList.add(
                            "wrong"
                        );
                    }
                }
            );

            if (
                selected ===
                question.answer
            ) {
                score++;
            }

            const explanation =
                document.createElement(
                    "div"
                );

            explanation.className =
                "explanation";

            explanation.innerHTML =
                "<strong>Explanation:</strong> " +
                escapeHtml(
                    question.explanation
                );

            document
                .getElementById(
                    "quizContainer"
                )
                .children[index]
                .appendChild(
                    explanation
                );
        }
    );

    const percentage =
        currentQuiz.length
            ? Math.round(
                score /
                currentQuiz.length *
                100
            )
            : 0;

    const result =
        document.createElement(
            "div"
        );

    result.className =
        "result";

    result.innerHTML = `
        <h2>Quiz Complete</h2>

        <h1>
            ${score} / ${currentQuiz.length}
        </h1>

        <p>
            Score: ${percentage}%
        </p>
    `;

    document
        .getElementById(
            "quizContainer"
        )
        .appendChild(result);

    try {

        await fetch(
            "/api/quiz/result",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    score: score,
                    total: currentQuiz.length
                })
            }
        );

    } catch (e) {

        console.log(
            "Could not save result"
        );
    }
}


/* ============================================================
   PROGRESS
============================================================ */

async function loadProgress() {

    try {

        const response =
            await fetch(
                "/api/stats"
            );

        const data =
            await response.json();

        document.getElementById(
            "attemptCount"
        ).textContent =
            data.quiz_attempts;

    } catch (e) {

        console.log(e);
    }
}


/* ============================================================
   PROFILE
============================================================ */

function saveProfile() {

    localStorage.setItem(
        "rag_profile_name",
        document.getElementById(
            "profileName"
        ).value
    );

    localStorage.setItem(
        "rag_profile_course",
        document.getElementById(
            "profileCourse"
        ).value
    );

    document.getElementById(
        "profileMessage"
    ).textContent =
        "Profile saved.";
}


function loadProfile() {

    document.getElementById(
        "profileName"
    ).value =
        localStorage.getItem(
            "rag_profile_name"
        ) || "";

    document.getElementById(
        "profileCourse"
    ).value =
        localStorage.getItem(
            "rag_profile_course"
        ) || "";
}


/* ============================================================
   SETTINGS
============================================================ */

function saveSettings() {

    localStorage.setItem(
        "rag_language",
        document.getElementById(
            "language"
        ).value
    );

    localStorage.setItem(
        "rag_answer_style",
        document.getElementById(
            "answerStyle"
        ).value
    );

    document.getElementById(
        "settingsMessage"
    ).textContent =
        "Settings saved.";
}


function loadSettings() {

    const language =
        localStorage.getItem(
            "rag_language"
        );

    const style =
        localStorage.getItem(
            "rag_answer_style"
        );

    if (language) {

        document.getElementById(
            "language"
        ).value =
            language;
    }

    if (style) {

        document.getElementById(
            "answerStyle"
        ).value =
            style;
    }
}


/* ============================================================
   HTML ESCAPING
============================================================ */

function escapeHtml(value) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        value == null
            ? ""
            : String(value);

    return div.innerHTML;
}


/* ============================================================
   START
============================================================ */

loadHealth();
loadProfile();
loadSettings();

setInterval(
    loadHealth,
    10000
);

</script>

</body>

</html>
"""


# ============================================================
# FRONTEND ROUTE
# ============================================================

@app.route("/")
def index():
    return render_template_string(
        HTML
    )


# ============================================================
# START SERVER
# ============================================================

if __name__ == "__main__":

    print("=" * 60)
    print("RAG Teaching Assistant")
    print("=" * 60)

    print(
        f"Ollama: {OLLAMA_URL}"
    )

    print(
        f"Embedding model: {EMBED_MODEL}"
    )

    print(
        f"LLM model: {LLM_MODEL}"
    )

    print(
        f"JSON directory: {JSON_DIR}"
    )

    # Load transcript chunks
    load_transcripts()

    # Build BGE-M3 vector index
    try:

        build_embedding_index()

    except Exception as e:

        print()
        print(
            "WARNING: Could not build "
            "embedding index."
        )
        print(e)
        print()
        print(
            "Make sure Ollama is running and "
            f"{EMBED_MODEL} is installed."
        )

    print()
    print(
        "Website: http://localhost:5000"
    )
    print()

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=False
    )