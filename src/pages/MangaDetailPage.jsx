import React, { useState } from "react";
import {
  Star,
  BookOpen,
  Bookmark,
  Heart,
  Share2,
  ChevronDown,
  ChevronUp,
  Search,
  ThumbsUp,
  Clock,
  Check,
  FolderPlus,
  ExternalLink,
  Users,
  Eye,
  CheckCircle2
} from "lucide-react";
import { useRomance } from "../context/RomanceContext";
import { ROMANCE_DATABASE } from "../data/romanceMangaDatabase";

export default function MangaDetailPage({ mangaId }) {
  const {
    navigateTo,
    library,
    updateLibraryStatus,
    favorites,
    toggleFavorite
  } = useRomance();

  const manga = ROMANCE_DATABASE.find((m) => m.id === mangaId) || ROMANCE_DATABASE[0];

  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [ratingHover, setRatingHover] = useState(0);
  const [chapterSearch, setChapterSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("All groups");
  const [sortOrder, setSortOrder] = useState("desc"); // 'desc' | 'asc'
  const [sortBy, setSortBy] = useState("chapter"); // 'chapter' | 'volume' | 'date'
  const [showFollowDropdown, setShowFollowDropdown] = useState(false);
  const [copyShareSuccess, setCopyShareSuccess] = useState(false);

  const isFav = favorites.includes(manga.id);
  const currentLibraryStatus = library[manga.id]?.status || null;

  // Extract scanlation groups
  const allGroups = ["All groups", ...new Set(manga.chapters?.map((c) => c.group) || [])];

  // Filter & sort chapters
  const filteredChapters = (manga.chapters || [])
    .filter((ch) => {
      const matchSearch =
        ch.chapter.toLowerCase().includes(chapterSearch.toLowerCase()) ||
        ch.title?.toLowerCase().includes(chapterSearch.toLowerCase());
      const matchGroup = selectedGroup === "All groups" || ch.group === selectedGroup;
      return matchSearch && matchGroup;
    })
    .sort((a, b) => {
      if (sortBy === "chapter") {
        const numA = parseFloat(a.chapter) || 0;
        const numB = parseFloat(b.chapter) || 0;
        return sortOrder === "desc" ? numB - numA : numA - numB;
      }
      if (sortBy === "date") {
        return sortOrder === "desc"
          ? new Date(b.date || 0) - new Date(a.date || 0)
          : new Date(a.date || 0) - new Date(b.date || 0);
      }
      return 0;
    });

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopyShareSuccess(true);
    setTimeout(() => setCopyShareSuccess(false), 2500);
  };

  const followStatuses = [
    { key: "reading", label: "Reading" },
    { key: "plan_to_read", label: "Plan to Read" },
    { key: "completed", label: "Completed" },
    { key: "on_hold", label: "On Hold" },
    { key: "dropped", label: "Dropped" }
  ];

  return (
    <div className="detail-page">
      {/* Breadcrumbs matching Screenshot 5 */}
      <nav className="breadcrumb-nav">
        <a href="#/" onClick={(e) => { e.preventDefault(); navigateTo("home"); }}>
          HOME
        </a>
        <span>/</span>
        <a href="#/browse" onClick={(e) => { e.preventDefault(); navigateTo("browse"); }}>
          MANGA
        </a>
        <span>/</span>
        <span style={{ color: "#fff" }}>{manga.title}</span>
      </nav>

      {/* Main 3-column layout matching Screenshot 5 */}
      <div className="detail-layout">
        {/* LEFT COLUMN: Cover, Star Rating, Share */}
        <div className="detail-left-col">
          <img src={manga.cover} alt={manga.title} className="detail-cover" />

          {/* Star Rating Widget */}
          <div
            className="star-rating-row"
            onMouseLeave={() => setRatingHover(0)}
            title="Rate this romance"
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={22}
                fill={(ratingHover || userRating) >= star ? "#eab308" : "none"}
                color="#eab308"
                onMouseEnter={() => setRatingHover(star)}
                onClick={() => setUserRating(star)}
              />
            ))}
          </div>

          {/* Social Share Row */}
          <div className="share-row">
            <span>SHARE • {manga.ratingVotes || 307}</span>
            <div className="share-icons">
              <button className="share-icon-btn" onClick={handleShare} title="Share Link">
                <Share2 size={14} />
              </button>
            </div>
          </div>
          {copyShareSuccess && (
            <div style={{ fontSize: "0.75rem", color: "#22d3ee" }}>Link copied to clipboard!</div>
          )}
        </div>

        {/* CENTER COLUMN: Info, Badges, Stats, Actions, Synopsis */}
        <div className="detail-center-col">
          <h1 className="detail-title">{manga.title}</h1>
          <div className="detail-author">
            Story & Art <strong>{manga.storyAndArt}</strong>
          </div>
          <div className="detail-alt-titles">
            {manga.kanjiTitle || manga.romajiTitle}
          </div>

          {/* Badges Row */}
          <div className="detail-badge-row">
            <span className="badge">{manga.type}</span>
            <span className="badge safe">{manga.contentRating}</span>
            <span className="badge">{manga.year}</span>
            <span className="badge ongoing">
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#22d3ee", marginRight: 4 }} />
              {manga.status}
            </span>
            <span className="badge">{manga.lang}</span>
          </div>

          {/* Stats Row */}
          <div className="detail-stats-row">
            <div className="stat-item">
              <span style={{ color: "#22d3ee", fontWeight: 700 }}>#{manga.rank}</span>
            </div>
            <div className="stat-item">
              <Star size={15} fill="#facc15" color="#facc15" />
              <strong>{manga.rating}</strong>
              <span style={{ color: "#94a3b8" }}>by {manga.ratingVotes} users</span>
            </div>
            <div className="stat-item">
              <strong>{manga.score}</strong>
              <span style={{ color: "#94a3b8" }}>score</span>
            </div>
            <div className="stat-item">
              <strong>{manga.followed?.toLocaleString()}</strong>
              <span style={{ color: "#94a3b8" }}>followed</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="detail-actions" style={{ position: "relative" }}>
            <button
              className="btn-primary"
              onClick={() => {
                const targetCh = manga.chapters?.[0]?.id || `${manga.id}-1`;
                navigateTo("reader", { mangaId: manga.id, chapterId: targetCh });
              }}
            >
              <BookOpen size={18} />
              <span>Start reading</span>
            </button>

            {/* Follow Dropdown */}
            <div style={{ position: "relative" }}>
              <button
                className="btn-secondary"
                onClick={() => setShowFollowDropdown(!showFollowDropdown)}
              >
                <Bookmark size={16} />
                <span>
                  {currentLibraryStatus
                    ? followStatuses.find((s) => s.key === currentLibraryStatus)?.label
                    : "Follow"}
                </span>
                <ChevronDown size={14} />
              </button>

              {showFollowDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    marginTop: 6,
                    background: "#1c2129",
                    border: "1px solid #333d4d",
                    borderRadius: 10,
                    width: 170,
                    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                    zIndex: 50,
                    overflow: "hidden"
                  }}
                >
                  {followStatuses.map((st) => (
                    <div
                      key={st.key}
                      style={{
                        padding: "0.6rem 0.9rem",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        color: currentLibraryStatus === st.key ? "#22d3ee" : "#fff",
                        background: currentLibraryStatus === st.key ? "rgba(34, 211, 238, 0.1)" : "transparent"
                      }}
                      onClick={() => {
                        updateLibraryStatus(manga.id, st.key);
                        setShowFollowDropdown(false);
                      }}
                    >
                      <span>{st.label}</span>
                      {currentLibraryStatus === st.key && <Check size={14} color="#22d3ee" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              className="btn-secondary"
              onClick={() => updateLibraryStatus(manga.id, "reading")}
            >
              <FolderPlus size={16} />
              <span>Add to Collection</span>
            </button>

            <button
              className={`btn-icon-round ${isFav ? "active" : ""}`}
              onClick={() => toggleFavorite(manga.id)}
              title={isFav ? "Saved in Favorites" : "Add to Favorites"}
            >
              <Heart size={18} fill={isFav ? "#ff4d79" : "none"} color={isFav ? "#ff4d79" : "#fff"} />
            </button>
          </div>

          {/* Synopsis */}
          <div className="detail-synopsis-box">
            <p>
              {isSynopsisExpanded
                ? manga.synopsis
                : `${manga.synopsis.slice(0, 240)}...`}
              <button
                className="view-more-btn"
                onClick={() => setIsSynopsisExpanded(!isSynopsisExpanded)}
              >
                {isSynopsisExpanded ? "[view less]" : "[view more]"}
              </button>
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Genres, Tags, Demographics, Trackers */}
        <div className="detail-right-col">
          {/* Genres */}
          <div>
            <div className="meta-group-title">GENRES</div>
            <div className="meta-tags-list">
              {manga.genres.map((g) => (
                <span
                  key={g}
                  className="meta-pill"
                  onClick={() => navigateTo("browse")}
                >
                  {g}
                </span>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <div className="meta-group-title">TAGS & TROPES</div>
            <div className="meta-tags-list">
              {manga.tags.map((t) => (
                <span
                  key={t}
                  className="meta-pill"
                  style={{ color: "#38bdf8" }}
                  onClick={() => navigateTo("browse")}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Demographics */}
          <div>
            <div className="meta-group-title">DEMOGRAPHICS</div>
            <div className="meta-tags-list">
              <span className="meta-pill" style={{ borderColor: "#f59e0b", color: "#f59e0b" }}>
                {manga.demographics}
              </span>
            </div>
          </div>

          {/* Trackers */}
          <div>
            <div className="meta-group-title">TRACKERS</div>
            <div className="trackers-row">
              {manga.trackers?.anilist && (
                <a href={manga.trackers.anilist} target="_blank" rel="noreferrer" className="tracker-badge tracker-al">
                  AL
                </a>
              )}
              {manga.trackers?.mal && (
                <a href={manga.trackers.mal} target="_blank" rel="noreferrer" className="tracker-badge tracker-mal">
                  MAL
                </a>
              )}
              {manga.trackers?.mangaupdates && (
                <a href={manga.trackers.mangaupdates} target="_blank" rel="noreferrer" className="tracker-badge tracker-mu">
                  MU
                </a>
              )}
              {manga.trackers?.mangadex && (
                <a href={manga.trackers.mangadex} target="_blank" rel="noreferrer" className="tracker-badge tracker-md">
                  MD
                </a>
              )}
              {manga.trackers?.mangabtt && (
                <a href={manga.trackers.mangabtt} target="_blank" rel="noreferrer" className="tracker-badge tracker-mb">
                  MB
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CHAPTERS SECTION matching Screenshot 4 */}
      <section className="chapters-container">
        <h2 className="chapters-header">Chapters</h2>

        {/* Toolbar matching Screenshot 4 */}
        <div className="chapters-toolbar">
          <div className="chapters-search-box">
            <Search size={15} color="#94a3b8" />
            <input
              type="text"
              className="chapters-search-input"
              placeholder="Search chapter..."
              value={chapterSearch}
              onChange={(e) => setChapterSearch(e.target.value)}
            />
          </div>

          <div className="chapters-filters">
            {/* Group Filter */}
            <select
              className="filter-dropdown-btn"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
            >
              {allGroups.map((grp) => (
                <option key={grp} value={grp} style={{ background: "#1a1e25", color: "#fff" }}>
                  {grp}
                </option>
              ))}
            </select>

            {/* Sort Buttons matching Screenshot 4 */}
            <div className="sort-group">
              <button
                className={`sort-btn ${sortBy === "chapter" ? "active" : ""}`}
                onClick={() => {
                  if (sortBy === "chapter") {
                    setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                  } else {
                    setSortBy("chapter");
                    setSortOrder("desc");
                  }
                }}
              >
                <span>{sortOrder === "desc" ? "↓" : "↑"} Chapter</span>
              </button>
              <button
                className={`sort-btn ${sortBy === "volume" ? "active" : ""}`}
                onClick={() => setSortBy("volume")}
              >
                Volume
              </button>
              <button
                className={`sort-btn ${sortBy === "date" ? "active" : ""}`}
                onClick={() => {
                  setSortBy("date");
                  setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                }}
              >
                Date
              </button>
            </div>
          </div>
        </div>

        {/* Chapters List matching Screenshot 4 */}
        <div className="chapters-list">
          {filteredChapters.length > 0 ? (
            filteredChapters.map((ch) => (
              <div
                key={ch.id}
                className="chapter-row"
                onClick={() => navigateTo("reader", { mangaId: manga.id, chapterId: ch.id })}
              >
                <div className="chapter-row-left">
                  <span className="chapter-num">Ch.{ch.chapter}</span>
                  {ch.title && (
                    <span className="chapter-title-text">{ch.title}</span>
                  )}
                </div>

                <div className="chapter-row-right">
                  <div className={`chapter-group ${ch.verified ? "verified" : ""}`}>
                    {ch.verified && <CheckCircle2 size={13} color="#22d3ee" />}
                    <span>{ch.group}</span>
                  </div>

                  <div className="chapter-likes">
                    <ThumbsUp size={13} />
                    <span>{ch.likes}</span>
                  </div>

                  <div className="chapter-time">
                    <span>{ch.timeAgo}</span>
                  </div>

                  <button
                    style={{ color: "#64748b" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateLibraryStatus(manga.id, "reading", ch.chapter);
                    }}
                    title="Bookmark this chapter"
                  >
                    <Bookmark size={15} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>
              No chapters found matching "{chapterSearch}".
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
