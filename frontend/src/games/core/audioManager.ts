import { useSettingsStore } from '@/stores/settings';

export type GameMusicTheme = 'dash' | 'adventure' | 'city' | 'puzzle' | 'simulator';

interface ThemeTrack {
  tempoMs: number;
  wave: OscillatorType;
  bassWave: OscillatorType;
  melody: (number | null)[];
  bass: (number | null)[];
}

const THEMES: Record<GameMusicTheme, ThemeTrack> = {
  // Fast, energetic arcade runner synthwave
  dash: {
    tempoMs: 200,
    wave: 'triangle',
    bassWave: 'sawtooth',
    melody: [523.25, 659.25, 783.99, 659.25, 880, 783.99, 659.25, 587.33, 523.25, 659.25, 783.99, 987.77, 880, 783.99, 659.25, null],
    bass: [130.81, null, 130.81, null, 174.61, null, 174.61, null, 196.0, null, 196.0, null, 146.83, null, 196.0, null],
  },
  // Bouncy chiptune adventure exploration
  adventure: {
    tempoMs: 260,
    wave: 'square',
    bassWave: 'triangle',
    melody: [392, 493.88, 587.33, 659.25, 587.33, 493.88, 440, 523.25, 392, 440, 493.88, 587.33, 783.99, null, 659.25, null],
    bass: [196, null, 246.94, null, 220, null, 174.61, null, 196, null, 220, null, 196, null, 146.83, null],
  },
  // Warm, uplifting city builder marimba-like vibe
  city: {
    tempoMs: 380,
    wave: 'sine',
    bassWave: 'triangle',
    melody: [523.25, 587.33, 659.25, null, 783.99, 659.25, 587.33, null, 440, 523.25, 587.33, null, 659.25, 523.25, 392, null],
    bass: [130.81, null, null, 196, 174.61, null, null, 196, 110, null, null, 164.81, 146.83, null, 196, null],
  },
  // Curious, clever puzzle pluck
  puzzle: {
    tempoMs: 320,
    wave: 'triangle',
    bassWave: 'sine',
    melody: [440, null, 523.25, 659.25, 587.33, null, 493.88, 440, 392, null, 493.88, 587.33, 523.25, null, 392, null],
    bass: [220, null, 220, null, 196, null, 196, null, 174.61, null, 174.61, null, 130.81, null, 196, null],
  },
  // Cozy cafe / life simulator lo-fi groove
  simulator: {
    tempoMs: 420,
    wave: 'sine',
    bassWave: 'sine',
    melody: [349.23, 440, 523.25, 659.25, null, 587.33, 523.25, 440, 392, 493.88, 587.33, null, 523.25, 440, 349.23, null],
    bass: [174.61, null, 130.81, null, 146.83, null, 110, null, 196, null, 146.83, null, 130.81, null, 174.61, null],
  },
};

/**
 * Multi-theme Web Audio synthesizer for Game Center SFX & background music.
 * Respects muted / soundVolume / musicVolume settings across all 5 games.
 */
class GameAudioManager {
  private ctx: AudioContext | null = null;
  private musicTimer: number | null = null;
  private musicStep = 0;

  private ensureCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const { muted } = useSettingsStore.getState();
    if (muted) return null;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private tone(freq: number, duration: number, type: OscillatorType = 'sine', volScale = 0.2, delay = 0, freqEnd?: number) {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const { soundVolume } = useSettingsStore.getState();
    const vol = Math.max(0, Math.min(1, soundVolume)) * volScale;
    if (vol <= 0.001) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, now + duration);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(vol, now + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  /* ---------------------------- Game SFX ---------------------------- */

  coin() {
    this.tone(987.77, 0.07, 'triangle', 0.22, 0);
    this.tone(1318.51, 0.14, 'triangle', 0.22, 0.055);
  }

  letter() {
    this.tone(659.25, 0.07, 'sine', 0.2, 0);
    this.tone(880, 0.07, 'sine', 0.2, 0.05);
    this.tone(1174.66, 0.14, 'triangle', 0.22, 0.1);
  }

  jump() {
    this.tone(280, 0.14, 'sine', 0.22, 0, 580);
  }

  slide() {
    this.tone(420, 0.12, 'triangle', 0.16, 0, 170);
  }

  laneSwitch() {
    this.tone(360, 0.05, 'sine', 0.12, 0, 480);
  }

  bounce() {
    this.tone(260, 0.2, 'triangle', 0.24, 0, 740);
  }

  step() {
    this.tone(320, 0.045, 'sine', 0.1, 0);
  }

  flip() {
    this.tone(520, 0.06, 'triangle', 0.14, 0, 680);
  }

  build() {
    this.tone(220, 0.08, 'triangle', 0.24, 0);
    this.tone(330, 0.09, 'triangle', 0.24, 0.06);
    this.tone(440, 0.15, 'sine', 0.22, 0.12);
  }

  dialogue() {
    this.tone(587.33, 0.06, 'sine', 0.15, 0);
    this.tone(739.99, 0.08, 'sine', 0.14, 0.05);
  }

  hit() {
    this.tone(180, 0.18, 'sawtooth', 0.2, 0, 75);
  }

  correct() {
    this.tone(523.25, 0.1, 'triangle', 0.24, 0);
    this.tone(659.25, 0.1, 'triangle', 0.24, 0.07);
    this.tone(783.99, 0.18, 'triangle', 0.26, 0.14);
  }

  victory() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.25, i * 0.09));
  }

  wrong() {
    this.tone(250, 0.14, 'sawtooth', 0.15, 0);
    this.tone(185, 0.22, 'sawtooth', 0.15, 0.11);
  }

  powerup() {
    [440, 554.37, 659.25, 880].forEach((f, i) => this.tone(f, 0.1, 'sine', 0.2, i * 0.05));
  }

  gameOver() {
    [392, 349.23, 311.13, 261.63].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.22, i * 0.12));
  }

  /* --------------------------- Per-Game BGM --------------------------- */

  startMusic(theme: GameMusicTheme = 'dash') {
    this.stopMusic();
    this.musicStep = 0;
    const spec = THEMES[theme];

    this.musicTimer = window.setInterval(() => {
      const { muted, musicVolume } = useSettingsStore.getState();
      if (muted || musicVolume <= 0.01) return;
      const ctx = this.ensureCtx();
      if (!ctx) return;

      const idx = this.musicStep % spec.melody.length;
      this.musicStep++;
      const now = ctx.currentTime;
      const dur = (spec.tempoMs / 1000) * 0.88;

      const mFreq = spec.melody[idx];
      if (mFreq) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = spec.wave;
        osc.frequency.setValueAtTime(mFreq, now);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(musicVolume * 0.075, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + dur + 0.02);
      }

      const bFreq = spec.bass[idx];
      if (bFreq) {
        const oscB = ctx.createOscillator();
        const gainB = ctx.createGain();
        oscB.type = spec.bassWave;
        oscB.frequency.setValueAtTime(bFreq, now);
        gainB.gain.setValueAtTime(0.001, now);
        gainB.gain.exponentialRampToValueAtTime(musicVolume * 0.05, now + 0.02);
        gainB.gain.exponentialRampToValueAtTime(0.001, now + dur * 1.15);
        oscB.connect(gainB);
        gainB.connect(ctx.destination);
        oscB.start(now);
        oscB.stop(now + dur * 1.2);
      }
    }, spec.tempoMs);
  }

  stopMusic() {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const gameAudio = new GameAudioManager();
