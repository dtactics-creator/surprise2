import React from 'react';
import { MOODS } from '../utils/frameManager';
import { TicketPercent, Lock } from 'lucide-react';

import { Offer } from '../lib/api';

interface MoodCollectionProps {
  stats: Record<number, number>;
  onSelectMood: (faceIndex: number) => void;
  activeFaceIndex: number | null;
  isSpinning: boolean;
  activeOffers: Offer[];
}

export const MoodCollection: React.FC<MoodCollectionProps> = ({
  stats,
  onSelectMood,
  activeFaceIndex,
  isSpinning,
  activeOffers,
}) => {
  return (
    <div className="w-full max-w-md mx-auto mt-6 bg-amber-950/5 border border-stone-200/60 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
          <TicketPercent className="w-3.5 h-3.5 text-amber-700" />
          <span>Face Rewards & Coupons (3/3)</span>
        </h3>
        <span className="text-[11px] font-medium text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
          Total Spins: {Object.values(stats).reduce((a, b) => a + b, 0)}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {MOODS.map((mood) => {
          const count = stats[mood.faceIndex] || 0;
          const isUnlocked = count > 0 || activeFaceIndex === mood.faceIndex;
          const isActive = activeFaceIndex === mood.faceIndex;

          const offer = activeOffers.length > 0 ? activeOffers[mood.faceIndex % activeOffers.length] : null;
          const displayBadge = offer ? offer.value : mood.discountBadge;
          const displayCode = offer ? offer.code : mood.couponCode;

          return (
            <button
              key={mood.faceIndex}
              onClick={() => !isSpinning && onSelectMood(mood.faceIndex)}
              disabled={isSpinning}
              className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center ${
                isActive
                  ? 'bg-white shadow-md border-amber-400 ring-2 ring-amber-400/20 scale-[1.02]'
                  : 'bg-white/65 hover:bg-white border-stone-200/70 hover:border-stone-300'
              } ${isSpinning ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {/* Offer Discount Pill */}
              <span
                className="text-[9px] font-black px-2 py-0.5 rounded-full text-white mb-1.5 tracking-wide"
                style={{ backgroundColor: mood.themeColor }}
              >
                {displayBadge}
              </span>

              <span className="text-2xl mb-1 select-none">{mood.emoji}</span>
              <span className="text-xs font-bold text-stone-800">{mood.name}</span>

              {/* Unlocked Coupon Code or Spin Prompt */}
              {isUnlocked ? (
                <span className="mt-1 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200/80">
                  {displayCode}
                </span>
              ) : (
                <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] text-stone-400 font-medium">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Spin to unlock</span>
                </span>
              )}

              <span className="text-[9px] text-stone-400 mt-1">
                Spun {count} {count === 1 ? 'time' : 'times'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
