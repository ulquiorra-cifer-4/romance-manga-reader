import React, { useState } from "react";
import { BookOpen, Star, Flame, Sparkles, Heart, ChevronRight, Play, Compass, Clock, Award } from "lucide-react";
import { useRomance } from "../context/RomanceContext";
import { ROMANCE_DATABASE, ROMANCE_GENRES } from "../data/romanceMangaDatabase";
import MangaCard from "../components/MangaCard";

export default function HomePage() {
  const { navigateTo, history, favorites } = useRomance();
  const [selectedGenre, setSelectedGenre] = useState("All Romance");
  const [heroIndex, setHeroIndex] = useState(0);

  // Spotlight featured mangas
  const featuredMangas = ROMANCE_DATABASE.filter((m) => m.featured);
  const currentHero = featuredMangas[heroIndex] || ROMANCE_DATABASE[0];

  // Filtered list by genre/trope
  const filteredMangas = ROMANCE_DATABASE.filter((m) => {
    if (selectedGenre === "All Romance") return true;
    if (selectedGenre === "High School") return m.tags.some((t) => t.includes("High School"));
    if (selectedGenre === "Wholesome / Fluff") return m.tags.includes("Wholesome") || m.tags.some((t) => t.includes("Pure") || t.includes("Fluff"));
    if (selectedGenre === "Sports Romance") return m.tags.some((t) => t.includes("Sports"));
    if (selectedGenre === "Rom-Com") return m.genres.includes("Comedy");
    if (selectedGenre === "Slice of Life") return m.genres.includes("Slice of Life");
    if (selectedGenre === "College / Adult") return m.tags.some((t) => t.includes("College") || t.includes("Adult") || t.includes("Workplace"));
    if (selectedGenre === "Enemies / Opposites Attract") return m.tags.some((t) => t.includes("Opposites"));
    return m.genres.includes(selectedGenre);
  });

  return (
    <div className="home-page">
      {/* Dynamic Hero Banner */}
      <section
        className="hero-banner"
        style={{ backgroundImage: `url(${currentHero.banner})` }}
      >
        <div className="hero-overlay" />
        <div className="hero-content">
          <img
            src={currentHero.cover}
            alt={currentHero.title}
            className="hero-cover"
            onClick={() => navigateTo("manga", { mangaId: currentHero.id })}
            style={{ cursor: "pointer" }}
          />
          <div className="hero-info">
            <div className="hero-spotlight-tag">
              <Sparkles size={14} />
              <span>Spotlight Masterpiece</span>
            </div>
            <h1 className="hero-title">{currentHero.title}</h1>
            <div className="hero-author">
              Story & Art by <strong>{currentHero.storyAndArt}</strong> • {currentHero.romajiTitle}
            </div>

            <div className="hero-badges">
              <span className="badge safe">{currentHero.contentRating}</span>
              <span className="badge">{currentHero.type}</span>
              <span className="badge">{currentHero.year}</span>
              <span className="badge ongoing">{currentHero.status}</span>
              <span className="badge score">
                <Star size={12} fill="#facc15" />
                {currentHero.rating} ({currentHero.ratingVotes} votes)
              </span>
              <span className="badge">{currentHero.demographics}</span>
            </div>

            <p className="hero-synopsis">{currentHero.synopsis}</p>

            <div className="hero-actions">
              <button
                className="btn-primary"
                onClick={() => {
                  const firstCh = currentHero.chapters?.[0]?.id || `${currentHero.id}-1`;
                  navigateTo("reader", { mangaId: currentHero.id, chapterId: firstCh });
                }}
              >
                <BookOpen size={18} />
                <span>Start Reading</span>
              </button>

              <button
                className="btn-secondary"
                onClick={() => navigateTo("manga", { mangaId: currentHero.id })}
              >
                <span>View Details & Chapters</span>
                <ChevronRight size={16} />
              </button>

              {/* Cycle through featured carousel */}
              <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
                {featuredMangas.map((m, idx) => (
                  <button
                    key={m.id}
                    onClick={() => setHeroIndex(idx)}
                    style={{
                      width: idx === heroIndex ? 26 : 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: idx === heroIndex ? "#22d3ee" : "#333d4d",
                      transition: "all 0.3s"
                    }}
                    title={m.title}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Romance Category Filter Bar */}
      <div className="category-filter-bar">
        {ROMANCE_GENRES.map((g) => (
          <button
            key={g}
            className={`filter-chip ${selectedGenre === g ? "active" : ""}`}
            onClick={() => setSelectedGenre(g)}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Continue Reading / History Bar (if user read something) */}
      {history.length > 0 && (
        <section className="manga-section" style={{ marginTop: "2rem" }}>
          <div className="section-header">
            <div className="section-title-wrap">
              <Clock size={20} className="section-title-icon" color="#22d3ee" />
              <h2 className="section-title">Continue Where You Left Off</h2>
            </div>
            <button
              className="section-see-all"
              onClick={() => navigateTo("library")}
            >
              My Library ({history.length})
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1rem"
            }}
          >
            {history.slice(0, 3).map((item) => {
              const manga = ROMANCE_DATABASE.find((m) => m.id === item.mangaId) || ROMANCE_DATABASE[0];
              return (
                <div
                  key={`${item.mangaId}-${item.chapterId}`}
                  style={{
                    display: "flex",
                    gap: "1rem",
                    padding: "0.85rem",
                    backgroundColor: "#1a1e25",
                    borderRadius: "12px",
                    border: "1px solid #2b3341",
                    cursor: "pointer",
                    alignItems: "center"
                  }}
                  onClick={() => navigateTo("reader", { mangaId: item.mangaId, chapterId: item.chapterId })}
                >
                  <img
                    src={manga.cover}
                    alt={item.mangaTitle}
                    style={{ width: 56, height: 78, objectFit: "cover", borderRadius: "6px" }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.mangaTitle}
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "#22d3ee", marginTop: "0.2rem" }}>
                      Ch. {item.chapterNum}
                    </div>
                    <div style={{ width: "100%", height: 4, backgroundColor: "#2d3748", borderRadius: 2, marginTop: "0.4rem", overflow: "hidden" }}>
                      <div style={{ width: `${item.progress || 60}%`, height: "100%", backgroundColor: "#22d3ee" }} />
                    </div>
                  </div>
                  <button
                    className="btn-icon-round"
                    style={{ width: 36, height: 36, flexShrink: 0, backgroundColor: "#22d3ee", color: "#000" }}
                  >
                    <Play size={15} fill="#000" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Filtered Masterpieces Section */}
      <section className="manga-section">
        <div className="section-header">
          <div className="section-title-wrap">
            <Flame size={22} className="section-title-icon" />
            <h2 className="section-title">
              {selectedGenre === "All Romance" ? "Top Trending Romance Manga" : selectedGenre}
            </h2>
            <span className="section-subtitle">({filteredMangas.length} series)</span>
          </div>
          <button className="section-see-all" onClick={() => navigateTo("browse")}>
            Explore All Tropes <ChevronRight size={15} />
          </button>
        </div>

        <div className="manga-grid">
          {filteredMangas.map((manga) => (
            <MangaCard key={manga.id} manga={manga} />
          ))}
        </div>
      </section>

      {/* Pure Sweetness & Wholesome Shelf */}
      <section className="manga-section">
        <div className="section-header">
          <div className="section-title-wrap">
            <Heart size={20} className="section-title-icon" fill="#ff4d79" />
            <h2 className="section-title">Sweet & Wholesome Fluff (Zero Heartbreak)</h2>
            <span className="section-subtitle">Comfort reads for soft moments</span>
          </div>
        </div>

        <div className="manga-grid">
          {ROMANCE_DATABASE.filter((m) =>
            m.tags.includes("Wholesome") || m.tags.some((t) => t.includes("Pure") || t.includes("Fluff"))
          ).slice(0, 6).map((manga) => (
            <MangaCard key={manga.id} manga={manga} />
          ))}
        </div>
      </section>

      {/* Legendary Romance Classics */}
      <section className="manga-section">
        <div className="section-header">
          <div className="section-title-wrap">
            <Award size={20} className="section-title-icon" color="#eab308" />
            <h2 className="section-title">All-Time Romance Hall of Fame</h2>
            <span className="section-subtitle">Highest rated romance stories in manga history</span>
          </div>
        </div>

        <div className="manga-grid">
          {[...ROMANCE_DATABASE].sort((a, b) => b.rating - a.rating).slice(0, 6).map((manga) => (
            <MangaCard key={manga.id} manga={manga} />
          ))}
        </div>
      </section>
    </div>
  );
}
