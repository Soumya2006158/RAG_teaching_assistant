import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Sparkles, Send, BookOpen } from 'lucide-react'
import { useAppContext } from '../App.jsx'
import { askTutor } from '../services/api.js'

const SUGGESTED = {
  Economics: [
    'What is the difference between fiscal and monetary policy?',
    'Explain opportunity cost with an example',
    'How does inflation affect purchasing power?',
  ],
  'Computer Networks': [
    'Walk me through the TCP three-way handshake',
    'What\u2019s the difference between TCP and UDP?',
    'How does DNS resolution work?',
  ],
  'AI / ML': [
    'What is overfitting and how do I prevent it?',
    'Explain gradient descent simply',
    'What\u2019s the bias-variance tradeoff?',
  ],
}

export default function Tutor() {
  const { subject, groundInCourse, showSources } = useAppContext()
  const location = useLocation()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (location.state?.prompt) {
      send(location.state.prompt)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  async function send(text) {
    const question = (text ?? input).trim()
    if (!question || loading) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text: question }])
    setLoading(true)
    try {
      const res = await askTutor({ subject, question, groundInCourse })
      setMessages((m) => [...m, { role: 'ai', text: res.answer, sources: res.sources }])
    } finally {
      setLoading(false)
    }
  }

  const prompts = SUGGESTED[subject] || SUGGESTED.Economics

  return (
    <div className="tutor-layout">
      <div className="panel panel-pad">
        {messages.length === 0 ? (
          <div className="empty-state">
            <Sparkles />
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', maxWidth: 320, margin: '0 auto' }}>
              Ask anything about <strong style={{ color: 'var(--text-primary)' }}>{subject}</strong>.
              Answers are grounded in your course material with sources shown below each response.
            </p>
          </div>
        ) : (
          <div className="chat-scroll" ref={scrollRef}>
            {messages.map((m, i) =>
              m.role === 'user' ? (
                <div className="msg-user" key={i}>
                  {m.text}
                </div>
              ) : (
                <div className="msg-ai" key={i}>
                  <div className="msg-ai-avatar">
                    <Sparkles />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="msg-ai-body">
                      {m.text}
                      {showSources && m.sources && m.sources.length > 0 && (
                        <div className="retrieval-trace">
                          <div className="retrieval-trace-label">Retrieved from course material</div>
                          {m.sources.map((s, j) => (
                            <div className="source-node" key={j}>
                              <span className="source-node-tag">{s.tag}</span>
                              <span className="source-node-title">{s.title}</span>
                              <span className="source-node-score mono">{Math.round(s.score * 100)}%</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            )}
            {loading && (
              <div className="msg-ai">
                <div className="msg-ai-avatar">
                  <Sparkles />
                </div>
                <div className="msg-ai-body">
                  <span className="typing-dots">
                    <span /><span /><span />
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="chat-input-row">
          <input
            className="text-input"
            placeholder={`Ask a question about ${subject}\u2026`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <button className="btn btn-primary" onClick={() => send()} disabled={loading || !input.trim()}>
            {loading ? <span className="spinner" /> : <Send size={15} />}
            Ask
          </button>
        </div>
      </div>

      <div className="panel panel-pad">
        <div className="section-heading">
          <h2 style={{ fontSize: 14 }}>
            <BookOpen size={14} style={{ marginRight: 6, verticalAlign: -2, color: 'var(--cyan)' }} />
            Suggested
          </h2>
        </div>
        <div className="suggested-prompts">
          {prompts.map((p) => (
            <button key={p} className="suggested-prompt" onClick={() => send(p)}>
              {p}
            </button>
          ))}
        </div>

        <div className="retrieval-toggle-box">
          <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
            {groundInCourse ? (
              <>Grounding: <span style={{ color: 'var(--cyan)' }}>ON</span>{' \u2014 answers cite course sources.'}</>
            ) : (
              <>Grounding: <span style={{ color: 'var(--text-tertiary)' }}>OFF</span>{' \u2014 change this in Settings.'}</>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
