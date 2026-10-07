import { useState, useEffect, useCallback } from 'react';
import { CoffeeCupToy } from './components/CoffeeCupToy';
import { ResultCard } from './components/ResultCard';
import { CatalogModal } from './components/CatalogModal';
import { ConfettiBurst } from './components/ConfettiBurst';
import { MoodResult, MOODS } from './utils/frameManager';
import { fidgetAudio } from './utils/audio';
import { fetchActiveOffers, fetchActiveCampaignTemplate, type CampaignTemplate, type Offer } from './lib/api';
import { useAnalyticsSession } from './hooks/useAnalyticsSession';
import { trackEvent } from './lib/analytics';
import {
  Volume2,
  VolumeX,
  RotateCw,
  Sparkles,
  Coffee,
  Store,
} from 'lucide-react';

export default function App() {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentResult, setCurrentResult] = useState<MoodResult | null>(null);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  const [isMuted, setIsMuted] = useState(fidgetAudio.isMuted);
  const [offerSequenceIndex, setOfferSequenceIndex] = useState(0);

  const [activeOffers, setActiveOffers] = useState<Offer[]>([]);
  const [template, setTemplate] = useState<CampaignTemplate | null>(null);

  useEffect(() => {
    let mounted = true;
    const domain = window.location.hostname;
    fetchActiveOffers(domain).then(fetchedOffers => {
      if (mounted) {
        setActiveOffers(fetchedOffers);
      }
    });
    fetchActiveCampaignTemplate(domain).then(t => {
      if (mounted) {
        setTemplate(t);
        if (t?.dynamic_title) {
          document.title = t.dynamic_title;
        }
      }
    });
    return () => { mounted = false; };
  }, []);

  useAnalyticsSession({
    domain: typeof window !== "undefined" ? window.location.hostname : undefined,
    campaignSetupId: template?.campaign_setup_id,
    templateId: template?.id,
  });

  // Stats for collectible faces
  const [stats, setStats] = useState<Record<number, number>>(() => {
    try {
      const saved = localStorage.getItem('coffee_cup_stats');
      return saved ? JSON.parse(saved) : { 0: 0, 1: 0, 2: 0 };
    } catch {
      return { 0: 0, 1: 0, 2: 0 };
    }
  });

  // Save stats when changed
  useEffect(() => {
    try {
      localStorage.setItem('coffee_cup_stats', JSON.stringify(stats));
    } catch {
      // Ignore
    }
  }, [stats]);

  // Audio mute toggle
  const handleToggleMute = () => {
    const muted = fidgetAudio.toggleMute();
    setIsMuted(muted);
  };

  // Spin trigger
  const handleSpinClick = useCallback(() => {
    if (isSpinning) return;
    setConfettiActive(false);

    // Select face sequentially based on offer index to ensure order
    const moodIndex = offerSequenceIndex % 3;

    // Dispatch custom event to trigger spin in CoffeeCupToy
    const event = new CustomEvent('trigger-cup-spin', {
      detail: { moodIndex: moodIndex },
    });
    window.dispatchEvent(event);
  }, [isSpinning, offerSequenceIndex]);

  // Handle spin to specific face from collection card
  const handleSelectSpecificMood = useCallback(
    (faceIndex: number) => {
      if (isSpinning) return;
      setConfettiActive(false);
      const event = new CustomEvent('trigger-cup-spin', {
        detail: { moodIndex: faceIndex },
      });
      window.dispatchEvent(event);
    },
    [isSpinning]
  );

  const handleSpinStart = () => {
    setCurrentResult(null);
    setIsOfferModalOpen(false);
  };

  const closeOfferModal = useCallback(() => setIsOfferModalOpen(false), []);

  const handleSpinComplete = (result: MoodResult) => {
    let finalResult = result;
    if (activeOffers.length > 0) {
      const offer = activeOffers[offerSequenceIndex % activeOffers.length];
      setOfferSequenceIndex((prev) => prev + 1);
      finalResult = {
        ...result,
        couponCode: offer.code,
        discountBadge: offer.value,
        offerTitle: offer.value,
        offerDetails: offer.blurb,
      };
      trackEvent({
        event_type: "reveal_shown",
        reveal_type: offer.type,
        reveal_title: offer.value,
      });
    } else {
      trackEvent({
        event_type: "reveal_shown",
        reveal_type: "static",
        reveal_title: finalResult.offerTitle,
      });
    }

    // Also track in User Actions (campaign_actions)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent('track_analytics_action', {
        detail: {
          eventType: 'popup_shown',
          metadata: { text: 'Offer Revealed', productName: finalResult.offerTitle || finalResult.discountBadge || 'Unknown Offer' }
        }
      }));
    }

    setCurrentResult(finalResult);
    setIsOfferModalOpen(true);
    setHasSpun(true);
    setConfettiActive(true);

    // Update stats
    setStats((prev) => ({
      ...prev,
      [result.faceIndex]: (prev[result.faceIndex] || 0) + 1,
    }));

    // Auto turn off confetti after 2 seconds
    setTimeout(() => {
      setConfettiActive(false);
    }, 2200);
  };

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-[#FAF7F2] text-[#2C1810] flex flex-col justify-between selection:bg-amber-200">
      {/* Confetti Celebration Burst (CSS only) */}
      <ConfettiBurst active={confettiActive} colorTheme={currentResult?.accentColor} />

      {/* TOP HEADER */}
      <header className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-5 pb-3 flex items-center justify-between z-20">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-900/10 flex items-center justify-center text-amber-900 shadow-inner">
            <Coffee className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-black tracking-wider uppercase text-stone-800">
              The Fidget Coffee Co.
            </h1>
            <p className="text-[10px] text-stone-500 font-medium">
              Rotary Mood-Switch Toy
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Store Button */}
          <button
            onClick={() => setIsCatalogOpen(true)}
            className="p-2 rounded-xl bg-white/80 hover:bg-white border border-stone-200/80 text-stone-600 hover:text-stone-900 shadow-sm transition active:scale-95 flex items-center gap-1.5 text-xs font-semibold px-3"
            title="View Store"
          >
            <Store className="w-4 h-4 text-amber-700" />
            <span className="hidden sm:inline">Store</span>
          </button>

          {/* Mute Button */}
          <button
            onClick={handleToggleMute}
            className="p-2 rounded-xl bg-white/80 hover:bg-white border border-stone-200/80 text-stone-600 hover:text-stone-900 shadow-sm transition active:scale-95"
            title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
            aria-label="Toggle Sound"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-stone-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-amber-700" />
            )}
          </button>

        </div>
      </header>

      {/* MAIN HERO CONTENT */}
      <main className="flex-1 min-h-0 flex flex-col items-center justify-center px-4 py-1 sm:py-2 max-w-3xl mx-auto w-full z-10">
        {/* Typography Hero as specified in prompt */}
        <div className="text-center mb-1 sm:mb-2 flex flex-col items-center gap-1 sm:gap-1.5">
          <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-700/80">
            <Sparkles className="w-3 h-3" />
            Fidget Keychain Edition
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-[#2D1A0E] leading-tight px-4 text-balance max-w-2xl">
            {template?.default_config?.title || "COFFEE MOOD"}
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 font-medium">
            {template?.default_config?.subtitle || "Which face will you get?"}
          </p>
        </div>

        {/* THE 3D-LOOKING PAPER COFFEE CUP TOY */}
        <div className="relative flex-1 min-h-0 w-full flex items-center justify-center py-1">
          <CoffeeCupToy
            currentFrame={currentFrame}
            setCurrentFrame={setCurrentFrame}
            isSpinning={isSpinning}
            setIsSpinning={setIsSpinning}
            onSpinComplete={handleSpinComplete}
            onSpinStart={handleSpinStart}
          />
        </div>

        {/* LARGE SPIN BUTTON */}
        <div className="mt-1 mb-2 sm:mb-3 flex flex-col items-center shrink-0">
          <button
            onClick={handleSpinClick}
            disabled={isSpinning}
            className={`
              relative px-6 py-2.5 sm:px-8 sm:py-3 rounded-full font-black text-xs sm:text-sm tracking-wider uppercase
              transition-all duration-200 select-none shadow-lg
              ${isSpinning
                ? 'bg-stone-300 text-stone-500 cursor-not-allowed shadow-none scale-95'
                : 'bg-[#3E2415] hover:bg-[#2C180B] active:bg-[#1E0F05] text-[#FDFBF7] shadow-amber-950/25 hover:shadow-xl hover:scale-105 active:scale-95 cursor-pointer ring-4 ring-amber-900/10'
              }
            `}
          >
            <span className="flex items-center gap-2.5">
              <RotateCw
                className={`w-5 h-5 ${isSpinning ? 'animate-spin text-stone-400' : 'text-amber-400'}`}
              />
              <span>
                {isSpinning
                  ? 'SPINNING...'
                  : hasSpun
                    ? 'SPIN AGAIN'
                    : 'SPIN'}
              </span>
            </span>
          </button>
        </div>

      </main>

      <ResultCard
        result={currentResult}
        offer={currentResult ? activeOffers[currentResult.faceIndex % activeOffers.length] : null}
        isSpinning={isSpinning}
        isOpen={isOfferModalOpen}
        onClose={closeOfferModal}
      />

      <CatalogModal
        offers={activeOffers}
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
      />
    </div>
  );
}
