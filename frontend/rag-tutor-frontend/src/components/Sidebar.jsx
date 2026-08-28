import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutGrid,
  MessageCircleQuestion,
  ListChecks,
  LineChart,
  UserRound,
  Settings as SettingsIcon,
  Flame,
  Radio,
} from 'lucide-react'

const LINKS = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid, end: true },
  { to: '/tutor', label: 'AI Tutor', icon: MessageCircleQuestion },
  { to: '/quiz', label: 'Quiz Generator', icon: ListChecks },
  { to: '/progress', label: 'Progress', icon: LineChart },
  { to: '/profile', label: 'Profile', icon: UserRound },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">
          <Radio size={16} strokeWidth={2.5} />
        </div>
        <div>
          <div className="sidebar-brand-name">Signal</div>
          <span className="sidebar-brand-sub">RAG STUDY TUTOR</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {LINKS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
          >
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-streak">
          <Flame size={14} color="#f2a93b" />
          <span>
            <strong>12</strong> day streak
          </span>
        </div>
      </div>
    </aside>
  )
}
