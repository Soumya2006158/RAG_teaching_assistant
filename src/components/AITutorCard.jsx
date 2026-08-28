import React, { useState } from "react";
import { Bot, Send, Sparkles, ExternalLink, LoaderCircle } from "lucide-react";
import { askTutor } from "../services/api";

export default function AITutorCard({ subject, onOpen }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e?.preventDefault();
    if (!question.trim() || loading) return;

    const q = question.trim();
    setMessages((m) => [...m, { role: "user", text: q }]);
    setQuestion("");
    setLoading(true);

    const result = await askTutor(q, subject);
    setMessages((m) => [
      ...m,
      {
        role: "assistant",
        text: result.answer,
        sources: result.sources || []
      }
    ]);
    setLoading(false);
  }

  const suggestions = [
    "Explain price elasticity",
    "Summarize demand and supply",
    "Explain in simple terms"
  ];

  return (
    <section className="panel tutor-card">
      <div className="panel-heading">
        <div className="heading-icon purple"><Sparkles size={21} /></div>
        <div>
          <h2>AI Tutor</h2>
          <p>Ask, learn, understand.</p>
        </div>
        <span className="online"><i /> Online</span>
      </div>

      <div className="chat-area">
        {messages.length === 0 ? (
          <div className="tutor-empty">
            <div className="tutor-orb"><Bot size={38} /></div>
            <h3>Ask your AI Teaching Assistant</h3>
            <p>
              Get answers from your <strong>{subject}</strong> course material
              using Retrieval-Augmented Generation.
            </p>
            <div className="capabilities">
              <span>Concept explanations</span>
              <span>Topic summaries</span>
              <span>Exam preparation</span>
            </div>
          </div>
        ) : (
          <div className="messages">
            {messages.map((msg, i) => (
              <div key={i} className={`message-row ${msg.role}`}>
                {msg.role === "assistant" && <div className="small-bot"><Bot size={16} /></div>}
                <div className="message-bubble">
                  {msg.text}
                  {msg.sources?.length > 0 && (
                    <div className="sources">
                      <div className="sources-title">Retrieved sources</div>
                      {msg.sources.map((s, j) => (
                        <div className="source-item" key={j}>
                          <div>
                            <strong>{s.title}</strong>
                            <span>{s.detail}</span>
                          </div>
                          <ExternalLink size={14} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="message-row assistant">
                <div className="small-bot"><Bot size={16} /></div>
                <div className="message-bubble typing"><LoaderCircle size={17} className="spin" /> Retrieving context...</div>
              </div>
            )}
          </div>
        )}
      </div>

      <form className="ask-form" onSubmit={submit}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask anything about your subject..."
        />
        <button type="submit" aria-label="Send question"><Send size={19} /></button>
      </form>

      <div className="suggestions">
        <span>Try asking:</span>
        {suggestions.map((s) => (
          <button key={s} onClick={() => setQuestion(s)}>{s}</button>
        ))}
      </div>

      {onOpen && messages.length > 0 && (
        <button className="text-button" onClick={onOpen}>Open full tutor →</button>
      )}
    </section>
  );
}