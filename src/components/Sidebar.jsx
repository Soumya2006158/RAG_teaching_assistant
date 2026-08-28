import React from "react";
import {
  LayoutDashboard, MessageCircle, BrainCircuit, BarChart3,
  UserRound, Settings, GraduationCap, ChevronDown, Sparkles
} from "lucide-react";

const items = [
  ["dashboard", "Dashboard", LayoutDashboard],
  ["tutor", "AI Tutor", MessageCircle],
  ["quiz", "Quiz Generator", BrainCircuit],
  ["progress", "Progress", BarChart3],
  ["profile", "Profile", UserRound],
  ["settings", "Settings", Settings]
];

export default function Sidebar({ active, setActive, subject, setSubject }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><BrainCircuit size={28} /></div>
        <div>
          <div className="brand-title">RAG Tutor</div>
          <div className="brand-subtitle">AI Teaching Assistant</div>
        </div>
      </div>

      <nav className="nav">
        {items.map(([id, label, Icon]) => (
          <button
            key={id}
            className={`nav-item ${active === id ? "active" : ""}`}
            onClick={() => setActive(id)}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="subject-card">
        <div className="subject-label">
          <GraduationCap size={17} />
          <span>Current Subject</span>
          <ChevronDown size={16} />
        </div>
        <select value={subject} onChange={(e) => setSubject(e.target.value)}>
          <option>Economics</option>
          <option>Computer Networks</option>
          <option>AI / ML</option>
        </select>
      </div>

      <div className="sidebar-tagline">
        <Sparkles size={20} />
        <div>
          <strong>Learn Smarter.</strong>
          <span>Go Further.</span>
        </div>
      </div>

      <div className="profile-mini">
        <div className="avatar">SR</div>
        <div className="profile-mini-text">
          <strong>Soumya</strong>
          <span>Level 6 Learner</span>
        </div>
        <ChevronDown size={16} />
      </div>
    </aside>
  );
}