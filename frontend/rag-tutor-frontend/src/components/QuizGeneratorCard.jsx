import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ListChecks, ArrowUpRight } from 'lucide-react'
import { useAppContext } from '../App.jsx'

const DIFFICULTIES = ['Easy', 'Medium', 'Hard']

export default function QuizGeneratorCard() {
  const navigate = useNavigate()
  const { subject, setQuizConfig } = useAppContext()
  const [difficulty, setDifficulty] = useState('Medium')

  const startQuiz = () => {
    setQuizConfig({ subject, difficulty, count: 8, types: ['MCQ'] })
    navigate('/quiz/play')
  }

  return (
    <div className="panel panel-pad">
      <div className="section-heading">
        <h2>
          <ListChecks size={15} style={{ marginRight: 7, color: 'var(--cyan)', verticalAlign: -2 }} />
          Quick Quiz
        </h2>
        <button className="see-all" onClick={() => navigate('/quiz')}>
          Customize <ArrowUpRight size={11} style={{ verticalAlign: -1 }} />
        </button>
      </div>

      <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 14 }}>
        Generate a short set from <strong style={{ color: 'var(--text-primary)' }}>{subject}</strong> to
        warm up.
      </p>

      <span className="field-label">Difficulty</span>
      <div className="chip-row" style={{ marginBottom: 18 }}>
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            className={`chip cyan ${difficulty === d ? 'active' : ''}`}
            onClick={() => setDifficulty(d)}
          >
            {d}
          </button>
        ))}
      </div>

      <button className="btn btn-cyan btn-block" onClick={startQuiz}>
        Generate 8 questions
      </button>
    </div>
  )
}
