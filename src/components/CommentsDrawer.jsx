import React, { useState } from "react";
import { X, MessageSquare, ThumbsUp, Heart, Send } from "lucide-react";
import { useRomance } from "../context/RomanceContext";

export default function CommentsDrawer({ currentChapterTitle = "Chapter Discussion" }) {
  const { isCommentsOpen, setIsCommentsOpen } = useRomance();

  const [comments, setComments] = useState([
    {
      id: 1,
      user: "ChinatsuFan99",
      avatar: "🌸",
      time: "2 hours ago",
      text: "The facial expressions in this chapter are peak art! When Taiki blushed my heart literally melted...",
      likes: 42
    },
    {
      id: 2,
      user: "RomanceAddict",
      avatar: "💖",
      time: "5 hours ago",
      text: "The pacing in this romance is unmatched. Healthy communication, no pointless drama, just genuine warmth.",
      likes: 28
    },
    {
      id: 3,
      user: "HinaSupporter",
      avatar: "🏸",
      time: "Yesterday",
      text: "I read this entire arc in one sitting. I need next week's chapter immediately!",
      likes: 19
    }
  ]);

  const [newComment, setNewComment] = useState("");

  if (!isCommentsOpen) return null;

  const handlePost = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments([
      {
        id: Date.now(),
        user: "You (Romantic Reader)",
        avatar: "✨",
        time: "Just now",
        text: newComment.trim(),
        likes: 1
      },
      ...comments
    ]);
    setNewComment("");
  };

  return (
    <div className="modal-backdrop" onClick={() => setIsCommentsOpen(false)}>
      <div className="side-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="drawer-title">
            <MessageSquare size={19} color="#ff4d79" />
            <span>Romance Reactions</span>
          </div>
          <button
            className="settings-close-btn"
            onClick={() => setIsCommentsOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid #252b36", fontSize: "0.85rem", color: "#94a3b8" }}>
          Discussing <strong style={{ color: "#fff" }}>{currentChapterTitle}</strong>
        </div>

        <div className="drawer-body">
          {comments.map((c) => (
            <div
              key={c.id}
              style={{
                marginBottom: "1rem",
                padding: "0.85rem",
                backgroundColor: "#202630",
                borderRadius: "10px",
                border: "1px solid #2b3341"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>{c.avatar}</span>
                  <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "#fff" }}>{c.user}</span>
                </div>
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{c.time}</span>
              </div>
              <p style={{ fontSize: "0.88rem", color: "#cbd5e1", lineHeight: 1.5, marginBottom: "0.5rem" }}>
                {c.text}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", color: "#94a3b8" }}>
                <ThumbsUp size={13} />
                <span>{c.likes} loves</span>
              </div>
            </div>
          ))}
        </div>

        <form className="comment-input-area" onSubmit={handlePost}>
          <textarea
            className="comment-textarea"
            placeholder="Share your thoughts on this sweet chapter..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button type="submit" className="comment-post-btn">
            Post Reaction
          </button>
        </form>
      </div>
    </div>
  );
}
