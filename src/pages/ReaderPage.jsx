import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  BookOpen,
  MessageSquare,
  List,
  Maximize,
  Minimize,
  Play,
  Pause,
  Settings as SettingsIcon,
  HelpCircle,
  ZoomIn,
  ZoomOut,
  ArrowRight
} from "lucide-react";
import { useRomance } from "../context/RomanceContext";
import { ROMANCE_DATABASE, GET_MANGA_BY_ID } from "../data/romanceMangaDatabase";
import CommentsDrawer from "../components/CommentsDrawer";
import ChapterDrawer from "../components/ChapterDrawer";

export default function ReaderPage({ mangaId, chapterId }) {
  const {
    navigateTo,
    settings,
    setIsSettingsOpen,
    setIsShortcutsOpen,
    setIsCommentsOpen,
    setIsChapterDrawerOpen,
    recordReadingHistory
  } = useRomance();

  const manga = GET_MANGA_BY_ID(mangaId) || ROMANCE_DATABASE[0];
  const chapters = manga.chapters || [];
  const currentChapterIndex = chapters.findIndex((c) => c.id === chapterId);
  const currentChapter = chapters[currentChapterIndex] || chapters[0] || {
    id: "default",
    chapter: "1",
    title: "Chapter 1",
    pages: []
  };

  const prevChapter = currentChapterIndex < chapters.length - 1 ? chapters[currentChapterIndex + 1] : null;
  const nextChapter = currentChapterIndex > 0 ? chapters[currentChapterIndex - 1] : null;

  // Reader states
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const [canvasFit, setCanvasFit] = useState("width"); // 'width' | 'height' | 'full'

  const autoScrollRef = useRef(null);
  const lastTimeRef = useRef(null);

  const pages = currentChapter.pages || [];
  const totalPages = pages.length || 1;

  // Track scroll position, update progress & current page
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
      setScrollProgress(progress);

      const estimatedPage = Math.min(totalPages, Math.max(1, Math.round((progress / 100) * totalPages)));
      setCurrentPageNum(estimatedPage);

      // Record reading history periodically
      recordReadingHistory({
        mangaId: manga.id,
        mangaTitle: manga.title,
        chapterId: currentChapter.id,
        chapterNum: currentChapter.chapter,
        page: estimatedPage,
        progress: Math.round(progress)
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [totalPages, manga.id, manga.title, currentChapter.id, currentChapter.chapter]);

  // Smooth Auto-Scroll loop matching Screenshot 3 settings
  useEffect(() => {
    if (!isAutoScrolling) {
      if (autoScrollRef.current) cancelAnimationFrame(autoScrollRef.current);
      lastTimeRef.current = null;
      return;
    }

    const scrollStep = (timestamp) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      const pixelsToScroll = settings.autoScrollSpeed * deltaTime;
      window.scrollBy({ top: pixelsToScroll, behavior: "auto" });

      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 5;
      if (atBottom) {
        setIsAutoScrolling(false);
        return;
      }

      autoScrollRef.current = requestAnimationFrame(scrollStep);
    };

    autoScrollRef.current = requestAnimationFrame(scrollStep);

    return () => {
      if (autoScrollRef.current) cancelAnimationFrame(autoScrollRef.current);
    };
  }, [isAutoScrolling, settings.autoScrollSpeed]);

  // Keyboard navigation matching settings (Arrow, Space, W, S, A, F)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is in an input or textarea
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;

      const stepPx = (window.innerHeight * (settings.keyboardStepSize / 100));
      const behavior = settings.keyboardScrollMode === "smooth" ? "smooth" : "instant";

      switch (e.key) {
        case "ArrowDown":
        case "s":
        case "S":
        case " ":
          e.preventDefault();
          window.scrollBy({ top: stepPx, behavior });
          break;
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault();
          window.scrollBy({ top: -stepPx, behavior });
          break;
        case "a":
        case "A":
          e.preventDefault();
          setIsAutoScrolling((prev) => !prev);
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
        case "M":
        case "o":
        case "O":
          e.preventDefault();
          setIsSettingsOpen(true);
          break;
        case "c":
        case "C":
          e.preventDefault();
          setIsCommentsOpen(true);
          break;
        case "l":
        case "L":
          e.preventDefault();
          setIsChapterDrawerOpen(true);
          break;
        case "h":
        case "H":
          e.preventDefault();
          navigateTo("manga", { mangaId: manga.id });
          break;
        case "[":
          if (prevChapter) navigateTo("reader", { mangaId: manga.id, chapterId: prevChapter.id });
          break;
        case "]":
          if (nextChapter) navigateTo("reader", { mangaId: manga.id, chapterId: nextChapter.id });
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [settings, prevChapter, nextChapter, manga.id]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleZoomChange = (delta) => {
    setZoomLevel((prev) => Math.min(160, Math.max(50, prev + delta)));
  };

  return (
    <div
      className="reader-page"
      style={{ backgroundColor: settings.readerBackground || "#13161b" }}
    >
      {/* Eyecare Dimmer Layer (matching Screenshot 3 DIM PAGES setting) */}
      {settings.dimPages > 0 && (
        <div
          className="eyecare-dim-overlay"
          style={{ opacity: settings.dimPages / 100 }}
        />
      )}

      {/* Configurable Progress Bar (matching Screenshot 3: left, top, bottom, right, none) */}
      {settings.progressBarPosition === "left" && (
        <div className="reader-progressbar-left">
          <div className="progress-fill" style={{ height: `${scrollProgress}%` }} />
        </div>
      )}
      {settings.progressBarPosition === "top" && (
        <div className="reader-progressbar-top">
          <div className="progress-fill" style={{ width: `${scrollProgress}%` }} />
        </div>
      )}
      {settings.progressBarPosition === "bottom" && (
        <div className="reader-progressbar-bottom">
          <div className="progress-fill" style={{ width: `${scrollProgress}%` }} />
        </div>
      )}
      {settings.progressBarPosition === "right" && (
        <div className="reader-progressbar-right">
          <div className="progress-fill" style={{ height: `${scrollProgress}%` }} />
        </div>
      )}

      {/* Top Bar matching Screenshot 1 */}
      <header className="reader-top-bar">
        <div className="reader-nav-group">
          <button
            className="btn-secondary"
            style={{ padding: "0.35rem 0.8rem", fontSize: "0.85rem" }}
            onClick={() => navigateTo("manga", { mangaId: manga.id })}
          >
            ← {manga.title}
          </button>
        </div>

        {/* Center Chapter Switcher: < Ch. 176 / 250 > */}
        <div className="chapter-switcher">
          <button
            className="ch-switch-btn"
            disabled={!prevChapter}
            onClick={() => prevChapter && navigateTo("reader", { mangaId: manga.id, chapterId: prevChapter.id })}
            title={prevChapter ? `Previous: Ch. ${prevChapter.chapter}` : "No earlier chapters"}
          >
            <ChevronLeft size={18} />
          </button>

          <span
            className="ch-current-label"
            onClick={() => setIsChapterDrawerOpen(true)}
            title="Click to jump to another chapter"
          >
            Ch. {currentChapter.chapter} / {manga.latestChapter || chapters[0]?.chapter || "250"}
          </span>

          <button
            className="ch-switch-btn"
            disabled={!nextChapter}
            onClick={() => nextChapter && navigateTo("reader", { mangaId: manga.id, chapterId: nextChapter.id })}
            title={nextChapter ? `Next: Ch. ${nextChapter.chapter}` : "No later chapters"}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Zoom & Page indicator matching Screenshot 1 */}
        <div className="reader-nav-group">
          <div className="reader-zoom-controls">
            <button onClick={() => handleZoomChange(-10)} title="Zoom out">
              <ZoomOut size={14} />
            </button>
            <span>{zoomLevel}%</span>
            <button onClick={() => handleZoomChange(10)} title="Zoom in">
              <ZoomIn size={14} />
            </button>
          </div>

          <div
            className="btn-secondary"
            style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem" }}
            onClick={() => setIsChapterDrawerOpen(true)}
          >
            Page {currentPageNum} / {totalPages}
          </div>
        </div>
      </header>

      {/* Floating Right Sidebar matching Screenshot 2 */}
      <aside className="reader-floating-sidebar">
        {/* 1. Home */}
        <button
          className="sidebar-btn"
          onClick={() => navigateTo("manga", { mangaId: manga.id })}
          title="Manga Details & Information"
        >
          <Home size={20} />
        </button>

        {/* 2. Reading Layout Mode */}
        <button
          className="sidebar-btn"
          onClick={() => {
            const nextFit = canvasFit === "width" ? "height" : canvasFit === "height" ? "full" : "width";
            setCanvasFit(nextFit);
          }}
          title={`Canvas Fit Mode (${canvasFit})`}
        >
          <BookOpen size={20} />
        </button>

        {/* 3. Comments */}
        <button
          className="sidebar-btn"
          onClick={() => setIsCommentsOpen(true)}
          title="Romance Comments & Reactions"
        >
          <MessageSquare size={20} />
        </button>

        {/* 4. Chapter List Drawer */}
        <button
          className="sidebar-btn"
          onClick={() => setIsChapterDrawerOpen(true)}
          title="Chapters List"
        >
          <List size={20} />
        </button>

        {/* 5. Fullscreen */}
        <button
          className="sidebar-btn"
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen (F)" : "Enter Fullscreen (F)"}
        >
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>

        {/* 6. Auto-Scroll */}
        <button
          className={`sidebar-btn ${isAutoScrolling ? "auto-scroll-active" : ""}`}
          onClick={() => setIsAutoScrolling(!isAutoScrolling)}
          title={isAutoScrolling ? "Pause Auto-Scroll (A)" : `Play Auto-Scroll (${settings.autoScrollSpeed} px/s)`}
        >
          {isAutoScrolling ? <Pause size={20} /> : <Play size={20} />}
        </button>

        {/* 7. Settings Modal */}
        <button
          className="sidebar-btn"
          onClick={() => setIsSettingsOpen(true)}
          title="Reader Settings"
        >
          <SettingsIcon size={20} />
        </button>

        {/* 8. Help / Keyboard Shortcuts */}
        <button
          className="sidebar-btn"
          onClick={() => setIsShortcutsOpen(true)}
          title="Keyboard Shortcuts (?)"
        >
          <HelpCircle size={20} />
        </button>
      </aside>

      {/* Main Manga Reader Viewport */}
      <main className="reader-viewport">
        <div
          className={`reader-canvas ${canvasFit === "height" ? "fit-height" : canvasFit === "full" ? "fit-full" : ""}`}
          style={{ width: `${zoomLevel}%` }}
        >
          {pages.map((p, idx) => (
            <div key={p.page} className="manga-page-frame">
              <img
                src={p.url}
                alt={`${manga.title} - Ch. ${currentChapter.chapter} Page ${p.page}`}
                className={`manga-page-img ${settings.greyscalePages ? "greyscale" : ""}`}
                loading={settings.preloadMode === "all" || idx < 4 ? "eager" : "lazy"}
                onError={(e) => {
                  // Automatic fallback panel to ensure zero image failures
                  e.target.onerror = null;
                  e.target.src = `https://picsum.photos/seed/${manga.id}-p${p.page}/900/1300`;
                }}
              />
              <span className="page-number-tag">
                {p.page} / {totalPages}
              </span>
            </div>
          ))}

          {/* End of Chapter Card */}
          <div className="chapter-end-card">
            <h3 className="chapter-end-title">
              End of Chapter {currentChapter.chapter}
            </h3>
            <p className="chapter-end-desc">
              {currentChapter.title ? `"${currentChapter.title}"` : "You've finished this chapter!"}
            </p>

            <div className="chapter-end-actions">
              {nextChapter ? (
                <button
                  className="btn-primary"
                  onClick={() => {
                    navigateTo("reader", { mangaId: manga.id, chapterId: nextChapter.id });
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <span>Next: Chapter {nextChapter.chapter}</span>
                  <ArrowRight size={18} />
                </button>
              ) : (
                <button
                  className="btn-primary"
                  onClick={() => navigateTo("manga", { mangaId: manga.id })}
                >
                  <span>Back to Series Info</span>
                </button>
              )}

              <button
                className="btn-secondary"
                onClick={() => setIsCommentsOpen(true)}
              >
                <MessageSquare size={16} />
                <span>Join Romance Discussion</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Drawers */}
      <CommentsDrawer currentChapterTitle={`Ch. ${currentChapter.chapter}: ${currentChapter.title}`} />
      <ChapterDrawer
        manga={manga}
        currentChapterId={currentChapter.id}
        onSelectChapter={(id) => navigateTo("reader", { mangaId: manga.id, chapterId: id })}
      />
    </div>
  );
}
