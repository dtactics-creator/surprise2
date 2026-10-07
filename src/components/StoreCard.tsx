import React, { useState, useEffect } from 'react';
import { MoodResult } from '../utils/frameManager';
import { Offer } from '../lib/api';
import { fidgetAudio } from '../utils/audio';
import { ArrowRight, Building2, Check, Layers3, Sparkles, Tag, Ticket, Copy, CheckCircle2, QrCode, X } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types & Constants                                                  */
/* ------------------------------------------------------------------ */

export type RewardTone = "amber" | "emerald" | "violet";
export type RewardStatus = "unlocked" | "redeemed" | "expired";

const TONES: Record<RewardTone, { eyebrow: string; media: string; avatar: string }> = {
  amber: { eyebrow: "text-amber-700", media: "bg-amber-50", avatar: "bg-amber-50 border-amber-200" },
  emerald: { eyebrow: "text-emerald-700", media: "bg-emerald-50", avatar: "bg-emerald-50 border-emerald-200" },
  violet: { eyebrow: "text-violet-700", media: "bg-violet-50", avatar: "bg-violet-50 border-violet-200" },
};

const STATUS: Record<RewardStatus, { label: string; dot: string; text: string; ping: boolean }> = {
  unlocked: { label: "Unlocked", dot: "bg-emerald-500", text: "text-emerald-700", ping: true },
  redeemed: { label: "Redeemed", dot: "bg-stone-400", text: "text-stone-600", ping: false },
  expired: { label: "Expired", dot: "bg-rose-500", text: "text-rose-700", ping: false },
};

/** Floating chip used on top of the artwork. */
const CHIP =
  "inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold shadow-[0_1px_2px_rgba(28,25,23,0.06)] ring-1 ring-inset ring-stone-900/[0.06]";

/** Keyframes live inside the component so it works when copied into any project. */
const POP_KEYFRAMES = `
@keyframes reward-card-pop {
  0%   { transform: scale(.85) rotate(-6deg); opacity: 0; }
  60%  { transform: scale(1.06) rotate(2deg); opacity: 1; }
  100% { transform: scale(1) rotate(0); }
}`;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

/** "DISCOUNT_COUPON" → "Discount coupon" */
const humanize = (value?: string) => {
  if (!value) return "";
  const s = value.replace(/[_-]+/g, " ").trim().toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const capitalize = (value?: string) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value);

const LEGAL_SUFFIXES = new Set(["PVT", "LTD", "INC", "LLC", "CO", "CORP", "PLC", "LIMITED", "PRIVATE", "GMBH"]);

