import React, { useEffect, useState } from "react";
import axios from "axios";
import { useUserContext } from "../context/userContext";
import { FiStar } from "react-icons/fi";

function StarRating({ value, onChange, readonly = false }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange && onChange(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`transition-transform ${!readonly ? "hover:scale-110 cursor-pointer" : "cursor-default"}`}
        >
          <FiStar
            size={readonly ? 14 : 20}
            style={{
              fill: star <= (hovered || value) ? "#f59e0b" : "transparent",
              color: star <= (hovered || value) ? "#f59e0b" : "#4b5563",
              transition: "all 0.15s",
            }}
          />
        </button>
      ))}
    </div>
  );
}

export default function ReviewSection({ itemId }) {
  const { accessToken, user } = useUserContext();
  const [reviews, setReviews] = useState([]);
  const [average, setAverage] = useState(0);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [hasReviewed, setHasReviewed] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchReviews = () => {
    axios
      .get(`/api/reviews/${itemId}`)
      .then((res) => {
        if (res.data.success) {
          setReviews(res.data.reviews);
          setAverage(res.data.average);
          if (user) setHasReviewed(res.data.reviews.some((r) => r.reviewer === user));
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    if (itemId) fetchReviews();
  }, [itemId, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { showToast("Please select a star rating", "error"); return; }
    setSubmitting(true);
    try {
      const res = await axios.post(
        "/api/reviews",
        { item_id: itemId, rating, comment },
        { headers: { Authorization: `Bearer ${accessToken}` }, withCredentials: true }
      );
      if (res.data.success) {
        showToast("Review submitted!");
        setRating(0);
        setComment("");
        fetchReviews();
      } else {
        showToast(res.data.message, "error");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to submit review", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-8">
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

      {/* Header with average */}
      <div
        className="flex items-center gap-4 mb-6 pb-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div>
          <h2 className="text-lg font-bold text-white">Reviews</h2>
          <p className="text-xs text-gray-500">{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</p>
        </div>
        {reviews.length > 0 && (
          <div
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}
          >
            <FiStar size={16} style={{ fill: "#f59e0b", color: "#f59e0b" }} />
            <span className="text-amber-400 font-bold text-lg">{average}</span>
            <span className="text-gray-500 text-xs">/ 5</span>
          </div>
        )}
      </div>

      {/* Submit form */}
      {accessToken && !hasReviewed && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl p-5 mb-6"
          style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.12)" }}
        >
          <p className="text-sm font-semibold text-indigo-300 mb-3">Leave a Review</p>
          <div className="mb-3">
            <StarRating value={rating} onChange={setRating} />
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience... (optional)"
            rows={3}
            className="w-full px-4 py-3 rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          />
          <button
            type="submit"
            disabled={submitting || rating === 0}
            className="mt-3 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      )}
      {hasReviewed && (
        <div className="text-center py-3 mb-4 text-xs text-gray-500">
          ✓ You've already reviewed this item
        </div>
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div
          className="text-center py-10 rounded-xl"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.07)" }}
        >
          <p className="text-gray-600 text-sm">No reviews yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review._id}
              className="p-4 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-indigo-300"
                    style={{ background: "rgba(99,102,241,0.15)" }}
                  >
                    {review.reviewer.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-gray-400 truncate max-w-[120px]">
                    {review.reviewer}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <StarRating value={review.rating} readonly />
                  <span className="text-[10px] text-gray-600">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              {review.comment && (
                <p className="text-sm text-gray-400 leading-relaxed">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
