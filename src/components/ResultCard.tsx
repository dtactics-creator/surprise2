import React, { useState, useEffect } from 'react';
import { MoodResult } from '../utils/frameManager';
import { Offer } from '../lib/api';
import { fidgetAudio } from '../utils/audio';
import {
  Sparkles,
  Copy,
  Check,
  Gift,
  TicketPercent,
  CheckCircle2,
  QrCode,
  Share2,
  X,
  Store,
  Wallet,
  Building,
} from 'lucide-react';
import { cn } from '../utils/cn';

function isVideoUrl(url?: string) {
  if (!url) return false;
  return url.match(/\.(mp4|webm|ogg|mov)/i) !== null;
}

interface ResultCardProps {
  result: MoodResult | null;
  offer: Offer | null;
  isSpinning: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result, offer, isSpinning, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [showQrPass, setShowQrPass] = useState(false);

  const qrUrl =
    "https://api.qrserver.com/v1/create-qr-code/?size=220x220&bgcolor=ffffff&color=1c1917&data=" +
    encodeURIComponent(
      offer?.cta?.url && offer.cta.url !== "#"
        ? offer.cta.url
        : (offer?.code || result?.couponCode || result?.name || "REWARD")
    );

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
    const codeToCopy = offer?.code || result.couponCode;
    try {
      await navigator.clipboard.writeText(codeToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2600);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = codeToCopy;
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

  const share = async () => {
    fidgetAudio.playClick(1.2, 0.1);
    const data = {
      title: result.name,
      text: offer?.blurb || result.moodDescription,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(data);
      } catch { }
    } else {
      try {
        await navigator.clipboard.writeText(`${result.name} — ${window.location.href}`);
      } catch { }
    }
  };

  const statusStyles = claimed
    ? "bg-slate-100 text-slate-500 ring-slate-200"
    : "bg-emerald-50 text-emerald-700 ring-emerald-200/80";

