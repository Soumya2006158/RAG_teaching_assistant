import React from 'react'
import { useNavigate } from 'react-router-dom'
import { LineChart, ArrowUpRight } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, YAxis } from 'recharts'
import { WEEKLY_ACTIVITY } from '../services/api.js'

export default function ProgressCard() {
  const navigate = useNavigate()

  return (
    <div className="panel panel-pad">
      <div className="section-heading">
        <h2>
          <LineChart size={15} style={{ marginRight: 7, color: 'var(--green)', verticalAlign: -2 }} />
          This week
        </h2>
        <button className="see-all" onClick={() => navigate('/progress')}>
          Full report <ArrowUpRight size={11} style={{ verticalAlign: -1 }} />
        </button>
      </div>

      <div style={{ height: 100, margin: '4px 0 10px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={WEEKLY_ACTIVITY}>
            <defs>
              <linearGradient id="progressFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6fcf97" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#6fcf97" stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis hide domain={[0, 'dataMax + 10']} />
            <Area
              type="monotone"
              dataKey="minutes"
              stroke="#6fcf97"
              strokeWidth={2}
              fill="url(#progressFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span style={{ color: 'var(--text-secondary)' }}>
          Study time <strong className="mono" style={{ color: 'var(--text-primary)' }}>4h 40m</strong>
        </span>
        <span style={{ color: 'var(--text-secondary)' }}>
          Accuracy <strong className="mono" style={{ color: 'var(--green)' }}>81%</strong>
        </span>
      </div>
    </div>
  )
}
