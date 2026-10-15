import React, { useEffect, useState } from "react";
import { pingMangaDex } from "../services/mangadexApi";

export default function StatusBanner() {
  const [problem, setProblem] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    pingMangaDex()
      .then(() => !cancelled && setProblem(null))
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
        alignItems: "center",
        gap: "1rem",
      }}
    >
      <span>
        Chapter connection is experiencing slowdowns. Pages are loading via proxy.
      </span>
      <button
        onClick={() => setDismissed(true)}
        style={{ color: "inherit", background: "none", border: "none", cursor: "pointer", fontSize: "1rem" }}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
