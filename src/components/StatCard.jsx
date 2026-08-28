import React from "react";

export default function StatCard({ icon, value, label, accent, note }) {
  return (
    <div className={`stat-card ${accent || ""}`}>
      <div className="stat-icon">{icon}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {note && <div className="stat-note">{note}</div>}
      </div>
    </div>
  );
}