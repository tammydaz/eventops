import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { createFeedback, type FeedbackType } from "../../services/feedbackApi";
import { FeedbackContext } from "./FeedbackContext";
import FeedbackCircle from "./FeedbackCircle";

const SCREEN_NAMES: Record<string, string> = {
  "/": "Dashboard",
  "/home": "Dashboard",
  "/beo-intake": "Event Builder",
  "/quick-intake": "Quick Intake",
  "/invoice-intake": "Invoice Intake",
  "/watchtower": "Today's tasks",
  "/ops-chief": "Ops Chief",
  "/beo-print": "BEO Print",
  "/kitchen-beo-print": "Kitchen BEO Print",
  "/kitchen-prep": "Kitchen Prep",
  "/delivery-command": "Delivery Command",
  "/delivery/intake": "Delivery Intake",
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
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const screenName = getScreenName(pathname);

  const openModal = useCallback((type: FeedbackType = "issue") => {
    setFeedbackType(type);
    setMessage("");
    setSubmitError(null);
    setModalOpen(true);
    setMenuOpen(false);
  }, []);

  const contextValue = { openSubmitModal: openModal };

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Keep menu on-screen (menu ~180px wide, 200px tall)
      const x = Math.min(e.clientX, window.innerWidth - 200);
      const y = Math.min(e.clientY, window.innerHeight - 220);
      setMenuPos({ x: Math.max(8, x), y: Math.max(8, y) });
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

  const handleSubmit = useCallback(async () => {
    const msg = message.trim() || "(No message provided)";
    if (!msg) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    const result = await createFeedback({
      type: feedbackType,
      screen: screenName,
      url: window.location.href,
      message: msg,
    });
    setSubmitting(false);
    if (result.error) {
      setSubmitError(result.error + (result.details ? ` — ${result.details}` : ""));
      return;
    }
    setSubmitSuccess(true);
    setTimeout(() => {
      setModalOpen(false);
      setSubmitSuccess(false);
    }, 800);
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
    <div
      className="feedback-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) setModalOpen(false);
      }}
    >
      <div
        className="feedback-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ pointerEvents: "auto" }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!submitting) handleSubmit();
          }}
        >
          <h3 className="feedback-modal-title">Send Feedback</h3>
          <p className="feedback-modal-screen">
            Screen: <strong>{screenName}</strong> · {FEEDBACK_LABELS[feedbackType]}
          </p>
          <textarea
            className="feedback-modal-textarea"
            placeholder="Describe the issue, idea, bug, or recommendation… (Ctrl+Enter to send)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.ctrlKey) {
                e.preventDefault();
                if (!submitting) handleSubmit();
              }
            }}
            rows={4}
            autoFocus
          />
          {submitSuccess && (
            <p className="feedback-modal-success" style={{ color: "#22c55e", fontSize: 14, marginBottom: 8, fontWeight: 600 }}>
              ✓ Saved!
            </p>
          )}
          {submitError && (
            <p className="feedback-modal-error" style={{ color: "#f87171", fontSize: 13, marginBottom: 8, background: "rgba(239,68,68,0.1)", padding: 8, borderRadius: 6 }}>
              {submitError}
            </p>
          )}
          <div className="feedback-modal-actions">
            <button type="button" className="feedback-modal-cancel" onClick={() => setModalOpen(false)} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="feedback-modal-submit" disabled={submitting}>
              {submitting ? "Saving…" : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <FeedbackContext.Provider value={contextValue}>
      {children}
      {menuEl && createPortal(menuEl, document.body)}
      {modalEl && createPortal(modalEl, document.body)}
      <FeedbackCircle />
    </FeedbackContext.Provider>
  );
}
