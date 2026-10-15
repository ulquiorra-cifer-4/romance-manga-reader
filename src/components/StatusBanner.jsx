import React, { useEffect, useState } from "react";
import { pingMangaDex } from "../services/mangadexApi";

// Small diagnostic banner: tells you (and users) when the chapter source is unreachable,
// instead of the site silently showing empty pages.
export default function StatusBanner() {
  const [problem, setProblem] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    pingMangaDex()
      .catch((e) => !cancelled && setProblem(e.message || "unreachable"));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!problem || dismissed) return null;
  return (
    <div
      style={{
        background: "rgba(245, 158, 11, 0.12)",
        borderBottom: "1px solid rgba(245, 158, 11, 0.4)",
        color: "#fbbf24",
        padding: "0.55rem 1rem",
        fontSize: "0.82rem",
        display: "flex",
        justifyContent: "space-between",
        gap: "1rem",
      }}
    >
      <span>
        Chapter source (MangaDex) isn't reachable right now ({problem}). Browsing and covers still work;
        titles with official links can be read on the publisher's site.
      </span>
      <button onClick={() => setDismissed(true)} style={{ color: "inherit" }} aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}
