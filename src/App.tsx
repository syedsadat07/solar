/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SolarSystemEngine, ScreenLabelPos } from './three/SolarSystemEngine';
import { PlanetSpec, SimulationSettings } from './types/solar';
import { PlanetInfoCard } from './components/PlanetInfoCard';
import { FloatingMenu } from './components/FloatingMenu';
import { PlanetLabelsOverlay } from './components/PlanetLabelsOverlay';
import { BottomQuickBar } from './components/BottomQuickBar';
import { HelpModal } from './components/HelpModal';
import { Eye, HelpCircle, Compass, Sparkles } from 'lucide-react';

const INITIAL_SETTINGS: SimulationSettings = {
  timeSpeed: 1.0,
  isPaused: false,
  showOrbits: true,
  showLabels: true,
  showTrails: true,
  showGrid: false,
  realisticLighting: false,
  showStars: true,
  darkSpaceMode: false,
  performanceMode: false,
  autoRotateCamera: false,
  selectedPlanetId: null,
  focusedPlanetId: null,
};

export default function App() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<SolarSystemEngine | null>(null);

  const [settings, setSettings] = useState<SimulationSettings>(INITIAL_SETTINGS);
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetSpec | null>(null);
  const [screenLabels, setScreenLabels] = useState<ScreenLabelPos[]>([]);
  const [hideUI, setHideUI] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize Three.js Engine once on mount
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const engine = new SolarSystemEngine(
      canvasContainerRef.current,
      INITIAL_SETTINGS,
      {
        onSelectPlanet: (planet) => {
          setSelectedPlanet(planet);
          setSettings((prev) => ({
            ...prev,
            selectedPlanetId: planet ? planet.id : null,
          }));
        },
        onLabelsUpdate: (labels) => {
          setScreenLabels(labels);
        },
      }
    );

    engineRef.current = engine;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyH') {
        setHideUI((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Sync settings updates to Engine
  const updateSettings = useCallback(
    (updater: (prev: SimulationSettings) => SimulationSettings) => {
      setSettings((prev) => {
        const next = updater(prev);
        if (engineRef.current) {
          if (next.timeSpeed !== prev.timeSpeed) engineRef.current.setTimeSpeed(next.timeSpeed);
          if (next.isPaused !== prev.isPaused) engineRef.current.setPaused(next.isPaused);
          if (next.showOrbits !== prev.showOrbits) engineRef.current.toggleOrbits(next.showOrbits);
          if (next.showLabels !== prev.showLabels) engineRef.current.toggleLabels(next.showLabels);
          if (next.showTrails !== prev.showTrails) engineRef.current.toggleTrails(next.showTrails);
          if (next.showGrid !== prev.showGrid) engineRef.current.toggleGrid(next.showGrid);
          if (next.realisticLighting !== prev.realisticLighting)
            engineRef.current.toggleRealisticLighting(next.realisticLighting);
          if (next.showStars !== prev.showStars) engineRef.current.toggleStars(next.showStars);
          if (next.darkSpaceMode !== prev.darkSpaceMode)
            engineRef.current.toggleDarkSpaceMode(next.darkSpaceMode);
          if (next.performanceMode !== prev.performanceMode)
            engineRef.current.togglePerformanceMode(next.performanceMode);
          if (next.autoRotateCamera !== prev.autoRotateCamera)
            engineRef.current.toggleAutoRotate(next.autoRotateCamera);
        }
        return next;
      });
    },
    []
  );

  const handleSelectPlanet = (id: string | null) => {
    if (engineRef.current) {
      engineRef.current.selectPlanet(id);
    }
  };

  const handleFocusPlanet = (id: string | null) => {
    if (engineRef.current) {
      engineRef.current.focusPlanet(id);
      setSettings((prev) => ({
        ...prev,
        focusedPlanetId: id,
        selectedPlanetId: id,
      }));
    }
  };

  const handleResetCamera = () => {
    if (engineRef.current) {
      engineRef.current.resetCamera();
      setSettings((prev) => ({ ...prev, focusedPlanetId: null }));
    }
  };

  const handleResetSimulation = () => {
    if (engineRef.current) {
      engineRef.current.resetSimulation();
      setSettings((prev) => ({
        ...prev,
        isPaused: false,
        focusedPlanetId: null,
        selectedPlanetId: null,
      }));
    }
  };

  const handleApplyCameraPreset = (presetId: string) => {
    if (engineRef.current) {
      engineRef.current.applyCameraPreset(presetId);
      setSettings((prev) => ({ ...prev, focusedPlanetId: null }));
    }
  };

  const handleTakeScreenshot = () => {
    if (!engineRef.current) return;
    const dataUrl = engineRef.current.takeScreenshot();
    const link = document.createElement('a');
    link.download = `SolarSystem3D_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '_')}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* Isolated Three.js WebGL Mount Container */}
      <div
        ref={canvasContainerRef}
        data-testid="threejs-viewport"
        className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing outline-none"
      />

      {/* Screen Projected Planet Labels */}
      {!hideUI && settings.showLabels && (
        <PlanetLabelsOverlay
          labels={screenLabels}
          selectedId={settings.selectedPlanetId}
          onSelect={(id) => handleSelectPlanet(id)}
          onFocus={(id) => handleFocusPlanet(id)}
        />
      )}

      {/* Top Header Badge */}
      {!hideUI && (
        <header className="absolute top-4 left-4 sm:top-5 sm:left-6 z-30 flex items-center gap-3 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-slate-950/80 border border-cyan-500/30 shadow-xl backdrop-blur-md">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
            <div>
              <h1 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                Solar System 3D
              </h1>
              <span className="text-[10px] text-cyan-400/90 font-medium hidden sm:inline">
                Interactive Planetary Explorer
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowHelp(true)}
            aria-label="Open controls help"
            className="pointer-events-auto p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-cyan-500/30 shadow-lg backdrop-blur-md transition-colors"
            title="Controls & Shortcuts (?)"
          >
            <HelpCircle size={16} />
          </button>
        </header>
      )}

      {/* Restore UI Button when in Zen mode */}
      {hideUI && (
        <button
          onClick={() => setHideUI(false)}
          className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-cyan-400 border border-cyan-500/40 shadow-2xl backdrop-blur-md text-xs font-semibold transition-all hover:scale-105"
        >
          <Eye size={15} />
          <span>Show UI (H)</span>
        </button>
      )}

      {/* Planet Info Card */}
      {!hideUI && selectedPlanet && (
        <PlanetInfoCard
          planet={selectedPlanet}
          isFocused={settings.focusedPlanetId === selectedPlanet.id}
          onFocus={() => handleFocusPlanet(selectedPlanet.id)}
          onClose={() => handleSelectPlanet(null)}
        />
      )}

      {/* Unified Bottom Quick Control Dock */}
      {!hideUI && (
        <BottomQuickBar
          settings={settings}
          onUpdateSettings={updateSettings}
          onSelectPlanet={handleSelectPlanet}
          onResetCamera={handleResetCamera}
          onToggleHideUI={() => setHideUI(true)}
        />
      )}

      {/* Floating Circular Menu Button & Hub in Corner */}
      {!hideUI && (
        <FloatingMenu
          settings={settings}
          onUpdateSettings={updateSettings}
          onResetSimulation={handleResetSimulation}
          onResetCamera={handleResetCamera}
          onApplyCameraPreset={handleApplyCameraPreset}
          onFocusPlanet={handleFocusPlanet}
          onTakeScreenshot={handleTakeScreenshot}
          onToggleHideUI={() => setHideUI(true)}
          onOpenHelp={() => setShowHelp(true)}
          onToggleFullscreen={handleToggleFullscreen}
          isFullscreen={isFullscreen}
        />
      )}

      {/* Help Modal */}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </main>
  );
}
