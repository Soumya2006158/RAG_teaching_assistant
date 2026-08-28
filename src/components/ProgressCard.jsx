import React from "react";
import { BarChart3, ArrowRight } from "lucide-react";

const items = [
  ["Quiz Performance", 82],
  ["Questions Attempted", 74],
  ["Study Consistency", 68],
  ["Exam Readiness", 61]
];

export default function ProgressCard({ onOpen }) {
  return (
    <section className="panel progress-card">
      <div className="panel-heading compact">
        <div className="heading-icon blue"><BarChart3 size={21} /></div>
        <div><h2>Progress Overview</h2><p>Track your learning journey.</p></div>
        <button className="view-link" onClick={onOpen}>View Details <ArrowRight size={15} /></button>
      </div>

      {items.map(([name, value]) => (
        <div className="progress-row" key={name}>
          <div><span>{name}</span><strong>{value}%</strong></div>
          <div className="progress-track"><div style={{ width: `${value}%` }} /></div>
        </div>
      ))}
    </section>
  );
}