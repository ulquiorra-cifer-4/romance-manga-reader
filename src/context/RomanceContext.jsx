import React, { createContext, useContext, useState, useEffect } from "react";
import { ROMANCE_DATABASE } from "../data/romanceMangaDatabase";

const RomanceContext = createContext();

const DEFAULT_SETTINGS = {
  keyboardScrollMode: "fast", // 'fast' | 'smooth'
  keyboardStepSize: 100, // percentage of viewport height
  autoScrollSpeed: 150, // px per second
  progressBarPosition: "left", // 'left' | 'top' | 'bottom' | 'right' | 'none'
  preloadMode: "some", // 'some' | 'all'
  greyscalePages: false,
  dimPages: 0, // 0 - 80 percentage
  readerBackground: "#15181c", // '#15181c' | '#000000' | '#0c1322' | '#1e1a17'
  readingDirection: "vertical", // 'vertical' | 'ltr' | 'rtl'
  imageFit: "width" // 'width' | 'height' | 'original'
};

export function RomanceProvider({ children }) {
  // Current route/view state: { view: 'home' | 'manga' | 'reader' | 'library' | 'browse', mangaId: null, chapterId: null }
  const [route, setRoute] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash.startsWith("/reader/")) {
      const parts = hash.split("/");
      return { view: "reader", mangaId: parts[2], chapterId: parts[3] };
    }
    if (hash.startsWith("/manga/")) {
      const parts = hash.split("/");
      return { view: "manga", mangaId: parts[2] };
    }
    if (hash === "/library") return { view: "library" };
    if (hash === "/browse") return { view: "browse" };
    return { view: "home", mangaId: null, chapterId: null };
  });

  // Settings
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("romance_reader_settings");
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // User Library: { [mangaId]: { status: 'reading'|'completed'|'plan_to_read', lastChapter: '250', timestamp: Date } }
  const [library, setLibrary] = useState(() => {
    try {
      const saved = localStorage.getItem("romance_user_library");
      return saved ? JSON.parse(saved) : {
        "blue-box": { status: "reading", lastChapter: "176", timestamp: Date.now() },
        "fragrant-flower": { status: "reading", lastChapter: "135", timestamp: Date.now() - 86400000 }
      };
    } catch {
      return {};
    }
  });

  // Reading History: Array of { mangaId, mangaTitle, chapterId, chapterNum, page, progress, timestamp }
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("romance_reading_history");
      return saved ? JSON.parse(saved) : [
        {
          mangaId: "blue-box",
          mangaTitle: "Blue Box",
          chapterId: "bb-176",
          chapterNum: "176",
          page: 1,
          progress: 68,
          timestamp: Date.now() - 3600000
        }
      ];
    } catch {
      return [];
    }
  });

  // Favorites
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem("romance_favorites");
      return saved ? JSON.parse(saved) : ["blue-box", "fragrant-flower"];
    } catch {
      return ["blue-box"];
    }
  });

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isChapterDrawerOpen, setIsChapterDrawerOpen] = useState(false);

  // Global search input
  const [searchQuery, setSearchQuery] = useState("");

  // Sync route from URL hash on popstate / hashchange
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash.startsWith("/reader/")) {
        const parts = hash.split("/");
        setRoute({ view: "reader", mangaId: parts[2], chapterId: parts[3] });
      } else if (hash.startsWith("/manga/")) {
        const parts = hash.split("/");
        setRoute({ view: "manga", mangaId: parts[2] });
      } else if (hash === "/library") {
        setRoute({ view: "library" });
      } else if (hash === "/browse") {
        setRoute({ view: "browse" });
      } else {
        setRoute({ view: "home", mangaId: null, chapterId: null });
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Sync hash to URL
  useEffect(() => {
    let newHash = "#/";
    if (route.view === "reader" && route.mangaId && route.chapterId) {
      newHash = `#/reader/${route.mangaId}/${route.chapterId}`;
    } else if (route.view === "manga" && route.mangaId) {
      newHash = `#/manga/${route.mangaId}`;
    } else if (route.view === "library") {
      newHash = "#/library";
    } else if (route.view === "browse") {
      newHash = "#/browse";
    }
    if (window.location.hash !== newHash) {
      window.location.hash = newHash;
    }
  }, [route]);

  // Persist settings
  useEffect(() => {
    localStorage.setItem("romance_reader_settings", JSON.stringify(settings));
  }, [settings]);

  // Persist library
  useEffect(() => {
    localStorage.setItem("romance_user_library", JSON.stringify(library));
  }, [library]);

  // Persist history
  useEffect(() => {
    localStorage.setItem("romance_reading_history", JSON.stringify(history));
  }, [history]);

  // Persist favorites
  useEffect(() => {
    localStorage.setItem("romance_favorites", JSON.stringify(favorites));
  }, [favorites]);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const navigateTo = (view, params = {}) => {
    setRoute({ view, ...params });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleFavorite = (mangaId) => {
    setFavorites((prev) =>
      prev.includes(mangaId) ? prev.filter((id) => id !== mangaId) : [...prev, mangaId]
    );
  };

  const updateLibraryStatus = (mangaId, status, lastChapter = null) => {
    setLibrary((prev) => {
      const current = prev[mangaId] || {};
      return {
        ...prev,
        [mangaId]: {
          ...current,
          status,
          lastChapter: lastChapter || current.lastChapter || "1",
          timestamp: Date.now()
        }
      };
    });
  };

  const recordReadingHistory = ({ mangaId, mangaTitle, chapterId, chapterNum, page = 1, progress = 0 }) => {
    setHistory((prev) => {
      const filtered = prev.filter((item) => !(item.mangaId === mangaId && item.chapterId === chapterId));
      return [
        {
          mangaId,
          mangaTitle,
          chapterId,
          chapterNum,
          page,
          progress,
          timestamp: Date.now()
        },
        ...filtered
      ].slice(0, 50); // Keep last 50 read
    });
  };

  return (
    <RomanceContext.Provider
      value={{
        route,
        navigateTo,
        settings,
        updateSetting,
        resetSettings,
        library,
        updateLibraryStatus,
        history,
        recordReadingHistory,
        favorites,
        toggleFavorite,
        isSettingsOpen,
        setIsSettingsOpen,
        isShortcutsOpen,
        setIsShortcutsOpen,
        isCommentsOpen,
        setIsCommentsOpen,
        isChapterDrawerOpen,
        setIsChapterDrawerOpen,
        searchQuery,
        setSearchQuery
      }}
    >
      {children}
    </RomanceContext.Provider>
  );
}

export function useRomance() {
  const context = useContext(RomanceContext);
  if (!context) {
    throw new Error("useRomance must be used within a RomanceProvider");
  }
  return context;
}
