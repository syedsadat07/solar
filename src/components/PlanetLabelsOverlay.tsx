import React from 'react';
import { ScreenLabelPos } from '../three/SolarSystemEngine';

interface PlanetLabelsOverlayProps {
  labels: ScreenLabelPos[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onFocus: (id: string) => void;
}

export const PlanetLabelsOverlay: React.FC<PlanetLabelsOverlayProps> = ({
  labels,
  selectedId,
  onSelect,
  onFocus,
}) => {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-20">
      {labels.map((item) => {
        if (!item.visible) return null;
        const isSelected = selectedId === item.id;

        return (
          <div
            key={item.id}
            style={{
              transform: `translate(${item.x}px, ${item.y}px)`,
            }}
            className="absolute left-0 top-0 -translate-x-1/2 -translate-y-full mb-3 pointer-events-auto"
          >
            <button
              onClick={() => onSelect(item.id)}
              onDoubleClick={() => onFocus(item.id)}
              className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium tracking-wide transition-all shadow-lg backdrop-blur-md border ${
                isSelected
                  ? 'bg-slate-900/95 text-white border-cyan-400 ring-2 ring-cyan-400/40 scale-110 shadow-cyan-500/30'
                  : 'bg-slate-950/75 hover:bg-slate-900/90 text-slate-300 hover:text-white border-slate-700/60 hover:border-slate-500 hover:scale-105'
              }`}
            >
              {/* Dot indicator */}
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor: item.color,
                  boxShadow: `0 0 8px ${item.color}`,
                }}
              />
              <span className="truncate max-w-[90px]">{item.name}</span>
              {item.distanceAu > 0 && (
                <span className="text-[9px] text-slate-400 font-mono hidden sm:inline">
                  {item.distanceAu}AU
                </span>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
};
