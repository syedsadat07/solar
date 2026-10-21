import React, { useState } from 'react';
import { PlanetSpec } from '../types/solar';
import { formatOrbitalPeriod, formatRotationPeriod, formatTemperature } from '../utils/planetaryMath';
import {
  X,
  Target,
  Compass,
  Thermometer,
  RotateCw,
  Orbit,
  Moon,
  Info,
  Layers,
  Sparkles,
  Maximize2,
} from 'lucide-react';

interface PlanetInfoCardProps {
  planet: PlanetSpec;
  isFocused: boolean;
  onFocus: () => void;
  onClose: () => void;
}

export const PlanetInfoCard: React.FC<PlanetInfoCardProps> = ({
  planet,
  isFocused,
  onFocus,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'moons' | 'facts'>('overview');
  const temp = formatTemperature(planet.temperatureC);

  return (
    <div
      className="fixed z-40 top-16 left-3 right-3 sm:right-auto sm:left-6 sm:w-96 max-h-[52vh] sm:max-h-[75vh] flex flex-col rounded-2xl bg-slate-900/95 text-slate-100 shadow-2xl border border-cyan-500/30 backdrop-blur-md overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-left-4"
      style={{
        boxShadow: `0 12px 40px -10px ${planet.color}33, 0 0 20px -2px rgba(6, 182, 212, 0.25)`,
      }}
    >
      {/* Header Banner */}
      <div
        className="relative px-5 pt-5 pb-4 border-b border-slate-800"
        style={{
          background: `linear-gradient(135deg, ${planet.color}22 0%, rgba(15, 23, 42, 0.8) 100%)`,
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-slate-950 font-bold shadow-md ring-2 ring-white/20"
              style={{ backgroundColor: planet.color }}
            >
              {planet.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">{planet.name}</h2>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800/80 text-cyan-300 border border-cyan-500/30">
                  {planet.type}
                </span>
              </div>
              <p className="text-xs text-slate-300 line-clamp-1">{planet.tagline}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close celestial info card"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action button */}
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={onFocus}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              isFocused
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'bg-slate-800 hover:bg-slate-700/80 text-cyan-300 border border-cyan-500/30'
            }`}
          >
            <Target size={14} />
            {isFocused ? 'Tracking Celestial Target' : 'Focus Camera On Planet'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/60 text-xs font-medium">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 text-center transition-colors border-b-2 ${
            activeTab === 'overview'
              ? 'border-cyan-400 text-cyan-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('metrics')}
          className={`flex-1 py-2 text-center transition-colors border-b-2 ${
            activeTab === 'metrics'
              ? 'border-cyan-400 text-cyan-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Telemetry
        </button>
        <button
          onClick={() => setActiveTab('moons')}
          className={`flex-1 py-2 text-center transition-colors border-b-2 ${
            activeTab === 'moons'
              ? 'border-cyan-400 text-cyan-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Moons ({planet.moonsCount})
        </button>
        <button
          onClick={() => setActiveTab('facts')}
          className={`flex-1 py-2 text-center transition-colors border-b-2 ${
            activeTab === 'facts'
              ? 'border-cyan-400 text-cyan-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Trivia
        </button>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <p className="text-slate-300 leading-relaxed">{planet.description}</p>

            {/* Quick highlight cards */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Equatorial Radius</span>
                <span className="text-sm font-bold text-white mt-0.5 block">
                  {planet.realRadiusKm.toLocaleString()} km
                </span>
                <span className="text-[10px] text-cyan-400/80">
                  {(planet.realRadiusKm / 6371).toFixed(2)}x Earth
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Mean Distance</span>
                <span className="text-sm font-bold text-white mt-0.5 block">{planet.distanceFromSunAU} AU</span>
                <span className="text-[10px] text-slate-400">{planet.realDistanceKm}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Orbital Period</span>
                <span className="text-sm font-bold text-white mt-0.5 block">
                  {planet.orbitalPeriodDays > 0 ? `${planet.orbitalPeriodDays.toLocaleString()} d` : 'Center'}
                </span>
                <span className="text-[10px] text-cyan-400/80">
                  {formatOrbitalPeriod(planet.orbitalPeriodDays)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Surface Gravity</span>
                <span className="text-sm font-bold text-white mt-0.5 block">{planet.gravityMs2} m/s²</span>
                <span className="text-[10px] text-cyan-400/80">
                  {(planet.gravityMs2 / 9.807).toFixed(2)}g Earth
                </span>
              </div>
            </div>

            {/* Atmosphere summary */}
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 space-y-1">
              <span className="text-[10px] font-semibold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={12} /> Atmospheric Makeup
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">{planet.atmosphere}</p>
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400 flex items-center gap-2">
                <Thermometer size={14} className="text-amber-400" /> Temperature
              </span>
              <span className="font-medium text-right text-slate-200">{temp.celsius}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400 flex items-center gap-2">
                <RotateCw size={14} className="text-cyan-400" /> Day Duration
              </span>
              <span className="font-medium text-right text-slate-200">
                {formatRotationPeriod(planet.rotationPeriodHours)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400 flex items-center gap-2">
                <Orbit size={14} className="text-purple-400" /> Axial Obliquity (Tilt)
              </span>
              <span className="font-medium text-right text-slate-200">{planet.axialTiltDeg}°</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400 flex items-center gap-2">
                <Moon size={14} className="text-blue-300" /> Natural Satellites
              </span>
              <span className="font-medium text-right text-slate-200">
                {planet.moonsCount} confirmed
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400 flex items-center gap-2">
                <Compass size={14} className="text-emerald-400" /> Discovered
              </span>
              <span className="font-medium text-right text-slate-200">
                {planet.discoveryYear || 'Ancient'}
              </span>
            </div>

            <div className="pt-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                Surface & Internal Geology
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed p-2.5 rounded-lg bg-slate-800/40">
                {planet.surfaceComposition}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'moons' && (
          <div className="space-y-3">
            {planet.moonsCount === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-1">
                <Moon size={24} className="mx-auto text-slate-600 mb-2" />
                <p className="font-medium">No Natural Moons</p>
                <p className="text-[11px] text-slate-500">
                  {planet.name} orbits too close to the Sun or lacks gravitational satellites.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-slate-400 text-[11px] mb-2.5">
                  Prominent natural satellites orbiting {planet.name}:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {planet.moons.map((m, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center gap-2"
                    >
                      <div className="w-2 h-2 rounded-full bg-cyan-400/80" />
                      <span className="text-xs text-slate-200 font-medium truncate">{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {planet.rings && (
              <div className="mt-3 p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1">
                <span className="text-[10px] font-semibold text-amber-300 uppercase tracking-wider block">
                  Ring System Active
                </span>
                <p className="text-[11px] text-slate-300">
                  Spans {planet.rings.innerRadius * 1000} to {planet.rings.outerRadius * 1000} km scale with icy water
                  ringlets, silicate debris, and fine dust bands.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'facts' && (
          <div className="space-y-2.5">
            {planet.funFacts.map((fact, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-start gap-2.5"
              >
                <Sparkles size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-slate-200 text-xs leading-relaxed">{fact}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
