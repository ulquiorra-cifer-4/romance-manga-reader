import React from "react";
import { X, ArrowLeft, ArrowUp, ArrowDown, ArrowRight, Ban, CheckCircle2, Circle } from "lucide-react";
import { useRomance } from "../context/RomanceContext";

export default function SettingsModal() {
  const { isSettingsOpen, setIsSettingsOpen, settings, updateSetting, resetSettings } = useRomance();

  if (!isSettingsOpen) return null;

  return (
    <div className="modal-backdrop" onClick={() => setIsSettingsOpen(false)}>
      <div className="settings-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="settings-modal-header">
          <h2 className="settings-modal-title">Settings</h2>
          <button
            className="settings-close-btn"
            onClick={() => setIsSettingsOpen(false)}
            aria-label="Close settings"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="settings-modal-body">
          {/* 1. KEYBOARD SCROLLING */}
          <section className="setting-section">
            <div className="setting-section-title">KEYBOARD SCROLLING</div>
            <div className="setting-btn-group">
              <button
                className={`setting-radio-btn ${settings.keyboardScrollMode === "fast" ? "active" : ""}`}
                onClick={() => updateSetting("keyboardScrollMode", "fast")}
              >
                {settings.keyboardScrollMode === "fast" ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <Circle size={16} />
                )}
                <span>Scroll fast</span>
              </button>

              <button
                className={`setting-radio-btn ${settings.keyboardScrollMode === "smooth" ? "active" : ""}`}
                onClick={() => updateSetting("keyboardScrollMode", "smooth")}
              >
                {settings.keyboardScrollMode === "smooth" ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <Circle size={16} />
                )}
                <span>Scroll smooth</span>
              </button>
            </div>

            <div className="step-size-row">
              <div className="step-size-counter">
                <button
                  className="step-btn"
                  onClick={() => updateSetting("keyboardStepSize", Math.max(25, settings.keyboardStepSize - 25))}
                  title="Decrease step"
                >
                  —
                </button>
                <span>{settings.keyboardStepSize}%</span>
                <button
                  className="step-btn"
                  onClick={() => updateSetting("keyboardStepSize", Math.min(200, settings.keyboardStepSize + 25))}
                  title="Increase step"
                >
                  +
                </button>
              </div>

              <button
                className="step-reset-btn"
                onClick={() => updateSetting("keyboardStepSize", 100)}
              >
                Reset
              </button>
            </div>
            <p className="setting-desc">
              Step size for Arrow / Space / W / S keys, as percent of the viewport height.
            </p>
          </section>

          {/* 2. AUTO-SCROLL SPEED */}
          <section className="setting-section">
            <div className="setting-section-title">AUTO-SCROLL SPEED</div>
            <div className="slider-wrapper">
              <input
                type="range"
                className="custom-range-slider"
                min="20"
                max="400"
                step="10"
                value={settings.autoScrollSpeed}
                onChange={(e) => updateSetting("autoScrollSpeed", Number(e.target.value))}
              />
              <span className="slider-val-readout">{settings.autoScrollSpeed} px/s</span>
            </div>
            <p className="setting-desc">
              Speed of the play / pause auto-scroll button in the reader controls.
            </p>
          </section>

          {/* 3. PROGRESS BAR */}
          <section className="setting-section">
            <div className="setting-section-title">PROGRESS BAR</div>
            <div className="progress-position-grid">
              <button
                className={`pos-btn ${settings.progressBarPosition === "left" ? "active" : ""}`}
                onClick={() => updateSetting("progressBarPosition", "left")}
                title="Left edge"
              >
                <ArrowLeft size={18} />
              </button>
              <button
                className={`pos-btn ${settings.progressBarPosition === "top" ? "active" : ""}`}
                onClick={() => updateSetting("progressBarPosition", "top")}
                title="Top edge"
              >
                <ArrowUp size={18} />
              </button>
              <button
                className={`pos-btn ${settings.progressBarPosition === "bottom" ? "active" : ""}`}
                onClick={() => updateSetting("progressBarPosition", "bottom")}
                title="Bottom edge"
              >
                <ArrowDown size={18} />
              </button>
              <button
                className={`pos-btn ${settings.progressBarPosition === "right" ? "active" : ""}`}
                onClick={() => updateSetting("progressBarPosition", "right")}
                title="Right edge"
              >
                <ArrowRight size={18} />
              </button>
              <button
                className={`pos-btn ${settings.progressBarPosition === "none" ? "active" : ""}`}
                onClick={() => updateSetting("progressBarPosition", "none")}
                title="Hide progress bar"
              >
                <Ban size={18} />
              </button>
            </div>
          </section>

          {/* 4. PRELOAD IMAGES */}
          <section className="setting-section">
            <div className="setting-section-title">PRELOAD IMAGES</div>
            <div className="setting-btn-group">
              <button
                className={`setting-radio-btn ${settings.preloadMode === "some" ? "active" : ""}`}
                onClick={() => updateSetting("preloadMode", "some")}
              >
                {settings.preloadMode === "some" ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <Circle size={16} />
                )}
                <span>Preload some</span>
              </button>

              <button
                className={`setting-radio-btn ${settings.preloadMode === "all" ? "active" : ""}`}
                onClick={() => updateSetting("preloadMode", "all")}
              >
                {settings.preloadMode === "all" ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <Circle size={16} />
                )}
                <span>Preload all</span>
              </button>
            </div>

            <div style={{ marginTop: "1rem" }}>
              <label className="setting-checkbox-label">
                <input
                  type="checkbox"
                  className="setting-checkbox"
                  checked={settings.greyscalePages}
                  onChange={(e) => updateSetting("greyscalePages", e.target.checked)}
                />
                <span>Greyscale pages</span>
              </label>
            </div>
          </section>

          {/* 5. DIM PAGES */}
          <section className="setting-section">
            <div className="setting-section-title">DIM PAGES</div>
            <div className="slider-wrapper">
              <input
                type="range"
                className="custom-range-slider"
                min="0"
                max="80"
                step="5"
                value={settings.dimPages}
                onChange={(e) => updateSetting("dimPages", Number(e.target.value))}
              />
              <span className="slider-val-readout">{settings.dimPages}%</span>
            </div>
            <p className="setting-desc">
              Soft nighttime screen dimming to protect romantic late-night reading sessions.
            </p>
          </section>

          {/* 6. READING CANVAS BACKGROUND */}
          <section className="setting-section">
            <div className="setting-section-title">READER BACKGROUND</div>
            <div className="setting-btn-group">
              <button
                className={`setting-radio-btn ${settings.readerBackground === "#15181c" ? "active" : ""}`}
                onClick={() => updateSetting("readerBackground", "#15181c")}
              >
                <span>Dark Slate</span>
              </button>
              <button
                className={`setting-radio-btn ${settings.readerBackground === "#000000" ? "active" : ""}`}
                onClick={() => updateSetting("readerBackground", "#000000")}
              >
                <span>Pitch Black</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
