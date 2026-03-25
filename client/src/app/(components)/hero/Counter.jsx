"use client";
import { useState, useRef, useEffect } from "react";

function Counter({ target, suffix = "" }) {
  const [v, setV] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const t0 = performance.now();
        const tick = (now) => {
          const prog = Math.min((now - t0) / 1800, 1);
          const ease = 1 - Math.pow(1 - prog, 3);
          setV(Math.floor(ease * target));
          if (prog < 1) requestAnimationFrame(tick);
          else setV(target);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);

  return <span ref={ref}>{v}{suffix}</span>;
}
