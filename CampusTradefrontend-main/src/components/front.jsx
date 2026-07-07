import React from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiShield, FiZap, FiUsers, FiStar, FiPackage, FiMessageSquare } from "react-icons/fi";

export default function Front() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060a14] flex flex-col">

      {/* ── Background layers ── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Radial top glow */}
        <div className="absolute inset-x-0 top-0 h-[600px]"
          style={{ background: "radial-gradient(ellipse 90% 60% at 50% 0%, rgba(99,102,241,0.18) 0%, transparent 70%)" }} />
        {/* Floating orbs */}
        <div className="ct-float-a absolute top-1/4 left-[8%] w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)" }} />
        <div className="ct-float-b absolute top-[35%] right-[5%] w-[420px] h-[420px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)" }} />
        <div className="ct-float-a absolute bottom-[10%] left-[35%] w-[380px] h-[380px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)" }} />
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
        {/* Top accent line */}
        <div className="absolute top-0 inset-x-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.8) 40%, rgba(168,85,247,0.8) 60%, transparent 100%)" }} />
      </div>

      {/* ── Navbar ── */}
      <nav className="relative z-20 flex items-center justify-between px-8 sm:px-16 py-5 ct-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30"
            style={{ background: "linear-gradient(135deg, #6366f1, #4338ca)" }}>
            <span className="text-white font-black text-sm">C</span>
          </div>
          <span className="font-black text-xl"
            style={{ background: "linear-gradient(135deg,#c7d2fe,#a5b4fc,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            CampusTrade
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login"
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-all duration-200"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            Sign In
          </Link>
          <Link to="/signup"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.03] shadow-lg shadow-indigo-500/25"
            style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}>
            Get Started <FiArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-16">

        {/* Live badge */}
        <div className="ct-fade-up flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-semibold mb-8 cursor-default"
          style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", color: "#a5b4fc" }}>
          <span className="relative flex h-2 w-2">
            <span className="ct-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          Campus marketplace · Live now
        </div>

        {/* Main heading */}
        <h1 className="ct-fade-up ct-d1 font-black leading-[0.88] tracking-tight mb-6"
          style={{ fontSize: "clamp(4rem, 12vw, 9rem)" }}>
          <span className="block"
            style={{ background: "linear-gradient(135deg,#e0e7ff 0%,#c7d2fe 35%,#a5b4fc 60%,#818cf8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Campus
          </span>
          <span className="block"
            style={{ background: "linear-gradient(135deg,#818cf8 0%,#6366f1 40%,#4f46e5 70%,#3730a3 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Trade
          </span>
        </h1>

        {/* Subheading */}
        <p className="ct-fade-up ct-d2 text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed mb-10 font-light">
          Rent books, gadgets, and gear from fellow students.
          Secure payments · Real-time chat ·{" "}
          <span className="text-slate-200 font-medium">Zero hassle.</span>
        </p>

        {/* CTA row */}
        <div className="ct-fade-up ct-d3 flex flex-col sm:flex-row items-center gap-4 mb-20">
          <Link to="/signup"
            className="group flex items-center gap-3 px-10 py-4 rounded-2xl text-base font-bold text-white shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/45 hover:scale-[1.02] transition-all duration-250"
            style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5,#4338ca)" }}>
            Start Renting Free
            <FiArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
          <Link to="/login"
            className="flex items-center gap-2 px-10 py-4 rounded-2xl text-base font-medium text-slate-300 hover:text-white hover:scale-[1.01] transition-all duration-200"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
            I have an account
          </Link>
        </div>

        {/* Feature cards row */}
        <div className="ct-fade-up ct-d4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 w-full max-w-4xl">
          {[
            { icon: FiShield, label: "Secure Pay", color: "#6366f1", dim: "99,102,241" },
            { icon: FiZap, label: "Instant List", color: "#10b981", dim: "16,185,129" },
            { icon: FiUsers, label: "Campus Only", color: "#a78bfa", dim: "167,139,250" },
            { icon: FiStar, label: "Rated Items", color: "#f59e0b", dim: "245,158,11" },
            { icon: FiMessageSquare, label: "Live Chat", color: "#06b6d4", dim: "6,182,212" },
            { icon: FiPackage, label: "Track Orders", color: "#ec4899", dim: "236,72,153" },
          ].map(({ icon: Icon, label, color, dim }) => (
            <div key={label}
              className="flex flex-col items-center gap-2.5 p-4 rounded-2xl cursor-default hover:-translate-y-1 transition-transform duration-200"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `rgba(${dim},0.12)`, border: `1px solid rgba(${dim},0.22)` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <p className="text-xs font-semibold text-slate-300">{label}</p>
            </div>
          ))}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 text-center py-6">
        <p className="text-xs text-slate-600">© 2026 CampusTrade — Built for students, by students</p>
      </footer>
    </div>
  );
}
