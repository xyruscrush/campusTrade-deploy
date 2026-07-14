import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useUserContext } from "../context/userContext";
import { FiArrowLeft, FiClock, FiPhone, FiTag, FiMinus, FiPlus, FiShield, FiCheckCircle } from "react-icons/fi";
import ReviewSection from "./ReviewSection";

const itemStatusConfig = {
  available: { label: "Available", color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)", pulse: true },
  rented: { label: "Rented", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)", pulse: false },
  returned: { label: "Returned", color: "#6366f1", bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.25)", pulse: false },
};

function ItemStatusBadge({ status }) {
  const cfg = itemStatusConfig[status] || itemStatusConfig.available;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <span
        className={`w-2 h-2 rounded-full ${cfg.pulse ? "animate-pulse" : ""}`}
        style={{ background: cfg.color }}
      />
      {cfg.label}
    </span>
  );
}

function Show() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [days, setDays] = useState(1);
  const [toast, setToast] = useState(null);
  const { user, accessToken } = useUserContext();

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    axios
      .post(`/api/item/${id}`, {}, { withCredentials: true })
      .then((response) => setItem(response.data.response))
      .catch((error) => console.error("Error fetching item details:", error));
  }, [id]);

  const rentTotal = item ? parseFloat(item.price_per_day) * days : 0;
  const depositVal = item ? parseFloat(item.security_deposit || "0") : 0;
  const totalPrice = (rentTotal + depositVal).toFixed(2);

  const incrementDays = () => { if (days < 365) setDays((p) => p + 1); };
  const decrementDays = () => { if (days > 1) setDays((p) => p - 1); };
  const handleDaysInput = (e) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val >= 1 && val <= 365) setDays(val);
    else if (e.target.value === "") setDays(1);
  };

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });

  const handlePayment = async () => {
    if (!item) return;
    setLoadingPayment(true);
    try {
      const response = await axios.post(
        "/api/create-order",
        { itemId: item._id, days },
        { headers: { Authorization: `Bearer ${accessToken}` }, withCredentials: true }
      );
      if (!response.data.success) {
        showToast(response.data.message || "Failed to initiate payment.", "error");
        setLoadingPayment(false);
        return;
      }
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        showToast("Razorpay SDK failed to load. Check your connection.", "error");
        setLoadingPayment(false);
        return;
      }
      const { order, key_id } = response.data;
      const options = {
        key: key_id,
        amount: order.amount,
        currency: order.currency,
        name: "CampusTrade",
        description: `Rent ${item.name} for ${days} day${days > 1 ? "s" : ""}`,
        order_id: order.id,
        handler: async (razorpayResponse) => {
          try {
            const verifyResponse = await axios.post(
              "/api/verify-payment",
              {
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                razorpay_signature: razorpayResponse.razorpay_signature,
                itemId: item._id,
                days,
              },
              { headers: { Authorization: `Bearer ${accessToken}` }, withCredentials: true }
            );
            if (verifyResponse.data.success) {
              showToast("Payment successful! Item is now rented.");
              setItem((prev) => ({ ...prev, status: "rented" }));
            } else {
              showToast("Payment verification failed: " + verifyResponse.data.message, "error");
            }
          } catch {
            showToast("An error occurred during payment verification.", "error");
          }
        },
        prefill: { email: user || "", contact: item.mobile_number || "" },
        theme: { color: "#6366f1" },
      };
      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to initiate payment.", "error");
    } finally {
      setLoadingPayment(false);
    }
  };

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg,#0a0e1a 0%,#111827 50%,#0a0e1a 100%)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
          </div>
          <p className="text-lg font-medium text-gray-400">Loading item details...</p>
        </div>
      </div>
    );
  }

  const isOwner = item.user === user;
  const isAvailable = item.status === "available" || !item.status;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg,#0a0e1a 0%,#111827 50%,#0a0e1a 100%)" }}>
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

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2.5 text-gray-400 hover:text-white transition-all duration-300 group"
        >
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 border border-white/10 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/30 transition-all">
            <FiArrowLeft size={16} />
          </span>
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(17,24,39,0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Image */}
            <div className="relative h-[28rem] lg:h-auto overflow-hidden group">
              <img src={item.Image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(10,14,26,0.9) 0%,rgba(10,14,26,0.3) 40%,transparent 100%)" }} />
              <div className="absolute top-5 left-5 flex flex-col gap-2">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-indigo-200" style={{ background: "rgba(99,102,241,0.2)", backdropFilter: "blur(10px)", border: "1px solid rgba(99,102,241,0.3)" }}>
                  <FiTag size={12} />{item.category}
                </span>
                <ItemStatusBadge status={item.status || "available"} />
              </div>
              {isOwner && (
                <div className="absolute top-5 right-5">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-amber-200" style={{ background: "rgba(245,158,11,0.2)", backdropFilter: "blur(10px)", border: "1px solid rgba(245,158,11,0.3)" }}>
                    Your Listing
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-8 lg:p-10 flex flex-col justify-between">
              <div className="space-y-6">
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight" style={{ background: "linear-gradient(135deg,#e0e7ff,#c7d2fe,#a5b4fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {item.name}
                </h1>
                <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-gray-300 leading-relaxed text-[15px]">{item.description}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <FiClock size={14} className="text-emerald-400" />
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Daily Rate</span>
                    </div>
                    <p className="text-xl font-bold text-emerald-400">₹{item.price_per_day}<span className="text-xs font-normal text-gray-500">/day</span></p>
                  </div>
                  <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <FiShield size={14} className="text-amber-400" />
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Deposit</span>
                    </div>
                    <p className="text-xl font-bold text-amber-400">₹{item.security_deposit || "0"}</p>
                  </div>
                  <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <FiPhone size={14} className="text-indigo-400" />
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</span>
                    </div>
                    <p className="text-[15px] font-semibold text-gray-200 truncate">{item.mobile_number}</p>
                  </div>
                </div>

                {/* Days selector — only show if available and not owner */}
                {!isOwner && isAvailable && (
                  <div className="rounded-xl p-5" style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.08))", border: "1px solid rgba(99,102,241,0.15)" }}>
                    <label className="block text-sm font-semibold text-indigo-300 mb-4">Rental Duration</label>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-0 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                        <button onClick={decrementDays} disabled={days <= 1} className="flex items-center justify-center w-12 h-12 text-gray-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed" style={{ background: "rgba(255,255,255,0.05)" }}>
                          <FiMinus size={18} />
                        </button>
                        <input type="number" min="1" max="365" value={days} onChange={handleDaysInput} className="w-20 h-12 text-center text-xl font-bold text-white bg-transparent border-x border-white/10 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                        <button onClick={incrementDays} disabled={days >= 365} className="flex items-center justify-center w-12 h-12 text-gray-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed" style={{ background: "rgba(255,255,255,0.05)" }}>
                          <FiPlus size={18} />
                        </button>
                      </div>
                      <span className="text-sm text-gray-400">{days === 1 ? "day" : "days"}</span>
                      <div className="text-right flex-grow">
                        <p className="text-xs text-gray-500 mb-0.5">Total to Pay</p>
                        <p className="text-3xl font-extrabold text-emerald-400">
                          ₹{totalPrice}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 space-y-1.5 text-xs text-gray-500" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex justify-between">
                        <span>Rental Fee ({days} {days === 1 ? "day" : "days"}):</span>
                        <span className="text-gray-300">₹{rentTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Security Deposit (Refundable):</span>
                        <span className="text-gray-300">₹{depositVal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-emerald-400 pt-1.5" style={{ borderTop: "1px dashed rgba(255,255,255,0.06)" }}>
                        <span>Grand Total:</span>
                        <span>₹{totalPrice}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="mt-8 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                {isOwner ? (
                  <div className="text-center py-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-gray-400 text-sm italic">You cannot rent your own listing.</p>
                  </div>
                ) : !isAvailable ? (
                  <div className="text-center py-4 rounded-xl" style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)" }}>
                    <div className="flex items-center justify-center gap-2 text-amber-400">
                      <FiCheckCircle size={16} />
                      <p className="text-sm font-medium">
                        {item.status === "rented" ? "This item is currently rented" : "This item has been returned and is under review"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={handlePayment}
                      disabled={loadingPayment}
                      className="w-full py-4 rounded-xl font-bold text-white shadow-2xl transition-all duration-300 transform hover:scale-[1.01] hover:shadow-emerald-500/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-base"
                      style={{ background: "linear-gradient(135deg,#059669,#10b981,#34d399)" }}
                    >
                      {loadingPayment ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Processing Payment...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          Pay ₹{totalPrice} for {days} {days === 1 ? "day" : "days"}
                        </>
                      )}
                    </button>
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                      <FiShield size={12} className="text-emerald-500/70" />
                      <span>Secured by Razorpay</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews section */}
        <div className="mt-6 rounded-2xl p-8" style={{ background: "rgba(17,24,39,0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <ReviewSection itemId={id} />
        </div>
      </div>
    </div>
  );
}

export default Show;
