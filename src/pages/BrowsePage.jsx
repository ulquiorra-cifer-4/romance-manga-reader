import React, { useState, useEffect } from "react";
import { Search, Filter, Sparkles, Star, Globe, RefreshCw } from "lucide-react";
import { useRomance } from "../context/RomanceContext";
import { ROMANCE_DATABASE, ROMANCE_GENRES, ROMANCE_TROPES } from "../data/romanceMangaDatabase";
import { searchMangaDexRomance, fetchReadableRomance } from "../services/mangadexApi";
import { searchAniList } from "../services/anilistApi";
import { REGISTER_DYNAMIC_MANGA } from "../data/romanceMangaDatabase";
import MangaCard from "../components/MangaCard";

export default function BrowsePage() {
  const { navigateTo } = useRomance();

  const [activeTrope, setActiveTrope] = useState("All");
  const [selectedDemographic, setSelectedDemographic] = useState("All");
  const [sortBy, setSortBy] = useState("rating"); // 'rating' | 'views' | 'year' | 'title'
  const [browseSearch, setBrowseSearch] = useState("");
  const [includeMangaDex, setIncludeMangaDex] = useState(true);
  const [mangaDexResults, setMangaDexResults] = useState([]);
  const [isLoadingMangaDex, setIsLoadingMangaDex] = useState(false);

  // Fetch live MangaDex romance titles when toggled or search queried
  useEffect(() => {
    if (!includeMangaDex) return;
    let isCancelled = false;
    setIsLoadingMangaDex(true);

    const finish = () => !isCancelled && setIsLoadingMangaDex(false);
    if (!browseSearch.trim()) {
      // No search text: show titles verified as readable on MangaDex
      fetchReadableRomance({
        target: 30,
        onFound: (list) => {
          list.forEach((r) => REGISTER_DYNAMIC_MANGA(r));
          if (!isCancelled) setMangaDexResults(list);
        },
      }).catch(() => {}).finally(finish);
    } else {
      searchAniList(browseSearch, 24)
        .catch(() => searchMangaDexRomance(browseSearch, 8))
        .then((data) => {
          data.forEach((r) => REGISTER_DYNAMIC_MANGA(r));
          if (!isCancelled) setMangaDexResults(data);
        })
        .catch(() => {})
        .finally(finish);
    }

    return () => {
      isCancelled = true;
    };
  }, [includeMangaDex, browseSearch]);

  // Filter curated database
  let results = ROMANCE_DATABASE.filter((m) => {
    const matchSearch =
      !browseSearch.trim() ||
      m.title.toLowerCase().includes(browseSearch.toLowerCase()) ||
      m.storyAndArt.toLowerCase().includes(browseSearch.toLowerCase()) ||
      m.tags.some((t) => t.toLowerCase().includes(browseSearch.toLowerCase()));

    const matchTrope =
      activeTrope === "All" ||
      m.tags.includes(activeTrope) ||
      m.genres.includes(activeTrope);

    const matchDemo =
      selectedDemographic === "All" ||
      m.demographics.toLowerCase() === selectedDemographic.toLowerCase();

    return matchSearch && matchTrope && matchDemo;
  });

  // Sort results
  results.sort((a, b) => {
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "year") return b.year - a.year;
    if (sortBy === "title") return a.title.localeCompare(b.title);
    return 0;
  });

  return (
    <div className="detail-page" style={{ maxWidth: 1300 }}>
      {/* Title */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "2.4rem", fontWeight: 800, color: "#fff" }}>
          Browse Romance Sanctuaries
        </h1>
        <p style={{ color: "#94a3b8", marginTop: 4 }}>
          Discover beloved romance manga masterpieces filtered by pure heart-fluttering tropes.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: "#1a1e25",
          padding: "1.25rem",
          borderRadius: "14px",
          border: "1px solid #28313e",
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "2rem"
        }}
      >
        <div className="search-input-wrapper" style={{ minWidth: 260, flex: 1 }}>
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by romance trope, character, keyword..."
            value={browseSearch}
            onChange={(e) => setBrowseSearch(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          {/* Demographic */}
          <select
            className="filter-dropdown-btn"
            value={selectedDemographic}
            onChange={(e) => setSelectedDemographic(e.target.value)}
          >
            <option value="All">All Demographics</option>
            <option value="Shounen">Shounen Romance</option>
            <option value="Shoujo">Shoujo Romance</option>
            <option value="Seinen">Seinen Romance</option>
            <option value="Josei">Josei Romance</option>
          </select>

          {/* Sort */}
          <select
            className="filter-dropdown-btn"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="rating">Highest Rated</option>
            <option value="year">Newest Release</option>
            <option value="title">Alphabetical</option>
          </select>

          {/* MangaDex live toggle */}
          <button
            className={`filter-chip ${includeMangaDex ? "active" : ""}`}
            style={{ borderRadius: 8, padding: "0.45rem 0.85rem" }}
            onClick={() => setIncludeMangaDex(!includeMangaDex)}
          >
            <Globe size={14} style={{ marginRight: 4, display: "inline" }} />
            <span>MangaDex Live Sync</span>
          </button>
        </div>
      </div>

      {/* Trope Chips */}
      <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "1rem", marginBottom: "2rem" }}>
        {["All", ...ROMANCE_TROPES].map((trope) => (
          <button
            key={trope}
            className={`filter-chip ${activeTrope === trope ? "active" : ""}`}
            onClick={() => setActiveTrope(trope)}
          >
            {trope}
          </button>
        ))}
      </div>

      {/* Curated Results */}
      <div className="manga-section" style={{ margin: 0, padding: 0 }}>
        <div className="section-header">
          <div className="section-title-wrap">
            <Sparkles size={20} color="#22d3ee" />
            <h2 className="section-title">
              {activeTrope === "All" ? "Curated Romance Gems" : activeTrope}
            </h2>
            <span className="section-subtitle">({results.length} masterpieces)</span>
          </div>
        </div>

        {results.length > 0 ? (
          <div className="manga-grid">
            {results.map((manga) => (
              <MangaCard key={manga.id} manga={manga} />
            ))}
          </div>
        ) : (
          <div style={{ padding: "4rem 2rem", textAlign: "center", background: "#1a1e25", borderRadius: 16 }}>
            <h3 style={{ color: "#fff" }}>No titles match your active filters</h3>
            <p style={{ color: "#94a3b8", marginTop: 4 }}>
              Try selecting "All" tropes or clearing the search query.
            </p>
          </div>
        )}
      </div>

      {/* Live MangaDex Section if enabled */}
      {includeMangaDex && (
        <div className="manga-section" style={{ marginTop: "3.5rem", padding: 0 }}>
          <div className="section-header">
            <div className="section-title-wrap">
              <Globe size={20} color="#ff4d79" />
              <h2 className="section-title">Live Romance Catalog</h2>
              {isLoadingMangaDex && <RefreshCw size={16} className="spin" color="#22d3ee" />}
            </div>
          </div>

          {mangaDexResults.length > 0 ? (
            <div className="manga-grid">
              {mangaDexResults.map((manga) => (
                <MangaCard key={manga.id} manga={manga} />
              ))}
            </div>
          ) : !isLoadingMangaDex ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>
              No extra results loaded from MangaDex API for this query.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
