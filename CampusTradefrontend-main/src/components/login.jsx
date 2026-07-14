import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useUserContext } from "../context/userContext";
import { FiMail, FiLock, FiArrowRight, FiEye, FiEyeOff, FiBookOpen } from "react-icons/fi";

export default function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState("student"); // "student" or "college"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setAccessToken, setUser } = useUserContext();

  useEffect(() => {
    // Clear previous sessions
    axios.post("/api/logout", {}, { withCredentials: true }).catch(() => {});
    localStorage.removeItem("collegeToken");
    localStorage.removeItem("collegeInfo");
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (role === "student") {
        const res = await axios.post("/api/login", { email, password }, { withCredentials: true });
        if (res.data.success) {
          setAccessToken(res.data.accessToken);
          setUser(email);
          navigate("/home");
        } else {
          setError(res.data.message || "Invalid email or password.");
        }
      } else {
        // College Admin Login
        const res = await axios.post("/api/college/login", { email, password });
        if (res.data.success) {
          localStorage.setItem("collegeToken", res.data.token);
          localStorage.setItem("collegeInfo", JSON.stringify(res.data.college));
          navigate("/college/dashboard");
        } else {
          setError(res.data.message || "Invalid credentials.");
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred. Please try again.");
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
      </div>

      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-14 relative z-10">
        <Link to="/front" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30"
            style={{ background: "linear-gradient(135deg,#6366f1,#4338ca)" }}>
            <span className="text-white font-black text-sm">C</span>
          </div>
          <span className="font-black text-xl text-white">CampusTrade</span>
        </Link>

        <div className="space-y-6 max-w-sm">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 bg-indigo-500/10 text-indigo-300">
              <span className="relative flex h-2 w-2">
                <span className="ct-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Campus P2P Rental Space
            </div>
            <h2 className="text-4xl font-black text-white leading-tight">
              The smarter way to rent on campus
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mt-2">
              Borrow what you need, lend what you have. Every transaction secured and campus-federated.
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600">© 2026 CampusTrade</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16 relative z-10">
        <div className="w-full max-w-md">

          {/* Mobile brand */}
          <div className="lg:hidden flex justify-center mb-6">
            <Link to="/front" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#6366f1,#4338ca)" }}>
                <span className="text-white font-black text-sm">C</span>
              </div>
              <span className="font-black text-xl text-white">CampusTrade</span>
            </Link>
          </div>

          {/* Role Tab Toggle */}
          <div className="flex bg-slate-900/60 p-1 rounded-xl mb-6 border border-white/5">
            <button onClick={() => { setRole("student"); setError(""); }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${role === "student" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}>
              Student Login
            </button>
            <button onClick={() => { setRole("college"); setError(""); }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${role === "college" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}>
              College Portal Login
            </button>
          </div>

          {/* Card */}
          <div className="rounded-3xl p-8 sm:p-10"
            style={{ background: "rgba(13,18,32,0.9)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 40px 80px rgba(0,0,0,0.6)", backdropFilter: "blur(20px)" }}>

            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-1.5">Welcome back 👋</h1>
              <p className="text-sm text-slate-400">
                {role === "student" ? "Sign in to your Student account" : "Sign in to your College Administrator portal"}
              </p>
            </div>

            {error && (
              <div className="mb-6 px-4 py-3 rounded-xl text-sm font-medium text-red-300"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email</label>
                <div className="relative">
                  <FiMail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@campus.edu" required
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl text-slate-100 text-sm outline-none transition-all duration-200"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    onFocus={inputFocus} onBlur={inputBlur} />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Password</label>
                <div className="relative">
                  <FiLock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" required
                    className="w-full pl-11 pr-12 py-3.5 rounded-xl text-slate-100 text-sm outline-none transition-all duration-200"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    onFocus={inputFocus} onBlur={inputBlur} />
                  <button type="button" onClick={() => setShowPw(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showPw ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 mt-4"
                style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}>
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <div className="mt-6 pt-6 text-center border-t border-white/5">
              <p className="text-sm text-slate-500">
                New here?{" "}
                <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold">
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

const inputFocus = e => { e.target.style.borderColor = "rgba(99,102,241,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"; };
const inputBlur  = e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; };
