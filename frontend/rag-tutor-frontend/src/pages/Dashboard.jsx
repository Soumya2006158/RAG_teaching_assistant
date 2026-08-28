import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, Flame, Zap, Target, MessageCircleQuestion, ListChecks, LineChart } from 'lucide-react'
import StatCard from '../components/StatCard.jsx'
import AITutorCard from '../components/AITutorCard.jsx'
import QuizGeneratorCard from '../components/QuizGeneratorCard.jsx'
import ProgressCard from '../components/ProgressCard.jsx'

const QUICK_ACTIONS = [
  { icon: MessageCircleQuestion, title: 'Ask a question', sub: 'Get a grounded answer', to: '/tutor' },
  { icon: ListChecks, title: 'Generate a quiz', sub: 'Pick topic & difficulty', to: '/quiz' },
  { icon: LineChart, title: 'Review progress', sub: 'See weekly trends', to: '/progress' },
]

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <>
      <div className="stat-grid">
        <StatCard
          icon={Trophy}
          iconColor="#f2a93b"
          value="84%"
          label="Avg. Quiz Score"
          delta={{ direction: 'up', text: '3.2%' }}
        />
        <StatCard icon={Flame} iconColor="#e8636f" value="12" label="Day Streak" />
        <StatCard
          icon={Zap}
          iconColor="#9b8cf2"
          value="3,420"
          label="XP"
          delta={{ direction: 'up', text: '120' }}
        />
        <StatCard icon={Target} iconColor="#46d5db" value="81%" label="Practice Accuracy" />
      </div>

      <div className="panel panel-pad" style={{ marginBottom: 18 }}>
        <div className="section-heading">
          <h2>Quick actions</h2>
        </div>
        <div className="quick-actions">
          {QUICK_ACTIONS.map(({ icon: Icon, title, sub, to }) => (
            <button key={title} className="quick-action" onClick={() => navigate(to)}>
              <Icon />
              <div>
                <div className="quick-action-title">{title}</div>
                <div className="quick-action-sub">{sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="dash-grid">
        <AITutorCard />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <QuizGeneratorCard />
          <ProgressCard />
        </div>
      </div>
    </>
  )
}

