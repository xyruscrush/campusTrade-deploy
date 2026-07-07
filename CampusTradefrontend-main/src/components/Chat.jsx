import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import { useUserContext } from "../context/userContext";
import { FiArrowLeft, FiSend, FiPackage } from "react-icons/fi";

let socket;

export default function Chat() {
  const { rentalId } = useParams();
  const navigate = useNavigate();
  const { user, accessToken } = useUserContext();
  const [messages, setMessages] = useState([]);
  const [rental, setRental] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!accessToken) return;
    axios
      .get(`/api/messages/${rentalId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      })
      .then((res) => {
        if (res.data.success) {
          setMessages(res.data.messages);
          setRental(res.data.rental);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    socket = io(window.location.origin, { withCredentials: true });
    socket.emit("join_rental", rentalId);
    socket.on("new_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    return () => {
      socket.emit("leave_rental", rentalId);
      socket.disconnect();
    };
  }, [rentalId, accessToken]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await axios.post(
        `/api/messages/${rentalId}`,
        { text },
        { headers: { Authorization: `Bearer ${accessToken}` }, withCredentials: true }
      );
      setText("");
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(135deg,#0a0e1a 0%,#111827 50%,#0a0e1a 100%)" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-4 px-4 py-4 sticky top-0 z-20"
        style={{ background: "rgba(10,14,26,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-9 h-9 rounded-xl text-gray-400 hover:text-white transition-all"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <FiArrowLeft size={16} />
        </button>
        <div className="flex items-center gap-3">
          {rental?.item_image ? (
            <img src={rental.item_image} alt="" className="w-10 h-10 rounded-xl object-cover" />
          ) : (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-indigo-400"
              style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}
            >
              <FiPackage size={18} />
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-gray-100 leading-tight">
              {rental?.item_name || "Chat"}
            </p>
            <p className="text-xs text-gray-500">
              {rental
                ? user === rental.buyer
                  ? `Seller: ${rental.seller}`
                  : `Buyer: ${rental.buyer}`
                : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
        {loading ? (
          <div className="text-center pt-20">
            <div className="relative w-10 h-10 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center pt-20">
            <p className="text-gray-600 text-sm">No messages yet. Say hello! 👋</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender === user;
            return (
              <div
                key={msg._id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="max-w-[75%] px-4 py-2.5 rounded-2xl"
                  style={
                    isMine
                      ? {
                          background: "linear-gradient(135deg,#6366f1,#4f46e5)",
                          borderBottomRightRadius: "4px",
                        }
                      : {
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderBottomLeftRadius: "4px",
                        }
                  }
                >
                  {!isMine && (
                    <p className="text-[10px] font-semibold text-indigo-400 mb-1">{msg.sender}</p>
                  )}
                  <p className="text-sm text-gray-100 leading-relaxed">{msg.text}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? "text-indigo-200" : "text-gray-600"} text-right`}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="px-4 py-4 sticky bottom-0"
        style={{ background: "rgba(10,14,26,0.9)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <form onSubmit={sendMessage} className="flex gap-3 max-w-3xl mx-auto">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 rounded-xl text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="flex items-center justify-center w-12 h-12 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
            style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}
          >
            <FiSend size={17} className="text-white" />
          </button>
        </form>
      </div>
    </div>
  );
}
