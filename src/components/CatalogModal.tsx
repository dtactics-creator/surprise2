import React, { useState } from 'react';
import { Offer } from '../lib/api';
import { StoreCard } from './StoreCard';
import { MOODS } from '../utils/frameManager';
import { X, Store } from 'lucide-react';

interface CatalogModalProps {
  offers: Offer[];
  isOpen: boolean;
  onClose: () => void;
}

export const CatalogModal: React.FC<CatalogModalProps> = ({ offers, isOpen, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);

  if (!isOpen && !isClosing) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col bg-[#FAF7F2] transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'
        }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-4 sm:px-6 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-900/10 text-amber-900">
            <Store className="h-4 w-4" />
          </div>
          <h2 className="text-xl font-black tracking-wider text-stone-800 uppercase">
            Store
          </h2>
        </div>

        <button
          onClick={handleClose}
          aria-label="Close Store"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-600 transition hover:bg-stone-200 hover:text-stone-900 active:scale-95"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-12 pt-8 sm:px-6 md:px-8">
        {offers.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center opacity-60">
            <p className="font-medium text-stone-600">No offers available at this time.</p>
          </div>
        ) : (
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-items-center">
            {offers.map((offer, i) => {
              const syntheticResult = MOODS[i % MOODS.length];
              return (
                <div key={i} className="w-full max-w-sm">
                  <StoreCard
                    offer={offer}
                    result={syntheticResult}
                    isSpinning={false}
                    isOpen={true}
                    onClose={() => { }}
                    isCatalogMode={true}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
