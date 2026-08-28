import React, { useState } from "react";
import { Search, X } from "lucide-react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import Tutor from "./pages/Tutor";
import QuizGenerator from "./pages/QuizGenerator";
import Progress from "./pages/Progress";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

export default function App() {
  const [active, setActive] = useState("dashboard");
  const [subject, setSubject] = useState("Economics");
  const [quizConfig, setQuizConfig] = useState(null);

  function generatedQuiz(config) {
    setQuizConfig(config);
    setActive("quiz");
  }

  function renderPage() {
    switch (active) {
      case "tutor": return <Tutor subject={subject} />;
      case "quiz": return <QuizGenerator subject={subject} initialConfig={quizConfig} />;
      case "progress": return <Progress />;
      case "profile": return <Profile />;
      case "settings": return <Settings />;
      default:
        return <Dashboard subject={subject} setActive={setActive} onGenerated={generatedQuiz} />;
    }
  }

  return (
    <div className="app-shell">
      <Sidebar active={active} setActive={setActive} subject={subject} setSubject={setSubject} />
      <main className="main">
        <Topbar />
        {renderPage()}
      </main>
    </div>
  );
}