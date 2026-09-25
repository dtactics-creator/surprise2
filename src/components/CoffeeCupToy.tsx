import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  TOTAL_FRAMES,
  MOODS,
  MoodResult,
  preloadAllFrames,
  onFrameReady,
} from '../utils/frameManager';
import { fidgetAudio } from '../utils/audio';
import { Hand, RefreshCw } from 'lucide-react';

interface CoffeeCupToyProps {
  currentFrame: number;
  setCurrentFrame: (frame: number) => void;
  isSpinning: boolean;
  setIsSpinning: (spinning: boolean) => void;
  onSpinComplete: (result: MoodResult) => void;
  onSpinStart: () => void;
}

const wrap = (f: number) => ((f % TOTAL_FRAMES) + TOTAL_FRAMES) % TOTAL_FRAMES;

export const CoffeeCupToy: React.FC<CoffeeCupToyProps> = ({
  currentFrame,
  setCurrentFrame,
  isSpinning,
  setIsSpinning,
  onSpinComplete,
  onSpinStart,
}) => {
  const [frameUrls, setFrameUrls] = useState<string[]>(() => new Array(TOTAL_FRAMES).fill(''));
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPromptVisible, setDragPromptVisible] = useState(true);

  // Refs mirror the latest props so the rAF loop never goes stale or gets cancelled
  const frameRef = useRef(currentFrame);
  const spinningRef = useRef(isSpinning);
  const propsRef = useRef({ setCurrentFrame, setIsSpinning, onSpinComplete, onSpinStart });
  const rafRef = useRef<number | null>(null);
  const dragStartX = useRef(0);
  const dragStartFrame = useRef(0);
  const lastClickFrame = useRef(currentFrame);

  frameRef.current = currentFrame;
  spinningRef.current = isSpinning;
  propsRef.current = { setCurrentFrame, setIsSpinning, onSpinComplete, onSpinStart };

  // Bake frames progressively (frame 00 first)
  useEffect(() => {
    const off = onFrameReady((index, url) => {
      setFrameUrls((prev) => {
        if (prev[index] === url) return prev;
        const next = prev.slice();
        next[index] = url;
        return next;
      });
    });
    preloadAllFrames(setProgress);
    return off;
  }, []);

  const dismissDragPrompt = useCallback(() => setDragPromptVisible(false), []);

  /**
   * Spin sequence: acceleration → fast spin (2–3 full turns) → deceleration → settle.
   */
  const spinToMood = useCallback((targetMoodIndex: number) => {
    if (spinningRef.current) return;
    const { setCurrentFrame: setFrame, setIsSpinning: setSpin, onSpinStart: start } = propsRef.current;

    dismissDragPrompt();
    start();
    spinningRef.current = true;
    setSpin(true);

    const targetMood = MOODS[targetMoodIndex];
    const targetFrame = targetMood.targetFrame;
    const startFrame = wrap(frameRef.current);
    const fullRotations = 2 + Math.floor(Math.random() * 2);
    const delta = wrap(targetFrame - startFrame);
    const totalSteps = fullRotations * TOTAL_FRAMES + delta;

    const duration = 3000;
    const settleStart = 0.9;
    const startTime = performance.now();
    let lastStep = -1;
    let settled = false;

    const easeSpin = (p: number) => {
      // slow start, fast middle, long smooth slow-down
      if (p < 0.22) return 0.14 * Math.pow(p / 0.22, 2);
      if (p < 0.62) return 0.14 + ((p - 0.22) / 0.4) * 0.6;
      const d = (p - 0.62) / 0.38;
      return 0.74 + (1 - Math.pow(1 - d, 3)) * 0.26;
    };

    const tick = (now: number) => {
      const progressT = Math.min(1, (now - startTime) / duration);

      if (progressT < settleStart) {
        const step = Math.min(totalSteps, Math.floor(easeSpin(progressT / settleStart) * totalSteps));
        if (step !== lastStep) {
          lastStep = step;
          const f = wrap(startFrame + step);
          frameRef.current = f;
          setFrame(f);
          fidgetAudio.playClick(Math.max(0.5, 1 - progressT * 0.4));
        }
        rafRef.current = requestAnimationFrame(tick);
      } else if (progressT < 1) {
        // Mechanical settle: overshoot by one notch, then snap back
        const s = (progressT - settleStart) / (1 - settleStart);
        const f = s < 0.5 ? wrap(targetFrame + 1) : targetFrame;
        if (f !== frameRef.current) {
          frameRef.current = f;
          setFrame(f);
          if (s < 0.5) fidgetAudio.playClick(1.1, 0.1);
        }
        if (s >= 0.5 && !settled) {
          settled = true;
          fidgetAudio.playSettle();
        }
        rafRef.current = requestAnimationFrame(tick);
      } else {
        frameRef.current = targetFrame;
        setFrame(targetFrame);
        spinningRef.current = false;
        propsRef.current.setIsSpinning(false);
        fidgetAudio.playMoodChime(targetMood.faceIndex);
        propsRef.current.onSpinComplete(targetMood);
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [dismissDragPrompt]);

  // Register the spin trigger ONCE; cancel rAF only on unmount
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ moodIndex?: number }>).detail;
      const idx = detail?.moodIndex ?? Math.floor(Math.random() * 3);
      spinToMood(idx);
    };
    window.addEventListener('trigger-cup-spin', handler);
    return () => {
      window.removeEventListener('trigger-cup-spin', handler);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [spinToMood]);

  // Drag-to-fidget
  const handlePointerDown = (e: React.PointerEvent) => {
    if (spinningRef.current) return;
    dismissDragPrompt();
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartFrame.current = frameRef.current;
    lastClickFrame.current = frameRef.current;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || spinningRef.current) return;
    const deltaX = e.clientX - dragStartX.current;
    const newFrame = wrap(dragStartFrame.current + Math.round(deltaX / 14));
    if (newFrame !== frameRef.current) {
      frameRef.current = newFrame;
      setCurrentFrame(newFrame);
      if (newFrame !== lastClickFrame.current) {
        lastClickFrame.current = newFrame;
        fidgetAudio.playClick(0.85);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const safeFrame = wrap(currentFrame);
  // Fall back to the nearest already-baked frame so the cup never disappears mid-spin
  let src = frameUrls[safeFrame];
  if (!src) {
    for (let d = 1; d < TOTAL_FRAMES && !src; d++) {
      src = frameUrls[wrap(safeFrame - d)] || frameUrls[wrap(safeFrame + d)];
    }
  }
  const currentAngle = safeFrame * (360 / TOTAL_FRAMES);
  const ready = progress >= 1;

  return (
    <div className="relative flex flex-col items-center justify-center select-none" style={{ touchAction: 'none' }}>
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative z-10 cursor-grab active:cursor-grabbing transition-transform duration-150 ${isDragging ? 'scale-[1.02]' : ''}`}
        title="Drag horizontally to fidget with the cup"
      >
        <div className={`relative ${isSpinning || isDragging ? '' : 'animate-cup-idle'}`}>
          <div className="relative w-[280px] sm:w-[360px] md:w-[420px] max-w-full aspect-[5/6]">
            {src ? (
              <img
                src={src}
                alt={`Paper coffee cup fidget toy, rotation ${currentAngle}°`}
                width={600}
                height={720}
                draggable={false}
                decoding="sync"
                className="absolute inset-0 w-full h-full pointer-events-none select-none"
                style={{ transform: 'translateZ(0)' }}
              />
            ) : (
              <div className="absolute inset-x-[18%] top-[9%] bottom-[12%] rounded-[38%/8%] bg-gradient-to-b from-stone-300/60 to-stone-200/40 animate-pulse" />
            )}
          </div>

          {isDragging && (
            <div className="absolute top-4 right-4 bg-amber-900/80 backdrop-blur-sm text-amber-100 text-xs font-semibold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{currentAngle}°</span>
            </div>
          )}
        </div>
      </div>

      {dragPromptVisible && !isSpinning && src && (
        <button
          type="button"
          onClick={dismissDragPrompt}
          className="absolute -bottom-2 z-20 flex items-center gap-2 bg-stone-900/85 hover:bg-stone-900 text-stone-100 text-xs sm:text-sm font-medium px-3.5 py-1.5 rounded-full shadow-lg backdrop-blur cursor-pointer transition-all hover:scale-105 animate-bounce"
        >
          <Hand className="w-4 h-4 text-amber-400" />
          <span>Swipe cup to fidget</span>
        </button>
      )}

      {!ready && (
        <div className="absolute top-1 left-1 text-[10px] text-stone-500 bg-white/70 border border-stone-200/70 px-2 py-0.5 rounded-full tabular-nums">
          Baking frames {Math.round(progress * 100)}%
        </div>
      )}
    </div>
  );
};
