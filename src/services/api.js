const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export async function askTutor(question, subject = "Economics") {
  try {
    const response = await fetch(`${API_BASE}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, courseId: subject })
    });
    if (!response.ok) throw new Error("API request failed");
    return await response.json();
  } catch {
    return {
      answer:
        "This is a demo response. Connect your RAG backend to /api/ask to receive answers grounded in your course chunks and embeddings.",
      sources: [
        { title: "Retrieved course context", detail: "RAG backend connection required" }
      ]
    };
  }
}

export async function generateQuiz({ topic, difficulty, count, type, subject }) {
  try {
    const response = await fetch(`${API_BASE}/quiz/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, difficulty, count, type, courseId: subject })
    });
    if (!response.ok) throw new Error("API request failed");
    return await response.json();
  } catch {
    return null;
  }
}