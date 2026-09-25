import React, { useMemo } from 'react';

interface ConfettiBurstProps {
  active: boolean;
  colorTheme?: string;
}

interface Particle {
  id: number;
  tx: number;
  ty: number;
  rot: number;
  size: number;
  color: string;
  shape: 'rect' | 'circle';
  delay: number;
}

const PALETTE = [
  '#FFD700', // Gold
  '#FF5252', // Coral red
  '#26C6DA', // Teal
  '#FF4081', // Pink
  '#FFA726', // Orange
  '#7C4DFF', // Purple
  '#A7FFEB', // Mint
  '#FFFFFF', // White glint
];

export const ConfettiBurst: React.FC<ConfettiBurstProps> = ({ active, colorTheme }) => {
  const particles = useMemo(() => {
    if (!active) return [];

    const items: Particle[] = [];
    const count = 36;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 2 * Math.PI + (Math.random() * 0.4 - 0.2);
      const distance = 80 + Math.random() * 140;
      const tx = Math.cos(angle) * distance;
      // Gravity / upward bias
      const ty = Math.sin(angle) * distance * 0.85 - 25;
      const rot = (Math.random() - 0.5) * 720;
      const size = 6 + Math.random() * 7;
      const shape = Math.random() > 0.4 ? 'rect' : 'circle';
      const color = colorTheme && Math.random() > 0.5 ? colorTheme : PALETTE[i % PALETTE.length];
      const delay = Math.random() * 0.08;

      items.push({
        id: i,
        tx,
        ty,
        rot,
        size,
        color,
        shape,
        delay,
      });
    }

    return items;
  }, [active, colorTheme]);

  if (!active || particles.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center overflow-visible">
      {particles.map((p) => (
        <span
          key={p.id}
          className="animate-confetti-particle absolute"
          style={
            {
              '--tw-tx': `${p.tx}px`,
              '--tw-ty': `${p.ty}px`,
              '--tw-rot': `${p.rot}deg`,
              width: `${p.size}px`,
              height: p.shape === 'rect' ? `${p.size * 1.6}px` : `${p.size}px`,
              borderRadius: p.shape === 'circle' ? '9999px' : '2px',
              backgroundColor: p.color,
              animationDelay: `${p.delay}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
};
