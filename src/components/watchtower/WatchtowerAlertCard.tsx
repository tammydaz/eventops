import { useState } from "react";

interface AlertProps {
  title: string;
  description: string;
  severity: "red" | "yellow" | "green";
}

const SEV_MAP = {
  red:    { color: "#ef4444", glow: "rgba(239,68,68,0.5)",  bg: "rgba(239,68,68,0.06)", icon: "🚨", label: "CRITICAL" },
  yellow: { color: "#eab308", glow: "rgba(234,179,8,0.5)",  bg: "rgba(234,179,8,0.06)", icon: "⚠️", label: "WARNING" },
  green:  { color: "#22c55e", glow: "rgba(34,197,94,0.5)",  bg: "rgba(34,197,94,0.06)", icon: "✅", label: "INFO" },
} as const;

export default function WatchtowerAlertCard({ title, description, severity }: AlertProps) {
  const [hovered, setHovered] = useState(false);
  const s = SEV_MAP[severity];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative rounded-xl px-6 py-5 transition-all duration-300 cursor-pointer"
      style={{
        background: hovered
          ? `linear-gradient(135deg, ${s.bg}, rgba(20,10,14,0.8))`
          : "linear-gradient(135deg, rgba(22,10,10,0.6), rgba(18,8,14,0.4))",
        border: `1px solid ${hovered ? s.glow : s.glow.replace("0.5", "0.15")}`,
        boxShadow: hovered
          ? `0 0 20px ${s.glow.replace("0.5", "0.15")}, 0 8px 24px rgba(0,0,0,0.4)`
          : "0 4px 16px rgba(0,0,0,0.3)",
        transform: hovered ? "translateX(4px)" : "translateX(0)",
      }}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
        style={{
          backgroundColor: s.color,
          boxShadow: `0 0 8px ${s.glow}`,
        }}
      />

      {/* Header row */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-lg">{s.icon}</span>
        <span
          className="text-[10px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded"
          style={{
            color: s.color,
            backgroundColor: s.glow.replace("0.5", "0.12"),
            border: `1px solid ${s.glow.replace("0.5", "0.25")}`,
          }}
        >
          {s.label}
        </span>
        <h3 className="text-sm font-bold text-white flex-1">{title}</h3>

        {/* Pulse dot */}
        <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-40"
            style={{ backgroundColor: s.color }}
          />
          <span
            className="relative inline-flex h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: s.color, boxShadow: `0 0 6px ${s.glow}` }}
          />
        </span>
      </div>

      {/* Description */}
      <p className="text-[13px] text-gray-400 leading-relaxed pl-8">
        {description}
      </p>
    </div>
  );
}
