import React, { useState } from 'react';
import { SimulationSettings, CameraPreset } from '../types/solar';
import { CAMERA_PRESETS, PLANETS_DATA, SUN_DATA } from '../data/planets';
import {
  Sliders,
  X,
  Play,
  Pause,
  RotateCcw,
  Eye,
  EyeOff,
  Sun,
  Sparkles,
  Camera,
  Grid,
  Zap,
  HelpCircle,
  Maximize,
  Compass,
  Layers,
  Footprints,
  Moon,
  Volume2,
  Film,
  Target,
} from 'lucide-react';

interface FloatingMenuProps {
  settings: SimulationSettings;
  onUpdateSettings: (updater: (prev: SimulationSettings) => SimulationSettings) => void;
  onResetSimulation: () => void;
  onResetCamera: () => void;
  onApplyCameraPreset: (presetId: string) => void;
  onFocusPlanet: (planetId: string | null) => void;
  onTakeScreenshot: () => void;
  onToggleHideUI: () => void;
  onOpenHelp: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
}

export const FloatingMenu: React.FC<FloatingMenuProps> = ({
  settings,
  onUpdateSettings,
  onResetSimulation,
  onResetCamera,
  onApplyCameraPreset,
  onFocusPlanet,
  onTakeScreenshot,
  onToggleHideUI,
  onOpenHelp,
  onToggleFullscreen,
  isFullscreen,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'sim' | 'visuals' | 'camera' | 'system'>('sim');

  const speedPresets = [0.1, 0.5, 1.0, 5.0, 20.0, 50.0];

  return (
    <>
      {/* Floating Circular Menu Button in corner */}
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={isOpen ? 'Close Simulation Controls Menu' : 'Open Simulation Controls Menu'}
          className={`group relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl backdrop-blur-md border ${
            isOpen
              ? 'bg-cyan-500 text-slate-950 border-cyan-300 ring-4 ring-cyan-500/30 rotate-90'
              : 'bg-slate-900/85 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 border-cyan-500/40 hover:border-cyan-400 shadow-cyan-950/60'
          }`}
          style={{
            boxShadow: isOpen
              ? '0 0 25px rgba(6, 182, 212, 0.6)'
              : '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 15px rgba(6, 182, 212, 0.3)',
          }}
        >
          {isOpen ? <X size={24} /> : <Sliders size={24} className="group-hover:scale-110 transition-transform" />}
          
          {/* Subtle hover tooltip when closed */}
          {!isOpen && (
            <span className="absolute right-16 px-2.5 py-1 rounded-md bg-slate-900/95 text-cyan-300 text-[11px] font-semibold border border-cyan-500/30 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
              Simulation Controls
            </span>
          )}
        </button>
      </div>

      {/* Modern Animated Glassmorphism Menu Panel */}
      {isOpen && (
        <div
          className="fixed bottom-36 right-3 sm:bottom-24 sm:right-6 z-50 w-[calc(100vw-1.5rem)] sm:w-[440px] max-h-[68vh] sm:max-h-[80vh] flex flex-col rounded-3xl bg-slate-950/92 text-slate-100 shadow-2xl border border-cyan-500/30 backdrop-blur-xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200"
          style={{
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(6, 182, 212, 0.25)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-800/80 bg-slate-900/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Sliders size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-wide">Solar Simulation Hub</h3>
                <p className="text-[11px] text-slate-400">Cosmic Engine & Visual Parameters</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* Section Navigation Tabs */}
          <div className="flex px-4 pt-3 pb-2 gap-1 border-b border-slate-800/60 bg-slate-950/40 text-xs font-semibold">
            {[
              { id: 'sim', label: 'Simulation' },
              { id: 'visuals', label: 'Visuals' },
              { id: 'camera', label: 'Camera' },
              { id: 'system', label: 'Utilities' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                  activeSection === tab.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Scrollable Settings Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
            {/* 1. SIMULATION TAB */}
            {activeSection === 'sim' && (
              <div className="space-y-4">
                {/* Play / Pause / Reset Quick Buttons */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        isPaused: !prev.isPaused,
                      }))
                    }
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold transition-all border ${
                      settings.isPaused
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                    }`}
                  >
                    {settings.isPaused ? (
                      <>
                        <Play size={16} fill="currentColor" /> Resume Animation
                      </>
                    ) : (
                      <>
                        <Pause size={16} fill="currentColor" /> Pause Animation
                      </>
                    )}
                  </button>

                  <button
                    onClick={onResetSimulation}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold bg-slate-800/60 hover:bg-slate-800 text-slate-200 border border-slate-700/60 transition-all"
                  >
                    <RotateCcw size={16} /> Reset Simulation
                  </button>
                </div>

                {/* Planet Speed Slider */}
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">Planet Speed Slider</span>
                    <span className="font-mono text-cyan-400 font-bold">{settings.timeSpeed.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="50"
                    step="0.1"
                    value={settings.timeSpeed}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      onUpdateSettings((prev) => ({ ...prev, timeSpeed: val }));
                    }}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>0.1x (Slow-mo)</span>
                    <span>1.0x (Standard)</span>
                    <span>50x (Hyperwarp)</span>
                  </div>
                </div>

                {/* Time Acceleration Presets */}
                <div className="space-y-2">
                  <span className="font-semibold text-slate-300 block">Time Acceleration Multipliers</span>
                  <div className="grid grid-cols-6 gap-1.5">
                    {speedPresets.map((speed) => (
                      <button
                        key={speed}
                        onClick={() =>
                          onUpdateSettings((prev) => ({
                            ...prev,
                            timeSpeed: speed,
                            isPaused: false,
                          }))
                        }
                        className={`py-1.5 rounded-lg font-mono text-[11px] font-medium transition-all ${
                          Math.abs(settings.timeSpeed - speed) < 0.05
                            ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                            : 'bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 border border-slate-700/50'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Focus Selected Planet Dropdown */}
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <span className="font-semibold text-slate-200 block">Focus Selected Planet</span>
                  <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                    <button
                      onClick={() => onFocusPlanet('sun')}
                      className={`text-left px-2.5 py-1.5 rounded-lg border text-[11px] transition-all flex items-center justify-between ${
                        settings.focusedPlanetId === 'sun'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                          : 'bg-slate-800/50 hover:bg-slate-800 text-slate-300 border-slate-700/50'
                      }`}
                    >
                      <span>The Sun</span>
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                    </button>
                    {PLANETS_DATA.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => onFocusPlanet(p.id)}
                        className={`text-left px-2.5 py-1.5 rounded-lg border text-[11px] transition-all flex items-center justify-between ${
                          settings.focusedPlanetId === p.id
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                            : 'bg-slate-800/50 hover:bg-slate-800 text-slate-300 border-slate-700/50'
                        }`}
                      >
                        <span className="truncate">{p.name}</span>
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. VISUALS TAB */}
            {activeSection === 'visuals' && (
              <div className="space-y-3">
                {/* Toggle Orbit Lines */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <OrbitIcon />
                    <div>
                      <span className="font-semibold text-slate-200 block">Toggle Orbit Lines</span>
                      <span className="text-[10px] text-slate-400">Renders planetary path rings</span>
                    </div>
                  </div>
                  <Switch
                    checked={settings.showOrbits}
                    onChange={(val) => onUpdateSettings((prev) => ({ ...prev, showOrbits: val }))}
                  />
                </div>

                {/* Show Planet Labels */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <Layers size={16} className="text-cyan-400" />
                    <div>
                      <span className="font-semibold text-slate-200 block">Show Planet Labels</span>
                      <span className="text-[10px] text-slate-400">Floating screen telemetry markers</span>
                    </div>
                  </div>
                  <Switch
                    checked={settings.showLabels}
                    onChange={(val) => onUpdateSettings((prev) => ({ ...prev, showLabels: val }))}
                  />
                </div>

                {/* Toggle Planet Trails */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <Footprints size={16} className="text-purple-400" />
                    <div>
                      <span className="font-semibold text-slate-200 block">Toggle Planet Trails</span>
                      <span className="text-[10px] text-slate-400">Glowing historical orbital motion tails</span>
                    </div>
                  </div>
                  <Switch
                    checked={settings.showTrails}
                    onChange={(val) => onUpdateSettings((prev) => ({ ...prev, showTrails: val }))}
                  />
                </div>

                {/* Toggle Axes/Grid */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <Grid size={16} className="text-indigo-400" />
                    <div>
                      <span className="font-semibold text-slate-200 block">Toggle Axes & Ecliptic Grid</span>
                      <span className="text-[10px] text-slate-400">Reference coordinate plane & AU rings</span>
                    </div>
                  </div>
                  <Switch
                    checked={settings.showGrid}
                    onChange={(val) => onUpdateSettings((prev) => ({ ...prev, showGrid: val }))}
                  />
                </div>

                {/* Toggle Realistic Lighting */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <Sun size={16} className="text-amber-400" />
                    <div>
                      <span className="font-semibold text-slate-200 block">Toggle Realistic Lighting</span>
                      <span className="text-[10px] text-slate-400">
                        {settings.realisticLighting ? 'Dramatic shadow falloff' : 'Ambient fill for visibility'}
                      </span>
                    </div>
                  </div>
                  <Switch
                    checked={settings.realisticLighting}
                    onChange={(val) => onUpdateSettings((prev) => ({ ...prev, realisticLighting: val }))}
                  />
                </div>

                {/* Toggle Background Stars */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <Sparkles size={16} className="text-blue-300" />
                    <div>
                      <span className="font-semibold text-slate-200 block">Toggle Background Stars</span>
                      <span className="text-[10px] text-slate-400">Cosmic starfield & deep nebulae</span>
                    </div>
                  </div>
                  <Switch
                    checked={settings.showStars}
                    onChange={(val) => onUpdateSettings((prev) => ({ ...prev, showStars: val }))}
                  />
                </div>

                {/* Dark Space Mode */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <Moon size={16} className="text-slate-400" />
                    <div>
                      <span className="font-semibold text-slate-200 block">Dark Space Mode</span>
                      <span className="text-[10px] text-slate-400">Deep pitch-black cosmic void</span>
                    </div>
                  </div>
                  <Switch
                    checked={settings.darkSpaceMode}
                    onChange={(val) => onUpdateSettings((prev) => ({ ...prev, darkSpaceMode: val }))}
                  />
                </div>
              </div>
            )}

            {/* 3. CAMERA TAB */}
            {activeSection === 'camera' && (
              <div className="space-y-4">
                {/* Reset & Auto Rotate */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={onResetCamera}
                    className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700 font-semibold transition-all"
                  >
                    <RotateCcw size={15} /> Reset Camera
                  </button>

                  <button
                    onClick={() =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        autoRotateCamera: !prev.autoRotateCamera,
                      }))
                    }
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-semibold border transition-all ${
                      settings.autoRotateCamera
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 border-slate-700/60'
                    }`}
                  >
                    <Compass size={15} /> Auto Rotate
                  </button>
                </div>

                {/* Camera Presets list */}
                <div className="space-y-2">
                  <span className="font-semibold text-slate-200 block">Camera Vantage Presets</span>
                  <div className="space-y-2">
                    {CAMERA_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => onApplyCameraPreset(preset.id)}
                        className="w-full text-left p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 hover:border-cyan-500/30 transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                            {preset.name}
                          </span>
                          <span className="text-[10px] text-cyan-400/80 font-mono">Jump</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{preset.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 4. UTILITIES TAB */}
            {activeSection === 'system' && (
              <div className="space-y-3">
                {/* Screenshot Capture */}
                <button
                  onClick={onTakeScreenshot}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 transition-all text-left group"
                >
                  <div className="flex items-center gap-2.5">
                    <Camera size={16} className="text-cyan-400 group-hover:scale-110 transition-transform" />
                    <div>
                      <span className="font-semibold text-slate-200 block">Screenshot Capture</span>
                      <span className="text-[10px] text-slate-400">Save crisp high-res snapshot of simulation</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-semibold border border-cyan-500/30">
                    PNG
                  </span>
                </button>

                {/* Hide / Show UI (Zen mode) */}
                <button
                  onClick={onToggleHideUI}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 transition-all text-left group"
                >
                  <div className="flex items-center gap-2.5">
                    <EyeOff size={16} className="text-amber-400 group-hover:scale-110 transition-transform" />
                    <div>
                      <span className="font-semibold text-slate-200 block">Hide UI (Zen Mode)</span>
                      <span className="text-[10px] text-slate-400">Clean cinematic full viewport (Hotkey: H)</span>
                    </div>
                  </div>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700">
                    H
                  </kbd>
                </button>

                {/* Toggle Fullscreen */}
                <button
                  onClick={onToggleFullscreen}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 transition-all text-left group"
                >
                  <div className="flex items-center gap-2.5">
                    <Maximize size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                    <div>
                      <span className="font-semibold text-slate-200 block">
                        {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                      </span>
                      <span className="text-[10px] text-slate-400">Immersive edge-to-edge space view</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                    {isFullscreen ? 'Active' : 'Toggle'}
                  </span>
                </button>

                {/* Performance Mode */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <Zap size={16} className="text-yellow-400" />
                    <div>
                      <span className="font-semibold text-slate-200 block">Performance Mode</span>
                      <span className="text-[10px] text-slate-400">Optimized particle counts & rendering for low-spec</span>
                    </div>
                  </div>
                  <Switch
                    checked={settings.performanceMode}
                    onChange={(val) => onUpdateSettings((prev) => ({ ...prev, performanceMode: val }))}
                  />
                </div>

                {/* Help Modal Trigger */}
                <button
                  onClick={onOpenHelp}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-cyan-950/20 hover:bg-cyan-950/40 border border-cyan-500/30 text-left transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <HelpCircle size={16} className="text-cyan-400" />
                    <div>
                      <span className="font-semibold text-cyan-200 block">Controls & Navigation Guide</span>
                      <span className="text-[10px] text-cyan-400/80">Mouse, keyboard, and touch reference</span>
                    </div>
                  </div>
                  <span className="text-cyan-400 font-bold">?</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// Reusable Switch component
const Switch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void }> = ({ checked, onChange }) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
      checked ? 'bg-cyan-500' : 'bg-slate-800'
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

const OrbitIcon = () => (
  <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <ellipse cx="12" cy="12" rx="10" ry="5" transform="rotate(-20 12 12)" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
);
