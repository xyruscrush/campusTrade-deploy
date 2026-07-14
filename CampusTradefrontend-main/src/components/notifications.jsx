import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUserContext } from "../context/userContext";
import { FiArrowLeft, FiBell, FiDollarSign, FiClock, FiRotateCcw, FiMessageSquare, FiKey, FiCheckCircle, FiAlertTriangle } from "react-icons/fi";

const typeConfig = {
  rental: { icon: FiDollarSign, color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.15)", label: "Order Created" },
  handover_otp: { icon: FiKey, color: "#a5b4fc", bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.15)", label: "Awaiting Handover" },
  pending_handover: { icon: FiClock, color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.15)", label: "Meetup & OTP Needed" },
  handover_complete_seller: { icon: FiCheckCircle, color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.15)", label: "Handover Verified" },
  handover_complete_buyer: { icon: FiCheckCircle, color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.15)", label: "Rental Active" },
  returned: { icon: FiRotateCcw, color: "#6366f1", bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.15)", label: "Item Returned" },
  late_fee_payout: { icon: FiDollarSign, color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.15)", label: "Late Fees Payout" },
  college_escalation: { icon: FiAlertTriangle, color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.15)", label: "Escalation Alert" },
};

export default function Notifications() {
  const navigate = useNavigate();
  const { accessToken } = useUserContext();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get("/api/notifications", {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        });
        if (response.data.success) setNotifications(response.data.notifications);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    };
    if (accessToken) fetchNotifications();
    else setLoading(false);
  }, [accessToken]);

  return (
    <div
      className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative"
      style={{ background: "linear-gradient(135deg, #0a0e1a 0%, #111827 50%, #0a0e1a 100%)" }}
    >
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-purple-600/5 rounded-full blur-3xl" />
      </div>

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

        <div className="rounded-2xl p-8" style={{ background: "rgba(17,24,39,0.5)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-4 mb-8 pb-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="p-3 rounded-xl text-indigo-400" style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.15)" }}>
              <FiBell size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Notifications</h1>
              <p className="text-xs text-gray-500 mt-0.5">Rental alerts and updates</p>
            </div>
            {notifications.length > 0 && (
              <span
                className="ml-auto px-2.5 py-1 rounded-full text-xs font-bold text-indigo-300"
                style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.2)" }}
              >
                {notifications.length}
              </span>
            )}
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="relative w-12 h-12 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
              </div>
              <p className="text-gray-500 mt-4 text-sm">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-20 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}>
              <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <FiBell size={28} className="text-gray-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-300">All quiet here</h3>
              <p className="text-sm text-gray-600 mt-1">No notifications yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => {
                const cfg = typeConfig[notification.type] || typeConfig.rental;
                const Icon = cfg.icon;
                return (
                  <div
                    key={notification._id}
                    className="p-5 rounded-xl transition-all duration-300 hover:bg-white/[0.03] group"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="p-2.5 rounded-lg mt-0.5 shrink-0"
                        style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-start gap-3">
                          <h3 className="font-semibold text-gray-100 group-hover:text-indigo-300 transition-colors text-sm">
                            {cfg.label}
                          </h3>
                          <span className="text-[11px] text-gray-600 font-medium shrink-0">
                            {new Date(notification.createdAt).toLocaleDateString(undefined, {
                              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-gray-400 mt-1.5 text-sm leading-relaxed">
                          {notification.type === "handover_otp" && (
                            <>
                              You paid <span className="font-semibold text-emerald-400">₹{notification.total_price}</span> (Rent + Deposit) to rent <span className="font-semibold text-gray-200">"{notification.item_name}"</span>. Meet the seller (<span className="text-indigo-300">{notification.sender}</span>) to verify the exchange.
                            </>
                          )}
                          {notification.type === "pending_handover" && (
                            <>
                              Buyer <span className="font-medium text-indigo-300">{notification.sender}</span> paid <span className="font-semibold text-emerald-400">₹{notification.total_price}</span> to rent your listing <span className="font-semibold text-gray-200">"{notification.item_name}"</span>. Meet them to verify their handover OTP.
                            </>
                          )}
                          {notification.type === "handover_complete_seller" && (
                            <>
                              Handover verified! Rent payout of <span className="font-bold text-emerald-400">₹{notification.total_price}</span> has been released to your account.
                            </>
                          )}
                          {notification.type === "handover_complete_buyer" && (
                            <>
                              Handover complete! Your rental for <span className="font-semibold text-gray-200">"{notification.item_name}"</span> is now active. Security deposit of <span className="font-semibold text-emerald-400">₹{notification.total_price}</span> is held in escrow.
                            </>
                          )}
                          {notification.type === "returned" && (
                            <>
                              Seller <span className="font-medium text-indigo-300">{notification.sender}</span> marked <span className="font-semibold text-gray-200">"{notification.item_name}"</span> as returned. Remaining security deposit refund: <span className="font-bold text-emerald-400">₹{notification.total_price}</span>.
                            </>
                          )}
                          {notification.type === "late_fee_payout" && (
                            <>
                              Late fee payout of <span className="font-bold text-emerald-400">₹{notification.total_price}</span> was collected from the buyer for the late return of <span className="font-semibold text-gray-200">"{notification.item_name}"</span>.
                            </>
                          )}
                          {notification.type === "college_escalation" && (
                            <>
                              ⚠️ Escalation: Student <span className="text-indigo-300">{notification.recipient}</span> failed to return <span className="font-semibold text-gray-200">"{notification.item_name}"</span>. Security deposit fully consumed by late fees.
                            </>
                          )}
                          {!["handover_otp", "pending_handover", "handover_complete_seller", "handover_complete_buyer", "returned", "late_fee_payout", "college_escalation"].includes(notification.type) && (
                            <>
                              Update on <span className="font-semibold text-gray-200">"{notification.item_name}"</span> from <span className="text-indigo-300">{notification.sender}</span>.
                            </>
                          )}
                        </p>
                        <div className="flex items-center gap-4 mt-3 flex-wrap">
                          <div className="flex items-center gap-1.5 text-xs">
                            <FiClock size={12} className="text-gray-600" />
                            <span className="text-gray-500">{notification.days || 1} {(notification.days || 1) === 1 ? "day" : "days"}</span>
                          </div>
                          <span className="text-gray-600 text-xs">₹{notification.price}/day</span>
                          <span className="font-bold text-emerald-400 text-sm ml-auto">₹{notification.total_price || notification.price}</span>
                          {notification.rental_id && (
                            <button
                              onClick={() => navigate(`/chat/${notification.rental_id}`)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-indigo-300 hover:text-white transition-all"
                              style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}
                            >
                              <FiMessageSquare size={11} /> Chat
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
