import React from "react";
import { BookOpen, Trophy, Flame, Zap, MessageCircle, BrainCircuit, BarChart3 } from "lucide-react";
import StatCard from "../components/StatCard";
import AITutorCard from "../components/AITutorCard";
import QuizGeneratorCard from "../components/QuizGeneratorCard";
import ProgressCard from "../components/ProgressCard";

export default function Dashboard({ subject, setActive, onGenerated }) {
  return (
    <div className="page">
      <div className="welcome">
        <div>
          <h1>Good morning, Soumya <span>👋</span></h1>
          <p>Your AI-powered study companion.</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon={<Trophy size={25} />} value="82%" label="Avg. Quiz Score" accent="gold" note="↑ 6% from last week" />
        <StatCard icon={<Flame size={25} />} value="7" label="Day Streak" accent="orange" note="Keep it up! 🔥" />
        <StatCard icon={<Zap size={25} />} value="1,245" label="XP Earned" accent="purple" note="Level 6 Learner" />
      </div>

      <div className="dashboard-grid">
        <AITutorCard subject={subject} onOpen={() => setActive("tutor")} />
        <div className="right-stack">
          <QuizGeneratorCard subject={subject} onGenerated={onGenerated} />
          <ProgressCard onOpen={() => setActive("progress")} />
        </div>
      </div>

      <section className="quick-actions">
        <div className="quick-title"><Zap size={19} /> Quick Actions</div>
        <div className="quick-grid">
          <button onClick={() => setActive("tutor")}><MessageCircle size={22} /><span><strong>Ask AI Tutor</strong><small>Get instant answers</small></span></button>
          <button onClick={() => setActive("quiz")}><BrainCircuit size={22} /><span><strong>Take Quiz</strong><small>Test your knowledge</small></span></button>
          <button onClick={() => setActive("progress")}><BarChart3 size={22} /><span><strong>Check Progress</strong><small>Track your learning</small></span></button>
        </div>
      </section>
    </div>
  );
}