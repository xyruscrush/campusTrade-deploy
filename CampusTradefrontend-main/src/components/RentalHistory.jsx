import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useUserContext } from "../context/userContext";
import {
  FiArrowLeft,
  FiPackage,
  FiMessageSquare,
  FiRotateCcw,
  FiCheckCircle,
  FiClock,
  FiCalendar,
} from "react-icons/fi";

const statusConfig = {
  pending_handover: { label: "Pending Handover", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)" },
  active: { label: "Active", color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)" },
  returned: { label: "Returned", color: "#6366f1", bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.25)" },
  completed: { label: "Completed", color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.25)" },
  disputed: { label: "Disputed & Suspended", color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.25)" },
};

function StatusBadge({ status }) {
  const cfg = statusConfig[status] || statusConfig.active;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: cfg.color, boxShadow: status === "active" ? `0 0 6px ${cfg.color}` : "none" }}
      />
      {cfg.label}
    </span>
  );
}

const getTimeRemaining = (handoverAt, days) => {
  const deadline = new Date(new Date(handoverAt).getTime() + days * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diffTime = deadline - now;
  if (diffTime <= 0) {
    const overdueDays = Math.ceil(Math.abs(diffTime) / (1000 * 60 * 60 * 24));
    return `${overdueDays} ${overdueDays === 1 ? "day" : "days"} OVERDUE`;
  }
  const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return `${remainingDays} ${remainingDays === 1 ? "day" : "days"} remaining`;
};

function RentalCard({ rental, isSeller, onMarkReturned, onVerifyHandover, accessToken }) {
  const navigate = useNavigate();
  const [otpVal, setOtpVal] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  const date = new Date(rental.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const handoverDateStr = rental.handoverAt
    ? new Date(rental.handoverAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;

  const dueDateStr = rental.handoverAt
    ? new Date(new Date(rental.handoverAt).getTime() + rental.days * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : null;

  const returnedDateStr = rental.returnedAt
    ? new Date(rental.returnedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;

  const remainingStr = rental.status === "active" && rental.handoverAt
    ? getTimeRemaining(rental.handoverAt, rental.days)
    : null;

  const dailyPrice = parseFloat(rental.price_per_day);
  const securityDeposit = parseFloat(rental.security_deposit || "0");

  let lateDays = 0;
  let accumulatedLateFee = 0;
  let remainingDeposit = securityDeposit;
  let isOverdue = false;

  if (rental.status === "active" && rental.handoverAt) {
    const deadline = new Date(new Date(rental.handoverAt).getTime() + rental.days * 24 * 60 * 60 * 1000);
    const now = new Date();
    if (now > deadline) {
      isOverdue = true;
      const diff = now - deadline;
      lateDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
      accumulatedLateFee = lateDays * (1.5 * dailyPrice);
      remainingDeposit = Math.max(0, securityDeposit - accumulatedLateFee);
    }
  }

  const handleVerify = async () => {
    if (!otpVal) return setError("Enter OTP");
    setVerifying(true);
    setError("");
    try {
      const res = await axios.post(
        `/api/verify-handover/${rental._id}`,
        { otp: otpVal },
        { headers: { Authorization: `Bearer ${accessToken}` }, withCredentials: true }
      );
      if (res.data.success) {
        onVerifyHandover(rental._id);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg"
      style={{ background: "rgba(17,24,39,0.55)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(16px)" }}
    >
      <div className="flex gap-4 p-5">
        {rental.item_image && (
          <img
            src={rental.item_image}
            alt={rental.item_name}
            className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-gray-100 truncate text-sm">{rental.item_name}</h3>
            <StatusBadge status={rental.status} />
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
            <span className="flex items-center gap-1">
              <FiCalendar size={11} />
              Ordered: {date}
            </span>
            <span className="flex items-center gap-1">
              <FiClock size={11} />
              Duration: {rental.days} {rental.days === 1 ? "day" : "days"}
            </span>
            <span className="font-medium text-emerald-400">Total: ₹{rental.total_price}</span>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            {isSeller ? `Rented by: ${rental.buyer}` : `Seller: ${rental.seller}`}
          </p>

          {/* Detailed Status & Time Messaging */}
          <div className="mt-3 p-3.5 rounded-xl border bg-gray-900/40 border-white/5 space-y-2">
            {rental.status === "pending_handover" && (
              <>
                <p className="text-xs font-semibold text-amber-400">
                  {isSeller ? "Awaiting OTP Verification" : "Awaiting Meetup & Handover"}
                </p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {isSeller
                    ? "Meet the buyer on campus to hand over the item. Collect their 4-digit verification code and enter it below to activate the rental."
                    : "Meet the seller on campus to pick up the item. Show them the verification code below to activate your rental."}
                </p>
                {!isSeller && (
                  <div className="mt-2 p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-center">
                    <p className="text-xs text-indigo-300 font-semibold">🔑 YOUR HANDOVER OTP: <span className="font-mono text-sm bg-indigo-500/20 px-2 py-0.5 rounded text-white font-bold">{rental.handover_otp || "1234"}</span></p>
                  </div>
                )}
                {isSeller && (
                  <div className="mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs text-amber-300 font-semibold mb-2">Enter Buyer's Handover OTP:</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="4-digit OTP"
                        maxLength={4}
                        value={otpVal}
                        onChange={(e) => setOtpVal(e.target.value.replace(/\D/g, ""))}
                        className="bg-transparent border border-white/10 rounded px-2.5 py-1 text-white font-bold text-center w-24 outline-none focus:border-amber-500/50"
                      />
                      <button
                        onClick={handleVerify}
                        disabled={verifying}
                        className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-800 text-slate-900 font-bold px-3 py-1 rounded transition-all text-xs"
                      >
                        {verifying ? "Verifying..." : "Verify"}
                      </button>
                    </div>
                    {error && <p className="text-red-400 mt-1 font-semibold text-[11px]">{error}</p>}
                    <p className="text-gray-500 mt-1 text-[9px]">*(Mock OTP: 1234)*</p>
                  </div>
                )}
              </>
            )}

            {rental.status === "active" && (
              <>
                <p className="text-xs font-semibold text-emerald-400">
                  {isSeller ? "Rental Active & Out" : "Rental Active & In Use"}
                </p>
                <div className="text-xs text-gray-400 space-y-1">
                  <p>📅 Handed over on: <span className="text-gray-300 font-medium">{handoverDateStr}</span></p>
                  <p>🚨 Due date: <span className="text-gray-300 font-medium">{dueDateStr}</span></p>
                  <p className="font-semibold mt-1" style={{ color: isOverdue ? "#ef4444" : "#10b981" }}>
                    Time Remaining: {remainingStr}
                  </p>

                  {isOverdue && (
                    <div className="mt-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 space-y-1 text-slate-300">
                      <p className="text-red-400 font-bold text-xs flex items-center gap-1">
                        ⚠️ Overdue Warning (1.5x Daily Late Fee)
                      </p>
                      <p className="text-[11px]">
                        Late Fee Accumulated: <strong className="text-white">₹{accumulatedLateFee.toFixed(2)}</strong> (₹{(1.5 * dailyPrice).toFixed(2)}/day)
                      </p>
                      <p className="text-[11px]">
                        Remaining Deposit Escrow: <strong className="text-white">₹{remainingDeposit.toFixed(2)}</strong> / ₹{securityDeposit.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-gray-500 italic mt-1 leading-normal">
                        *If late fees completely consume the deposit, your account will be suspended.*
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {rental.status === "returned" && (
              <>
                <p className="text-xs font-semibold text-indigo-400">
                  Returned & Complete
                </p>
                <div className="text-xs text-gray-400 space-y-1">
                  <p>📅 Handed over on: <span className="text-gray-300">{handoverDateStr}</span></p>
                  <p>✅ Returned on: <span className="text-gray-300">{returnedDateStr}</span></p>
                  {rental.late_fee > 0 && (
                    <p className="text-red-400 font-semibold">⚠️ Late Penalty Charged: ₹{rental.late_fee}</p>
                  )}
                </div>
              </>
            )}

            {rental.status === "disputed" && (
              <>
                <p className="text-xs font-semibold text-red-500">
                  ⚠️ Deposit Exhausted & Suspended
                </p>
                <div className="text-xs text-gray-400 space-y-1.5 mt-2">
                  <p>📅 Handed over on: <span className="text-gray-300 font-medium">{handoverDateStr}</span></p>
                  <p className="text-red-400 font-bold">
                    🚨 Security Deposit (₹{rental.security_deposit}) fully consumed by late fees!
                  </p>
                  <p className="text-red-300 font-medium leading-relaxed">
                    {isSeller 
                      ? "The buyer failed to return the item. Their account has been suspended and escalated to the college administration."
                      : "Your account is suspended for failing to return this item. College administration has been notified."
                    }
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div
        className="px-5 pb-4 flex gap-2 flex-wrap"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <button
          onClick={() => navigate(`/chat/${rental._id}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-300 hover:text-white transition-all"
          style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}
        >
          <FiMessageSquare size={13} />
          Chat
        </button>
        {isSeller && (rental.status === "active" || rental.status === "disputed") && (
          <button
            onClick={() => onMarkReturned(rental._id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-300 hover:text-white transition-all"
            style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}
          >
            <FiRotateCcw size={13} />
            Mark Returned
          </button>
        )}
        {rental.status === "returned" && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400"
            style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
            <FiCheckCircle size={13} /> Returned
          </span>
        )}
      </div>
    </div>
  );
}

export default function RentalHistory() {
  const navigate = useNavigate();
  const { accessToken } = useUserContext();
  const [activeTab, setActiveTab] = useState("buyer");
  const [buyerRentals, setBuyerRentals] = useState([]);
  const [sellerRentals, setSellerRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!accessToken) { setLoading(false); return; }
    const headers = { Authorization: `Bearer ${accessToken}` };
    Promise.all([
      axios.get("/api/my-rentals", { headers, withCredentials: true }),
      axios.get("/api/my-listings-rentals", { headers, withCredentials: true }),
    ])
      .then(([buyerRes, sellerRes]) => {
        if (buyerRes.data.success) setBuyerRentals(buyerRes.data.rentals);
        if (sellerRes.data.success) setSellerRentals(sellerRes.data.rentals);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [accessToken]);

  const handleMarkReturned = async (rentalId) => {
    try {
      const res = await axios.post(
        `/api/return-item/${rentalId}`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` }, withCredentials: true }
      );
      if (res.data.success) {
        setSellerRentals((prev) =>
          prev.map((r) => (r._id === rentalId ? { ...r, status: "returned" } : r))
        );
        showToast("Item marked as returned!");
      }
    } catch {
      showToast("Failed to mark as returned", "error");
    }
  };

  const handleVerifyHandoverSuccess = (rentalId) => {
    setSellerRentals((prev) =>
      prev.map((r) => (r._id === rentalId ? { ...r, status: "active" } : r))
    );
    showToast("Handover verified successfully! Rental is now active.");
  };


  const current = activeTab === "buyer" ? buyerRentals : sellerRentals;

  return (
    <div className="min-h-screen py-10 px-4 relative" style={{ background: "linear-gradient(135deg,#0a0e1a 0%,#111827 50%,#0a0e1a 100%)" }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-purple-600/5 rounded-full blur-3xl" />
      </div>

      {toast && (
        <div
          className="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-xl"
          style={{
            background: toast.type === "error" ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
            border: `1px solid ${toast.type === "error" ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
            color: toast.type === "error" ? "#f87171" : "#34d399",
            backdropFilter: "blur(12px)",
          }}
        >
          {toast.msg}
        </div>
      )}

      <div className="max-w-3xl mx-auto relative z-10">
        <button
          onClick={() => navigate("/home")}
          className="mb-8 flex items-center gap-2.5 text-gray-400 hover:text-white transition-all duration-300 group"
        >
          <span
            className="flex items-center justify-center w-9 h-9 rounded-xl group-hover:bg-indigo-500/20 transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <FiArrowLeft size={16} />
          </span>
          <span className="text-sm font-medium">Back to Home</span>
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div
              className="p-2.5 rounded-xl text-indigo-400"
              style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.15)" }}
            >
              <FiPackage size={20} />
            </div>
            <h1 className="text-2xl font-bold text-white">Rental History</h1>
          </div>
          <p className="text-xs text-gray-500 ml-14">Track all your rental activity</p>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-1 p-1 rounded-xl mb-6"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          {[
            { key: "buyer", label: `My Rentals (${buyerRentals.length})` },
            { key: "seller", label: `My Listings' Rentals (${sellerRentals.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200"
              style={
                activeTab === tab.key
                  ? { background: "rgba(99,102,241,0.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" }
                  : { color: "#6b7280" }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="relative w-12 h-12 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
            </div>
            <p className="text-gray-500 mt-4 text-sm">Loading rentals...</p>
          </div>
        ) : current.length === 0 ? (
          <div
            className="text-center py-20 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}
          >
            <FiPackage size={36} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-base font-semibold text-gray-300">No rentals yet</h3>
            <p className="text-sm text-gray-600 mt-1">
              {activeTab === "buyer" ? "Browse the marketplace and rent something!" : "Your listings haven't been rented yet."}
            </p>
            {activeTab === "buyer" && (
              <Link
                to="/home"
                className="inline-block mt-4 px-5 py-2.5 rounded-xl text-sm font-medium text-indigo-300 transition-all"
                style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}
              >
                Browse Marketplace
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {current.map((rental) => (
              <RentalCard
                key={rental._id}
                rental={rental}
                isSeller={activeTab === "seller"}
                onMarkReturned={handleMarkReturned}
                onVerifyHandover={handleVerifyHandoverSuccess}
                accessToken={accessToken}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
