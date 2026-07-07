import React, { useState, useEffect } from "react";
import { useUserContext } from "../context/userContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiArrowLeft,
  FiPackage,
  FiRotateCcw,
  FiTrash2,
  FiMessageSquare,
  FiPlusCircle,
  FiAlertCircle,
} from "react-icons/fi";

const statusConfig = {
  available: { label: "Available", color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)", pulse: true },
  rented: { label: "Rented", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)", pulse: false },
  returned: { label: "Returned", color: "#6366f1", bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.25)", pulse: false },
};

function StatusBadge({ status }) {
  const cfg = statusConfig[status || "available"];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.pulse ? "animate-pulse" : ""}`} style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

export default function Upload() {
  const { setglobaldata, globaldata, user, accessToken } = useUserContext();
  const [filteredData, setFilteredData] = useState([]);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const navigate = useNavigate();

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (globaldata) setFilteredData(globaldata.filter((items) => items.user === user));
  }, [globaldata, user]);

  const remove = async (id) => {
    try {
      await axios.delete("/api/delete", {
        data: { id },
        withCredentials: true,
      });
      const newData = globaldata.filter((item) => item._id !== id);
      setglobaldata(newData);
      showToast("Listing removed.");
    } catch {
      showToast("Something went wrong.", "error");
    } finally {
      setConfirmDelete(null);
    }
  };

  const stats = {
    total: filteredData.length,
    available: filteredData.filter((i) => !i.status || i.status === "available").length,
    rented: filteredData.filter((i) => i.status === "rented").length,
    returned: filteredData.filter((i) => i.status === "returned").length,
  };

  return (
    <div className="min-h-screen py-10 px-4 relative" style={{ background: "linear-gradient(135deg,#0a0e1a 0%,#111827 50%,#0a0e1a 100%)" }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-purple-600/5 rounded-full blur-3xl" />
      </div>

      {/* Toast */}
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

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "rgba(17,24,39,0.95)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <FiAlertCircle size={20} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Remove Listing?</h3>
                <p className="text-xs text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => remove(confirmDelete)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all" style={{ background: "linear-gradient(135deg,#dc2626,#ef4444)" }}>
                Remove
              </button>
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white transition-all" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <button onClick={() => navigate("/home")} className="mb-8 flex items-center gap-2.5 text-gray-400 hover:text-white transition-all group">
          <span className="flex items-center justify-center w-9 h-9 rounded-xl group-hover:bg-indigo-500/20 transition-all" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <FiArrowLeft size={16} />
          </span>
          <span className="text-sm font-medium">Back to Home</span>
        </button>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl text-indigo-400" style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.15)" }}>
              <FiPackage size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">My Listings</h1>
              <p className="text-xs text-gray-500">{stats.total} total listing{stats.total !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/uploadItem")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-indigo-300 hover:text-white transition-all"
            style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}
          >
            <FiPlusCircle size={15} />
            <span className="hidden sm:inline">Add Listing</span>
          </button>
        </div>

        {/* Stats row */}
        {stats.total > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "Available", count: stats.available, color: "#10b981" },
              { label: "Rented", count: stats.rented, color: "#f59e0b" },
              { label: "Returned", count: stats.returned, color: "#6366f1" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: "rgba(17,24,39,0.55)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {filteredData.length === 0 ? (
          <div className="text-center py-24 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}>
            <FiPackage size={40} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-300">No listings yet</h3>
            <p className="text-sm text-gray-500 mt-1 mb-6">Start renting out your items to the campus community!</p>
            <button
              onClick={() => navigate("/uploadItem")}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
              style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}
            >
              Add Your First Item
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredData.map((item) => (
              <div
                key={item._id}
                className="rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/[0.06]"
                style={{ background: "rgba(17,24,39,0.55)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(16px)" }}
              >
                <div className="relative h-48 overflow-hidden">
                  <img src={item.Image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(10,14,26,0.85) 0%,transparent 50%)" }} />
                  <div className="absolute top-3 right-3">
                    <StatusBadge status={item.status || "available"} />
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="text-lg font-bold text-emerald-400">₹{item.price_per_day}<span className="text-xs font-normal text-gray-400">/day</span></span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h2 className="text-sm font-semibold text-gray-100 truncate">{item.name}</h2>
                    <span className="text-xs text-indigo-400 shrink-0 px-2 py-0.5 rounded-md" style={{ background: "rgba(99,102,241,0.1)" }}>{item.category}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">📞 {item.mobile_number}</p>

                  <div className="flex gap-2">
                    {item.status === "rented" && (
                      <button
                        onClick={() => navigate("/rental-history")}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-indigo-300 transition-all hover:text-white"
                        style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}
                      >
                        <FiMessageSquare size={12} /> View Rental
                      </button>
                    )}
                    {item.status === "returned" && (
                      <button
                        onClick={() => navigate("/rental-history")}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-indigo-300 transition-all hover:text-white"
                        style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}
                      >
                        <FiRotateCcw size={12} /> View Return
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmDelete(item._id)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium text-red-400 hover:text-white transition-all"
                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}
                    >
                      <FiTrash2 size={12} />
                      {item.status === "rented" ? "" : "Remove"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
