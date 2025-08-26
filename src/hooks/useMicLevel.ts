// src/hooks/useMicLevel.ts
import { useEffect, useRef, useState } from 'react';

/**
 * Temporary mic-level source (fake).
 * Returns a smooth 0..1 value while `enabled` is true.
 * Replace this later with real native metering.
 */
export default function useMicLevel(enabled: boolean) {
  const [level, setLevel] = useState(0);
  const tRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      // stop + reset quickly so the bar drops when inactive
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      setLevel(0);
      return;
    }

    const tick = () => {
      tRef.current += 0.08;
      // smooth “VU” curve with a bit of jitter
      const base = Math.abs(Math.sin(tRef.current));
      const jitter = (Math.random() - 0.5) * 0.1;
      const v = Math.max(0, Math.min(1, base * 0.85 + 0.1 + jitter));
      setLevel(v);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [enabled]);

  return level;
}