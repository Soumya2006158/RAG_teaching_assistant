# Signal — RAG Study Tutor (Frontend)

A dark-themed React frontend for a RAG-powered study tutor: an AI Tutor chat grounded in
course material, a configurable quiz generator, and progress tracking across Economics,
Computer Networks, and AI/ML.

## Getting started

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

## Connecting your Python backend

All backend calls live in `src/services/api.js`. Set the base URL of your API in a `.env`
file at the project root:

```
VITE_API_BASE_URL=http://localhost:8000
```

Expected endpoints:

- `POST /api/tutor/ask` — `{ subject, question, groundInCourse }` → `{ answer, sources }`
- `POST /api/quiz/generate` — `{ subject, topic, difficulty, count, types }` → `{ questions }`
- `GET /api/progress/summary?subject=...` → `{ quizAverage, streak, accuracy, studyTime, weeklyActivity }`

Every function in `api.js` falls back to local mock data if the backend request fails, so
the UI stays fully interactive during frontend development.

## Structure

```
src/
├── components/     Reusable UI: Sidebar, Topbar, StatCard, dashboard preview cards
├── pages/          Dashboard, Tutor, QuizGenerator, QuizScreen, Progress, Profile, Settings
├── services/api.js RAG API service layer
├── styles.css       Design tokens + component styles (dark theme)
├── App.jsx          Routing + global app context (subject, settings)
└── main.jsx          Entry point
```
