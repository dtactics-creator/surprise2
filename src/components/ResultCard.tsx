import React, { useState, useEffect } from 'react';
import { MoodResult } from '../utils/frameManager';
import { fidgetAudio } from '../utils/audio';
import {
  Sparkles,
  Copy,
  Check,
  Gift,
  TicketPercent,
  CheckCircle2,
  QrCode,
  X,
} from 'lucide-react';

interface ResultCardProps {
  result: MoodResult | null;
  isSpinning: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result, isSpinning, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [showQrPass, setShowQrPass] = useState(false);

  // Reset local copy/pass state when a new result arrives
  useEffect(() => {
    setCopied(false);
    setClaimed(false);
    setShowQrPass(false);
  }, [result?.faceIndex]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!result || isSpinning || !isOpen) return null;

  const handleCopyCode = async () => {
    fidgetAudio.playClick(1.1, 0.15);
    try {
      await navigator.clipboard.writeText(result.couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2600);
    } catch {
      // Fallback copy method
      const textArea = document.createElement('textarea');
      textArea.value = result.couponCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2600);
    }
  };

  const handleClaimOffer = () => {
    fidgetAudio.playSettle();
    setClaimed(true);
    setShowQrPass((prev) => !prev);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/65 p-3 backdrop-blur-sm animate-result-in sm:p-5"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="offer-modal-title"
        onClick={(event) => event.stopPropagation()}
        className="relative max-h-[92vh] max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-[28px] border border-white/70 bg-[#fffdf9] p-5 text-center shadow-2xl shadow-black/30 sm:p-7"
      >
        {/* Decorative Top Accent Bar */}
        <div
          className="absolute inset-x-0 top-0 h-2"
          style={{ backgroundColor: result.themeColor }}
        />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close coupon offer"
          className="absolute right-3 top-3 z-10 rounded-full bg-stone-100 p-2 text-stone-500 transition hover:bg-stone-200 hover:text-stone-900 active:scale-95"
        >
          <X className="h-4 w-4" />
        </button>

        {/* "YOU GOT" Heading */}
        <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold tracking-widest text-stone-400 uppercase mb-1 mt-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>YOU GOT</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        </div>

        {/* Face Emoji & Title */}
        <div className="flex items-center justify-center gap-3 my-1.5">
          <span className="text-4xl drop-shadow-sm select-none">{result.emoji}</span>
          <h2
            id="offer-modal-title"
            className="text-2xl sm:text-3xl font-black tracking-tight"
            style={{ color: result.themeColor }}
          >
            {result.name}
          </h2>
        </div>

        {/* Tagline Pill */}
        <div className="inline-block px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wide mb-2.5 bg-stone-100 text-stone-700">
          {result.tagline}
        </div>

        {/* Coffee Mood Fortune */}
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal px-2 mb-4">
          {result.moodDescription}
        </p>

        {/* PERFORATED COUPON & OFFER TICKET */}
        <div className="relative bg-[#FAF6F0] border-2 border-dashed border-amber-800/25 rounded-2xl p-4 text-left transition-all">
          {/* Left & Right Ticket Cutout Notches */}
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-r-2 border-dashed border-amber-800/25" />
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-l-2 border-dashed border-amber-800/25" />

          {/* Header row: Unlocked Offer + Discount Badge */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-900/70">
              <TicketPercent className="w-4 h-4" style={{ color: result.themeColor }} />
              <span>{result.name} MOOD REWARD</span>
            </div>
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-black text-white shadow-sm tracking-wide"
              style={{ backgroundColor: result.themeColor }}
            >
              {result.discountBadge}
            </span>
          </div>

          {/* Main Offer Title & Subtitle */}
          <h3 className="text-sm sm:text-base font-black text-stone-900 tracking-tight leading-snug">
            {result.offerTitle}
          </h3>
          <p className="text-xs text-stone-600 mt-0.5 leading-snug">
            {result.offerDetails}
          </p>

          {/* Bonus Perk Pill */}
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-stone-200/80 text-[11px] font-bold text-stone-800 shadow-2xs">
            <Gift className="w-3.5 h-3.5 shrink-0" style={{ color: result.themeColor }} />
            <span>{result.offerPerk}</span>
          </div>

          {/* Coupon Code Box + Copy Action */}
          <div className="mt-3.5 flex items-center gap-2">
            <div className="flex-1 bg-white border border-stone-300/90 rounded-xl px-3 py-2 flex items-center justify-between shadow-inner">
              <div>
                <span className="block text-[9px] font-bold uppercase tracking-widest text-stone-400">
                  COUPON CODE
                </span>
                <span className="font-mono text-sm sm:text-base font-black tracking-wider text-stone-900 select-all">
                  {result.couponCode}
                </span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-500">
                Active
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              className={`px-3.5 py-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                  : 'bg-[#3E2415] hover:bg-[#2C180B] text-white'
              }`}
              title="Copy coupon code"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>COPIED!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>COPY</span>
                </>
              )}
            </button>
          </div>

          {/* Redeem / In-Store Pass Toggle & Terms */}
          <div className="mt-3 pt-2.5 border-t border-stone-200/80 flex items-center justify-between gap-2 text-[11px]">
            <span className="text-stone-400 font-medium">{result.offerTerms}</span>
            <button
              type="button"
              onClick={handleClaimOffer}
              className="inline-flex items-center gap-1 font-bold hover:underline cursor-pointer shrink-0"
              style={{ color: result.themeColor }}
            >
              {claimed ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">
                    {showQrPass ? 'Hide Pass' : 'Offer Claimed'}
                  </span>
                </>
              ) : (
                <>
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Redeem Pass</span>
                </>
              )}
            </button>
          </div>

          {/* Expandable Barista / Checkout Pass */}
          {showQrPass && (
            <div className="mt-3 bg-white rounded-xl p-3 border border-stone-200 text-center animate-result-in">
              <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-emerald-700 mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>VOUCHER READY FOR BARISTA OR ONLINE CHECKOUT</span>
              </div>
              <p className="text-[11px] text-stone-500 mb-2">
                Show this pass in-store or paste code{' '}
                <strong className="font-mono text-stone-800">{result.couponCode}</strong> at checkout.
              </p>
              {/* Simulated Barcode Graphic */}
              <div className="py-2 px-4 bg-stone-50 rounded-lg border border-stone-200/70 inline-flex flex-col items-center">
                <div className="flex items-center gap-[2px] h-8">
                  {[3, 1, 2, 1, 3, 2, 1, 1, 3, 2, 1, 2, 3, 1, 2, 1, 1, 2, 3, 1, 2].map(
                    (w, idx) => (
                      <span
                        key={idx}
                        className="bg-stone-900 h-full inline-block"
                        style={{ width: `${w * 2}px` }}
                      />
                    )
                  )}
                </div>
                <span className="font-mono text-[10px] tracking-[0.25em] text-stone-500 mt-1">
                  *{result.couponCode}*
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
