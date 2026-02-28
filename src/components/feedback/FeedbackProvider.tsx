import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";

export type FeedbackType = "issue" | "idea" | "bug" | "recommendation";

const SCREEN_NAMES: Record<string, string> = {
  "/": "Dashboard",
  "/home": "Dashboard",
  "/beo-intake": "BEO Intake",
  "/quick-intake": "Quick Intake",
  "/invoice-intake": "Invoice Intake",
  "/watchtower": "Watchtower",
  "/papa-chulo": "Papa Chulo",
  "/ops-chief": "Ops Chief",
  "/beo-print": "BEO Print",
  "/kitchen-beo-print": "Kitchen BEO Print",
  "/kitchen-prep": "Kitchen Prep",
  "/delivery-command": "Delivery Command",
  "/returned-equipment": "Returned Equipment",
  "/post-event-debrief": "Post Event Debrief",
  "/site-visit": "Site Visit",
  "/print-test": "Print Test",
  "/spec-engine": "Spec Engine",
  "/profit": "Profit",
  "/health": "Health",
  "/foh": "FOH Landing",
  "/dashboard-old": "Dashboard (Old)",
  "/seed-demo": "Seed Demo",
};

function getScreenName(pathname: string): string {
  // Prefer longer paths first so /beo-intake/xyz matches before /
  const sorted = Object.entries(SCREEN_NAMES).sort((a, b) => b[0].length - a[0].length);
  for (const [path, name] of sorted) {
    if (pathname === path || (path !== "/" && pathname.startsWith(path))) return name;
  }
  if (pathname === "/" || pathname === "/home" || pathname.startsWith("/home/")) return "Dashboard";
  return pathname || "Unknown";
}

const FEEDBACK_LABELS: Record<FeedbackType, string> = {
  issue: "Report Issue",
  idea: "Share Idea",
  bug: "Report Bug",
  recommendation: "Recommendation",
};

const FEEDBACK_EMAIL =
  (import.meta.env.VITE_FEEDBACK_EMAIL as string | undefined)?.trim() || "feedback@foodwerx.com";

interface FeedbackProviderProps {
  children: React.ReactNode;
}

export function FeedbackProvider({ children }: FeedbackProviderProps) {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("issue");
  const [message, setMessage] = useState("");

  const screenName = getScreenName(pathname);

  const openModal = useCallback((type: FeedbackType) => {
    setFeedbackType(type);
    setMessage("");
    setModalOpen(true);
    setMenuOpen(false);
  }, []);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setMenuPos({ x: e.clientX, y: e.clientY });
      setMenuOpen(true);
    };

    document.addEventListener("contextmenu", handleContextMenu, true);
    return () => document.removeEventListener("contextmenu", handleContextMenu, true);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = () => setMenuOpen(false);
    const t = setTimeout(() => document.addEventListener("click", handleClick), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("click", handleClick);
    };
  }, [menuOpen]);

  const handleSubmit = useCallback(() => {
    const subject = `[EventOps ${FEEDBACK_LABELS[feedbackType]}] ${screenName}`;
    const body = [
      `Screen: ${screenName}`,
      `Type: ${FEEDBACK_LABELS[feedbackType]}`,
      `URL: ${window.location.href}`,
      "",
      "Message:",
      message.trim() || "(No message provided)",
    ].join("\n");

    const mailto = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, "_blank", "noopener,noreferrer");
    setModalOpen(false);
  }, [feedbackType, screenName, message]);

  const menuEl = menuOpen && (
    <div
      className="feedback-context-menu"
      style={{ left: menuPos.x, top: menuPos.y }}
      onClick={(e) => e.stopPropagation()}
    >
      <button type="button" onClick={() => openModal("issue")}>
        Report Issue
      </button>
      <button type="button" onClick={() => openModal("idea")}>
        Share Idea
      </button>
      <button type="button" onClick={() => openModal("bug")}>
        Report Bug
      </button>
      <button type="button" onClick={() => openModal("recommendation")}>
        Recommendation
      </button>
    </div>
  );

  const modalEl = modalOpen && (
    <div className="feedback-modal-backdrop" onClick={() => setModalOpen(false)}>
      <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="feedback-modal-title">Send Feedback</h3>
        <p className="feedback-modal-screen">
          Screen: <strong>{screenName}</strong> · {FEEDBACK_LABELS[feedbackType]}
        </p>
        <textarea
          className="feedback-modal-textarea"
          placeholder="Describe the issue, idea, bug, or recommendation..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          autoFocus
        />
        <div className="feedback-modal-actions">
          <button type="button" className="feedback-modal-cancel" onClick={() => setModalOpen(false)}>
            Cancel
          </button>
          <button type="button" className="feedback-modal-submit" onClick={handleSubmit}>
            Open Email to Send
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {children}
      {menuEl && createPortal(menuEl, document.body)}
      {modalEl && createPortal(modalEl, document.body)}
    </>
  );
}
