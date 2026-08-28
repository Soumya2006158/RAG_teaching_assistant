import React, { useState } from "react";
import { BrainCircuit, Sparkles } from "lucide-react";
import { generateQuiz } from "../services/api";

export default function QuizGeneratorCard({ subject, onGenerated }) {
  const [topic, setTopic] = useState("Elasticity");
  const [difficulty, setDifficulty] = useState("Medium");
  const [count, setCount] = useState(10);
  const [type, setType] = useState("MCQ");
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    const quiz = await generateQuiz({ topic, difficulty, count, type, subject });
    setLoading(false);
    onGenerated({
      topic,
      difficulty,
      count,
      type,
      backendQuiz: quiz
    });
  }

  return (
    <section className="panel quiz-generator-card">
      <div className="panel-heading compact">
        <div className="heading-icon violet"><BrainCircuit size={21} /></div>
        <div>
          <h2>Quiz Generator</h2>
          <p>Generate topic-wise quizzes instantly.</p>
        </div>
      </div>

      <label>Topic</label>
      <select value={topic} onChange={(e) => setTopic(e.target.value)}>
        <option>Elasticity</option>
        <option>Demand</option>
        <option>Supply</option>
        <option>Market Equilibrium</option>
      </select>

      <label>Difficulty</label>
      <div className="segmented">
        {["Easy", "Medium", "Hard"].map((d) => (
          <button className={difficulty === d ? "selected" : ""} onClick={() => setDifficulty(d)} key={d}>{d}</button>
        ))}
      </div>

      <label>Number of Questions</label>
      <div className="counter">
        <button onClick={() => setCount(Math.max(1, count - 1))}>−</button>
        <strong>{count}</strong>
        <button onClick={() => setCount(Math.min(30, count + 1))}>+</button>
      </div>

      <label>Question Type</label>
      <div className="type-buttons">
        {["MCQ", "True / False", "Numerical"].map((t) => (
          <button className={type === t ? "selected" : ""} onClick={() => setType(t)} key={t}>{t}</button>
        ))}
      </div>

      <button className="primary-button" onClick={generate} disabled={loading}>
        <Sparkles size={18} />
        {loading ? "Generating..." : "Generate Quiz"}
      </button>
    </section>
  );
}