import React, { useState, useRef, useEffect } from "react";
import { Heart, Search, BookOpen, Settings, Moon, Compass, Bookmark, X, Sparkles, Loader } from "lucide-react";
import { useRomance } from "../context/RomanceContext";
import { onCoverError } from "../services/mangadexApi";
import { ROMANCE_DATABASE } from "../data/romanceMangaDatabase";
import { searchMangaDex } from "../services/mangadexApi";
import { searchAniList } from "../services/anilistApi";
import { REGISTER_DYNAMIC_MANGA } from "../data/romanceMangaDatabase";

export default function Header() {
  const {
    navigateTo,
    route,
    setIsSettingsOpen,
    library,
    settings,
    updateSetting
  } = useRomance();

  const [searchVal, setSearchVal] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [liveResults, setLiveResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // Close search dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Local database search (instant)
  const localResults = searchVal.trim()
    ? ROMANCE_DATABASE.filter((m) =>
        m.title.toLowerCase().includes(searchVal.toLowerCase()) ||
        m.romajiTitle?.toLowerCase().includes(searchVal.toLowerCase()) ||
        m.storyAndArt?.toLowerCase().includes(searchVal.toLowerCase()) ||
        m.tags?.some((t) => t.toLowerCase().includes(searchVal.toLowerCase()))
      )
    : [];

  // Live MangaDex search (debounced)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!searchVal.trim() || searchVal.trim().length < 2) {
      setLiveResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(() => {
      searchAniList(searchVal.trim(), 8)
        .catch(() => searchMangaDex(searchVal.trim(), 8))
        .then((results) => {
          // Filter out titles already in the curated database
          const localTitles = new Set(ROMANCE_DATABASE.map(m => (m.romajiTitle || m.title).toLowerCase()));
          const newResults = results.filter(r => !localTitles.has((r.romajiTitle || r.title).toLowerCase()));
          // Register these in dynamic registry so they can be navigated to
          newResults.forEach(r => REGISTER_DYNAMIC_MANGA(r));
          setLiveResults(newResults);
          setIsSearching(false);
        })
        .catch(() => {
          setIsSearching(false);
        });
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchVal]);

  // Merge local + live results
  const allResults = [...localResults, ...liveResults];

  const libraryCount = Object.keys(library).length;

  const toggleNightDim = () => {
    updateSetting("dimPages", settings.dimPages > 0 ? 0 : 35);
  };

  return (
    <header className="site-header">
      <div className="header-left">
        <div className="brand-logo" onClick={() => navigateTo("home")}>
          <Heart className="brand-heart-icon" size={24} fill="currentColor" />
          <span>AmoreComix</span>
        </div>

        <nav className="header-nav">
          <button
            className={`nav-link ${route.view === "home" ? "active" : ""}`}
            onClick={() => navigateTo("home")}
          >
            <Sparkles size={16} />
            <span>Romance Hub</span>
          </button>
          <button
            className={`nav-link ${route.view === "browse" ? "active" : ""}`}
            onClick={() => navigateTo("browse")}
          >
            <Compass size={16} />
            <span>Tropes & Browse</span>
          </button>
          <button
            className={`nav-link ${route.view === "library" ? "active" : ""}`}
            onClick={() => navigateTo("library")}
          >
            <Bookmark size={16} />
            <span>My Library</span>
            {libraryCount > 0 && (
              <span className="badge safe" style={{ padding: "0.1rem 0.4rem", fontSize: "0.7rem" }}>
                {libraryCount}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Center Search Bar */}
      <div className="header-search-bar" ref={searchRef}>
        <div className="search-input-wrapper">
          <Search size={17} color="#94a3b8" />
          <input
            type="text"
            className="search-input"
            placeholder="Search romance title, trope, author (e.g. Blue Box, Wholesome)..."
            value={searchVal}
            onChange={(e) => {
              setSearchVal(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
          />
          {searchVal && (
            <button
              onClick={() => {
                setSearchVal("");
                setIsDropdownOpen(false);
                setLiveResults([]);
              }}
              style={{ color: "#94a3b8" }}
            >
              <X size={16} />
            </button>
          )}
          <span className="search-browse-tag" onClick={() => navigateTo("browse")}>
            Browse
          </span>
        </div>

        {/* Search Results Dropdown */}
        {isDropdownOpen && searchVal.trim() && (
          <div className="search-dropdown">
            {/* Local curated results */}
            {localResults.length > 0 && (
              <div style={{ padding: "0.4rem 0.8rem 0.2rem", fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Curated Collection
              </div>
            )}
            {localResults.map((manga) => (
              <div
                key={manga.id}
                className="search-result-item"
                onClick={() => {
                  setIsDropdownOpen(false);
                  setSearchVal("");
                  navigateTo("manga", { mangaId: manga.id });
                }}
              >
                <img referrerPolicy="no-referrer" src={manga.cover} alt={manga.title} className="search-result-thumb" onError={onCoverError} />
                <div className="search-result-info">
                  <div className="search-result-title">{manga.title}</div>
                  <div className="search-result-meta">
                    <span>★ {manga.rating}</span>
                    <span>•</span>
                    <span>Ch. {manga.latestChapter}</span>
                    <span>•</span>
                    <span>{manga.status}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Live MangaDex results */}
            {(isSearching || liveResults.length > 0) && (
              <div style={{ padding: "0.4rem 0.8rem 0.2rem", fontSize: "0.7rem", color: "#22d3ee", textTransform: "uppercase", letterSpacing: "0.05em", borderTop: localResults.length > 0 ? "1px solid #28313e" : "none", marginTop: localResults.length > 0 ? "0.3rem" : 0 }}>
                {isSearching ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Loader size={11} className="spin" />
                    Searching MangaDex...
                  </span>
                ) : (
                  "From MangaDex"
                )}
              </div>
            )}
            {liveResults.map((manga) => (
              <div
                key={manga.id}
                className="search-result-item"
                onClick={() => {
                  setIsDropdownOpen(false);
                  setSearchVal("");
                  navigateTo("manga", { mangaId: manga.id });
                }}
              >
                <img referrerPolicy="no-referrer" src={manga.cover} alt={manga.title} className="search-result-thumb" onError={onCoverError} />
                <div className="search-result-info">
                  <div className="search-result-title">{manga.title}</div>
                  <div className="search-result-meta">
                    <span>★ {manga.rating}</span>
                    <span>•</span>
                    <span>{manga.year}</span>
                    <span>•</span>
                    <span style={{ color: "#22d3ee" }}>MangaDex</span>
                  </div>
                </div>
              </div>
            ))}

            {/* No results at all */}
            {allResults.length === 0 && !isSearching && (
              <div style={{ padding: "1.2rem", textAlign: "center", color: "#94a3b8" }}>
                No romance series found for "{searchVal}". Click "Browse" for more.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="header-right">
        <button
          className="header-icon-btn"
          title={`Eye-Care Dimmer (${settings.dimPages > 0 ? "Active" : "Off"})`}
          onClick={toggleNightDim}
          style={settings.dimPages > 0 ? { color: "#22d3ee" } : {}}
        >
          <Moon size={19} />
        </button>

        <button
          className="header-icon-btn"
          title="Reader Settings"
          onClick={() => setIsSettingsOpen(true)}
        >
          <Settings size={19} />
        </button>

        <button
          className="login-btn"
          onClick={() => navigateTo("library")}
          title="Romantic Member Profile"
        >
          My Haven
        </button>
      </div>
    </header>
  );
}
