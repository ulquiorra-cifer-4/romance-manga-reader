import React, { useState } from "react";
import { Bookmark, Heart, Clock, CheckCircle, BookOpen, Trash2, ArrowRight } from "lucide-react";
import { useRomance } from "../context/RomanceContext";
import { ROMANCE_DATABASE } from "../data/romanceMangaDatabase";
import MangaCard from "../components/MangaCard";

export default function LibraryPage() {
  const { library, history, favorites, navigateTo, updateLibraryStatus } = useRomance();
  const [activeTab, setActiveTab] = useState("reading"); // 'reading' | 'plan_to_read' | 'completed' | 'favorites' | 'history'

  const libraryKeys = Object.keys(library);

  // Filter manga for library statuses
  const readingList = libraryKeys
    .filter((id) => library[id]?.status === "reading")
    .map((id) => ({ manga: ROMANCE_DATABASE.find((m) => m.id === id) || { id, title: id, cover: "" }, entry: library[id] }));

  const planList = libraryKeys
    .filter((id) => library[id]?.status === "plan_to_read")
    .map((id) => ({ manga: ROMANCE_DATABASE.find((m) => m.id === id) || { id, title: id, cover: "" }, entry: library[id] }));

  const completedList = libraryKeys
    .filter((id) => library[id]?.status === "completed")
    .map((id) => ({ manga: ROMANCE_DATABASE.find((m) => m.id === id) || { id, title: id, cover: "" }, entry: library[id] }));

  const favoriteMangas = favorites
    .map((id) => ROMANCE_DATABASE.find((m) => m.id === id))
    .filter(Boolean);

  return (
    <div className="detail-page" style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "2.2rem", fontWeight: 800, color: "#fff" }}>
          My Romance Sanctuary
        </h1>
        <p style={{ color: "#94a3b8", marginTop: 4 }}>
          Your personal library of heartfelt confessions, wholesome moments, and reading progress.
        </p>

        {/* Quick Stats Bar */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
            marginTop: "1.5rem"
          }}
        >
          <div style={{ background: "#1a1e25", padding: "1rem", borderRadius: 12, border: "1px solid #28313e" }}>
            <div style={{ fontSize: "0.8rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>Reading</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#22d3ee", marginTop: 4 }}>
              {readingList.length}
            </div>
          </div>
          <div style={{ background: "#1a1e25", padding: "1rem", borderRadius: 12, border: "1px solid #28313e" }}>
            <div style={{ fontSize: "0.8rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>Favorites</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#ff4d79", marginTop: 4 }}>
              {favorites.length}
            </div>
          </div>
          <div style={{ background: "#1a1e25", padding: "1rem", borderRadius: 12, border: "1px solid #28313e" }}>
            <div style={{ fontSize: "0.8rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>History Logs</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#facc15", marginTop: 4 }}>
              {history.length}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid #2b3341", paddingBottom: "0.5rem", marginBottom: "1.5rem", overflowX: "auto" }}>
        <button
          className={`filter-chip ${activeTab === "reading" ? "active" : ""}`}
          onClick={() => setActiveTab("reading")}
        >
          Reading ({readingList.length})
        </button>
        <button
          className={`filter-chip ${activeTab === "plan_to_read" ? "active" : ""}`}
          onClick={() => setActiveTab("plan_to_read")}
        >
          Plan to Read ({planList.length})
        </button>
        <button
          className={`filter-chip ${activeTab === "completed" ? "active" : ""}`}
          onClick={() => setActiveTab("completed")}
        >
          Completed ({completedList.length})
        </button>
        <button
          className={`filter-chip ${activeTab === "favorites" ? "active" : ""}`}
          onClick={() => setActiveTab("favorites")}
        >
          Favorites ♥ ({favoriteMangas.length})
        </button>
        <button
          className={`filter-chip ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          Reading History ({history.length})
        </button>
      </div>

      {/* Tab Content: Reading / Plan / Completed */}
      {(activeTab === "reading" || activeTab === "plan_to_read" || activeTab === "completed") && (
        <div>
          {(() => {
            const list = activeTab === "reading" ? readingList : activeTab === "plan_to_read" ? planList : completedList;
            if (list.length === 0) {
              return (
                <div style={{ padding: "4rem 2rem", textAlign: "center", background: "#1a1e25", borderRadius: 16 }}>
                  <Bookmark size={36} color="#64748b" style={{ margin: "0 auto 1rem" }} />
                  <h3 style={{ color: "#fff", marginBottom: "0.5rem" }}>No series in this shelf yet</h3>
                  <p style={{ color: "#94a3b8", marginBottom: "1.5rem" }}>
                    Browse our curated romance collections to add stories to your library.
                  </p>
                  <button className="btn-primary" onClick={() => navigateTo("browse")}>
                    Browse Romance Masterpieces
                  </button>
                </div>
              );
            }
            return (
              <div className="manga-grid">
                {list.map(({ manga }) => (
                  <MangaCard key={manga.id} manga={manga} />
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Tab Content: Favorites */}
      {activeTab === "favorites" && (
        <div>
          {favoriteMangas.length > 0 ? (
            <div className="manga-grid">
              {favoriteMangas.map((manga) => (
                <MangaCard key={manga.id} manga={manga} />
              ))}
            </div>
          ) : (
            <div style={{ padding: "4rem 2rem", textAlign: "center", background: "#1a1e25", borderRadius: 16 }}>
              <Heart size={36} color="#64748b" style={{ margin: "0 auto 1rem" }} />
              <h3 style={{ color: "#fff" }}>No favorites marked yet</h3>
              <p style={{ color: "#94a3b8", marginTop: 4 }}>
                Click the heart icon on any manga card to bookmark your most treasured romance series!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: History */}
      {activeTab === "history" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {history.length > 0 ? (
            history.map((item, idx) => {
              const manga = ROMANCE_DATABASE.find((m) => m.id === item.mangaId) || ROMANCE_DATABASE[0];
              return (
                <div
                  key={`${item.mangaId}-${item.chapterId}-${idx}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1rem 1.25rem",
                    backgroundColor: "#1a1e25",
                    borderRadius: "12px",
                    border: "1px solid #2b3341"
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer", flex: 1 }}
                    onClick={() => navigateTo("reader", { mangaId: item.mangaId, chapterId: item.chapterId })}
                  >
                    <img
                      src={manga.cover}
                      alt={item.mangaTitle}
                      style={{ width: 44, height: 60, objectFit: "cover", borderRadius: 6 }}
                    />
                    <div>
                      <h4 style={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>{item.mangaTitle}</h4>
                      <div style={{ fontSize: "0.85rem", color: "#22d3ee", marginTop: 2 }}>
                        Chapter {item.chapterNum} • Page {item.page || 1}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 2 }}>
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <button
                    className="btn-primary"
                    style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
                    onClick={() => navigateTo("reader", { mangaId: item.mangaId, chapterId: item.chapterId })}
                  >
                    <span>Resume</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              );
            })
          ) : (
            <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>
              No reading history recorded yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
