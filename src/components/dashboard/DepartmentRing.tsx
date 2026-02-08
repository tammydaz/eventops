import { useState } from "react";

interface DeptItem {
  id: string;
  label: string;
  icon: string;
  glowColor: string;
  children?: { label: string; href: string }[];
}

const DEPARTMENTS: DeptItem[] = [
  {
    id: "client-intel",
    label: "Client Intel\nFOH Ops",
    icon: "🎯",
    glowColor: "rgba(217,155,102,0.7)",
  },
  {
    id: "kitchen",
    label: "Kitchen Ops",
    icon: "🔥",
    glowColor: "rgba(239,68,68,0.7)",
  },
  {
    id: "packout",
    label: "Flair &\nPack-Out Post",
    icon: "📦",
    glowColor: "rgba(168,85,247,0.7)",
  },
  {
    id: "bar",
    label: "Bar Ops",
    icon: "🍸",
    glowColor: "rgba(0,188,212,0.7)",
  },
  {
    id: "delivery",
    label: "Delivery Ops",
    icon: "🚚",
    glowColor: "rgba(34,197,94,0.7)",
  },
  {
    id: "rentals",
    label: "Rentals",
    icon: "🏺",
    glowColor: "rgba(251,191,36,0.7)",
  },
  {
    id: "vault",
    label: "Ops Vault",
    icon: "🔐",
    glowColor: "rgba(204,0,0,0.7)",
    children: [
      { label: "BEO Packets", href: "#" },
      { label: "Staffing Grid", href: "#" },
      { label: "Vendor Notes", href: "#" },
    ],
  },
];

function DeptCircle({ dept }: { dept: DeptItem }) {
  const [hovered, setHovered] = useState(false);
  const [open, setOpen] = useState(false);
  const hasChildren = dept.children && dept.children.length > 0;

  return (
    <div className="relative flex flex-col items-center">
      <button
        onClick={() => hasChildren && setOpen(!open)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setOpen(false); }}
        className="relative flex flex-col items-center justify-center rounded-full transition-all duration-500 focus:outline-none"
        style={{
          width: 120,
          height: 120,
          background: `radial-gradient(circle at 40% 35%, ${dept.glowColor.replace("0.7", "0.95")}, ${dept.glowColor.replace("0.7", "0.4")})`,
          boxShadow: hovered
            ? `0 0 45px ${dept.glowColor}, 0 0 80px ${dept.glowColor.replace("0.7", "0.3")}, 0 8px 24px rgba(0,0,0,0.5)`
            : `0 0 25px ${dept.glowColor.replace("0.7", "0.45")}, 0 6px 18px rgba(0,0,0,0.4)`,
          transform: hovered ? "scale(1.14) translateY(-6px)" : "scale(1) translateY(0)",
        }}
      >
        {/* Glass overlay */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.12), transparent 60%)",
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
        />
        <span className="text-3xl mb-1 drop-shadow-lg relative z-10">{dept.icon}</span>
        <span className="text-[10px] font-bold text-white leading-tight text-center whitespace-pre-line relative z-10 drop-shadow-md">
          {dept.label}
        </span>
      </button>

      {/* Dropdown children */}
      {hasChildren && open && (
        <div
          className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full z-50 min-w-[180px] rounded-lg border overflow-hidden"
          style={{
            background: "rgba(15,10,10,0.96)",
            borderColor: dept.glowColor.replace("0.7", "0.4"),
            backdropFilter: "blur(12px)",
            boxShadow: `0 10px 40px rgba(0,0,0,0.7), 0 0 20px ${dept.glowColor.replace("0.7", "0.2")}`,
          }}
        >
          {dept.children!.map((child) => (
            <a
              key={child.label}
              href={child.href}
              className="block px-4 py-3 text-[12px] font-semibold text-gray-300 hover:text-white transition-all duration-200"
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = dept.glowColor.replace("0.7", "0.15");
                (e.currentTarget as HTMLElement).style.paddingLeft = "22px";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.paddingLeft = "16px";
              }}
            >
              {child.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export function DepartmentRing() {
  return (
    <section className="relative py-16 px-8">
      {/* Top separator */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent 5%, rgba(204,0,0,0.25), rgba(0,188,212,0.25), transparent 95%)",
        }}
      />

      <h2
        className="text-center text-xl font-bold text-white mb-12 tracking-wider"
        style={{ textShadow: "0 0 20px rgba(204,0,0,0.25)" }}
      >
        DEPARTMENT COMMAND RING
      </h2>

      {/* Ring layout with subtle arch */}
      <div
        className="flex justify-center items-end gap-6 max-w-[1100px] mx-auto"
        style={{ perspective: "2000px", transform: "perspective(2000px) rotateX(6deg)" }}
      >
        {DEPARTMENTS.map((dept, i) => {
          // Subtle arch: outer items lower
          const dist = Math.abs(i - 3);
          const yOffset = dist * dist * 3;
          return (
            <div key={dept.id} style={{ transform: `translateY(${yOffset}px)` }}>
              <DeptCircle dept={dept} />
            </div>
          );
        })}
      </div>

      {/* Reflection / shadow under ring */}
      <div
        className="mx-auto mt-8 h-4 w-3/4 rounded-full"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(0,188,212,0.08), transparent 70%)",
        }}
      />
    </section>
  );
}
