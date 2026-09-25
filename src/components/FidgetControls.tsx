import React from 'react';
import { TOTAL_FRAMES } from '../utils/frameManager';
import { fidgetAudio } from '../utils/audio';
import { ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';

interface FidgetControlsProps {
  currentFrame: number;
  onSetFrame: (frame: number) => void;
  isSpinning: boolean;
}

export const FidgetControls: React.FC<FidgetControlsProps> = ({
  currentFrame,
  onSetFrame,
  isSpinning,
}) => {
  const [showInspector, setShowInspector] = React.useState(false);

  const safeFrame = ((currentFrame % TOTAL_FRAMES) + TOTAL_FRAMES) % TOTAL_FRAMES;
  const currentAngle = (safeFrame * (360 / TOTAL_FRAMES)) % 360;

  const handleStep = (direction: -1 | 1) => {
    if (isSpinning) return;
    const next = (((safeFrame + direction) % TOTAL_FRAMES) + TOTAL_FRAMES) % TOTAL_FRAMES;
    fidgetAudio.playClick(0.9);
    onSetFrame(next);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isSpinning) return;
    const val = parseInt(e.target.value, 10);
    if (val !== safeFrame) {
      fidgetAudio.playClick(0.75);
      onSetFrame(val);
    }
  };

  return (
    <div className="w-full max-w-xs mx-auto mt-4 text-center">
      <button
        onClick={() => setShowInspector(!showInspector)}
        disabled={isSpinning}
        className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 transition font-medium px-2.5 py-1 rounded-full hover:bg-stone-200/50"
      >
        <SlidersHorizontal className="w-3 h-3 text-amber-700" />
        <span>{showInspector ? 'Hide manual scrubber' : 'Manual 360° scrubber'}</span>
      </button>

      {showInspector && (
        <div className="mt-3 bg-white/70 backdrop-blur-sm border border-stone-200 rounded-2xl p-3 shadow-sm animate-result-in">
          <div className="flex items-center justify-between text-[11px] font-bold text-stone-600 mb-2">
            <span>Frame {String(safeFrame).padStart(2, '0')} / 23</span>
            <span className="text-amber-800">{currentAngle}° angle</span>
          </div>

          {/* Scrub Range Slider */}
          <input
            type="range"
            min={0}
            max={TOTAL_FRAMES - 1}
            value={safeFrame}
            onChange={handleSliderChange}
            disabled={isSpinning}
            className="w-full accent-amber-600 cursor-pointer h-1.5 bg-stone-200 rounded-lg appearance-none"
          />

          {/* Step Buttons */}
          <div className="flex items-center justify-between mt-2.5 gap-2">
            <button
              onClick={() => handleStep(-1)}
              disabled={isSpinning}
              className="flex-1 py-1 px-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center justify-center gap-1 transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>-15°</span>
            </button>
            <button
              onClick={() => handleStep(1)}
              disabled={isSpinning}
              className="flex-1 py-1 px-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center justify-center gap-1 transition"
            >
              <span>+15°</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
