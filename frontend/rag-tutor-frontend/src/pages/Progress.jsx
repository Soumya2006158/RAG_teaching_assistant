import React, { useEffect, useState } from 'react'
import { Trophy, Flame, Target, Clock } from 'lucide-react'
import StatCard from '../components/StatCard.jsx'
import { fetchProgressSummary } from '../services/api.js'
import { useAppContext } from '../App.jsx'

export default function Progress() {
  const { subject } = useAppContext()
  const [data, setData] = useState(null)

  useEffect(() => {
    fetchProgressSummary(subject).then(setData)
  }, [subject])

  if (!data) {
    return <div className="empty-state">Loading progress\u2026</div>
  }

  const maxMinutes = Math.max(...data.weeklyActivity.map((d) => d.minutes))

  return (
    <>
      <div className="progress-grid">
        <StatCard icon={Trophy} iconColor="#f2a93b" value={`${data.quizAverage}%`} label="Quiz Average" />
        <StatCard icon={Flame} iconColor="#e8636f" value={data.streak} label="Day Streak" />
        <StatCard icon={Target} iconColor="#46d5db" value={`${data.accuracy}%`} label="Practice Accuracy" />
        <StatCard icon={Clock} iconColor="#9b8cf2" value={data.studyTime} label="Study Time" />
      </div>

      <div className="panel panel-pad">
        <div className="section-heading">
          <h2>Weekly activity</h2>
          <span className="see-all">MINUTES STUDIED</span>
        </div>
        <div className="activity-bars">
          {data.weeklyActivity.map((d) => (
            <div className="activity-bar-col" key={d.day}>
              <span className="mono" style={{ fontSize: 10.5, color: 'var(--text-secondary)' }}>
                {d.minutes}
              </span>
              <div
                className="activity-bar"
                style={{ height: `${(d.minutes / maxMinutes) * 100}%` }}
              />
              <span className="activity-bar-label">{d.day}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
