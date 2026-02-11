import { useState } from "react";

interface KPIProps {
  label: string;
  value: number;
  glow: "red" | "yellow" | "green" | "gold";
}

const GLOW_MAP = {
  red:    { color: "#ef4444", shadow: "rgba(239,68,68,0.5)",  bg: "rgba(239,68,68,0.08)" },
  yellow: { color: "#eab308", shadow: "rgba(234,179,8,0.5)",  bg: "rgba(234,179,8,0.08)" },
  green:  { color: "#22c55e", shadow: "rgba(34,197,94,0.5)",  bg: "rgba(34,197,94,0.08)" },
  gold:   { color: "#d99b66", shadow: "rgba(217,155,102,0.5)", bg: "rgba(217,155,102,0.08)" },
} as const;

export default function WatchtowerKPI({ label, value, glow }: KPIProps) {
  const [hovered, setHovered] = useState(false);
  const g = GLOW_MAP[glow];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative rounded-xl px-5 py-6 text-center transition-all duration-400"
      style={{
        background: hovered
          ? `linear-gradient(135deg, ${g.bg}, rgba(20,10,14,0.7))`
          : "linear-gradient(135deg, rgba(22,10,10,0.7), rgba(18,8,14,0.5))",
        border: `1px solid ${hovered ? g.shadow : "rgba(255,255,255,0.05)"}`,
        boxShadow: hovered
          ? `0 0 24px ${g.shadow.replace("0.5", "0.2")}, 0 8px 24px rgba(0,0,0,0.4)`
          : "0 4px 16px rgba(0,0,0,0.3)",
        transform: hovered ? "translateY(-4px) scale(1.03)" : "translateY(0) scale(1)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Top neon line */}
      <div
        className="absolute top-0 left-4 right-4 h-[1px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${g.color}80, transparent)`,
          opacity: hovered ? 1 : 0.3,
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Value */}
      <div
        className="text-4xl font-black mb-2 transition-all duration-300"
        style={{
          color: g.color,
          textShadow: hovered ? `0 0 20px ${g.shadow}` : `0 0 8px ${g.shadow.replace("0.5", "0.2")}`,
        }}
      >
        {value}
      </div>

      {/* Label */}
      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.12em]">
        {label}
      </div>

      {/* Pulse dot */}
      <div className="absolute top-3 right-3">
        <span className="relative flex h-2.5 w-2.5">
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-40"
            style={{ backgroundColor: g.color }}
          />
          <span
            className="relative inline-flex h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: g.color, boxShadow: `0 0 6px ${g.shadow}` }}
          />
        </span>
      </div>
    </div>
  );
}
