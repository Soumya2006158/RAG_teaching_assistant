import React, { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

const demoQuestions = [
  {
    q: "What does price elasticity of demand measure?",
    options: [
      "Change in supply caused by income",
      "Responsiveness of quantity demanded to a change in price",
      "Change in price caused by supply",
      "Total revenue of a firm"
    ],
    answer: 1
  },
  {
    q: "If demand is elastic and price decreases, total revenue generally:",
    options: ["Increases", "Decreases", "Becomes zero", "Always remains unchanged"],
    answer: 0
  },
  {
    q: "A perfectly inelastic demand curve is represented by a:",
    options: ["Horizontal line", "Downward curve", "Vertical line", "45-degree line"],
    answer: 2
  }
];

export default function QuizScreen({ config, onBack }) {
  const questions = useMemo(() => {
    if (config.backendQuiz?.questions?.length) return config.backendQuiz.questions;
    return demoQuestions.slice(0, Math.min(config.count, demoQuestions.length));
  }, [config]);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [finished, setFinished] = useState(false);

  const current = questions[index];

  function next() {
    const nextAnswers = [...answers];
    nextAnswers[index] = selected;
    setAnswers(nextAnswers);
    setSelected(null);

    if (index === questions.length - 1) setFinished(true);
    else setIndex(index + 1);
  }

  if (finished) {
    const score = answers.reduce((n, a, i) => n + (a === questions[i].answer ? 1 : 0), 0);
    return (
      <div className="page quiz-page">
        <div className="result-card panel">
          <CheckCircle2 size={58} />
          <h1>Quiz Completed 🎉</h1>
          <div className="score">{score} / {questions.length}</div>
          <p>{Math.round((score / questions.length) * 100)}% — keep building your understanding.</p>
          <div className="result-actions">
            <button className="secondary-button" onClick={onBack}>Generate Another Quiz</button>
            <button className="primary-button" onClick={() => { setIndex(0); setAnswers([]); setFinished(false); }}>Retry Quiz</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page quiz-page">
      <button className="back-button" onClick={onBack}><ArrowLeft size={17} /> Back to Generator</button>
      <div className="quiz-header">
        <div><span>{config.topic} Quiz</span><small>{config.difficulty} · {config.type}</small></div>
        <strong>{index + 1} / {questions.length}</strong>
      </div>
      <div className="quiz-progress"><div style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div>

      <section className="question-card panel">
        <span className="question-number">Question {index + 1}</span>
        <h2>{current.q}</h2>
        <div className="options">
          {current.options.map((option, i) => (
            <button key={option} className={selected === i ? "chosen" : ""} onClick={() => setSelected(i)}>
              <span className="option-letter">{String.fromCharCode(65 + i)}</span>
              {option}
            </button>
          ))}
        </div>
        <button className="primary-button next-button" disabled={selected === null} onClick={next}>
          {index === questions.length - 1 ? "Submit Quiz" : "Next Question"}
        </button>
      </section>
    </div>
  );
}