/** "PK PVT LTD" → "PK", "Northwind Retail" → "NR" */
const initials = (name?: string) => {
  if (!name) return "RE";
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .split(/\s+/)
    .filter((w) => w && !LEGAL_SUFFIXES.has(w.toUpperCase()));
  if (!words.length) return name.slice(0, 2).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

/* ------------------------------------------------------------------ */
/* StoreCard                                                          */
/* ------------------------------------------------------------------ */

interface StoreCardProps {
  result: MoodResult | null;
  offer: Offer | null;
  isSpinning: boolean;
  isOpen: boolean;
  onClose: () => void;
  isCatalogMode?: boolean;
}

export const StoreCard: React.FC<StoreCardProps> = ({ result, offer, isSpinning, isOpen, onClose, isCatalogMode = false }) => {
  const [copied, setCopied] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [showQrPass, setShowQrPass] = useState(false);

  // Reset local state when a new result arrives
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
      await navigator.clipboard.writeText(offer?.code || result.couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2600);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = offer?.code || result.couponCode;
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

  const tone: RewardTone = result.faceIndex === 1 ? "emerald" : result.faceIndex === 2 ? "violet" : "amber";
  const t = TONES[tone];
  const status: RewardStatus = claimed ? "redeemed" : "unlocked";
  const s = STATUS[status];
  const hasImage = Boolean(offer?.image);
  const expired = false; // Component currently does not have an expired state

  const notchClassName = isCatalogMode ? "bg-[#FAF7F2]" : "bg-stone-950/65 backdrop-blur-sm";
  const animate = !isCatalogMode;
  const notch = "absolute top-1/2 size-[22px] -translate-y-1/2 rounded-full border border-stone-200";

  const details = [];
  if (offer?.type || offer?.category) {
    details.push({
      key: "type",
      label: "Type",
      icon: <Layers3 className="size-3.5" aria-hidden />,
      title: offer?.type || "Reward",
      value: <span className="truncate">{humanize(offer?.type || "Reward")}</span>,
    });
  }
  if (offer?.category) {
    details.push({
      key: "category",
      label: "Category",
      icon: <Tag className="size-3.5" aria-hidden />,
      title: offer.category,
      value: <span className="truncate">{humanize(offer.category)}</span>,
    });
  }
  if (offer?.brand) {
    details.push({
      key: "issuer",
      label: "Issued by",
      icon: <Building2 className="size-3.5" aria-hidden />,
      title: offer.brand,
      value: (
        <span className="inline-flex min-w-0 items-center gap-2">
          <span
            aria-hidden
            className="grid size-5 shrink-0 place-items-center rounded-md bg-stone-900 text-[9px] font-bold tracking-tight text-white"
          >
            {initials(offer.brand)}
          </span>
          <span className="truncate">{offer.brand}</span>
        </span>
      ),
    });
  }

  const content = (
    <article
      role={isCatalogMode ? undefined : "dialog"}
      aria-modal={isCatalogMode ? undefined : "true"}
      onClick={(event) => event.stopPropagation()}
      aria-label={`${result.name} reward from ${offer?.brand || 'Store'}, ${s.label.toLowerCase()}`}
      className={cx(
        "@container group relative w-full rounded-[20px] border border-stone-200/90 bg-white text-left",
        "shadow-[0_1px_2px_rgba(28,25,23,0.04),0_12px_32px_-18px_rgba(28,25,23,0.18)]",
        "transition-[box-shadow,border-color,transform] duration-300",
        "hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-[0_1px_2px_rgba(28,25,23,0.05),0_24px_48px_-22px_rgba(28,25,23,0.28)]",
        isCatalogMode ? "h-full flex flex-col" : "max-h-[92vh] max-h-[92dvh] max-w-lg overflow-y-auto"
      )}
    >
      {animate && (
        <style dangerouslySetInnerHTML={{ __html: POP_KEYFRAMES }} />
      )}

      {!isCatalogMode && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close coupon offer"
          className="absolute right-3 top-3 z-10 rounded-full bg-stone-100 p-2 text-stone-500 transition hover:bg-stone-200 hover:text-stone-900 active:scale-95"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <div className="flex flex-col @2xl:flex-row">
        {/* ============ Media banner ============ */}
        <div
          className={cx(
            "relative flex aspect-[16/10] shrink-0 items-center justify-center overflow-hidden",
            "rounded-t-[19px] border-b border-stone-900/[0.05]",
            "@2xl:aspect-auto @2xl:min-h-[260px] @2xl:w-[40%] @2xl:rounded-l-[19px] @2xl:rounded-tr-none @2xl:border-b-0 @2xl:border-r",
            t.media,
          )}
        >
          {/* soft spotlight behind the artwork */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_55%,rgba(255,255,255,0.9),transparent)]"
          />

          {hasImage ? (
            <img
              src={offer?.image}
              alt={`${result.name} offer artwork`}
              draggable={false}
              className={cx(
                "relative h-full w-full object-cover",
                "transition-transform duration-500 ease-out group-hover:scale-[1.04]",
                expired && "opacity-50 grayscale",
              )}
            />
          ) : (
            <span
              aria-hidden
              style={animate ? { animation: "reward-card-pop 600ms cubic-bezier(.2,.8,.2,1) both" } : undefined}
              className={cx("relative select-none text-[64px] leading-none", expired && "opacity-50 grayscale")}
            >
              {result.emoji}
            </span>
          )}

          {/* type + status chips */}
          <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
            {(offer?.type || offer?.category) && (
              <span className={cx(CHIP, "min-w-0 text-stone-700")} title={offer?.type || offer?.category}>
                <Ticket className="size-3.5 shrink-0 text-stone-500" strokeWidth={2.25} aria-hidden />
                <span className="truncate">{humanize(offer?.type || offer?.category)}</span>
              </span>
            )}
            <span className={cx(CHIP, "shrink-0", s.text)} role="status">
              <span className="relative flex size-1.5">
                {s.ping && <span className={cx("absolute inset-0 animate-ping rounded-full opacity-60", s.dot)} />}
                <span className={cx("relative size-1.5 rounded-full", s.dot)} />
              </span>
              {s.label}
            </span>
          </div>
        </div>

        {/* ============ Content ============ */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="px-5 pb-5 @sm:px-6 @sm:pb-6">
            {/* emoji badge — overlaps the banner on vertical layout */}
            {hasImage ? (
              <div
                aria-hidden
                className={cx(
                  "relative -mt-7 grid size-14 shrink-0 place-items-center rounded-2xl border text-[28px] ring-4 ring-white @2xl:mt-6",
                  t.avatar,
                )}
              >
                <span
                  className="select-none leading-none"
                  style={animate ? { animation: "reward-card-pop 600ms cubic-bezier(.2,.8,.2,1) both" } : undefined}
                >
                  {result.emoji}
                </span>
              </div>
            ) : (
              <div className="h-5 @2xl:h-6" />
            )}

            <div className={cx(hasImage && "mt-3")}>
              <p className={cx("inline-flex items-center gap-1.5 text-xs font-semibold", t.eyebrow)}>
                <Sparkles className="size-3.5" strokeWidth={2.25} aria-hidden />
                You got a reward
              </p>
              <h3
                title={result.name}
                className={cx(
                  "mt-1 truncate text-[26px] font-bold leading-tight tracking-[-0.02em] @sm:text-[28px]",
                  status === "unlocked" ? "text-stone-900" : "text-stone-500",
                )}
              >
                {result.name}
              </h3>
            </div>

            <div className="mt-4">
              <h4 className="text-[15px] font-semibold text-stone-900">{capitalize(offer?.value || result.name)}</h4>
              <p className="mt-1 text-sm leading-relaxed text-stone-600">{capitalize(offer?.blurb)}</p>
            </div>
          </div>

          {/* ticket perforation */}
          <div className="relative h-0" aria-hidden>
            <span className={cx(notch, "-left-3 [clip-path:inset(0_0_0_50%)] @2xl:hidden", notchClassName)} />
            <span className={cx(notch, "-right-3 [clip-path:inset(0_50%_0_0)]", notchClassName)} />
            <div className="mx-5 border-t border-dashed border-stone-200 @sm:mx-6" />
          </div>

          {/* details strip */}
          {details.length > 0 && (
            <dl className="divide-y divide-stone-100 px-5 py-2.5 @sm:px-6 @2xl:grid @2xl:grid-cols-3 @2xl:gap-4 @2xl:divide-y-0 @2xl:py-5">
              {details.map((d) => (
                <div
                  key={d.key}
                  className="flex min-w-0 items-center justify-between gap-4 py-2.5 @2xl:flex-col @2xl:items-start @2xl:justify-start @2xl:gap-1.5 @2xl:py-0"
                >
                  <dt className="flex shrink-0 items-center gap-1.5 text-[13px] text-stone-500 @2xl:text-[11px] @2xl:font-medium @2xl:uppercase @2xl:tracking-wider @2xl:text-stone-400">
                    {d.icon}
                    {d.label}
                  </dt>
                  <dd
                    title={d.title}
                    className="flex min-w-0 justify-end text-[13px] font-semibold text-stone-900 @2xl:justify-start @2xl:text-sm"
                  >
                    {d.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {/* actions */}
          {!isCatalogMode && (
            <footer className="mt-auto border-t border-stone-100 bg-stone-50 px-5 py-4 @sm:px-6 rounded-br-[19px]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClaimOffer}
                  disabled={status !== "unlocked"}
                  className={cx(
                    "inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition group",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2",
                    status === "unlocked" && "bg-stone-900 text-white hover:bg-stone-800 active:bg-stone-950",
                    status === "redeemed" && "cursor-default bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
                  )}
                >
                  {status === "unlocked" && (
                    <>
                      Redeem reward <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                  {status === "redeemed" && (
                    <>
                      <Check className="size-4" /> Redeemed
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-medium text-stone-600 ring-1 ring-inset ring-stone-200 transition hover:bg-stone-50 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  {copied ? "Copied!" : "Details"}
                </button>
              </div>

              {showQrPass && (
                <div className="mt-4 bg-white rounded-xl p-3 border border-stone-200 text-center animate-result-in shadow-sm">
                  <div className="flex items-center justify-center gap-1.5 text-[10px] font-extrabold text-emerald-700 mb-1">
                    <CheckCircle2 className="size-3.5" />
                    <span>VOUCHER READY FOR CHECKOUT</span>
                  </div>
                  <p className="text-[10px] text-stone-500 mb-2">
                    Show this pass in-store or paste code{' '}
                    <strong className="font-mono text-stone-800">{offer?.code || result.couponCode}</strong>.
                  </p>
                  <div className="py-2 px-4 bg-stone-50 rounded-lg border border-stone-200/70 inline-flex flex-col items-center">
                    <div className="flex items-center gap-[2px] h-6 opacity-70">
                      {[3, 1, 2, 1, 3, 2, 1, 1, 3, 2, 1, 2, 3, 1, 2, 1, 1, 2, 3, 1, 2].map(
                        (w, idx) => (
                          <span
                            key={idx}
                            className="bg-stone-900 h-full inline-block"
                            style={{ width: `${w * 1.5}px` }}
                          />
                        )
                      )}
                    </div>
                    <span className="font-mono text-[9px] tracking-[0.25em] text-stone-500 mt-1">
                      *{offer?.code || result.couponCode}*
                    </span>
                  </div>
                </div>
              )}
            </footer>
          )}
        </div>
      </div>
    </article>
  );

  if (isCatalogMode) return content;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/65 p-3 backdrop-blur-sm animate-result-in sm:p-5"
      onClick={onClose}
    >
      {content}
    </div>
  );
};
