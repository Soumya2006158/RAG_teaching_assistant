import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Minus, Plus, Wand2 } from 'lucide-react'
import { useAppContext } from '../App.jsx'

const TOPICS_BY_SUBJECT = {
  Economics: ['Microeconomics', 'Macroeconomics', 'Trade & Markets', 'Monetary Policy'],
  'Computer Networks': ['OSI Model', 'Transport Layer', 'Routing', 'Network Security'],
  'AI / ML': ['Supervised Learning', 'Neural Networks', 'Model Evaluation', 'Optimization'],
}

const DIFFICULTIES = ['Easy', 'Medium', 'Hard']
const QUESTION_TYPES = ['MCQ', 'True / False', 'Numerical']

export default function QuizGenerator() {
  const navigate = useNavigate()
  const { subject, setQuizConfig } = useAppContext()
  const topics = TOPICS_BY_SUBJECT[subject] || []

  const [topic, setTopic] = useState(topics[0])
  const [difficulty, setDifficulty] = useState('Medium')
  const [count, setCount] = useState(10)
  const [types, setTypes] = useState(['MCQ'])

  const toggleType = (t) => {
    setTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  }

  const canGenerate = topic && types.length > 0

  const handleGenerate = () => {
    setQuizConfig({ subject, topic, difficulty, count, types })
    navigate('/quiz/play')
  }

  return (
    <div className="panel panel-pad" style={{ maxWidth: 640 }}>
      <div className="section-heading">
        <h2>Configure your quiz</h2>
      </div>

      <div style={{ marginBottom: 22 }}>
        <span className="field-label">Topic \u2014 {subject}</span>
        <div className="chip-row">
          {topics.map((t) => (
            <button key={t} className={`chip ${topic === t ? 'active' : ''}`} onClick={() => setTopic(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 22 }}>
        <span className="field-label">Difficulty</span>
        <div className="chip-row">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              className={`chip ${difficulty === d ? 'active' : ''}`}
              onClick={() => setDifficulty(d)}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 22 }}>
        <span className="field-label">Question types</span>
        <div className="chip-row">
          {QUESTION_TYPES.map((t) => (
            <button
              key={t}
              className={`chip cyan ${types.includes(t) ? 'active' : ''}`}
              onClick={() => toggleType(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <span className="field-label">Number of questions</span>
        <div className="count-stepper">
          <button onClick={() => setCount((c) => Math.max(3, c - 1))}>
            <Minus size={14} />
          </button>
          <span className="count-stepper-value mono">{count}</span>
          <button onClick={() => setCount((c) => Math.min(25, c + 1))}>
            <Plus size={14} />
          </button>
        </div>
      </div>

      <button className="btn btn-primary btn-block" disabled={!canGenerate} onClick={handleGenerate}>
        <Wand2 size={15} />
        Generate quiz
      </button>
    </div>
  )
}
