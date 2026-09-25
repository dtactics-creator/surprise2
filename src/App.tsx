import { useState, useEffect, useCallback } from 'react';
import { CoffeeCupToy } from './components/CoffeeCupToy';
import { ResultCard } from './components/ResultCard';
import { MoodCollection } from './components/MoodCollection';
import { TechInfoModal } from './components/TechInfoModal';
import { FidgetControls } from './components/FidgetControls';
import { ConfettiBurst } from './components/ConfettiBurst';
import { MoodResult, MOODS } from './utils/frameManager';
import { fidgetAudio } from './utils/audio';
import {
  Volume2,
  VolumeX,
  Info,
  RotateCw,
  Sparkles,
  Coffee,
  TicketPercent,
  ChevronRight,
} from 'lucide-react';

export default function App() {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentResult, setCurrentResult] = useState<MoodResult | null>(null);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  const [isMuted, setIsMuted] = useState(fidgetAudio.isMuted);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

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

    // Randomly select 1 of 3 faces:
    // 0: Happy 😊, 1: Surprised 😮, 2: Cool 😎
    const randomMoodIndex = Math.floor(Math.random() * 3);

    // Dispatch custom event to trigger spin in CoffeeCupToy
    const event = new CustomEvent('trigger-cup-spin', {
      detail: { moodIndex: randomMoodIndex },
    });
    window.dispatchEvent(event);
  }, [isSpinning]);

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
    setCurrentResult(result);
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
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C1810] flex flex-col justify-between selection:bg-amber-200">
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

          {/* Info Modal Button */}
          <button
            onClick={() => setIsInfoModalOpen(true)}
            className="p-2 rounded-xl bg-white/80 hover:bg-white border border-stone-200/80 text-stone-600 hover:text-stone-900 shadow-sm transition active:scale-95 flex items-center gap-1.5 text-xs font-semibold px-3"
            title="How it works (Zero 3D engine)"
          >
            <Info className="w-4 h-4 text-amber-700" />
            <span className="hidden sm:inline">How It Works</span>
          </button>
        </div>
      </header>

      {/* MAIN HERO CONTENT */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-3 sm:py-6 max-w-xl mx-auto w-full z-10">
        {/* Typography Hero as specified in prompt */}
        <div className="text-center mb-2 sm:mb-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-amber-700/80 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Fidget Keychain Edition
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#2D1A0E]">
            COFFEE MOOD
          </h2>
          <p className="text-sm sm:text-base text-stone-500 font-medium mt-1">
            Which face will you get?
          </p>
        </div>

        {/* THE 3D-LOOKING PAPER COFFEE CUP TOY */}
        <div className="relative my-1 sm:my-2 flex items-center justify-center">
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
        <div className="mt-3 sm:mt-5 flex flex-col items-center gap-2">
          <button
            onClick={handleSpinClick}
            disabled={isSpinning}
            className={`
              relative px-9 py-3.5 sm:px-11 sm:py-4 rounded-full font-black text-base sm:text-lg tracking-wider uppercase
              transition-all duration-200 select-none shadow-lg
              ${
                isSpinning
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

        {/* Compact result prompt; the full coupon is shown in a modal. */}
        <div className="w-full mt-4 min-h-[76px] flex items-center justify-center">
          {currentResult ? (
            <div className="animate-result-in text-center">
              <p className="text-xs font-medium text-stone-500 mb-2">
                {currentResult.emoji} {currentResult.name} mood unlocked
              </p>
              <button
                type="button"
                onClick={() => setIsOfferModalOpen(true)}
                className="group inline-flex items-center gap-2 rounded-full bg-white border border-amber-900/15 px-4 py-2 text-sm font-bold text-[#3E2415] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
              >
                <TicketPercent className="h-4 w-4 text-amber-700" />
                <span>View {currentResult.discountBadge} reward</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          ) : (
            <p className="text-stone-500 text-sm font-medium flex items-center gap-2 opacity-70">
              <Coffee className="w-4 h-4 text-amber-600" />
              <span>Your mood and coffee reward await...</span>
            </p>
          )}
        </div>

        {/* MANUAL 360 FIDGET SCRUBBER */}
        <FidgetControls
          currentFrame={currentFrame}
          onSetFrame={(frame) => {
            setCurrentFrame(frame);
            // Check if settled on one of the 3 faces
            const face = MOODS.find((m) => m.targetFrame === frame);
            if (face) {
              setCurrentResult(face);
            }
          }}
          isSpinning={isSpinning}
        />

        {/* COLLECTIBLE FACES TRACKER */}
        <MoodCollection
          stats={stats}
          onSelectMood={handleSelectSpecificMood}
          activeFaceIndex={currentResult?.faceIndex ?? null}
          isSpinning={isSpinning}
        />
      </main>

      {/* FOOTER */}
      <footer className="w-full max-w-4xl mx-auto px-4 py-4 text-center text-xs text-stone-400 border-t border-stone-200/60 z-10 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="flex items-center justify-center gap-1.5 font-medium">
          <span>3D appearance + 2D animation = extremely fast loading.</span>
        </p>
        <p className="text-[11px] text-stone-400">
          Pure 24-frame 2D image sequence • Zero Three.js/WebGL
        </p>
      </footer>

      {/* Behind The Illusion Modal */}
      <TechInfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        currentFrame={currentFrame}
      />

      <ResultCard
        result={currentResult}
        isSpinning={isSpinning}
        isOpen={isOfferModalOpen}
        onClose={closeOfferModal}
      />
    </div>
  );
}
