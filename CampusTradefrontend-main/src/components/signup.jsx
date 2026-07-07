import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FiMail, FiLock, FiArrowRight, FiShield, FiEye, FiEyeOff, FiCheck } from "react-icons/fi";

export default function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer(p => p - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  useEffect(() => {
    if (timer === 0 && isOtpSent) setError("OTP expired. Please resend.");
  }, [timer, isOtpSent]);

  const inputFocus = e => { e.target.style.borderColor = "rgba(99,102,241,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"; };
  const inputBlur  = e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; };

  const baseInput = "w-full py-3.5 rounded-xl text-slate-100 text-sm outline-none transition-all duration-200 placeholder-slate-600";
  const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" };

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setError(""); setInfo("");
    if (!email) return setError("Please enter your email");
    if (password !== confirmPassword) return setError("Passwords do not match");
    if (password.length < 6) return setError("Password must be at least 6 characters");
    setLoading(true);
    try {
      const res = await axios.post("/api/send-otp", { email });
      if (res.data.success) { setIsOtpSent(true); setTimer(30); setInfo("Check your email for the 6-digit code."); }
      else setError(res.data.message);
    } catch (err) { setError(err.response?.data?.message || "Failed to send OTP."); }
    finally { setLoading(false); }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(""); setInfo("");
    if (!otp) return setError("Please enter the OTP");
    if (timer === 0) return setError("OTP expired. Please resend.");
    setLoading(true);
    try {
      const res = await axios.post("/api/signup", { email, password, otp }, { withCredentials: true });
      if (res.data.success) { setInfo("Account created! Redirecting…"); setTimeout(() => navigate("/login"), 1000); }
    } catch (err) { setError(err.response?.data?.message || "Verification failed."); }
    finally { setLoading(false); }
  };

  const pwStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const pwColors   = ["", "#ef4444", "#f59e0b", "#10b981"];
  const pwLabels   = ["", "Weak", "Fair", "Strong"];
  const circumference = 2 * Math.PI * 18;

  return (
    <div className="min-h-screen flex bg-[#060a14] overflow-hidden">
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="ct-float-a absolute -top-40 left-1/4 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 65%)" }} />
        <div className="ct-float-b absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 65%)" }} />
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
        <div className="absolute top-0 inset-x-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.6), transparent)" }} />
      </div>

      {/* ── Form Panel ── */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16 relative z-10 order-1">
        <div className="w-full max-w-md ct-fade-up">

          <div className="flex justify-center mb-8">
            <Link to="/front" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25"
                style={{ background: "linear-gradient(135deg,#6366f1,#4338ca)" }}>
                <span className="text-white font-black text-sm">C</span>
              </div>
              <span className="font-black text-xl"
                style={{ background: "linear-gradient(135deg,#c7d2fe,#a5b4fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                CampusTrade
              </span>
            </Link>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-7">
            {[{ n: 1, label: "Your Details" }, { n: 2, label: "Verify Email" }].map((s, i, arr) => (
              <div key={s.n} className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                    style={s.n === 1 && isOtpSent
                      ? { background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", color: "#34d399" }
                      : (s.n === 1 && !isOtpSent) || (s.n === 2 && isOtpSent)
                      ? { background: "linear-gradient(135deg,#6366f1,#4338ca)", color: "#fff", boxShadow: "0 0 12px rgba(99,102,241,0.4)" }
                      : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#475569" }
                    }>
                    {s.n === 1 && isOtpSent ? <FiCheck size={13} /> : s.n}
                  </div>
                  <span className="text-xs font-medium transition-colors duration-300"
                    style={{ color: (s.n === 1 && !isOtpSent)||(s.n === 2 && isOtpSent) ? "#a5b4fc" : s.n===1&&isOtpSent ? "#34d399" : "#475569" }}>
                    {s.label}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <div className="flex-1 h-px mx-2 transition-all duration-500 rounded-full"
                    style={{ background: isOtpSent ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.07)" }} />
                )}
              </div>
            ))}
          </div>

          {/* Card */}
          <div className="rounded-3xl p-8 sm:p-10"
            style={{ background: "rgba(13,18,32,0.9)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 40px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07)", backdropFilter: "blur(20px)" }}>

            <div className="mb-7">
              <h1 className="text-2xl font-bold text-white mb-1.5">
                {isOtpSent ? "Check your inbox 📬" : "Create your account"}
              </h1>
              <p className="text-sm text-slate-500">
                {isOtpSent ? `We sent a 6-digit code to ${email}` : "Join your campus community today"}
              </p>
            </div>

            {error && (
              <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-300"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <span>⚠️</span> {error}
              </div>
            )}
            {info && (
              <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-emerald-300"
                style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                <FiCheck size={14} className="shrink-0" /> {info}
              </div>
            )}

            <form onSubmit={isOtpSent ? handleSignup : handleSendOtp} className="space-y-5">
              {!isOtpSent ? (<>
                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">Email</label>
                  <div className="relative">
                    <FiMail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      placeholder="you@campus.edu" className={`${baseInput} pl-11 pr-4`} style={inputStyle}
                      onFocus={inputFocus} onBlur={inputBlur} />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">Password</label>
                  <div className="relative">
                    <FiLock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                      placeholder="Min. 6 characters" className={`${baseInput} pl-11 pr-12`} style={inputStyle}
                      onFocus={inputFocus} onBlur={inputBlur} />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                      {showPw ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex gap-1 flex-1">
                        {[1,2,3].map(n => (
                          <div key={n} className="h-1 flex-1 rounded-full transition-all duration-300"
                            style={{ background: n <= pwStrength ? pwColors[pwStrength] : "rgba(255,255,255,0.07)" }} />
                        ))}
                      </div>
                      <span className="text-[11px] font-semibold" style={{ color: pwColors[pwStrength] }}>{pwLabels[pwStrength]}</span>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">Confirm Password</label>
                  <div className="relative">
                    <FiLock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                      placeholder="Re-enter password" className={`${baseInput} pl-11 pr-12`}
                      style={{ ...inputStyle, borderColor: confirmPassword && confirmPassword !== password ? "rgba(239,68,68,0.5)" : undefined }}
                      onFocus={inputFocus} onBlur={e => { if (!confirmPassword || confirmPassword === password) inputBlur(e); }} />
                    {confirmPassword && confirmPassword === password && (
                      <FiCheck size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400" />
                    )}
                  </div>
                </div>
              </>) : (
                /* OTP step */
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Verification Code</label>
                    <div className="relative">
                      <FiShield size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                        maxLength={6} placeholder="000000" required
                        className="w-full pl-11 pr-4 py-4 rounded-xl text-center font-mono text-3xl tracking-[0.5em] text-white outline-none transition-all duration-200 placeholder-slate-700"
                        style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    {timer > 0 ? (
                      <div className="flex items-center gap-3">
                        {/* SVG circular timer */}
                        <svg width="32" height="32" viewBox="0 0 40 40" className="-rotate-90">
                          <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3"/>
                          <circle cx="20" cy="20" r="18" fill="none" stroke="#6366f1" strokeWidth="3"
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference - (timer / 30) * circumference}
                            strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s linear" }}/>
                        </svg>
                        <span className="text-sm font-bold text-indigo-400">{timer}s remaining</span>
                      </div>
                    ) : (
                      <button type="button" onClick={handleSendOtp}
                        className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                        Resend code →
                      </button>
                    )}
                    <button type="button" onClick={() => { setIsOtpSent(false); setOtp(""); setError(""); setInfo(""); }}
                      className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
                      ← Change email
                    </button>
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2.5 mt-2 transition-all duration-200 hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25 group"
                style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}>
                {loading
                  ? <svg className="ct-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  : <><span>{isOtpSent ? "Verify & Create Account" : "Send Verification Code"}</span><FiArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" /></>
                }
              </button>
            </form>

            <div className="mt-6 pt-6 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-sm text-slate-500">
                Already have an account?{" "}
                <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">Sign in →</Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right decorative panel ── */}
      <div className="hidden lg:flex flex-col items-center justify-center w-[42%] p-16 relative z-10 order-2">
        <div className="max-w-xs text-center space-y-6">
          <div className="w-24 h-24 mx-auto rounded-3xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2))", border: "1px solid rgba(99,102,241,0.25)", boxShadow: "0 0 40px rgba(99,102,241,0.15)" }}>
            <FiShield size={40} className="text-indigo-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Safe & Secure</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Every transaction protected by Razorpay. Your money stays safe until the item is in your hands.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {["OTP Verified", "Razorpay Secured", "In-App Chat", "Rental Tracking"].map(f => (
              <div key={f} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-400"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <FiCheck size={12} className="text-emerald-400 shrink-0" /> {f}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
