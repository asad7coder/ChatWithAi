"use client";

import React, { useEffect } from "react";
import { AVAILABLE_THEMES, ColorMode, ThemeId } from "../types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  mode: ColorMode;
  setMode: (mode: ColorMode) => void;
}

function ColorModeIcon({ mode }: { mode: ColorMode }) {
  const paths = {
    dark: <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />,
    light: <><circle cx="12" cy="12" r="4" /><path strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></>,
    system: <><rect x="3" y="4" width="18" height="13" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8m-4-4v4" /></>,
  };

  return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">{paths[mode]}</svg>;
}

export default function SettingsModal({ isOpen, onClose, theme, setTheme, mode, setMode }: SettingsModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ backgroundColor: "var(--app-backdrop)", backdropFilter: "blur(6px)" }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        style={{ backgroundColor: "var(--app-surface)", borderColor: "var(--app-border)", color: "var(--app-text)" }}
      >
        <header className="flex flex-none items-center justify-between border-b px-6 py-4" style={{ borderColor: "var(--app-border)" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border" style={{ backgroundColor: "var(--theme-primary-soft)", borderColor: "var(--theme-primary-border)", color: "var(--theme-primary)" }}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 id="settings-title" className="text-base font-semibold tracking-tight">Application Settings</h2>
              <p className="text-xs" style={{ color: "var(--app-text-muted)" }}>Personalize your appearance and theme</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close settings" className="flex h-8 w-8 items-center justify-center rounded-lg border transition hover:opacity-80" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface-subtle)", color: "var(--app-text-muted)" }}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto space-y-6 p-6">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--app-text-muted)" }}>Color Mode</label>
            <div className="grid grid-cols-3 gap-3">
              {([
                { id: "dark", label: "Dark" },
                { id: "light", label: "Light" },
                { id: "system", label: "System" },
              ] as const).map((item) => (
                <button key={item.id} type="button" onClick={() => setMode(item.id)} className="flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-medium transition active:scale-98" style={{ backgroundColor: mode === item.id ? "var(--theme-primary-soft)" : "var(--app-surface-subtle)", borderColor: mode === item.id ? "var(--theme-primary)" : "var(--app-border)", color: mode === item.id ? "var(--theme-primary)" : "var(--app-text)" }}>
                  <ColorModeIcon mode={item.id} /><span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--app-text-muted)" }}>Select Theme ({AVAILABLE_THEMES.length})</label>
              <span className="text-[11px]" style={{ color: "var(--theme-primary)" }}>Active: {AVAILABLE_THEMES.find((item) => item.id === theme)?.name}</span>
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {AVAILABLE_THEMES.map((item) => {
                const isSelected = item.id === theme;
                return (
                  <button key={item.id} type="button" onClick={() => setTheme(item.id)} className="group flex items-center justify-between rounded-xl border p-3 text-left transition hover:opacity-90 active:scale-[0.99]" style={{ backgroundColor: isSelected ? "var(--theme-primary-soft)" : "var(--app-surface-subtle)", borderColor: isSelected ? "var(--theme-primary)" : "var(--app-border)" }}>
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="h-7 w-7 shrink-0 rounded-lg border border-white/20" style={{ background: `linear-gradient(135deg, ${item.primaryColor} 0%, ${item.accentColor} 100%)` }} />
                      <span className="min-w-0"><span className="block text-xs font-semibold" style={{ color: "var(--app-text)" }}>{item.name}</span><span className="block truncate text-[11px]" style={{ color: "var(--app-text-muted)" }}>{item.description}</span></span>
                    </span>
                    {isSelected && <span className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: "var(--theme-primary)", color: "var(--theme-contrast-text)" }}>Selected</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <footer className="flex flex-none items-center justify-between border-t px-6 py-3 text-xs" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface-subtle)" }}>
          <span style={{ color: "var(--app-text-dim)" }}>Changes save instantly to your browser</span>
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-1.5 font-medium transition" style={{ backgroundColor: "var(--theme-primary)", color: "var(--theme-contrast-text)" }}>Done</button>
        </footer>
      </section>
    </div>
  );
}
