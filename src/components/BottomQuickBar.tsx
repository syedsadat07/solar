import React, { useState } from 'react';
import { SimulationSettings } from '../types/solar';
import { PLANETS_DATA, SUN_DATA } from '../data/planets';
import {
  Play,
  Pause,
  RotateCcw,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Compass,
  Zap,
} from 'lucide-react';

interface BottomQuickBarProps {
  settings: SimulationSettings;
  onUpdateSettings: (updater: (prev: SimulationSettings) => SimulationSettings) => void;
  onSelectPlanet: (id: string) => void;
  onResetCamera: () => void;
  onToggleHideUI: () => void;
}

export const BottomQuickBar: React.FC<BottomQuickBarProps> = ({
  settings,
  onUpdateSettings,
  onSelectPlanet,
  onResetCamera,
  onToggleHideUI,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const allBodies = [SUN_DATA, ...PLANETS_DATA];

  return (
    <div
      className={`fixed left-1/2 -translate-x-1/2 z-30 transition-all duration-300 ${
        isCollapsed ? 'bottom-2' : 'bottom-5'
      } max-w-[min(940px,94vw)] w-full flex flex-col items-center pointer-events-none`}
    >
      {/* Collapse / Expand pill */}
      <button
        onClick={() => setIsCollapsed((prev) => !prev)}
        className="pointer-events-auto px-4 py-1 rounded-t-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border-t border-x border-cyan-500/30 text-[11px] font-semibold flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-colors"
        aria-label={isCollapsed ? 'Show Quick Navigation Dock' : 'Hide Quick Navigation Dock'}
      >
        {isCollapsed ? (
          <>
            <ChevronUp size={14} className="text-cyan-400" /> Show Navigation Dock
          </>
        ) : (
          <>
            <ChevronDown size={14} className="text-cyan-400" /> Collapse Dock
          </>
        )}
      </button>

      {/* Main Bar */}
      {!isCollapsed && (
        <div className="pointer-events-auto w-full p-2.5 sm:p-3 rounded-2xl bg-slate-950/90 border border-cyan-500/30 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {/* Left: Simulation Playback */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  isPaused: !prev.isPaused,
                }))
              }
              aria-label={settings.isPaused ? 'Resume Simulation' : 'Pause Simulation'}
              className={`p-2 rounded-xl border transition-all ${
                settings.isPaused
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30'
              }`}
            >
              {settings.isPaused ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}
            </button>

            {/* Speed indicator & quick bump */}
            <div className="flex items-center gap-1 bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-slate-800">
              <Zap size={14} className="text-amber-400" />
              <span className="font-mono text-cyan-300 font-bold">{settings.timeSpeed.toFixed(1)}x</span>
            </div>

            <button
              onClick={onResetCamera}
              aria-label="Reset Camera View"
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
              title="Reset Camera (R)"
            >
              <Compass size={16} />
            </button>
          </div>

          {/* Middle: Horizontal Planet Selector */}
          <div className="flex-1 overflow-x-auto py-1 px-1 flex items-center gap-1.5 max-w-full scrollbar-none">
            {allBodies.map((body) => {
              const isSelected = settings.selectedPlanetId === body.id;
              return (
                <button
                  key={body.id}
                  onClick={() => onSelectPlanet(body.id)}
                  className={`shrink-0 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400 font-bold shadow-sm'
                      : 'bg-slate-900/50 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 border-slate-800'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: body.color }}
                  />
                  <span>{body.name.replace('The ', '')}</span>
                </button>
              );
            })}
          </div>

          {/* Right: Zen mode toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onToggleHideUI}
              className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-medium flex items-center gap-1.5 transition-colors"
              title="Hide UI (H)"
            >
              <EyeOff size={14} className="text-amber-400" />
              <span className="hidden md:inline">Zen View</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
