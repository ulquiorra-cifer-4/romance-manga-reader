import React, { useState, useRef, useEffect } from "react";
import { Heart, Search, BookOpen, Settings, Moon, Compass, Bookmark, X, Sparkles } from "lucide-react";
import { useRomance } from "../context/RomanceContext";
import { ROMANCE_DATABASE } from "../data/romanceMangaDatabase";

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
  const searchRef = useRef(null);

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

  const searchResults = searchVal.trim()
    ? ROMANCE_DATABASE.filter((m) =>
        m.title.toLowerCase().includes(searchVal.toLowerCase()) ||
        m.romajiTitle?.toLowerCase().includes(searchVal.toLowerCase()) ||
        m.storyAndArt.toLowerCase().includes(searchVal.toLowerCase()) ||
        m.tags.some((t) => t.toLowerCase().includes(searchVal.toLowerCase()))
      )
    : [];

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
            {searchResults.length > 0 ? (
              searchResults.map((manga) => (
                <div
                  key={manga.id}
                  className="search-result-item"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setSearchVal("");
                    navigateTo("manga", { mangaId: manga.id });
                  }}
                >
                  <img src={manga.cover} alt={manga.title} className="search-result-thumb" />
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
              ))
            ) : (
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
