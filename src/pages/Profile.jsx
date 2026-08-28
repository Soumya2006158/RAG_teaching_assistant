import React from "react";
import { UserRound, Mail, Award } from "lucide-react";

export default function Profile() {
  return (
    <div className="page narrow-page">
      <div className="page-title"><h1>Profile</h1><p>Your learner profile and achievements.</p></div>
      <section className="panel profile-panel">
        <div className="large-avatar">SR</div>
        <h2>Soumya</h2>
        <p>Level 6 Learner</p>
        <div className="profile-details">
          <div><UserRound size={18} /> Student</div>
          <div><Mail size={18} /> Student account</div>
          <div><Award size={18} /> 1,245 XP</div>
        </div>
      </section>
    </div>
  );
}