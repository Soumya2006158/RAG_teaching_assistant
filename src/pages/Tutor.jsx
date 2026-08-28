import React from "react";
import AITutorCard from "../components/AITutorCard";

export default function Tutor({ subject }) {
  return (
    <div className="page narrow-page">
      <div className="page-title">
        <h1>AI Tutor</h1>
        <p>Ask questions and get answers grounded in your course material.</p>
      </div>
      <AITutorCard subject={subject} />
    </div>
  );
}