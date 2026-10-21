import React from 'react';
import { X, Mouse, Keyboard, Smartphone, Compass } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-3xl bg-slate-900 border border-cyan-500/30 text-slate-100 shadow-2xl p-6 overflow-hidden space-y-5"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 30px rgba(6, 182, 212, 0.25)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Compass size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Controls & Navigation Guide</h3>
              <p className="text-[11px] text-slate-400">Master free 3D camera controls and gestures</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content sections */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 text-xs">
          {/* Mouse Section */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-cyan-300 font-semibold">
              <Mouse size={16} />
              <span>Mouse Controls</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="font-semibold text-slate-200 block">Left-Click Drag</span>
                <span className="text-slate-400">Orbit & rotate camera</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="font-semibold text-slate-200 block">Middle-Click Drag</span>
                <span className="text-slate-400">Pan camera target</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="font-semibold text-slate-200 block">Right-Click Drag</span>
                <span className="text-slate-400">Rotate vantage angle</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="font-semibold text-slate-200 block">Scroll Wheel</span>
                <span className="text-slate-400">Smooth zoom with inertia</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 sm:col-span-2">
                <span className="font-semibold text-cyan-300 block">Double-Click Planet</span>
                <span className="text-slate-400">Smoothly glide camera and lock tracking on planet</span>
              </div>
            </div>
          </div>

          {/* Keyboard Section */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-purple-300 font-semibold">
              <Keyboard size={16} />
              <span>Keyboard Shortcuts</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-300">Move Forward/Back</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[10px]">W / S</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-300">Strafe Left/Right</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[10px]">A / D</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-300">Elevate Down/Up</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[10px]">Q / E</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-300">Pause / Resume</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[10px]">Space</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-300">Reset Camera</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[10px]">R</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-300">Hide UI (Zen Mode)</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[10px]">H</kbd>
              </div>
            </div>
          </div>

          {/* Touch Gestures */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-semibold">
              <Smartphone size={16} />
              <span>Mobile Touch Gestures</span>
            </div>
            <div className="space-y-1.5 text-[11px] text-slate-300">
              <p>• <strong className="text-white">1-Finger Drag:</strong> Smooth orbital rotation</p>
              <p>• <strong className="text-white">2-Finger Pinch:</strong> Smooth zoom in / zoom out</p>
              <p>• <strong className="text-white">Single Tap:</strong> Select celestial body & open metrics panel</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wide transition-colors shadow-lg"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
