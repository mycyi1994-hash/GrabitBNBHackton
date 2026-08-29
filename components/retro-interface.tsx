'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';

type AudioWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

export function RetroInterface({ children }: { children: ReactNode }) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<AudioContext | null>(null);

  function playTone(frequency: number, duration = 0.07) {
    if (!soundEnabled) return;
    const AudioContextClass = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = audioRef.current ?? new AudioContextClass();
    audioRef.current = context;
    void context.resume();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'square';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.035, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  }

  useEffect(() => {
    const preference = window.localStorage.getItem('agent-market-sfx');
    if (preference === 'off') setSoundEnabled(false);
  }, []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const control = target?.closest('a[href], button');
      if (!control || control.classList.contains('sfx-toggle')) return;

      if (!(control instanceof HTMLAnchorElement)) {
        playTone(520);
        return;
      }

      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        control.target === '_blank' ||
        control.hasAttribute('download')
      ) {
        playTone(560);
        return;
      }

      const destination = new URL(control.href, window.location.href);
      if (destination.origin !== window.location.origin) {
        playTone(560);
        return;
      }
      if (
        destination.pathname === window.location.pathname &&
        destination.search === window.location.search &&
        destination.hash
      ) {
        playTone(620);
        return;
      }

      event.preventDefault();
      document.documentElement.classList.add('page-is-leaving');
      playTone(640, 0.06);
      window.setTimeout(() => playTone(880, 0.08), 55);
      window.setTimeout(() => window.location.assign(destination.href), 190);
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [soundEnabled]);

  function toggleSound() {
    const next = !soundEnabled;
    setSoundEnabled(next);
    window.localStorage.setItem('agent-market-sfx', next ? 'on' : 'off');
    if (next) window.setTimeout(() => playTone(760, 0.09), 0);
  }

  return (
    <>
      <div className="page-transition-stage">{children}</div>
      <button className="sfx-toggle" type="button" aria-pressed={soundEnabled} onClick={toggleSound}>
        SFX {soundEnabled ? 'ON' : 'OFF'}
      </button>
    </>
  );
}
