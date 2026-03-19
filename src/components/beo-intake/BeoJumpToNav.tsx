import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

type JumpSection = {
  id: string;
  label: string;
  icon: string;
  hint?: string;
};

const SECTIONS: JumpSection[] = [
  { id: "beo-section-header",      label: "Event details/Header",     icon: "📋", hint: "Client, venue, date, guests, times, FW staff" },
  { id: "beo-section-event",       label: "Event Details",             icon: "📅" },
  { id: "beo-section-menu",        label: "Menu",                     icon: "🍽️" },
  { id: "beo-section-bar",         label: "Beverage Services",         icon: "🍸" },
  { id: "beo-section-serviceware", label: "Plates / Serviceware",      icon: "🥂" },
  { id: "beo-section-timeline",    label: "Timeline",                  icon: "⏱️" },
  { id: "beo-section-notes",       label: "Notes / Logistics",         icon: "📝", hint: "Kitchen, allergies, ops exceptions" },
];

/** Shared jump logic: expand section, scroll, flash. Used by nav and by ?section= on BEO Intake. */
export function jumpToBeoSection(sectionId: string) {
  window.dispatchEvent(new CustomEvent("beo-jump-to-section", { detail: sectionId }));
  setTimeout(() => {
    const el = document.getElementById(sectionId);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const HEADER_OFFSET = 80;
    const targetY = rect.top + window.scrollY - HEADER_OFFSET;
    window.scrollTo({ top: targetY, behavior: "smooth" });
    el.style.outline = "2px solid #ff6b6b";
    el.style.outlineOffset = "3px";
    setTimeout(() => {
      el.style.outline = "";
      el.style.outlineOffset = "";
    }, 1400);
  }, 200);
}

function jumpTo(sectionId: string) {
  jumpToBeoSection(sectionId);
}

export const BeoJumpToNav = () => {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Scroll-spy: track which section is currently in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible section
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { threshold: 0.15, rootMargin: "-60px 0px -40% 0px" }
    );

    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Keyboard: Escape closes, Ctrl+J toggles
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if ((e.ctrlKey || e.metaKey) && e.key === "j") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const activeSection = SECTIONS.find((s) => s.id === activeId);

  const navContent = (
    <div
      ref={ref}
      style={{
        position: "fixed",
        bottom: 96,
        right: 20,
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 6,
        pointerEvents: "auto",
      }}
    >
      {/* Dropdown nav list */}
      {open && (
        <div
          style={{
            background: "#1a1a1a",
            border: "1px solid rgba(255,107,107,0.35)",
            borderRadius: 10,
            boxShadow: "0 8px 32px rgba(0,0,0,0.65)",
            overflow: "hidden",
            minWidth: 240,
            marginBottom: 4,
          }}
        >
          <div
            style={{
              padding: "7px 14px",
              fontSize: 10,
              fontWeight: 700,
              color: "#777",
              textTransform: "uppercase",
              letterSpacing: 1,
              borderBottom: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            Jump To Section
          </div>

          {SECTIONS.map((s) => {
            const isActive = s.id === activeId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => { jumpTo(s.id); setOpen(false); }}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  width: "100%",
                  padding: "9px 14px",
                  background: isActive ? "rgba(255,107,107,0.12)" : "transparent",
                  border: "none",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  borderLeft: isActive ? "3px solid #ff6b6b" : "3px solid transparent",
                  color: isActive ? "#ff6b6b" : "#e0e0e0",
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontSize: 15, lineHeight: 1.3, flexShrink: 0 }}>{s.icon}</span>
                <span>
                  <div>{s.label}</div>
                  {s.hint && <div style={{ fontSize: 10, color: "#666", marginTop: 1 }}>{s.hint}</div>}
                </span>
                {isActive && (
                  <span style={{ marginLeft: "auto", fontSize: 10, color: "#ff6b6b", alignSelf: "center" }}>← here</span>
                )}
              </button>
            );
          })}

          <div style={{ padding: "5px 14px", fontSize: 10, color: "#444", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            Ctrl+J to toggle
          </div>
        </div>
      )}

      {/* Trigger button — shows current section when closed */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Jump to section (Ctrl+J)"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 13px",
          borderRadius: 20,
          border: "1px solid rgba(255,107,107,0.45)",
          background: open ? "rgba(255,107,107,0.18)" : "rgba(20,20,20,0.92)",
          color: "#ff6b6b",
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 4px 16px rgba(0,0,0,0.45)",
          backdropFilter: "blur(8px)",
          letterSpacing: 0.2,
          transition: "all 0.15s",
          maxWidth: 200,
        }}
      >
        <span style={{ fontSize: 13, flexShrink: 0 }}>⬆</span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {open ? "Close" : activeSection ? activeSection.label : "Jump To"}
        </span>
      </button>
    </div>
  );

  return createPortal(navContent, document.body);
};
