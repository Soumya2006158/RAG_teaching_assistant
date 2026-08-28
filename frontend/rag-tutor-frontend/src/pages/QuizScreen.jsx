import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, RotateCcw, Sparkles } from 'lucide-react'
import { useAppContext } from '../App.jsx'
import { generateQuiz } from '../services/api.js'

export default function QuizScreen() {
  const navigate = useNavigate()
  const { quizConfig, setQuizConfig, subject } = useAppContext()
  const [questions, setQuestions] = useState(null)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [revealed, setRevealed] = useState({})
  const [numericDraft, setNumericDraft] = useState('')
  const [finished, setFinished] = useState(false)

  const config = quizConfig || { subject, topic: subject, difficulty: 'Medium', count: 8, types: ['MCQ'] }

  useEffect(() => {
    let active = true
    generateQuiz(config).then((res) => {
      if (active) setQuestions(res.questions)
    })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!questions) {
    return (
      <div className="panel panel-pad empty-state" style={{ maxWidth: 640, margin: '0 auto' }}>
        <span className="spinner" style={{ margin: '0 auto 14px' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>Generating your quiz\u2026</p>
      </div>
    )
  }

  const total = questions.length
  const q = questions[index]
  const selected = answers[q.id]
  const isRevealed = !!revealed[q.id]

  function selectOption(i) {
    if (isRevealed) return
    setAnswers((a) => ({ ...a, [q.id]: i }))
    setRevealed((r) => ({ ...r, [q.id]: true }))
  }

  function submitNumeric() {
    if (isRevealed || !numericDraft.trim()) return
    setAnswers((a) => ({ ...a, [q.id]: numericDraft.trim() }))
    setRevealed((r) => ({ ...r, [q.id]: true }))
  }

  function goNext() {
    if (index < total - 1) {
      setIndex((i) => i + 1)
      setNumericDraft('')
    } else {
      setFinished(true)
    }
  }

  function goPrev() {
    if (index > 0) {
      setIndex((i) => i - 1)
      setNumericDraft('')
    }
  }

  function retry() {
    setAnswers({})
    setRevealed({})
    setIndex(0)
    setFinished(false)
    setNumericDraft('')
  }

  function generateAnother() {
    setQuizConfig(config)
    setQuestions(null)
    retry()
    generateQuiz(config).then((res) => setQuestions(res.questions))
  }

  if (finished) {
    const correct = questions.filter((qq) => isCorrect(qq, answers[qq.id])).length
    const pct = Math.round((correct / total) * 100)
    return (
      <div className="panel panel-pad score-screen" style={{ maxWidth: 520, margin: '0 auto' }}>
        <Sparkles size={22} color="var(--amber)" style={{ marginBottom: 10 }} />
        <h2 style={{ fontSize: 15, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 6 }}>
          Quiz complete
        </h2>
        <div className="score-ring-value mono">{pct}%</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '10px 0 28px' }}>
          {correct} of {total} correct \u2014 {config.topic || config.subject} \u00b7 {config.difficulty}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-ghost" onClick={retry}>
            <RotateCcw size={14} /> Retry
          </button>
          <button className="btn btn-primary" onClick={generateAnother}>
            Generate another
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/progress')}>
            View progress
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="panel panel-pad" style={{ maxWidth: 640, margin: '0 auto' }}>
      <div className="quiz-progress-track">
        <div className="quiz-progress-fill" style={{ width: `${((index + 1) / total) * 100}%` }} />
      </div>
      <div className="quiz-meta-row">
        <span>
          QUESTION {index + 1} / {total}
        </span>
        <span>{q.type?.toUpperCase()} \u00b7 {config.difficulty?.toUpperCase()}</span>
      </div>

      <div className="quiz-question">{q.prompt}</div>

      {q.options ? (
        <div className="option-list">
          {q.options.map((opt, i) => {
            let cls = 'option-item'
            if (isRevealed) {
              if (i === q.answer) cls += ' correct'
              else if (i === selected) cls += ' incorrect'
            } else if (selected === i) {
              cls += ' selected'
            }
            return (
              <button key={i} className={cls} onClick={() => selectOption(i)}>
                <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                {opt}
              </button>
            )
          })}
        </div>
      ) : (
        <div style={{ marginBottom: 24 }}>
          <input
            className="number-input"
            type="text"
            inputMode="decimal"
            placeholder="Type your answer\u2026"
            value={isRevealed ? String(selected) : numericDraft}
            onChange={(e) => setNumericDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitNumeric()}
            disabled={isRevealed}
            style={
              isRevealed
                ? {
                    borderColor: isCorrect(q, selected) ? 'var(--green)' : 'var(--red)',
                  }
                : undefined
            }
          />
          {!isRevealed && (
            <button className="btn btn-primary" style={{ marginTop: 10 }} onClick={submitNumeric}>
              Submit answer
            </button>
          )}
          {isRevealed && !isCorrect(q, selected) && (
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>
              Correct answer: <span className="mono">{q.answer}</span>
            </p>
          )}
        </div>
      )}

      {isRevealed && q.explanation && (
        <div
          style={{
            fontSize: 12.5,
            color: 'var(--text-secondary)',
            background: 'var(--bg-alt)',
            border: '1px solid var(--border-soft)',
            borderRadius: 10,
            padding: '12px 14px',
            marginBottom: 22,
          }}
        >
          {q.explanation}
        </div>
      )}

      <div className="quiz-nav-row">
        <button className="btn btn-ghost" onClick={goPrev} disabled={index === 0}>
          <ArrowLeft size={14} /> Previous
        </button>
        <button className="btn btn-primary" onClick={goNext} disabled={!isRevealed}>
          {index === total - 1 ? 'Finish' : 'Next'} <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}

function isCorrect(q, given) {
  if (given === undefined) return false
  if (q.options) return given === q.answer
  return String(given).trim() === String(q.answer).trim()
}
