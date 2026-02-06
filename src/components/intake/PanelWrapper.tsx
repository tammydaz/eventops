import { ReactNode } from "react";

type PanelWrapperProps = {
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  title: string;
  children: ReactNode;
  isLoading?: boolean;
};

export const PanelWrapper = ({ index, isOpen, onToggle, title, children, isLoading }: PanelWrapperProps) => {
  const isRed = index % 2 === 0;
  
  const baseClass = isRed
    ? "bg-gradient-to-r from-gray-900 to-black border-2 border-red-900 rounded-xl p-5 mb-3 transition-all shadow-lg hover:shadow-red-900/50 hover:border-red-600"
    : "bg-gradient-to-r from-gray-900 to-black border-2 border-cyan-900 rounded-xl p-5 mb-3 transition-all shadow-lg hover:shadow-cyan-500/50 hover:border-cyan-500";

  const glowClass = isRed
    ? "shadow-red-900/30"
    : "shadow-cyan-500/30";

  const titleClass = isRed
    ? "text-lg font-black text-red-600 tracking-wider uppercase"
    : "text-lg font-black text-cyan-400 tracking-wider uppercase";

  const arrowClass = isRed
    ? "text-red-600"
    : "text-cyan-400";

  return (
    <section className={`${baseClass} ${glowClass}`}>
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onToggle}
          className="text-left flex-1 hover:opacity-80 transition flex items-center gap-3"
        >
          <span className={`${arrowClass} transition-transform ${isOpen ? 'rotate-90' : ''}`}>
            ▶
          </span>
          <h2 className={titleClass}>{title}</h2>
        </button>
        {isLoading ? <span className="text-xs text-gray-400">Loading...</span> : null}
      </div>
      {isOpen && children}
    </section>
  );
};
