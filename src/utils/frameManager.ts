/**
 * Frame Baker — turns the cute photographic cup base into 24 pre-rendered,
 * transparent 2D frames of an ultra-cute rotating fidget toy cup (15° per frame).
 *
 * No 3D engine. The photo is chroma-keyed to transparency with despill,
 * the cup silhouette is measured row-by-row, and all rotating details
 * (die-cut windows, kawaii faces, cute sleeve branding, seams) are projected
 * onto the 3D cylinder with true perspective foreshortening & parallax,
 * baked into optimized WebP blobs.
 */
import cuteCupUrl from '../assets/cute-cup-base.jpg';

export const TOTAL_FRAMES = 24;
export const FRAME_W = 600;
export const FRAME_H = 720;

export interface MoodResult {
  faceIndex: number;
  name: string;
  emoji: string;
  tagline: string;
  headline: string;
  moodDescription: string;
  themeColor: string;
  badgeBg: string;
  accentColor: string;
  targetFrame: number;
  couponCode: string;
  discountBadge: string;
  offerTitle: string;
  offerDetails: string;
  offerPerk: string;
  offerTerms: string;
}

export const MOODS: MoodResult[] = [
  {
    faceIndex: 0,
    name: 'HAPPY',
    emoji: '😊',
    tagline: 'Sweet Caramel Glow',
    headline: 'SUNNY & BEAMING',
    moodDescription:
      'Warm golden energy radiates through you today. Savor the sweet moments, spread radiant smiles, and enjoy a wonderfully balanced brew of pure optimism!',
    themeColor: '#D97706',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    accentColor: '#F59E0B',
    targetFrame: 0,
    couponCode: 'HAPPYBREW20',
    discountBadge: '20% OFF',
    offerTitle: '20% OFF + FREE SWEET PASTRY',
    offerDetails: 'Valid on any Caramel Latte, Honey Oat Macchiato, or Hot Cocoa',
    offerPerk: '🥐 Bonus: Free Butter Croissant at checkout',
    offerTerms: 'No minimum spend • Online & In-Store',
  },
  {
    faceIndex: 1,
    name: 'SURPRISED',
    emoji: '😮',
    tagline: 'Electric Espresso Spark',
    headline: 'WIDE-EYED WONDER',
    moodDescription:
      'Expect the unexpected! A delightful serendipity or sudden burst of creative excitement is heading your way. Keep your curiosity wide awake!',
    themeColor: '#EA580C',
    badgeBg: 'bg-orange-100 text-orange-900 border-orange-300',
    accentColor: '#F97316',
    targetFrame: 8,
    couponCode: 'SHOCKSHOT50',
    discountBadge: 'BOGO FREE',
    offerTitle: 'BUY 1 GET 1 FREE + MYSTERY GIFT',
    offerDetails: 'Valid on all Signature Espresso Drinks & Double-Shot Roasts',
    offerPerk: '🎁 Bonus: Free Mini Coffee Cup Fidget Keychain',
    offerTerms: 'Surprise Flash Drop • Valid for 24 hours',
  },
  {
    faceIndex: 2,
    name: 'COOL',
    emoji: '😎',
    tagline: 'Cold Brew Composure',
    headline: 'EFFORTLESSLY CHILL',
    moodDescription:
      'Smooth, unflappable, and dialed in. Nothing shakes your confidence today. Sip your brew slow and steady—you have everything totally handled.',
    themeColor: '#0D9488',
    badgeBg: 'bg-teal-100 text-teal-900 border-teal-300',
    accentColor: '#14B8A6',
    targetFrame: 16,
    couponCode: 'CHILLBEAN30',
    discountBadge: '30% OFF',
    offerTitle: '30% OFF ALL ICED & COLD BREWS',
    offerDetails: 'Valid on Nitro Cold Brew, Iced Matcha & Frappes',
    offerPerk: '🧊 Bonus: Free Large Size Upgrade + Sweet Cream Foam',
    offerTerms: 'Instant redemption • Stackable with member points',
  },
];

/* ------------------------------------------------------------------ */
/*  Geometry of the cup (derived from the photo silhouette)            */
/* ------------------------------------------------------------------ */

