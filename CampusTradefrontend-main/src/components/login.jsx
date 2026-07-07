import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useUserContext } from "../context/userContext";
import { FiMail, FiLock, FiArrowRight, FiEye, FiEyeOff } from "react-icons/fi";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setAccessToken, setUser } = useUserContext();

  useEffect(() => {
    axios.post("/api/logout", {}, { withCredentials: true }).catch(() => {});
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post("/api/login", { email, password }, { withCredentials: true });
      if (res.data.success) {
        setAccessToken(res.data.accessToken);
        setUser(email);
        navigate("/home");
      } else {
        setError("Invalid email or password.");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#060a14] overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="ct-float-a absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 65%)" }} />
        <div className="ct-float-b absolute bottom-0 -left-20 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 65%)" }} />
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
        <div className="absolute top-0 inset-x-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.6), transparent)" }} />
      </div>

      {/* ── Left decorative panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-[48%] p-14 relative z-10">
        <Link to="/front" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30"
            style={{ background: "linear-gradient(135deg,#6366f1,#4338ca)" }}>
            <span className="text-white font-black text-sm">C</span>
          </div>
          <span className="font-black text-xl"
            style={{ background: "linear-gradient(135deg,#c7d2fe,#a5b4fc,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            CampusTrade
          </span>
        </Link>

        <div className="ct-fade-up space-y-8 max-w-sm">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
              style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.22)", color: "#a5b4fc" }}>
              <span className="relative flex h-2 w-2">
                <span className="ct-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Live marketplace
            </div>
            <h2 className="text-4xl font-black text-white leading-[1.1] mb-4">
              The smarter way to<br />
              <span style={{ background: "linear-gradient(135deg,#a5b4fc,#6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                rent on campus
              </span>
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              Borrow what you need, lend what you have. Every transaction secured by Razorpay.
            </p>
          </div>

          {/* Testimonial */}
          <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-0.5 mb-3">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              "Saved ₹4,500 renting textbooks this semester. The in-app chat made everything so smooth!"
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold"
                style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.3),rgba(139,92,246,0.3))", color: "#a5b4fc" }}>R</div>
              <div>
                <p className="text-sm font-semibold text-slate-200">Rohit K.</p>
                <p className="text-xs text-slate-500">2nd Year, Computer Science</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-600">© 2026 CampusTrade</p>
      </div>

      {/* Vertical divider */}
      <div className="hidden lg:block w-px my-16 opacity-20"
        style={{ background: "linear-gradient(180deg, transparent, rgba(99,102,241,0.8), transparent)" }} />

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16 relative z-10">
        <div className="w-full max-w-md ct-fade-up">

          {/* Mobile brand */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link to="/front" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#6366f1,#4338ca)" }}>
                <span className="text-white font-black text-sm">C</span>
              </div>
              <span className="font-black text-xl"
                style={{ background: "linear-gradient(135deg,#c7d2fe,#a5b4fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                CampusTrade
              </span>
            </Link>
          </div>

          {/* Card */}
          <div className="rounded-3xl p-8 sm:p-10"
            style={{ background: "rgba(13,18,32,0.9)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 40px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07)", backdropFilter: "blur(20px)" }}>

            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white mb-1.5">Welcome back 👋</h1>
              <p className="text-sm text-slate-500">Sign in to your CampusTrade account</p>
            </div>

            {error && (
              <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-300"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <span className="text-base">⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">Email</label>
                <div className="relative">
                  <FiMail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@campus.edu" required
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl text-slate-100 text-sm outline-none transition-all duration-200 placeholder-slate-600"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    onFocus={e => { e.target.style.borderColor = "rgba(99,102,241,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"; }}
                    onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }} />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">Password</label>
                <div className="relative">
                  <FiLock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" required
                    className="w-full pl-11 pr-12 py-3.5 rounded-xl text-slate-100 text-sm outline-none transition-all duration-200 placeholder-slate-600"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    onFocus={e => { e.target.style.borderColor = "rgba(99,102,241,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"; }}
                    onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }} />
                  <button type="button" onClick={() => setShowPw(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    {showPw ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2.5 mt-2 transition-all duration-200 hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 group"
                style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}>
                {loading
                  ? <svg className="ct-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  : <><span>Sign In</span><FiArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" /></>
                }
              </button>
            </form>

            <div className="mt-8 pt-6 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-sm text-slate-500">
                New here?{" "}
                <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                  Create an account →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
