import React, { useState } from "react";

export default function Settings() {
  const [grounded, setGrounded] = useState(true);
  const [sources, setSources] = useState(true);

  return (
    <div className="page narrow-page">
      <div className="page-title"><h1>Settings</h1><p>Configure how your AI teaching assistant behaves.</p></div>
      <section className="panel settings-panel">
        <Setting title="Ground answers in course material" description="Prefer retrieved context before generating an answer." value={grounded} setValue={setGrounded} />
        <Setting title="Show retrieved sources" description="Display the source chunks used for AI answers." value={sources} setValue={setSources} />
      </section>
    </div>
  );
}

function Setting({ title, description, value, setValue }) {
  return (
    <div className="setting">
      <div><strong>{title}</strong><p>{description}</p></div>
      <button className={`toggle ${value ? "on" : ""}`} onClick={() => setValue(!value)}><span /></button>
    </div>
  );
}