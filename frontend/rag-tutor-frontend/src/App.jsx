import React, { createContext, useContext, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import Topbar from './components/Topbar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Tutor from './pages/Tutor.jsx'
import QuizGenerator from './pages/QuizGenerator.jsx'
import QuizScreen from './pages/QuizScreen.jsx'
import Progress from './pages/Progress.jsx'
import Profile from './pages/Profile.jsx'
import Settings from './pages/Settings.jsx'

export const SUBJECTS = ['Economics', 'Computer Networks', 'AI / ML']

const AppContext = createContext(null)
export const useAppContext = () => useContext(AppContext)

const PAGE_META = {
  '/': { eyebrow: 'Dashboard', title: 'Welcome back' },
  '/tutor': { eyebrow: 'AI Tutor', title: 'Ask about your course material' },
  '/quiz': { eyebrow: 'Quiz Generator', title: 'Build a practice set' },
  '/progress': { eyebrow: 'Progress', title: 'How you\u2019re trending' },
  '/profile': { eyebrow: 'Profile', title: 'Your account' },
  '/settings': { eyebrow: 'Settings', title: 'Tutor preferences' },
}

export default function App() {
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [groundInCourse, setGroundInCourse] = useState(true)
  const [showSources, setShowSources] = useState(true)
  const [quizConfig, setQuizConfig] = useState(null)

  const value = {
    subject,
    setSubject,
    groundInCourse,
    setGroundInCourse,
    showSources,
    setShowSources,
    quizConfig,
    setQuizConfig,
  }

  return (
    <AppContext.Provider value={value}>
      <div className="app-shell">
        <Sidebar />
        <div className="app-main">
          <RoutedTopbarAndPages />
        </div>
      </div>
    </AppContext.Provider>
  )
}

function RoutedTopbarAndPages() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Page meta={PAGE_META['/']}>
            <Dashboard />
          </Page>
        }
      />
      <Route
        path="/tutor"
        element={
          <Page meta={PAGE_META['/tutor']}>
            <Tutor />
          </Page>
        }
      />
      <Route
        path="/quiz"
        element={
          <Page meta={PAGE_META['/quiz']}>
            <QuizGenerator />
          </Page>
        }
      />
      <Route
        path="/quiz/play"
        element={
          <Page meta={{ eyebrow: 'Quiz', title: 'In progress' }} hideTopbarExtras>
            <QuizScreen />
          </Page>
        }
      />
      <Route
        path="/progress"
        element={
          <Page meta={PAGE_META['/progress']}>
            <Progress />
          </Page>
        }
      />
      <Route
        path="/profile"
        element={
          <Page meta={PAGE_META['/profile']}>
            <Profile />
          </Page>
        }
      />
      <Route
        path="/settings"
        element={
          <Page meta={PAGE_META['/settings']}>
            <Settings />
          </Page>
        }
      />
    </Routes>
  )
}

function Page({ meta, children, hideTopbarExtras }) {
  return (
    <>
      <Topbar eyebrow={meta.eyebrow} title={meta.title} hideExtras={hideTopbarExtras} />
      <div className="page-body">{children}</div>
    </>
  )
}
