import { useEffect, useRef, useState } from 'react';

// Animates toward `target` from the previously shown value. Jumps straight there under reduced motion.
export function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(target);
  const shown = useRef(0);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const from = shown.current;
    if (reduce || from === target) {
      shown.current = target;
      setValue(target);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(2, -10 * t);
      const next = t === 1 ? target : from + (target - from) * eased;
      shown.current = next;
      setValue(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return value;
}
