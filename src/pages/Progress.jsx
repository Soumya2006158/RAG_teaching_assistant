import React from "react";
import { Flame, Trophy, Target, Clock3 } from "lucide-react";

export default function Progress() {
  return (
    <div className="page">
      <div className="page-title">
        <h1>Progress</h1>
        <p>A simple overview of your learning activity.</p>
      </div>

      <div className="stats-grid four">
        <div className="metric-card"><Flame /><strong>7</strong><span>Day streak</span></div>
        <div className="metric-card"><Trophy /><strong>82%</strong><span>Quiz average</span></div>
        <div className="metric-card"><Target /><strong>74%</strong><span>Practice accuracy</span></div>
        <div className="metric-card"><Clock3 /><strong>8.5h</strong><span>Study time</span></div>
      </div>

      <section className="panel large-panel">
        <h2>Weekly activity</h2>
        <div className="bar-chart">
          {[55, 70, 42, 84, 68, 91, 60].map((v, i) => (
            <div className="chart-column" key={i}>
              <div className="chart-bar" style={{ height: `${v}%` }} />
              <span>{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i]}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}