interface CupGeometry {
  top: number; // y of lid top
  bottom: number; // y of cup base
  radiusAt: (y: number) => number;
  centerAt: (y: number) => number;
}

interface BaseAsset {
  canvas: HTMLCanvasElement;
  geo: CupGeometry;
}

// Fractions of cup height measured on cute-cup-base.jpg
const SLEEVE_TOP_F = 0.40;
const SLEEVE_BOT_F = 0.74;
const WINDOW_F = 0.57;
// Vertical foreshortening tilt angle
const TILT = 0.088;

const DEG = Math.PI / 180;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Chroma-key the green screen, scale the cup into the frame, measure silhouette. */
async function prepareBase(): Promise<BaseAsset | null> {
  try {
    const img = await loadImage(cuteCupUrl);
    const sw = img.naturalWidth;
    const sh = img.naturalHeight;
    const src = document.createElement('canvas');
    src.width = sw;
    src.height = sh;
    const sctx = src.getContext('2d', { willReadFrequently: true });
    if (!sctx) return null;
    sctx.drawImage(img, 0, 0);
    const data = sctx.getImageData(0, 0, sw, sh);
    const px = data.data;

    let minX = sw, maxX = 0, minY = sh, maxY = 0;

    for (let i = 0; i < px.length; i += 4) {
      const r = px[i], g = px[i + 1], b = px[i + 2];
      const maxRB = Math.max(r, b);
      const isGreen = g > maxRB + 20 && g > 75 && (g / (maxRB + 1)) > 1.15;
      const isFringeGreen = g > maxRB + 8 && g > 65;

      if (isGreen) {
        px[i + 3] = 0;
      } else if (isFringeGreen) {
        const factor = (g - (maxRB + 8)) / 16;
        px[i + 3] = Math.round(255 * Math.max(0, 1 - factor));
        // Despill green fringe to neutral warm edge
        px[i + 1] = Math.min(px[i + 1], Math.round((r + b) / 2));
      } else {
        // Despill any subtle bounce on edge pixels
        if (g > maxRB) {
          px[i + 1] = maxRB;
        }
        if (px[i + 3] > 100) {
          const x = (i / 4) % sw;
          const y = Math.floor(i / 4 / sw);
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX <= minX || maxY <= minY) return null;
    sctx.putImageData(data, 0, 0);

    // Place the cup nicely inside the 600x720 canvas
    const bw = maxX - minX + 1;
    const bh = maxY - minY + 1;
    const targetH = 550;
    const scale = targetH / bh;
    const targetW = bw * scale;
    const dx = (FRAME_W - targetW) / 2;
    const dy = 65;

    const placed = document.createElement('canvas');
    placed.width = FRAME_W;
    placed.height = FRAME_H;
    const pctx = placed.getContext('2d', { willReadFrequently: true });
    if (!pctx) return null;
    pctx.imageSmoothingEnabled = true;
    pctx.imageSmoothingQuality = 'high';
    pctx.drawImage(src, minX, minY, bw, bh, dx, dy, targetW, targetH);

    // Row silhouette profile
    const pd = pctx.getImageData(0, 0, FRAME_W, FRAME_H).data;
    const left = new Float32Array(FRAME_H);
    const right = new Float32Array(FRAME_H);
    for (let y = 0; y < FRAME_H; y++) {
      let l = -1, r = -1;
      for (let x = 0; x < FRAME_W; x++) {
        if (pd[(y * FRAME_W + x) * 4 + 3] > 90) {
          if (l < 0) l = x;
          r = x;
        }
      }
      left[y] = l;
      right[y] = r;
    }
    const top = dy;
    const bottom = dy + targetH;
    const clampY = (y: number) => Math.max(top + 2, Math.min(bottom - 2, Math.round(y)));
    const radiusAt = (y: number) => {
      const yy = clampY(y);
      if (left[yy] < 0) return targetW / 2;
      return (right[yy] - left[yy]) / 2;
    };
    const centerAt = (y: number) => {
      const yy = clampY(y);
      if (left[yy] < 0) return FRAME_W / 2;
      return (right[yy] + left[yy]) / 2;
    };

    return { canvas: placed, geo: { top, bottom, radiusAt, centerAt } };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Procedural fallback body if image fails to load                   */
/* ------------------------------------------------------------------ */

function drawFallbackBody(ctx: CanvasRenderingContext2D): CupGeometry {
  const cx = FRAME_W / 2;
  const top = 70, bottom = 620;
  const rTop = 135, rBot = 95;
  const radiusAt = (y: number) => {
    const t = (Math.max(top, Math.min(bottom, y)) - top) / (bottom - top);
    return rTop - (rTop - rBot) * t;
  };
  const centerAt = () => cx;

  // Cute ivory-cream body
  const bodyTop = top + 45;
  const g = ctx.createLinearGradient(cx - rTop, 0, cx + rTop, 0);
  g.addColorStop(0, '#e5dcd0');
  g.addColorStop(0.3, '#fbf8f3');
  g.addColorStop(0.6, '#fbf8f3');
  g.addColorStop(0.85, '#ede4d8');
  g.addColorStop(1, '#d8cdbe');
  ctx.beginPath();
  ctx.moveTo(cx - radiusAt(bodyTop), bodyTop);
  ctx.lineTo(cx - rBot, bottom);
  ctx.ellipse(cx, bottom, rBot, rBot * TILT, 0, Math.PI, 0, true);
  ctx.lineTo(cx + radiusAt(bodyTop), bodyTop);
  ctx.closePath();
  ctx.fillStyle = g;
  ctx.fill();

  // Cute pastel kraft sleeve
  const sTop = top + (bottom - top) * SLEEVE_TOP_F;
  const sBot = top + (bottom - top) * SLEEVE_BOT_F;
  const sg = ctx.createLinearGradient(cx - rTop, 0, cx + rTop, 0);
  sg.addColorStop(0, '#be9d78');
  sg.addColorStop(0.25, '#dfc5a6');
  sg.addColorStop(0.5, '#edd9bf');
  sg.addColorStop(0.78, '#d6ba99');
  sg.addColorStop(1, '#a8855e');
  ctx.beginPath();
  ctx.moveTo(cx - radiusAt(sTop) - 2, sTop);
  ctx.lineTo(cx - radiusAt(sBot) - 2, sBot);
  ctx.ellipse(cx, sBot, radiusAt(sBot) + 2, (radiusAt(sBot) + 2) * TILT, 0, Math.PI, 0, true);
  ctx.lineTo(cx + radiusAt(sTop) + 2, sTop);
  ctx.ellipse(cx, sTop, radiusAt(sTop) + 2, (radiusAt(sTop) + 2) * TILT, 0, 0, Math.PI, false);
  ctx.closePath();
  ctx.fillStyle = sg;
  ctx.fill();

  // Cute dusty rose pastel lid
  const lg = ctx.createLinearGradient(cx - rTop, 0, cx + rTop, 0);
  lg.addColorStop(0, '#aa6f7a');
  lg.addColorStop(0.3, '#d89aa5');
  lg.addColorStop(0.55, '#e4adb6');
  lg.addColorStop(0.8, '#cb8c97');
  lg.addColorStop(1, '#985e68');
  ctx.beginPath();
  ctx.moveTo(cx - rTop - 8, bodyTop);
  ctx.lineTo(cx - rTop - 8, top + 20);
  ctx.ellipse(cx, top + 20, rTop + 8, (rTop + 8) * 0.14, 0, Math.PI, 0, false);
  ctx.lineTo(cx + rTop + 8, bodyTop);
  ctx.ellipse(cx, bodyTop, rTop + 8, (rTop + 8) * 0.14, 0, 0, Math.PI, false);
  ctx.closePath();
  ctx.fillStyle = lg;
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, top + 20, rTop + 8, (rTop + 8) * 0.14, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#d89aa5';
  ctx.fill();

  return { top, bottom, radiusAt, centerAt };
}

/* ------------------------------------------------------------------ */
/*  Ultra-Cute Kawaii Face Artwork (Unit space: radius 45)             */
/* ------------------------------------------------------------------ */

function drawCuteFace(ctx: CanvasRenderingContext2D, index: number) {
  const dark = '#2D1606';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (index === 0) {
    // 😊 Face 1: Kawaii Happy Smile
    // Rosy blushing cheeks
    const blushG = ctx.createRadialGradient(-20, 7, 1, -20, 7, 10);
    blushG.addColorStop(0, 'rgba(255,75,110,0.85)');
    blushG.addColorStop(1, 'rgba(255,75,110,0)');
    ctx.fillStyle = blushG;
    ctx.beginPath(); ctx.arc(-20, 7, 10, 0, Math.PI * 2); ctx.fill();

    const blushG2 = ctx.createRadialGradient(20, 7, 1, 20, 7, 10);
    blushG2.addColorStop(0, 'rgba(255,75,110,0.85)');
    blushG2.addColorStop(1, 'rgba(255,75,110,0)');
    ctx.fillStyle = blushG2;
    ctx.beginPath(); ctx.arc(20, 7, 10, 0, Math.PI * 2); ctx.fill();

    // Cute blush twinkle dashes
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-23, 6); ctx.lineTo(-17, 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(17, 6); ctx.lineTo(23, 8); ctx.stroke();

    // Cheerful curved smiling eyes
    ctx.strokeStyle = dark;
    ctx.lineWidth = 4.8;
    ctx.beginPath(); ctx.moveTo(-25, -2); ctx.quadraticCurveTo(-17, -18, -9, -2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(9, -2); ctx.quadraticCurveTo(17, -18, 25, -2); ctx.stroke();

    // Sweet beaming open grin with cute pink tongue
    ctx.fillStyle = dark;
    ctx.beginPath(); ctx.moveTo(-18, 7); ctx.quadraticCurveTo(0, 28, 18, 7); ctx.closePath(); ctx.fill();

    // Tongue
    ctx.save();
    ctx.beginPath(); ctx.moveTo(-18, 7); ctx.quadraticCurveTo(0, 28, 18, 7); ctx.closePath(); ctx.clip();
    ctx.fillStyle = '#FF5388';
    ctx.beginPath(); ctx.ellipse(0, 20, 10, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Cute sparkle star top-right
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(25, -18); ctx.lineTo(27, -13); ctx.lineTo(32, -11); ctx.lineTo(27, -9);
    ctx.lineTo(25, -4); ctx.lineTo(23, -9); ctx.lineTo(18, -11); ctx.lineTo(23, -13);
    ctx.closePath(); ctx.fill();

    // Tiny heart sparkle
    ctx.fillStyle = '#FF5388';
    ctx.beginPath();
    ctx.arc(-26, -14, 2.5, 0, Math.PI * 2); ctx.fill();
  } else if (index === 1) {
    // 😮 Face 2: Kawaii Shock / Surprised
    // Cute blush
    const blushG = ctx.createRadialGradient(-23, 9, 1, -23, 9, 9);
    blushG.addColorStop(0, 'rgba(255,60,60,0.75)');
    blushG.addColorStop(1, 'rgba(255,60,60,0)');
    ctx.fillStyle = blushG;
    ctx.beginPath(); ctx.arc(-23, 9, 9, 0, Math.PI * 2); ctx.fill();
    const blushG2 = ctx.createRadialGradient(23, 9, 1, 23, 9, 9);
    blushG2.addColorStop(0, 'rgba(255,60,60,0.75)');
    blushG2.addColorStop(1, 'rgba(255,60,60,0)');
    ctx.fillStyle = blushG2;
    ctx.beginPath(); ctx.arc(23, 9, 9, 0, Math.PI * 2); ctx.fill();

    // Arched raised brows
    ctx.strokeStyle = dark;
    ctx.lineWidth = 3.2;
    ctx.beginPath(); ctx.moveTo(-24, -20); ctx.quadraticCurveTo(-17, -28, -10, -20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(10, -20); ctx.quadraticCurveTo(17, -28, 24, -20); ctx.stroke();

    // Big shiny anime eyes
    ctx.fillStyle = dark;
    ctx.beginPath(); ctx.ellipse(-17, -5, 8.5, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(17, -5, 8.5, 11, 0, 0, Math.PI * 2); ctx.fill();

    // Large main eye catchlights
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(-14.5, -9, 3.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(14.5, -9, 3.8, 0, Math.PI * 2); ctx.fill();

    // Secondary cute gleam dots
    ctx.beginPath(); ctx.arc(-19, -3, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-15, 0, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(19, -3, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(15, 0, 1.2, 0, Math.PI * 2); ctx.fill();

    // Adorable round open "O" mouth
    ctx.fillStyle = dark;
    ctx.beginPath(); ctx.ellipse(0, 15, 8, 11.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FF5388';
    ctx.beginPath(); ctx.ellipse(0, 18, 5, 7, 0, 0, Math.PI * 2); ctx.fill();

    // Cute sweatdrop sparkle
    ctx.fillStyle = '#80D8FF';
    ctx.beginPath();
    ctx.moveTo(27, -22); ctx.quadraticCurveTo(30, -18, 28, -15);
    ctx.arc(26.5, -15, 1.5, 0, Math.PI);
    ctx.quadraticCurveTo(24, -18, 27, -22); ctx.fill();
  } else {
    // 😎 Face 3: Kawaii Cool Sunglasses
    // Cute subtle blush under glasses
    ctx.fillStyle = 'rgba(0,180,216,0.3)';
    ctx.beginPath(); ctx.ellipse(-20, 10, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(20, 10, 8, 5, 0, 0, Math.PI * 2); ctx.fill();

    // Confident playful smirk
    ctx.strokeStyle = '#181818';
    ctx.lineWidth = 4.4;
    ctx.beginPath(); ctx.moveTo(-11, 15); ctx.quadraticCurveTo(4, 18, 18, 9); ctx.stroke();

    // Retro rounded sunglasses frames
    ctx.strokeStyle = '#101010';
    ctx.lineWidth = 3.6;
    ctx.beginPath(); ctx.moveTo(-6, -6); ctx.lineTo(6, -6); ctx.stroke();

    // Side temple bars
    ctx.beginPath(); ctx.moveTo(-28, -8); ctx.lineTo(-37, -13); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(28, -8); ctx.lineTo(37, -13); ctx.stroke();

    // Glossy dark lenses
    const drawLens = (x: number) => {
      ctx.fillStyle = '#181A24';
      ctx.strokeStyle = '#0C0D12';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') ctx.roundRect(x, -17, 24, 20, 7);
      else ctx.rect(x, -17, 24, 20);
      ctx.fill(); ctx.stroke();
    };
    drawLens(-29);
    drawLens(5);

    // Multi-angle white lens reflection glints
    ctx.strokeStyle = 'rgba(255,255,255,0.92)';
    ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(-24, -14); ctx.lineTo(-17, 1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(10, -14); ctx.lineTo(17, 1); ctx.stroke();

    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-15, -14); ctx.lineTo(-10, -5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(19, -14); ctx.lineTo(24, -5); ctx.stroke();

    // Sparkle star on frame corner
    ctx.fillStyle = '#FFE082';
    ctx.beginPath();
    ctx.moveTo(31, -21); ctx.lineTo(32.5, -18); ctx.lineTo(36, -17); ctx.lineTo(33, -15);
    ctx.lineTo(34, -11); ctx.lineTo(31, -13); ctx.lineTo(28, -11); ctx.lineTo(29, -15);
    ctx.lineTo(26, -17); ctx.lineTo(29.5, -18);
    ctx.closePath(); ctx.fill();
  }
}

const FACE_BADGE_COLORS = [
  ['#FFFDE7', '#FFD54F', '#FFA000', '#7E4200'], // Happy Sunny Gold
  ['#FBE9E7', '#FF8A65', '#E64A19', '#6F1A00'], // Surprised Coral
  ['#E0F7FA', '#26C6DA', '#00838F', '#00363A'], // Cool Cyan/Teal
];

/* ------------------------------------------------------------------ */
/*  Projected 3D Detail Helpers                                        */
/* ------------------------------------------------------------------ */

function ringY(yFront: number, R: number, cosT: number) {
  return yFront - R * TILT * (1 - cosT);
}

function drawWindow(
  ctx: CanvasRenderingContext2D,
  geo: CupGeometry,
  faceIndex: number,
  thetaDeg: number,
) {
  const cosT = Math.cos(thetaDeg * DEG);
  const sinT = Math.sin(thetaDeg * DEG);
  if (cosT < 0.05) return;

  const yFront = geo.top + (geo.bottom - geo.top) * WINDOW_F;
  const R = geo.radiusAt(yFront);
  const cx = geo.centerAt(yFront);
  const x = cx + R * sinT * 0.98;
  const y = ringY(yFront, R, cosT);
  const r = 44;
  const sx = Math.max(0.04, cosT);
  // Parallax: face sits 12px recessed behind sleeve window
  const depth = 12;
  const parallax = (-depth * sinT) / sx;
  const [hi, mid, lo, edge] = FACE_BADGE_COLORS[faceIndex];

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sx, 1);

  // Soft ambient occlusion shadow cast around die-cut window onto the sleeve
  const ao = ctx.createRadialGradient(0, 0, r, 0, 0, r + 16);
  ao.addColorStop(0, 'rgba(45,22,8,0.48)');
  ao.addColorStop(0.5, 'rgba(45,22,8,0.18)');
  ao.addColorStop(1, 'rgba(45,22,8,0)');
  ctx.fillStyle = ao;
  ctx.beginPath(); ctx.arc(0, 0, r + 16, 0, Math.PI * 2); ctx.fill();

  // Premium beveled golden/stitched window rim ring
  ctx.lineWidth = 3.2;
  ctx.strokeStyle = 'rgba(255,245,230,0.85)';
  ctx.beginPath(); ctx.arc(-1, -1, r + 2, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(80,45,20,0.6)';
  ctx.beginPath(); ctx.arc(1.2, 1.2, r + 2, 0, Math.PI * 2); ctx.stroke();

  // Deep cavity inside
  ctx.fillStyle = '#150A04';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();

  // Recessed Rotating Face Drum (Clipped by the die-cut circle)
  ctx.save();
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.clip();

  // 3D Sphere Badge with true parallax shift
  ctx.save();
  ctx.translate(parallax, 1.5);
  const rf = r + 7;
  const badge = ctx.createRadialGradient(-rf * 0.35, -rf * 0.38, rf * 0.05, 0, 0, rf);
  badge.addColorStop(0, hi);
  badge.addColorStop(0.28, mid);
  badge.addColorStop(0.82, lo);
  badge.addColorStop(1, edge);
  ctx.fillStyle = badge;
  ctx.beginPath(); ctx.arc(0, 0, rf, 0, Math.PI * 2); ctx.fill();

  // Draw the kawaii face expression
  drawCuteFace(ctx, faceIndex);
  ctx.restore();

  // Inner cavity shadow cast by paper wall onto recessed face
  const innerShadow = ctx.createRadialGradient(0, 0, r * 0.6, 0, 0, r);
  innerShadow.addColorStop(0, 'rgba(0,0,0,0)');
  innerShadow.addColorStop(0.7, 'rgba(0,0,0,0.22)');
  innerShadow.addColorStop(1, 'rgba(0,0,0,0.68)');
  ctx.fillStyle = innerShadow;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();

  // Top lip shadow from studio key light above
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = 8;
  ctx.beginPath(); ctx.arc(0, 3, r + 1, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();

  // Clear acrylic crystal dome bubble lens reflections
  ctx.fillStyle = 'rgba(255,255,255,0.32)';
  ctx.beginPath(); ctx.ellipse(-r * 0.32, -r * 0.42, r * 0.45, r * 0.22, -0.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath(); ctx.arc(-r * 0.46, -r * 0.5, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  ctx.restore();
}

/** Cute curved typography and icons printed on the sleeve */
function drawCurvedText(
  ctx: CanvasRenderingContext2D,
  geo: CupGeometry,
  text: string,
  centerAngle: number,
  rot: number,
  yFront: number,
  fontPx: number,
  color: string,
) {
  const R = geo.radiusAt(yFront);
  const cx = geo.centerAt(yFront);
  ctx.save();
  ctx.font = `800 ${fontPx}px "Plus Jakarta Sans", Inter, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  const widths = [...text].map((c) => ctx.measureText(c).width + fontPx * 0.22);
  const total = widths.reduce((a, b) => a + b, 0);
  let cursor = -total / 2;
  [...text].forEach((ch, i) => {
    const mid = cursor + widths[i] / 2;
    cursor += widths[i];
    if (ch === ' ') return;
    const phi = centerAngle + (mid / R) / DEG;
    const theta = (phi - rot) * DEG;
    const cosT = Math.cos(theta);
    if (cosT < 0.08) return;
    const x = cx + R * Math.sin(theta) * 0.98;
    const y = ringY(yFront, R, cosT);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(cosT, 1);
    ctx.globalAlpha = 0.55 + 0.45 * cosT;
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  });
  ctx.restore();
}

/** Cute mini coffee cup doodle on sleeve between windows */
function drawCuteCoffeeIcon(ctx: CanvasRenderingContext2D, geo: CupGeometry, angle: number, rot: number, yFront: number) {
  const theta = (angle - rot) * DEG;
  const cosT = Math.cos(theta);
  if (cosT < 0.08) return;
  const R = geo.radiusAt(yFront);
  const x = geo.centerAt(yFront) + R * Math.sin(theta) * 0.98;
  const y = ringY(yFront, R, cosT);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(cosT, 1);
  ctx.globalAlpha = 0.65 + 0.35 * cosT;

  // Cute mini coffee mug
  ctx.fillStyle = 'rgba(65,35,15,0.85)';
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') ctx.roundRect(-8, -5, 16, 13, [1, 1, 6, 6]);
  else ctx.rect(-8, -5, 16, 13);
  ctx.fill();

  // Cute handle
  ctx.strokeStyle = 'rgba(65,35,15,0.85)';
  ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.arc(9, 1, 4, -Math.PI / 2, Math.PI / 2); ctx.stroke();

  // Cute heart on mug
  ctx.fillStyle = '#FFE0B2';
  ctx.beginPath();
  ctx.arc(-2, -0.5, 2, 0, Math.PI * 2);
  ctx.arc(2, -0.5, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-4, 0); ctx.lineTo(0, 4); ctx.lineTo(4, 0); ctx.closePath();
  ctx.fill();

  // Steam swirls
  ctx.strokeStyle = 'rgba(120,70,30,0.6)';
  ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(-3, -8); ctx.quadraticCurveTo(-1, -11, -3, -14); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(3, -8); ctx.quadraticCurveTo(5, -11, 3, -14); ctx.stroke();

  ctx.restore();
}

function drawSeam(
  ctx: CanvasRenderingContext2D,
  geo: CupGeometry,
  angle: number,
  rot: number,
  y0: number,
  y1: number,
) {
  const theta = (angle - rot) * DEG;
  const cosT = Math.cos(theta);
  if (cosT < 0.05) return;
  const sinT = Math.sin(theta);
  const xa = geo.centerAt(y0) + geo.radiusAt(y0) * sinT * 0.98;
  const xb = geo.centerAt(y1) + geo.radiusAt(y1) * sinT * 0.98;
  ctx.save();
  ctx.globalAlpha = 0.28 + 0.4 * cosT;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(60,30,10,0.6)';
  ctx.lineWidth = 2.4 * Math.max(0.35, cosT);
  ctx.beginPath(); ctx.moveTo(xa, y0 + 4); ctx.lineTo(xb, y1 - 4); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,245,230,0.65)';
  ctx.lineWidth = 1.4 * Math.max(0.35, cosT);
  ctx.beginPath(); ctx.moveTo(xa + 2, y0 + 4); ctx.lineTo(xb + 2, y1 - 4); ctx.stroke();
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/*  Frame Renderer                                                     */
/* ------------------------------------------------------------------ */

function renderFrame(ctx: CanvasRenderingContext2D, frameIndex: number, base: BaseAsset | null) {
  ctx.clearRect(0, 0, FRAME_W, FRAME_H);
  const rot = frameIndex * (360 / TOTAL_FRAMES);

  let geo: CupGeometry;
  const tmpGeo = base ? base.geo : null;
  const bottom = tmpGeo ? tmpGeo.bottom : 620;
  const rBot = tmpGeo ? tmpGeo.radiusAt(bottom - 6) : 95;
  const cxBot = tmpGeo ? tmpGeo.centerAt(bottom - 6) : FRAME_W / 2;

  // Soft warm studio contact shadow under cup
  ctx.save();
  ctx.translate(cxBot + 4, bottom - rBot * TILT + 8);
  ctx.scale(1, 0.35);
  const sh = ctx.createRadialGradient(0, 0, rBot * 0.2, 0, 0, rBot * 1.8);
  sh.addColorStop(0, 'rgba(45,22,10,0.55)');
  sh.addColorStop(0.4, 'rgba(55,28,14,0.22)');
  sh.addColorStop(1, 'rgba(65,35,18,0)');
  ctx.fillStyle = sh;
  ctx.beginPath(); ctx.arc(0, 0, rBot * 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  if (base) {
    ctx.drawImage(base.canvas, 0, 0);
    geo = base.geo;
  } else {
    geo = drawFallbackBody(ctx);
  }

  const H = geo.bottom - geo.top;
  const sleeveTop = geo.top + H * SLEEVE_TOP_F;
  const sleeveBot = geo.top + H * SLEEVE_BOT_F;

  // Sleeve cute branding (multiply blend = looks printed directly on kraft cardstock)
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  const ink = 'rgba(56,30,12,0.95)';
  const titles = ['★ SWEET MOOD ★', '★ SHOCK BREW ★', '★ CHILL BEAN ★'];
  for (let i = 0; i < 3; i++) {
    const a = i * 120;
    drawCurvedText(ctx, geo, titles[i], a, rot, sleeveTop + H * 0.052, 9.5, ink);
    drawCurvedText(ctx, geo, 'THE FIDGET COFFEE CO.', a, rot, sleeveBot - H * 0.045, 8.2, ink);
    drawCuteCoffeeIcon(ctx, geo, a + 60, rot, (sleeveTop + sleeveBot) / 2);
    drawCurvedText(ctx, geo, `★ 0${i + 1} ★`, a + 60, rot, sleeveTop + H * 0.052, 9, ink);
  }
  ctx.restore();

  // Rotating glued paper seams removed by user request

  // Recessed windows and kawaii collectible faces (back-to-front sorting)
  const order = [0, 1, 2]
    .map((i) => ({ i, theta: i * 120 - rot }))
    .sort((a, b) => Math.cos(a.theta * DEG) - Math.cos(b.theta * DEG));
  for (const w of order) drawWindow(ctx, geo, w.i, w.theta);
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

let cache: string[] | null = null;
let inflight: Promise<string[]> | null = null;
const frameListeners = new Set<(index: number, url: string) => void>();

export function onFrameReady(cb: (index: number, url: string) => void) {
  frameListeners.add(cb);
  if (cache) cache.forEach((u, i) => u && cb(i, u));
  return () => {
    frameListeners.delete(cb);
  };
}

function canvasToUrl(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(URL.createObjectURL(blob));
          else resolve(canvas.toDataURL('image/png'));
        },
        'image/webp',
        0.92,
      );
    } catch {
      resolve(canvas.toDataURL('image/png'));
    }
  });
}

const nextTick = () => new Promise<void>((r) => setTimeout(r, 0));

export function preloadAllFrames(onProgress?: (p: number) => void): Promise<string[]> {
  if (cache) {
    onProgress?.(1);
    return Promise.resolve(cache);
  }
  if (inflight) return inflight;

  inflight = (async () => {
    const urls: string[] = new Array(TOTAL_FRAMES).fill('');
    const base = await prepareBase();

    try {
      await Promise.race([
        (document as Document & { fonts?: { load: (f: string) => Promise<unknown> } }).fonts?.load(
          '800 11px "Plus Jakarta Sans"',
        ),
        new Promise((r) => setTimeout(r, 900)),
      ]);
    } catch {
      /* ignore */
    }

    const canvas = document.createElement('canvas');
    canvas.width = FRAME_W;
    canvas.height = FRAME_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return urls;

    const order = [0, 8, 16, ...Array.from({ length: TOTAL_FRAMES }, (_, i) => i).filter((i) => i % 8 !== 0)];
    let done = 0;
    for (const i of order) {
      renderFrame(ctx, i, base);
      const url = await canvasToUrl(canvas);
      urls[i] = url;
      const img = new Image();
      img.src = url;
      frameListeners.forEach((cb) => cb(i, url));
      done++;
      onProgress?.(done / TOTAL_FRAMES);
      await nextTick();
    }

    cache = urls;
    return urls;
  })();

  return inflight;
}
