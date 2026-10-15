import React, { useEffect, useState } from "react";
import { RomanceProvider, useRomance } from "./context/RomanceContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import SettingsModal from "./components/SettingsModal";
import ShortcutsModal from "./components/ShortcutsModal";
import HomePage from "./pages/HomePage";
import MangaDetailPage from "./pages/MangaDetailPage";
import ReaderPage from "./pages/ReaderPage";
import LibraryPage from "./pages/LibraryPage";
import BrowsePage from "./pages/BrowsePage";
import StatusBanner from "./components/StatusBanner";
import { hydrateCuratedFromAniList } from "./data/romanceMangaDatabase";
import { lookupAniListByTitles } from "./services/anilistApi";
import { markReadability } from "./services/mangadexApi";
import { ROMANCE_DATABASE } from "./data/romanceMangaDatabase";

function MainApp() {
  const { route } = useRomance();

  const isReaderView = route.view === "reader";

  // Refresh curated covers / official links from AniList, then re-render
  const [, setCatalogTick] = useState(0);
  useEffect(() => {
    hydrateCuratedFromAniList(lookupAniListByTitles)
      .then((changed) => changed && setCatalogTick((t) => t + 1))
      .catch((e) => console.warn("AniList hydration failed:", e));
    markReadability(ROMANCE_DATABASE).then(() => setCatalogTick((t) => t + 1));
  }, []);

  return (
    <div className="app-container">
      {/* Hide main navigation header when inside Reader for full immersion */}
      {!isReaderView && <Header />}

      <StatusBanner />
      <main className="main-content">
        {route.view === "home" && <HomePage />}
        {route.view === "manga" && <MangaDetailPage mangaId={route.mangaId} />}
        {route.view === "reader" && (
          <ReaderPage mangaId={route.mangaId} chapterId={route.chapterId} />
        )}
        {route.view === "library" && <LibraryPage />}
        {route.view === "browse" && <BrowsePage />}
      </main>

      {!isReaderView && <Footer />}

      {/* Global Modals */}
      <SettingsModal />
      <ShortcutsModal />
    </div>
  );
}

export default function App() {
  return (
    <RomanceProvider>
      <MainApp />
    </RomanceProvider>
  );
}
