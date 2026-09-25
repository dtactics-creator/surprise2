/**
 * Procedural Web Audio Sound Generator for the Fidget Cup Toy
 * Zero external audio files required, runs with 0ms latency.
 */

class FidgetAudioManager {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;

  constructor() {
    // Read user mute preference from localStorage if available
    try {
      const saved = localStorage.getItem('coffee_cup_muted');
      if (saved !== null) {
        this.isMuted = saved === 'true';
      }
    } catch {
      // Ignore
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('coffee_cup_muted', String(this.isMuted));
    } catch {
      // Ignore
    }
    return this.isMuted;
  }

  /**
   * Crisp tactile mechanical ratchet click sound.
   * Played on each frame transition or fidget drag step.
   */
  public playClick(intensity: number = 1.0, pitchShift: number = 0) {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Slightly randomize frequency for organic mechanical feel
      const randomPitch = 1 + (Math.random() * 0.12 - 0.06) + pitchShift;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1150 * randomPitch, t);
      osc.frequency.exponentialRampToValueAtTime(320 * randomPitch, t + 0.025);

      // Noise burst for mechanical plastic snap
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(800, t);

      // Tight exponential envelope
      const vol = Math.min(0.28, 0.22 * intensity);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.028);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.03);
    } catch {
      // Audio errors are ignored gracefully
    }
  }

  /**
   * Settling mechanical double-click detent.
   */
  public playSettle() {
    if (this.isMuted) return;
    this.playClick(1.2, -0.15);
    setTimeout(() => {
      this.playClick(1.4, 0.1);
    }, 45);
  }

  /**
   * Triumphant melodic chime when settling on a face.
   */
  public playMoodChime(moodIndex: number) {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const ctx = this.ctx;
      const t = ctx.currentTime;

      // Note chords based on mood:
      // Happy (0): Sunny C Major (C5, E5, G5, C6)
      // Surprised (1): Bright rising arpeggio (D5, G5, B5, E6)
      // Cool (2): Mellow jazz seventh (Eb5, G5, Bb5, D6)
      const chords = [
        [523.25, 659.25, 783.99, 1046.5], // C5, E5, G5, C6
        [587.33, 783.99, 987.77, 1318.5], // D5, G5, B5, E6
        [622.25, 783.99, 932.33, 1174.6], // Eb5, G5, Bb5, D6
      ];

      const notes = chords[moodIndex] || chords[0];

      notes.forEach((freq, idx) => {
        const noteTime = t + idx * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.0001, noteTime);
        gain.gain.linearRampToValueAtTime(0.18, noteTime + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.55);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.6);
      });
    } catch {
      // Audio errors ignored gracefully
    }
  }
}

export const fidgetAudio = new FidgetAudioManager();
