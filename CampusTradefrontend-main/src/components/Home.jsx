import React, { useState } from "react";
import { useUserContext } from "../context/userContext";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiMenu, FiX, FiUpload, FiList, FiBell, FiSearch,
  FiLogOut, FiLock, FiChevronDown, FiPackage, FiGrid, FiFilter,
} from "react-icons/fi";

export default function Home() {
  const { globaldata, user, setUser, accessToken } = useUserContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("name");
  const [priceSortOrder, setPriceSortOrder] = useState("asc");
  const [showAvailableOnly, setShowAvailableOnly] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [password, setPassword] = useState("");
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogout = async () => {
    try { await axios.post("/api/logout", {}, { withCredentials: true }); navigate("/login"); }
    catch { console.error("Logout failed"); }
  };

  const handleSavePw = async () => {
    setIsEditing(false);
    try {
      const res = await axios.post("/api/update-password", { password },
        { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
      showToast(res.data.message, res.data.success ? "success" : "error");
    } catch { showToast("Something went wrong", "error"); }
    setPassword("");
  };

  const filteredData = (globaldata || []).filter(item => {
    const matchSearch = searchType === "name"
      ? item.name.toLowerCase().includes(searchQuery.toLowerCase())
      : item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchAvail = showAvailableOnly ? (!item.status || item.status === "available") : true;
    return matchSearch && matchAvail;
  });
  const sortedData = [...filteredData].sort((a, b) =>
    priceSortOrder === "asc" ? a.price_per_day - b.price_per_day : b.price_per_day - a.price_per_day
  );

  const navLinks = [
    { to: "/uploadItem", icon: FiUpload,  label: "Upload" },
    { to: "/upload",    icon: FiList,    label: "My Listings" },
    { to: "/rental-history", icon: FiPackage, label: "Rentals" },
    { to: "/notifications",  icon: FiBell,   label: "Alerts" },
  ];

  return (
    <div className="min-h-screen bg-[#060a14] relative">

      {/* ── Ambient background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-60 -right-60 w-[800px] h-[800px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 65%)" }} />
        <div className="absolute top-1/2 -left-60 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 65%)" }} />
        <div className="absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed top-5 right-5 z-[200] flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-semibold shadow-2xl ct-slide-right"
          style={{
            background: toast.type === "error" ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)",
            border: `1px solid ${toast.type === "error" ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
            color: toast.type === "error" ? "#f87171" : "#34d399",
            backdropFilter: "blur(20px)",
          }}>
          <span>{toast.type === "error" ? "⚠️" : "✓"}</span>{toast.msg}
        </div>
      )}

      {/* ── Sidebar Overlay ── */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 ct-fade-in" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
          onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`fixed inset-y-0 left-0 w-[300px] z-50 flex flex-col transition-transform duration-300 ease-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "rgba(8,12,24,0.97)", backdropFilter: "blur(24px)", borderRight: "1px solid rgba(255,255,255,0.07)" }}>

        {/* Top accent */}
        <div className="absolute top-0 inset-x-0 h-px"
          style={{ background: "linear-gradient(90deg, rgba(99,102,241,0.8), rgba(168,85,247,0.5))" }} />

        <div className="flex flex-col h-full p-7">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#6366f1,#4338ca)" }}>
                <span className="text-white font-black text-sm">C</span>
              </div>
              <span className="font-black text-base"
                style={{ background: "linear-gradient(135deg,#c7d2fe,#a5b4fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                CampusTrade
              </span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all">
              <FiX size={16} />
            </button>
          </div>

          {/* Avatar card */}
          <div className="flex items-center gap-3 p-4 rounded-2xl mb-6"
            style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.14)" }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black text-indigo-300 shrink-0"
              style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.25),rgba(139,92,246,0.25))", border: "1px solid rgba(99,102,241,0.3)" }}>
              {user ? user.charAt(0).toUpperCase() : "?"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate">{user}</p>
              <p className="text-[11px] text-slate-500">Campus Member</p>
            </div>
          </div>

          {/* Nav links */}
          <nav className="space-y-1.5 flex-1">
            {isEditing ? (
              <div className="space-y-3 p-1">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">New Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-4 py-3 rounded-xl text-sm text-slate-100 placeholder-slate-600 outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                <div className="flex gap-2">
                  <button onClick={handleSavePw}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ background: "linear-gradient(135deg,#059669,#10b981)" }}>Save</button>
                  <button onClick={() => { setIsEditing(false); setPassword(""); }}
                    className="px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-slate-200 transition-colors"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                {navLinks.map(({ to, icon: Icon, label }) => (
                  <Link key={to} to={to} onClick={() => setIsSidebarOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-100 transition-all duration-200 group"
                    style={{ border: "1px solid transparent" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.08)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.15)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ""; e.currentTarget.style.borderColor = "transparent"; }}>
                    <Icon size={15} className="text-indigo-400" />{label}
                  </Link>
                ))}
                <button onClick={() => setIsEditing(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-100 transition-all duration-200 mt-1"
                  style={{ border: "1px solid transparent" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.08)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.15)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = ""; e.currentTarget.style.borderColor = "transparent"; }}>
                  <FiLock size={15} className="text-indigo-400" />Change Password
                </button>
              </>
            )}
          </nav>

          {/* Sign out */}
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:text-red-300 transition-all duration-200"
            style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.14)" }}>
            <FiLogOut size={15} />Sign Out
          </button>
        </div>
      </aside>

      {/* ── Navbar ── */}
      <header className="fixed top-0 inset-x-0 z-30"
        style={{ background: "rgba(6,10,20,0.88)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {/* Top accent line */}
        <div className="absolute top-0 inset-x-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.7) 40%, rgba(168,85,247,0.7) 60%, transparent 100%)" }} />

        <div className="max-w-7xl mx-auto flex items-center justify-between px-5 py-3 gap-4">
          {/* Left */}
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all border border-white/5">
              <FiMenu size={18} />
            </button>
            <Link to="/home" className="hidden sm:flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#6366f1,#4338ca)" }}>
                <span className="text-white font-black text-xs">C</span>
              </div>
              <span className="font-black text-base"
                style={{ background: "linear-gradient(135deg,#c7d2fe,#a5b4fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                CampusTrade
              </span>
            </Link>
          </div>

          {/* Center nav links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navLinks.map(({ to, icon: Icon, label }) => (
              <Link key={to} to={to}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium text-slate-400 hover:text-slate-100 transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.1)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)"; e.currentTarget.style.color = "#a5b4fc"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = ""; }}>
                <Icon size={14} />{label}
              </Link>
            ))}
          </nav>

          {/* Right – search bar */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="relative">
                <select value={searchType} onChange={e => setSearchType(e.target.value)}
                  className="appearance-none bg-transparent text-slate-400 text-xs font-semibold pl-3 pr-7 py-2.5 outline-none cursor-pointer">
                  <option value="name"     className="bg-[#0d1220]">Name</option>
                  <option value="category" className="bg-[#0d1220]">Category</option>
                </select>
                <FiChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
              </div>
              <div className="w-px h-5" style={{ background: "rgba(255,255,255,0.08)" }} />
              <div className="flex items-center gap-2 px-3">
                <FiSearch size={13} className="text-slate-500 shrink-0" />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search…"
                  className="bg-transparent text-slate-300 text-sm w-28 lg:w-44 py-2.5 outline-none placeholder-slate-600" />
              </div>
            </div>
            <div className="relative hidden sm:block">
              <select value={priceSortOrder} onChange={e => setPriceSortOrder(e.target.value)}
                className="appearance-none text-slate-400 text-xs font-semibold pl-3 pr-7 py-2.5 rounded-xl outline-none cursor-pointer"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <option value="asc"  className="bg-[#0d1220]">Price ↑</option>
                <option value="desc" className="bg-[#0d1220]">Price ↓</option>
              </select>
              <FiChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
            </div>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="relative z-10 pt-20 pb-16 px-5 sm:px-8 lg:px-10">
        <div className="max-w-7xl mx-auto">

          {/* Section title row */}
          <div className="flex items-center justify-between flex-wrap gap-4 mb-8 ct-fade-up">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}>
                <FiGrid size={17} className="text-indigo-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Marketplace</h1>
                <p className="text-xs text-slate-500">
                  {sortedData.length} {sortedData.length === 1 ? "item" : "items"}{" "}
                  {showAvailableOnly ? "available to rent" : "total"}
                </p>
              </div>
            </div>
            <button onClick={() => setShowAvailableOnly(p => !p)}
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200"
              style={showAvailableOnly
                ? { background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.28)", color: "#34d399" }
                : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#64748b" }}>
              <FiFilter size={12} />
              {showAvailableOnly ? "Available Only" : "Show All"}
              <span className={`w-1.5 h-1.5 rounded-full ${showAvailableOnly ? "ct-pulse" : ""}`}
                style={{ background: showAvailableOnly ? "#10b981" : "#334155" }} />
            </button>
          </div>

          {/* Empty state */}
          {sortedData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 ct-fade-up">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <FiSearch size={32} className="text-slate-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-300 mb-1">No items found</h3>
              <p className="text-sm text-slate-500 mb-5">Try adjusting your search or switching to "Show All"</p>
              {showAvailableOnly && (
                <button onClick={() => setShowAvailableOnly(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-indigo-300 transition-all"
                  style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
                  Show All Items
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {sortedData.map((item, i) => (
                <Link key={item._id} to={`/show/${item._id}`}
                  className="group block rounded-2xl overflow-hidden ct-card ct-card-in"
                  style={{ animationDelay: `${Math.min(i * 0.04, 0.32)}s`, background: "rgba(13,18,32,0.8)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(12px)" }}>

                  {/* Image */}
                  <div className="relative h-52 overflow-hidden">
                    <img src={item.Image_url} alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    {/* Gradient */}
                    <div className="absolute inset-0"
                      style={{ background: "linear-gradient(to top, rgba(6,10,20,0.96) 0%, rgba(6,10,20,0.3) 50%, transparent 100%)" }} />

                    {/* Category */}
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                        style={{ background: "rgba(99,102,241,0.22)", backdropFilter: "blur(12px)", border: "1px solid rgba(99,102,241,0.35)", color: "#c7d2fe" }}>
                        {item.category}
                      </span>
                    </div>

                    {/* Status */}
                    {item.status && item.status !== "available" && (
                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                          style={item.status === "rented"
                            ? { background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.35)", color: "#fbbf24" }
                            : { background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.35)", color: "#a5b4fc" }}>
                          {item.status}
                        </span>
                      </div>
                    )}

                    {/* Price */}
                    <div className="absolute bottom-3 left-4">
                      <span className="text-xl font-extrabold"
                        style={{ background: "linear-gradient(135deg,#6ee7b7,#34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        ₹{item.price_per_day}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">/day</span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-4 ct-underline-slide">
                    <h3 className="text-sm font-semibold text-slate-200 truncate mb-3 group-hover:text-indigo-300 transition-colors duration-300">
                      {item.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-600">View details →</span>
                      <span className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 group-hover:text-indigo-400 group-hover:bg-indigo-500/15 transition-all duration-300"
                        style={{ background: "rgba(255,255,255,0.04)" }}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
