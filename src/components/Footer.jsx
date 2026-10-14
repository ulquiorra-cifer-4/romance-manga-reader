import React from "react";
import { Heart, Sparkles, BookOpen, Coffee } from "lucide-react";
import { useRomance } from "../context/RomanceContext";

export default function Footer() {
  const { navigateTo } = useRomance();

  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div>
          <div className="footer-brand-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Heart size={20} fill="#ff4d79" color="#ff4d79" />
            <span>AmoreComix</span>
          </div>
          <p className="footer-quote">
            "Every heartbeat tells a story. From quiet glances across the high school gymnasium to confessions beneath fireworks, we curate only the sweetest romance masterpieces."
          </p>
          <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", color: "#64748b" }}>
            <Coffee size={15} color="#22d3ee" />
            <span>Crafted with devotion for romance manga lovers worldwide</span>
          </div>
        </div>

        <div>
          <h4 className="footer-col-title">Masterpieces</h4>
          <ul className="footer-links-list">
            <li><a href="#/manga/blue-box" onClick={(e) => { e.preventDefault(); navigateTo("manga", { mangaId: "blue-box" }); }}>Blue Box (Ao no Hako)</a></li>
            <li><a href="#/manga/fragrant-flower" onClick={(e) => { e.preventDefault(); navigateTo("manga", { mangaId: "fragrant-flower" }); }}>The Fragrant Flower</a></li>
            <li><a href="#/manga/kaguya-sama" onClick={(e) => { e.preventDefault(); navigateTo("manga", { mangaId: "kaguya-sama" }); }}>Kaguya-sama: Love Is War</a></li>
            <li><a href="#/manga/horimiya" onClick={(e) => { e.preventDefault(); navigateTo("manga", { mangaId: "horimiya" }); }}>Horimiya</a></li>
            <li><a href="#/manga/dangers-in-my-heart" onClick={(e) => { e.preventDefault(); navigateTo("manga", { mangaId: "dangers-in-my-heart" }); }}>The Dangers in My Heart</a></li>
          </ul>
        </div>

        <div>
          <h4 className="footer-col-title">Romance Tropes</h4>
          <ul className="footer-links-list">
            <li><a href="#/browse" onClick={(e) => { e.preventDefault(); navigateTo("browse"); }}>Wholesome Fluff</a></li>
            <li><a href="#/browse" onClick={(e) => { e.preventDefault(); navigateTo("browse"); }}>Opposites Attract</a></li>
            <li><a href="#/browse" onClick={(e) => { e.preventDefault(); navigateTo("browse"); }}>Sports & Romance</a></li>
            <li><a href="#/browse" onClick={(e) => { e.preventDefault(); navigateTo("browse"); }}>Childhood Friends</a></li>
            <li><a href="#/browse" onClick={(e) => { e.preventDefault(); navigateTo("browse"); }}>Male Lead Falls First</a></li>
          </ul>
        </div>

        <div>
          <h4 className="footer-col-title">Sanctuary Features</h4>
          <ul className="footer-links-list">
            <li><span>✓ Auto-Scroll Engine (px/s)</span></li>
            <li><span>✓ Nighttime Eyecare Dimmer</span></li>
            <li><span>✓ Seamless Strip & Double Page</span></li>
            <li><span>✓ Zero Load Lag & Preload Buffers</span></li>
            <li><span>✓ Multi-Tracker Links (AL, MAL)</span></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div>© 2026 AmoreComix. Dedicated exclusively to romance manga stories.</div>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          <span>Privacy Friendly</span>
          <span>Fast CDN Caching</span>
          <span>Night Eyecare Safe</span>
        </div>
      </div>
    </footer>
  );
}
