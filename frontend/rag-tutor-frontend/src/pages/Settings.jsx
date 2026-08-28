import React from 'react'
import { useAppContext } from '../App.jsx'

export default function Settings() {
  const { groundInCourse, setGroundInCourse, showSources, setShowSources } = useAppContext()

  return (
    <div className="panel panel-pad" style={{ maxWidth: 640 }}>
      <div className="section-heading">
        <h2>Tutor behavior</h2>
      </div>

      <div className="settings-row">
        <div>
          <div className="settings-row-title">Ground answers in course material</div>
          <div className="settings-row-sub">
            When on, the AI Tutor retrieves relevant passages from your course content before
            answering, instead of relying on general knowledge.
          </div>
        </div>
        <Toggle on={groundInCourse} onClick={() => setGroundInCourse((v) => !v)} />
      </div>

      <div className="settings-row">
        <div>
          <div className="settings-row-title">Show retrieved sources</div>
          <div className="settings-row-sub">
            Display the passages and documents used to generate each answer, with relevance
            scores.
          </div>
        </div>
        <Toggle on={showSources} onClick={() => setShowSources((v) => !v)} />
      </div>
    </div>
  )
}

function Toggle({ on, onClick }) {
  return (
    <button
      className={`toggle ${on ? 'on' : ''}`}
      onClick={onClick}
      role="switch"
      aria-checked={on}
    >
      <span className="toggle-knob" />
    </button>
  )
}
