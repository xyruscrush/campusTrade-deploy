import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiLogOut, FiUsers, FiAlertTriangle, FiCheckCircle, FiCopy, FiBookOpen } from "react-icons/fi";

export default function CollegeDashboard() {
  const navigate = useNavigate();
  const [collegeInfo, setCollegeInfo] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("collegeToken");
    const info = localStorage.getItem("collegeInfo");
    if (!token || !info) {
      navigate("/login");
      return;
    }
    setCollegeInfo(JSON.parse(info));

    const fetchNotifications = async () => {
      try {
        const res = await axios.get("/api/college/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) {
          setNotifications(res.data.notifications);
        }
      } catch (err) {
        console.error("Failed to fetch college notifications", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("collegeToken");
    localStorage.removeItem("collegeInfo");
    navigate("/login");
  };

  const copyCode = () => {
    if (!collegeInfo) return;
    navigator.clipboard.writeText(collegeInfo.college_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!collegeInfo) return null;

  return (
    <div className="min-h-screen bg-[#060a14] text-slate-100 flex flex-col relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 60%)" }} />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.03]"
          style={{ background: "radial-gradient(circle, #ec4899 0%, transparent 60%)" }} />
      </div>

      {/* Header bar */}
      <header className="relative z-10 px-8 py-5 border-b border-white/5 bg-slate-950/40 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-tr from-indigo-500 to-indigo-700 shadow-lg shadow-indigo-500/20">
            <span className="text-white font-black text-sm">C</span>
          </div>
          <div>
            <span className="font-black text-lg text-white block">CampusTrade Admin</span>
            <span className="text-xs text-slate-500">{collegeInfo.name}</span>
          </div>
        </div>

        <button onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/25 transition-all">
          <FiLogOut size={14} /> Log Out
        </button>
      </header>

      {/* Content body */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Side: College Info & Access Code */}
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-3xl p-6 border border-white/5 bg-slate-900/40 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <FiBookOpen size={20} />
              </div>
              <h3 className="font-bold text-white text-lg">College Portal</h3>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              Welcome to the campus management space for <strong>{collegeInfo.name}</strong>. Here you can monitor unreturned item alerts and students flagged for default.
            </p>

            <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 relative group">
              <span className="block text-[10px] uppercase tracking-widest text-indigo-400 font-bold mb-1.5">Campus Access Code</span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-white font-mono">{collegeInfo.college_code}</span>
                <button onClick={copyCode}
                  className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20 hover:text-white transition-all">
                  {copied ? <FiCheckCircle size={14} className="text-emerald-400" /> : <FiCopy size={14} />}
                </button>
              </div>
            </div>
            <span className="block text-[10px] text-slate-500 mt-2 text-center">Share this code with your students so they can sign up.</span>
          </div>

          <div className="rounded-3xl p-6 border border-white/5 bg-slate-900/40 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-3">
              <FiUsers className="text-indigo-400" />
              <h4 className="font-bold text-sm text-white">Marketplace Safety</h4>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Students must authenticate their signup using a valid access code. This ensures a closed, trusted network inside your university. When defaults occur (exhausted security deposits), student accounts are automatically locked.
            </p>
          </div>
        </div>

        {/* Right Side: Escalations / Notifications */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-3xl p-8 border border-white/5 bg-slate-900/40 backdrop-blur-md min-h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-white text-xl">Active Default Escalations</h3>
                <p className="text-slate-400 text-xs">Flagged student accounts and unresolved rentals</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                {notifications.length} Alerts
              </span>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                  <FiCheckCircle size={22} />
                </div>
                <h4 className="font-bold text-sm text-white">No active defaults</h4>
                <p className="text-slate-500 text-xs max-w-xs mt-1 leading-relaxed">
                  All active rentals are currently within their deposit thresholds. No student accounts are suspended.
                </p>
              </div>
            ) : (
              <div className="space-y-4 flex-1">
                {notifications.map((notif) => (
                  <div key={notif._id}
                    className="p-5 rounded-2xl border border-red-500/15 bg-red-500/[0.02] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:bg-red-500/[0.04]">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-sm font-bold text-white">Account Flagged & Suspended</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Student Email: <strong className="text-slate-200">{notif.recipient}</strong>
                      </p>
                      <p className="text-xs text-slate-400">
                        Item Rented: <strong className="text-slate-300">{notif.item_name}</strong> (Daily Price: ₹{notif.price}/day)
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Escalated: {new Date(notif.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2 text-right">
                      <span className="text-xs font-bold text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                        Penalty: ₹{notif.total_price} (Deposit Exhausted)
                      </span>
                      <button onClick={() => alert(`Email simulation: Sending disciplinary warning to ${notif.recipient} regarding item ${notif.item_name}.`)}
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
                        Email Student Warning →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
