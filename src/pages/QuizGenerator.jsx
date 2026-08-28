import React, { useState } from "react";
import QuizScreen from "./QuizScreen";
import QuizGeneratorCard from "../components/QuizGeneratorCard";

export default function QuizGenerator({ subject }) {
  const [quizConfig, setQuizConfig] = useState(null);
  if (quizConfig) return <QuizScreen config={quizConfig} onBack={() => setQuizConfig(null)} />;

  return (
    <div className="page narrow-page">
      <div className="page-title">
        <h1>Quiz Generator</h1>
        <p>Create a personalized quiz from your learning material.</p>
      </div>
      <QuizGeneratorCard subject={subject} onGenerated={setQuizConfig} />
    </div>
  );
}