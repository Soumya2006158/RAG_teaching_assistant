import React from 'react'
import { Trophy, Flame, Zap, BookOpen } from 'lucide-react'
import { SUBJECTS } from '../App.jsx'

export default function Profile() {
  return (
    <div className="panel panel-pad" style={{ maxWidth: 640 }}>
      <div className="profile-header">
        <div className="profile-avatar-lg">RA</div>
        <div>
          <h2 style={{ fontSize: 19, fontWeight: 600, marginBottom: 4 }}>Riya Anand</h2>
          <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>riya.anand@studentmail.edu</p>
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 26 }}>
        <StatMini icon={Trophy} color="#f2a93b" value="84%" label="Avg. Score" />
        <StatMini icon={Flame} color="#e8636f" value="12" label="Streak" />
        <StatMini icon={Zap} color="#9b8cf2" value="3,420" label="XP" />
      </div>

      <div className="section-heading">
        <h2 style={{ fontSize: 14 }}>
          <BookOpen size={14} style={{ marginRight: 6, verticalAlign: -2, color: 'var(--cyan)' }} />
          Enrolled subjects
        </h2>
      </div>
      <div className="chip-row">
        {SUBJECTS.map((s) => (
          <span key={s} className="chip cyan active" style={{ cursor: 'default' }}>
            {s}
          </span>
        ))}
      </div>
    </div>
  )
}

function StatMini({ icon: Icon, color, value, label }) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon" style={{ background: `${color}22`, color }}>
        <Icon />
      </div>
      <div className="stat-card-value mono">{value}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  )
}
