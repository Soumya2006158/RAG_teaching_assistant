import React from 'react'

export default function StatCard({ icon: Icon, iconColor, value, label, delta }) {
  return (
    <div className="stat-card">
      {delta && (
        <span className={`stat-card-delta ${delta.direction}`}>
          {delta.direction === 'up' ? '\u2191' : '\u2193'} {delta.text}
        </span>
      )}
      <div
        className="stat-card-icon"
        style={{ background: `${iconColor}22`, color: iconColor }}
      >
        <Icon />
      </div>
      <div className="stat-card-value mono">{value}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  )
}
