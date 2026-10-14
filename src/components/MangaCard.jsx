import React from "react";
import { Star, Heart } from "lucide-react";
import { useRomance } from "../context/RomanceContext";

export default function MangaCard({ manga }) {
  const { navigateTo, favorites, toggleFavorite } = useRomance();

  const isFav = favorites.includes(manga.id);

  return (
    <div
      className="manga-card"
      onClick={() => navigateTo("manga", { mangaId: manga.id })}
    >
      <div className="card-cover-wrapper">
        <img
          src={manga.cover}
          alt={manga.title}
          className="card-cover-img"
          loading="lazy"
        />
        <div className="card-rating-badge">
          <Star size={12} fill="#facc15" />
          <span>{manga.rating}</span>
        </div>
        <div className="card-ch-badge">
          <span>Ch. {manga.latestChapter || manga.chapters?.length || "NEW"}</span>
        </div>
        <button
          className={`btn-icon-round ${isFav ? "active" : ""}`}
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            width: 30,
            height: 30,
            background: "rgba(15, 23, 42, 0.75)",
            border: "none",
            backdropFilter: "blur(6px)"
          }}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(manga.id);
          }}
          title={isFav ? "Remove from Favorites" : "Add to Favorites"}
        >
          <Heart size={15} fill={isFav ? "#ff4d79" : "none"} color={isFav ? "#ff4d79" : "#fff"} />
        </button>
      </div>

      <div className="card-body">
        <h3 className="card-title" title={manga.title}>{manga.title}</h3>
        <p className="card-romaji">{manga.romajiTitle || manga.storyAndArt}</p>
        <div className="card-tags">
          {manga.genres?.slice(0, 2).map((g) => (
            <span key={g} className="card-tag">{g}</span>
          ))}
          {manga.tags?.[0] && (
            <span className="card-tag" style={{ color: "#38bdf8" }}>
              {manga.tags[0]}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
