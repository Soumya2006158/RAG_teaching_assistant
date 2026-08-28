import React from 'react'
import { ChevronDown } from 'lucide-react'
import { SUBJECTS, useAppContext } from '../App.jsx'

export default function Topbar({ eyebrow, title, hideExtras }) {
  const { subject, setSubject } = useAppContext()

  return (
    <header className="topbar">
      <div>
        <span className="topbar-eyebrow">{eyebrow}</span>
        <h1 className="topbar-title">{title}</h1>
      </div>

      {!hideExtras && (
        <div className="topbar-right">
          <label className="subject-select">
            <span className="mono" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
              SUBJECT
            </span>
            <select value={subject} onChange={(e) => setSubject(e.target.value)}>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown size={13} color="var(--text-tertiary)" />
          </label>
          <div className="topbar-avatar">RA</div>
        </div>
      )}
    </header>
  )
}