  return (
    <div
      className="fixed inset-0 z-[60] flex animate-fade-in items-center justify-center bg-stone-950/55 p-4 backdrop-blur-sm motion-reduce:animate-none sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <article
        role="dialog"
        aria-modal="true"
        aria-labelledby="offer-modal-title"
        tabIndex={-1}
        className="relative max-h-[92dvh] w-full max-w-[420px] flex flex-col animate-pop-in overflow-y-auto overscroll-contain rounded-[24px] bg-white shadow-2xl ring-1 ring-slate-200/80 outline-none motion-reduce:animate-none"
      >
        {/* Banner or Top accent */}
        {offer?.image ? (
          <div className="relative flex aspect-[21/9] w-full shrink-0 items-center justify-center overflow-hidden bg-stone-100/50 border-b border-stone-200/50 rounded-t-[24px]">
            {/* Soft spotlight behind artwork */}
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_55%,rgba(255,255,255,0.9),transparent)]"
              aria-hidden
            />
            {isVideoUrl(offer.image) ? (
              <video
                src={offer.image}
                autoPlay
                loop
                muted
                playsInline
                className="relative h-full w-full object-cover"
              />
            ) : (
              <img
                src={offer.image}
                alt={result.name}
                className="relative h-full w-full object-cover"
              />
            )}
          </div>
        ) : (
          <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />
        )}

        <button
          type="button"
          onClick={onClose}
          className={cn(
            "absolute right-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300",
            offer?.image
              ? "bg-white/80 text-slate-500 hover:bg-white hover:text-slate-700 backdrop-blur-md shadow-sm"
              : "bg-slate-100/80 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          )}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="relative px-6 pb-2 pt-2">
          <div className="flex flex-col items-center text-center">

            {/* Overlapping Emoji Badge */}
            <div
              className={cn(
                "mb-3 grid shrink-0 place-items-center rounded-2xl border text-[28px] ring-4 ring-white shadow-sm",
                offer?.image ? "-mt-8 size-14 bg-white border-slate-200/50" : "mt-4 size-16 bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200/80 shadow-inner"
              )}
            >
              <span className="select-none leading-none drop-shadow-sm">{result.emoji}</span>
            </div>

            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700 ring-1 ring-amber-200/70">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              You Got
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            </div>

            {/* Mood */}
            <h1 className="text-3xl sm:text-[2.15rem] font-bold tracking-tight text-slate-900 break-words leading-none">
              {result.name}
            </h1>

            {/* {offer?.category && (
              <div className="mt-2.5">
                <span className="inline-flex items-center rounded-md bg-slate-100/90 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                  {offer.category}
                </span>
              </div>
            )} */}

            {/* {offer?.blurb && (
              <p className="mt-2.5 max-w-[20rem] text-[13px] leading-relaxed text-slate-500">
                {offer.blurb}
              </p>
            )} */}
          </div>
        </div>

        {/* Coupon section */}
        <div className="px-5 pb-5 pt-3 sm:px-6">
          <div className="rounded-2xl bg-slate-50/80 p-4 ring-1 ring-slate-200/70 sm:p-5">
            {/* Coupon header */}
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700 ring-1 ring-amber-200/60">
                  <TicketPercent className="h-3.5 w-3.5" />
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-800/80">
                  {offer?.type || "DISCOUNT COUPON"}
                </span>
              </div>
              {offer?.category && (
                <span className="shrink-0 inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800 capitalize">
                  {offer.category}
                </span>
              )}
            </div>

            {/* Title */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">{offer?.value || result.name}</h2>
            </div>

            {/* Bonus + merchant */}
            {offer?.brand && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 rounded-xl bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200/80 shadow-sm">
                  <Building className="text-slate-400 w-3.5 h-3.5" />
                  {offer.brand}
                </div>
              </div>
            )}

            {/* Coupon code row */}
            {(offer?.code || result.couponCode) && (
              <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                <div className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-xl bg-white px-3.5 py-3 ring-1 ring-slate-200/90 shadow-sm">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Coupon Code
                    </p>
                    <p className="mt-0.5 truncate font-mono text-base font-semibold tracking-wide text-slate-900 select-all">
                      {offer?.code || result.couponCode}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
                      statusStyles
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        claimed
                          ? "bg-slate-400"
                          : "bg-emerald-500"
                      )}
                    />
                    {claimed ? "Claimed" : "Active"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className={cn(
                    "flex sm:inline-flex h-auto w-full sm:w-auto sm:min-w-[5.5rem] flex-row sm:flex-col items-center justify-center gap-1.5 sm:gap-0.5 rounded-xl px-3 py-2.5 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
                    copied ? "bg-emerald-600 hover:bg-emerald-600" : "bg-slate-900 hover:bg-slate-800"
                  )}
                  aria-label={copied ? "Copied" : "Copy coupon code"}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span className="text-[11px] font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span className="text-[11px] font-semibold">Copy</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Expandable Barista / Checkout Pass */}
            {showQrPass && (
              <div className="mt-3 bg-white rounded-xl p-3 ring-1 ring-slate-200/90 text-center animate-pop-in">
                <div className="py-2 px-2 inline-flex flex-col items-center">
                  <img
                    src={qrUrl}
                    alt="Scan to redeem"
                    loading="lazy"
                    className="h-32 w-32 rounded-lg object-contain"
                  />
                </div>
                {offer?.expiry && (
                  <p className="text-[11px] text-slate-400 mt-2 font-medium">Valid until {offer.expiry}</p>
                )}
              </div>
            )}

            {/* CTA */}
            {offer?.cta && (
              <div className="mt-4">
                <a
                  href={offer.cta.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-amber-600 active:scale-95"
                >
                  {offer.cta.label}
                </a>
              </div>
            )}

            {/* Footer meta + actions */}
            {/* <div className="mt-4 flex flex-col gap-3 border-t border-slate-200/80 pt-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Wallet className="text-slate-400 w-3.5 h-3.5" />
                  No minimum spend
                </span>
                <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-block" />
                <span className="inline-flex items-center gap-1.5">
                  <Store className="text-slate-400 w-3.5 h-3.5" />
                  Online & In-Store
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={share}
                  className="inline-flex items-center justify-center rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors gap-1.5"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Share
                </button>
                {offer?.qr !== false && (
                  <button
                    type="button"
                    onClick={handleClaimOffer}
                    className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors gap-1.5"
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    {showQrPass ? 'Hide Pass' : 'Redeem Pass'}
                  </button>
                )}
              </div>
            </div> */}
          </div>
        </div>
      </article>
    </div>
  );
};
