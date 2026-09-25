import React from 'react';
import { X, Cpu, Zap, Eye, CheckCircle2, Layers } from 'lucide-react';
import { TOTAL_FRAMES } from '../utils/frameManager';

interface TechInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFrame: number;
}

export const TechInfoModal: React.FC<TechInfoModalProps> = ({
  isOpen,
  onClose,
  currentFrame,
}) => {
  if (!isOpen) return null;

  const currentAngle = (currentFrame * (360 / TOTAL_FRAMES)) % 360;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-result-in">
      <div className="bg-[#FAF7F2] border border-stone-200 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative overflow-hidden text-stone-800 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-700">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-stone-900 tracking-tight">
              Behind The Illusion
            </h2>
            <p className="text-xs text-stone-500">
              3D appearance + 2D animation = instant loading
            </p>
          </div>
        </div>

        {/* Live Status Tag */}
        <div className="bg-amber-100/70 border border-amber-200/80 rounded-xl p-3 mb-5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-semibold text-amber-950">Active Frame:</span>
          </div>
          <span className="font-mono font-bold text-amber-900">
            Frame {String(currentFrame).padStart(2, '0')} / 23 ({currentAngle}°)
          </span>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-stone-600 leading-relaxed">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-stone-900 font-bold block mb-0.5">
                Zero 3D Engines or WebGL
              </strong>
              No Three.js, Canvas 3D, WebGL shaders, or heavy GLTF models. CPU and GPU usage remain close to 0%.
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-stone-900 font-bold block mb-0.5">
                24 Baked Rotation Frames
              </strong>
              The coffee cup was pre-projected into 24 transparent frames (15° steps). Shadows, kraft paper texture, beveled windows, and the 3 faces are baked directly into the assets.
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-stone-900 font-bold block mb-0.5">
                Physical Ratchet Physics
              </strong>
              The spin sequence implements authentic physical fidget dynamics: slow acceleration, high-speed spin with multiple full rotations, smooth deceleration, and a mechanical overshoot settle.
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-stone-900 font-bold block mb-0.5">
                Procedural Web Audio API
              </strong>
              Clicking and chiming sounds are synthesized in real-time with Web Audio oscillators—0 audio files downloaded!
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-600" /> 60fps Frame Swapping
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-amber-600" /> Studio Tactile Render
          </span>
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-amber-600" /> ~0% CPU Idle
          </span>
        </div>
      </div>
    </div>
  );
};
