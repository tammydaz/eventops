import { useState } from "react";

const DEPARTMENTS = [
  { id: "client",   label: "Client Intel\nFOH Ops",     icon: "🎯", glow: "rgba(217,155,102,0.7)" },
  { id: "kitchen",  label: "Kitchen Ops",                icon: "🔥", glow: "rgba(239,68,68,0.7)" },
  { id: "packout",  label: "Flair &\nPack-Out Post",    icon: "📦", glow: "rgba(168,85,247,0.7)" },
  { id: "bar",      label: "Bar Ops",                    icon: "🍸", glow: "rgba(0,188,212,0.7)" },
  { id: "delivery", label: "Delivery Ops",               icon: "🚚", glow: "rgba(34,197,94,0.7)" },
  { id: "rentals",  label: "Rentals",                    icon: "🏺", glow: "rgba(251,191,36,0.7)" },
  { id: "vault",    label: "Ops Vault",                  icon: "🔐", glow: "rgba(204,0,0,0.7)" },
];

export default function DepartmentRing() {
  return (
    <section
      className="relative py-14 px-6"
      style={{
        borderTop: "1px solid rgba(204,0,0,0.15)",
        background: "linear-gradient(180deg, transparent, rgba(10,5,5,0.5))",
      }}
    >
      {/* Top separator glow */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent 10%, rgba(204,0,0,0.3), rgba(0,188,212,0.2), transparent 90%)" }}
      />

      <h2
        className="text-center text-lg font-bold text-white mb-10 tracking-[0.15em] uppercase"
        style={{ textShadow: "0 0 16px rgba(204,0,0,0.2)" }}
      >
        Department Command Ring
      </h2>

      {/* Ring with arch */}
      <div
        className="flex justify-center items-end gap-5 max-w-[1000px] mx-auto"
        style={{ perspective: "2000px", transform: "perspective(2000px) rotateX(6deg)" }}
      >
        {DEPARTMENTS.map((dept, i) => {
          const dist = Math.abs(i - 3);
          const yOffset = dist * dist * 3;
          return (
            <DeptCircle key={dept.id} dept={dept} yOffset={yOffset} />
          );
        })}
      </div>

      {/* Reflection */}
      <div
        className="mx-auto mt-6 h-3 w-2/3 rounded-full"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(0,188,212,0.06), transparent 70%)" }}
      />
    </section>
  );
}

function DeptCircle({ dept, yOffset }: { dept: typeof DEPARTMENTS[number]; yOffset: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex flex-col items-center justify-center rounded-full transition-all duration-500 focus:outline-none"
      style={{
        width: 110,
        height: 110,
        background: `radial-gradient(circle at 40% 35%, ${dept.glow.replace("0.7", "0.95")}, ${dept.glow.replace("0.7", "0.35")})`,
        boxShadow: hovered
          ? `0 0 40px ${dept.glow}, 0 0 70px ${dept.glow.replace("0.7", "0.25")}, 0 8px 20px rgba(0,0,0,0.5)`
          : `0 0 22px ${dept.glow.replace("0.7", "0.4")}, 0 6px 16px rgba(0,0,0,0.4)`,
        transform: hovered
          ? `translateY(${yOffset}px) scale(1.14)`
          : `translateY(${yOffset}px) scale(1)`,
      }}
    >
      {/* Glass highlight */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.12), transparent 60%)",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      />
      <span className="text-2xl mb-1 drop-shadow-lg relative z-10">{dept.icon}</span>
      <span className="text-[10px] font-bold text-white leading-tight text-center whitespace-pre-line relative z-10 drop-shadow-md">
        {dept.label}
      </span>
    </button>
  );
}
