import { Link } from "react-router-dom";
import { useAuthStore } from "../state/authStore";
import DepartmentRing from "../components/foh/DepartmentRing";
import { EventsPipeline } from "../components/EventsPipeline";

/* ═══════════════════════════════════════════
   FOH LANDING PAGE — 10-Day Pipeline
   ═══════════════════════════════════════════ */
export default function FOHLandingPage() {
  const { user, logout } = useAuthStore();

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1a0808 40%, #0f0a15 100%)" }}
    >
      {/* ── Ambient glow ── */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 30%, rgba(204,0,0,0.06) 0%, transparent 55%), radial-gradient(ellipse at 80% 70%, rgba(0,188,212,0.04) 0%, transparent 55%)",
        }}
      />

      {/* ═══ HEADER ═══ */}
      <header
        className="relative z-10 flex items-center justify-between px-8 py-5"
        style={{
          background: "linear-gradient(180deg, rgba(15,8,8,0.95), rgba(10,5,10,0.7))",
          borderBottom: "1px solid rgba(204,0,0,0.2)",
          backdropFilter: "blur(14px)",
        }}
      >
        {/* Left: Back + Title */}
        <div className="flex items-center gap-5">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-gray-500 hover:text-white transition-colors duration-300"
          >
            <div
              className="w-8 h-8 flex items-center justify-center rounded-sm flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #cc0000, #ff3333)",
                transform: "rotate(45deg)",
                boxShadow: "0 0 14px rgba(204,0,0,0.35)",
              }}
            >
              <span className="text-white font-bold text-sm" style={{ transform: "rotate(-45deg)" }}>F</span>
            </div>
          </Link>
          <div>
            <h1
              className="text-xl font-black tracking-wide"
              style={{ color: "#ff6b6b", textShadow: "0 0 20px rgba(204,0,0,0.25)" }}
            >
              FOH Dashboard
            </h1>
            <p className="text-[10px] text-gray-600 font-semibold tracking-[0.2em] uppercase">
              Front of House Command
            </p>
          </div>
        </div>

        {/* Right: Upload Invoice + Sign out */}
        <div className="flex items-center gap-3">
          {user && (
            <button
              type="button"
              onClick={() => { logout(); window.location.href = "/login"; }}
              className="px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-300"
              style={{
                background: "rgba(239,68,68,0.15)",
                border: "1px solid rgba(239,68,68,0.4)",
                color: "#f87171",
              }}
            >
              Sign out
            </button>
          )}
          <Link
            to="/invoice-intake"
            className="px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-300"
            style={{
              background: "rgba(34,197,94,0.15)",
              border: "1px solid rgba(34,197,94,0.4)",
              color: "#4ade80",
              textDecoration: "none",
            }}
          >
            📄 Upload Invoice
          </Link>
        </div>
      </header>

      {/* Neon edge */}
      <div
        className="relative z-10 h-px"
        style={{ background: "linear-gradient(90deg, transparent 10%, rgba(0,188,212,0.3), rgba(204,0,0,0.2), transparent 90%)" }}
      />

      {/* ═══ MAIN CONTENT — 10-Day Pipeline ═══ */}
      <main className="relative z-10 flex-1 overflow-y-auto">
        <EventsPipeline title="FOH — 10-Day Pipeline" />
      </main>

      {/* ═══ DEPARTMENT RING ═══ */}
      <div className="relative z-10">
        <DepartmentRing />
      </div>
    </div>
  );
}
