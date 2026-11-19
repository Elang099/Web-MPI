import { useCallback, useEffect, useRef, useState } from 'react';
import { useSettingsStore } from '@/stores/settings';

/* ---------------------------- Text-to-speech ---------------------------- */

function pickVoice(accent: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  return voices.find((v) => v.lang === accent && /natural|google|online/i.test(v.name)) ?? voices.find((v) => v.lang === accent) ?? voices.find((v) => v.lang.startsWith('en'));
}

/** Speak English text with the browser's speech synthesis (respects user settings). */
export function speak(text: string, opts: { rate?: number; onEnd?: () => void } = {}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  const { speechRate, voiceAccent, muted } = useSettingsStore.getState();
  if (muted) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = voiceAccent;
  u.rate = opts.rate ?? speechRate;
  const v = pickVoice(voiceAccent);
  if (v) u.voice = v;
  if (opts.onEnd) u.onend = opts.onEnd;
  window.speechSynthesis.speak(u);
  return true;
}

export function useSpeak() {
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  const say = useCallback((text: string, rate?: number) => {
    setSpeaking(true);
    const ok = speak(text, { rate, onEnd: () => setSpeaking(false) });
    if (!ok) setSpeaking(false);
  }, []);
  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);
  return { say, stop, speaking, supported: typeof window !== 'undefined' && 'speechSynthesis' in window };
}

/* -------------------------- Speech recognition -------------------------- */

type Recognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string; confidence: number }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

/** Browser speech recognition (Chrome/Edge/Safari). Gracefully reports `supported: false` elsewhere. */
export function useSpeechRecognition(lang = 'en-US') {
  const Ctor = typeof window !== 'undefined' ? ((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition) : undefined;
  const rec = useRef<Recognition | null>(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => rec.current?.abort(), []);

  const start = useCallback(() => {
    if (!Ctor) return;
    rec.current?.abort();
    const r: Recognition = new Ctor();
    r.lang = lang;
    r.interimResults = true;
    r.maxAlternatives = 1;
    r.continuous = false;
    r.onresult = (e) => {
      let text = '';
      let conf = 0;
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
        conf = e.results[i][0].confidence || conf;
      }
      setTranscript(text.trim());
      setConfidence(conf);
    };
    r.onerror = (e) => {
      setError(e.error === 'not-allowed' ? 'Microphone permission was denied.' : `Speech error: ${e.error}`);
      setListening(false);
    };
    r.onend = () => setListening(false);
    rec.current = r;
    setTranscript('');
    setError(null);
    setListening(true);
    r.start();
  }, [Ctor, lang]);

  const stop = useCallback(() => {
    rec.current?.stop();
    setListening(false);
  }, []);

  return { supported: !!Ctor, listening, transcript, confidence, error, start, stop, setTranscript };
}

/** Word-overlap similarity (0..1) between a target sentence and what was said. */
export function speechSimilarity(target: string, said: string) {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9' ]/g, ' ').split(/\s+/).filter(Boolean);
  const t = norm(target);
  const s = norm(said);
  if (!t.length) return 0;
  const pool = [...s];
  let hit = 0;
  for (const w of t) {
    const i = pool.indexOf(w);
    if (i >= 0) {
      hit++;
      pool.splice(i, 1);
    }
  }
  return hit / Math.max(t.length, s.length || 1);
}
