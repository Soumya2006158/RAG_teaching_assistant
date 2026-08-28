import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, ArrowUpRight } from 'lucide-react'
import { useAppContext } from '../App.jsx'

const RECENT_QUESTIONS = [
  'Explain TCP three-way handshake',
  'Difference between fiscal and monetary policy',
  'What is overfitting and how do I prevent it?',
]

export default function AITutorCard() {
  const navigate = useNavigate()
  const { subject } = useAppContext()

  return (
    <div className="panel panel-pad">
      <div className="section-heading">
        <h2>
          <Sparkles size={15} style={{ marginRight: 7, color: 'var(--amber)', verticalAlign: -2 }} />
          Ask the AI Tutor
        </h2>
        <button className="see-all" onClick={() => navigate('/tutor')}>
          Open <ArrowUpRight size={11} style={{ verticalAlign: -1 }} />
        </button>
      </div>

      <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 14 }}>
        Grounded in your <strong style={{ color: 'var(--text-primary)' }}>{subject}</strong> course
        material. Pick up where you left off.
      </p>

      <div className="suggested-prompts">
        {RECENT_QUESTIONS.map((q) => (
          <button key={q} className="suggested-prompt" onClick={() => navigate('/tutor', { state: { prompt: q } })}>
            {q}
          </button>
        ))}
      </div>

      <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={() => navigate('/tutor')}>
        New question
      </button>
    </div>
  )
}
