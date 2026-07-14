import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FiMail, FiLock, FiArrowRight, FiShield, FiEye, FiEyeOff, FiCheck, FiBookOpen } from "react-icons/fi";

export default function SignupPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState("student"); // "student" or "college"
  
  // Student States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [collegeCode, setCollegeCode] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);

  // College States
  const [collegeName, setCollegeName] = useState("");
  const [collegeEmail, setCollegeEmail] = useState("");
  const [collegePassword, setCollegePassword] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");

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
    if (!collegeCode) return setError("Please enter your college code");
    if (password !== confirmPassword) return setError("Passwords do not match");
    if (password.length < 6) return setError("Password must be at least 6 characters");
    
    setLoading(true);
    try {
      const res = await axios.post("/api/send-otp", { email });
      if (res.data.success) { 
        setIsOtpSent(true); 
        setTimer(30); 
        setInfo("Check your email for the 6-digit verification code."); 
      } else {
        setError(res.data.message);
      }
    } catch (err) { 
      setError(err.response?.data?.message || "Failed to send OTP."); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleStudentSignup = async (e) => {
    e.preventDefault();
    setError(""); setInfo("");
    if (!otp) return setError("Please enter the OTP");
    if (timer === 0) return setError("OTP expired. Please resend.");
    setLoading(true);
    try {
      const res = await axios.post("/api/signup", { email, password, otp, college_code: collegeCode.trim() }, { withCredentials: true });
      if (res.data.success) { 
        setInfo("Account created! Redirecting to login…"); 
        setTimeout(() => navigate("/login"), 1500); 
      }
    } catch (err) { 
      setError(err.response?.data?.message || "Verification failed."); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleCollegeSignup = async (e) => {
    e.preventDefault();
    setError(""); setInfo("");
    if (!collegeName) return setError("Please enter college name");
    if (!collegeEmail) return setError("Please enter college email");
    if (!collegePassword) return setError("Please enter college password");
    setLoading(true);
    try {
      const res = await axios.post("/api/college/signup", { name: collegeName, email: collegeEmail, password: collegePassword });
      if (res.data.success) {
        setGeneratedCode(res.data.college_code);
        setInfo("College space created successfully!");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to register college.");
    } finally {
      setLoading(false);
    }
  };

  const pwStrength = (role === "student" ? password : collegePassword).length === 0 ? 0 : (role === "student" ? password : collegePassword).length < 6 ? 1 : (role === "student" ? password : collegePassword).length < 10 ? 2 : 3;
  const pwColors   = ["", "#ef4444", "#f59e0b", "#10b981"];
  const pwLabels   = ["", "Weak", "Fair", "Strong"];
  const circumference = 2 * Math.PI * 18;

  return (
    <div className="min-h-screen flex bg-[#060a14] overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="ct-float-a absolute -top-40 left-1/4 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 65%)" }} />
        <div className="ct-float-b absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 65%)" }} />
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
      </div>

      {/* Form Panel */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16 relative z-10">
        <div className="w-full max-w-md">

          <div className="flex justify-center mb-6">
            <Link to="/front" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25"
                style={{ background: "linear-gradient(135deg,#6366f1,#4338ca)" }}>
                <span className="text-white font-black text-sm">C</span>
              </div>
              <span className="font-black text-xl text-white">CampusTrade</span>
            </Link>
          </div>

          {/* Role Tab Toggle (Only visible if OTP hasn't been sent yet and college isn't registered yet) */}
          {!isOtpSent && !generatedCode && (
            <div className="flex bg-slate-900/60 p-1 rounded-xl mb-6 border border-white/5">
              <button onClick={() => { setRole("student"); setError(""); setInfo(""); }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${role === "student" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}>
                Student Signup
              </button>
              <button onClick={() => { setRole("college"); setError(""); setInfo(""); }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${role === "college" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}>
                College Space Signup
              </button>
            </div>
          )}

          {/* Card */}
          <div className="rounded-3xl p-8 sm:p-10"
            style={{ background: "rgba(13,18,32,0.9)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 40px 80px rgba(0,0,0,0.6)", backdropFilter: "blur(20px)" }}>

            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-1.5">
                {generatedCode ? "Welcome to CampusTrade! 🎉" : isOtpSent ? "Check your inbox 📬" : role === "student" ? "Join your campus space" : "Register your College"}
              </h1>
              <p className="text-sm text-slate-400">
                {generatedCode 
                  ? "Your unique campus access code is generated" 
                  : isOtpSent 
                  ? `We sent a 6-digit verification code to ${email}` 
                  : role === "student" 
                  ? "Enter your details and college code to get started." 
                  : "Create an administrator account for your educational institution."}
              </p>
            </div>

            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl text-sm font-medium text-red-300"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                ⚠️ {error}
              </div>
            )}
            {info && (
              <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-emerald-300"
                style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                <FiCheck size={14} className="shrink-0" /> {info}
              </div>
            )}

            {/* If College Code is successfully generated */}
            {generatedCode ? (
              <div className="space-y-6 text-center">
                <div className="p-6 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 my-4">
                  <span className="block text-xs uppercase tracking-widest text-indigo-400 font-bold mb-2">Unique College Code</span>
                  <span className="text-3xl font-black text-white font-mono tracking-wider">{generatedCode}</span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  IMPORTANT: Share this code with students at your college. They must enter this code when registering in order to access your campus rental marketplace.
                </p>
                <button onClick={() => navigate("/login")}
                  className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}>
                  Go to Sign In <FiArrowRight size={15} />
                </button>
              </div>
            ) : role === "student" ? (
              /* STUDENT FORM */
              <form onSubmit={isOtpSent ? handleStudentSignup : handleSendOtp} className="space-y-4">
                {!isOtpSent ? (<>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">College Code</label>
                    <div className="relative">
                      <FiBookOpen size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      <input type="text" value={collegeCode} onChange={e => setCollegeCode(e.target.value)} required
                        placeholder="e.g. MULT-1234" className={`${baseInput} pl-11 pr-4`} style={inputStyle}
                        onFocus={inputFocus} onBlur={inputBlur} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email</label>
                    <div className="relative">
                      <FiMail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                        placeholder="you@college.edu" className={`${baseInput} pl-11 pr-4`} style={inputStyle}
                        onFocus={inputFocus} onBlur={inputBlur} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Password</label>
                    <div className="relative">
                      <FiLock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                        placeholder="Min. 6 characters" className={`${baseInput} pl-11 pr-12`} style={inputStyle}
                        onFocus={inputFocus} onBlur={inputBlur} />
                      <button type="button" onClick={() => setShowPw(p => !p)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                        {showPw ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Confirm Password</label>
                    <div className="relative">
                      <FiLock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                        placeholder="Re-enter password" className={`${baseInput} pl-11 pr-12`} style={inputStyle}
                        onFocus={inputFocus} onBlur={inputBlur} />
                    </div>
                  </div>
                </>) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Verification Code</label>
                      <div className="relative">
                        <FiShield size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                        <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                          maxLength={6} placeholder="000000" required
                          className="w-full pl-11 pr-4 py-3.5 rounded-xl text-center font-mono text-2xl tracking-[0.5em] text-white outline-none transition-all duration-200 placeholder-slate-700"
                          style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      {timer > 0 ? (
                        <div className="flex items-center gap-2">
                          <svg width="24" height="24" viewBox="0 0 40 40" className="-rotate-90">
                            <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3"/>
                            <circle cx="20" cy="20" r="18" fill="none" stroke="#6366f1" strokeWidth="3"
                              strokeDasharray={circumference}
                              strokeDashoffset={circumference - (timer / 30) * circumference}
                              strokeLinecap="round" />
                          </svg>
                          <span className="text-xs font-bold text-indigo-400">{timer}s remaining</span>
                        </div>
                      ) : (
                        <button type="button" onClick={handleSendOtp}
                          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
                          Resend code →
                        </button>
                      )}
                      <button type="button" onClick={() => { setIsOtpSent(false); setOtp(""); setError(""); setInfo(""); }}
                        className="text-xs text-slate-500 hover:text-slate-400">
                        ← Change details
                      </button>
                    </div>
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 mt-4"
                  style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}>
                  {loading
                    ? "Processing..."
                    : isOtpSent ? "Verify & Register" : "Send Verification OTP"}
                </button>
              </form>
            ) : (
              /* COLLEGE ADMIN FORM */
              <form onSubmit={handleCollegeSignup} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">College Name</label>
                  <div className="relative">
                    <FiBookOpen size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input type="text" value={collegeName} onChange={e => setCollegeName(e.target.value)} required
                      placeholder="e.g. Indian Institute of Technology" className={`${baseInput} pl-11 pr-4`} style={inputStyle}
                      onFocus={inputFocus} onBlur={inputBlur} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Admin Email</label>
                  <div className="relative">
                    <FiMail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input type="email" value={collegeEmail} onChange={e => setCollegeEmail(e.target.value)} required
                      placeholder="admin@college.edu" className={`${baseInput} pl-11 pr-4`} style={inputStyle}
                      onFocus={inputFocus} onBlur={inputBlur} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Admin Password</label>
                  <div className="relative">
                    <FiLock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input type={showPw ? "text" : "password"} value={collegePassword} onChange={e => setCollegePassword(e.target.value)} required
                      placeholder="Min. 6 characters" className={`${baseInput} pl-11 pr-12`} style={inputStyle}
                      onFocus={inputFocus} onBlur={inputBlur} />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {showPw ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 mt-4"
                  style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}>
                  {loading ? "Registering Space..." : "Register College Space"}
                </button>
              </form>
            )}

            {!generatedCode && (
              <div className="mt-6 pt-6 text-center border-t border-white/5">
                <p className="text-sm text-slate-500">
                  Already have an account?{" "}
                  <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">Sign in →</Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
