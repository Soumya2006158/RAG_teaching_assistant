import React from "react";
import { Search, Bell } from "lucide-react";

export default function Topbar() {
  return (
    <header className="topbar">
      <div className="top-search">
        <Search size={18} />
        <input placeholder="Search anything..." />
      </div>
      <button className="icon-button notification">
        <Bell size={20} />
        <span />
      </button>
      <div className="avatar top-avatar">SR</div>
    </header>
  );
}