import React from "react";
import { Star, Heart } from "lucide-react";
import { useRomance } from "../context/RomanceContext";
import { onCoverError } from "../services/mangadexApi";

export default function MangaCard({ manga }) {
  const { navigateTo, favorites, toggleFavorite } = useRomance();

  const isFav = favorites.includes(manga.id);

  return (
    <div
      className="manga-card"
      onClick={() => navigateTo("manga", { mangaId: manga.id })}
    >
      <div className="card-cover-wrapper">
        <img referrerPolicy="no-referrer"
          src={manga.cover}
          alt={manga.title}
          className="card-cover-img"
          loading="lazy"
          onError={onCoverError}
        />
        <div className="card-rating-badge">
          <Star size={12} fill="#facc15" />
          <span>{manga.rating}</span>
        </div>

        {manga.readable === true && (
          <div
            style={{
              position: "absolute", bottom: 8, left: 8, padding: "2px 8px", borderRadius: 6,
              fontSize: "0.68rem", fontWeight: 700, background: "rgba(34,211,238,0.9)", color: "#0b1118",
            }}
          >
            READ HERE
          </div>
        )}
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
