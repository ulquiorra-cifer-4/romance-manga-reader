import React, { useState } from "react";
import { X, List, Search, Check } from "lucide-react";
import { useRomance } from "../context/RomanceContext";

export default function ChapterDrawer({ manga, currentChapterId, onSelectChapter }) {
  const { isChapterDrawerOpen, setIsChapterDrawerOpen } = useRomance();
  const [filterQuery, setFilterQuery] = useState("");

  if (!isChapterDrawerOpen || !manga) return null;

  const chapters = manga.chapters || [];
  const filtered = chapters.filter((c) =>
    c.chapter.includes(filterQuery) ||
    c.title.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="modal-backdrop" onClick={() => setIsChapterDrawerOpen(false)}>
      <div className="side-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="drawer-title">
            <List size={19} color="#22d3ee" />
            <span>Select Chapter ({chapters.length})</span>
          </div>
          <button
            className="settings-close-btn"
            onClick={() => setIsChapterDrawerOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: "0.85rem 1.25rem", borderBottom: "1px solid #252b36" }}>
          <div className="chapters-search-box" style={{ width: "100%" }}>
            <Search size={15} color="#94a3b8" />
            <input
              type="text"
              className="chapters-search-input"
              placeholder="Filter chapters..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="drawer-body" style={{ padding: 0 }}>
          {filtered.map((ch) => {
            const isCurrent = ch.id === currentChapterId;
            return (
              <div
                key={ch.id}
                style={{
                  padding: "0.85rem 1.25rem",
                  borderBottom: "1px solid #252b36",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: isCurrent ? "rgba(34, 211, 238, 0.12)" : "transparent",
                  cursor: "pointer",
                  transition: "background 0.15s"
                }}
                onClick={() => {
                  onSelectChapter(ch.id);
                  setIsChapterDrawerOpen(false);
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: isCurrent ? "#22d3ee" : "#fff", fontSize: "0.92rem" }}>
                    Ch. {ch.chapter} {ch.title ? `- ${ch.title}` : ""}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: 2 }}>
                    {ch.group} • {ch.timeAgo}
                  </div>
                </div>
                {isCurrent && <Check size={18} color="#22d3ee" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
