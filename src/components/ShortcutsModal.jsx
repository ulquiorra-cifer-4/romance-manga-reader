import React from "react";
import { X, Keyboard } from "lucide-react";
import { useRomance } from "../context/RomanceContext";

export default function ShortcutsModal() {
  const { isShortcutsOpen, setIsShortcutsOpen } = useRomance();

  if (!isShortcutsOpen) return null;

  const shortcuts = [
    { key: "↓ / S / Space", action: "Scroll down by configured step size" },
    { key: "↑ / W", action: "Scroll up by configured step size" },
    { key: "A", action: "Toggle Auto-Scroll playback" },
    { key: "F", action: "Toggle Fullscreen mode" },
    { key: "M / O", action: "Open Settings modal" },
    { key: "C", action: "Open Romance Chapter discussion" },
    { key: "L", action: "Open Chapter Switcher drawer" },
    { key: "H", action: "Return to Romance Home / Info" },
    { key: "[ / ]", action: "Jump to Previous / Next Chapter" },
    { key: "Esc", action: "Close modals & drawers" }
  ];

  return (
    <div className="modal-backdrop" onClick={() => setIsShortcutsOpen(false)}>
      <div className="settings-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="settings-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Keyboard size={20} color="#22d3ee" />
            <h2 className="settings-modal-title">Keyboard Shortcuts</h2>
          </div>
          <button
            className="settings-close-btn"
            onClick={() => setIsShortcutsOpen(false)}
            aria-label="Close shortcuts"
          >
            <X size={20} />
          </button>
        </div>

        <div className="settings-modal-body" style={{ gap: "0.85rem" }}>
          {shortcuts.map((sc) => (
            <div
              key={sc.key}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.6rem 0.8rem",
                backgroundColor: "#272f3a",
                borderRadius: "8px",
                fontSize: "0.88rem"
              }}
            >
              <span style={{ color: "#cbd5e1" }}>{sc.action}</span>
              <kbd
                style={{
                  backgroundColor: "#161b22",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "5px",
                  border: "1px solid #364152",
                  color: "#22d3ee",
                  fontWeight: "700",
                  fontFamily: "monospace",
                  fontSize: "0.82rem"
                }}
              >
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
