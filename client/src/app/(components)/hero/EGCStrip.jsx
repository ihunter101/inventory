"use client";

import { useEffect, useRef, useState } from "react";

// ── ECG Strip ─────────────────────────────────────────────────────────────────
function ECGStrip() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const ecgY = (t) => {
      const p = t % 1;
      if (p < 0.08) return -Math.sin((p / 0.08) * Math.PI) * 0.18;
      if (p < 0.14) return 0;
      if (p < 0.17) return ((p - 0.14) / 0.03) * 0.22;
      if (p < 0.21) { const x = (p - 0.17) / 0.04; return 0.22 - Math.sin(x * Math.PI) * 1.0; }
      if (p < 0.25) return ((p - 0.21) / 0.04) * 0.28 - 0.28;
      if (p < 0.30) return -0.28 + ((p - 0.25) / 0.05) * 0.28;
      if (p < 0.48) return -Math.sin(((p - 0.30) / 0.18) * Math.PI) * 0.28;
      return 0;
    };

    const speed = 1.4;
    let offset = 0;
    const cycleWidth = 200;

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      const midY = H / 2, amp = H * 0.38;
      ctx.clearRect(0, 0, W, H);

      ctx.beginPath();
      let started = false;
      for (let x = 0; x <= W; x++) {
        const y = midY + ecgY(((x + offset) % cycleWidth) / cycleWidth) * amp;
        if (!started) { ctx.moveTo(x, y); started = true; }
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "#16a34a";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#16a34a";
      ctx.shadowBlur = 5;
      ctx.stroke();
      ctx.shadowBlur = 0;

      const hx = W - (offset % cycleWidth);
      const safeHx = hx < 0 ? W + hx : hx;
      const hy = midY + ecgY(((safeHx + offset) % cycleWidth) / cycleWidth) * amp;
      ctx.beginPath();
      ctx.arc(safeHx, hy, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "#16a34a";
      ctx.shadowColor = "#16a34a";
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      offset += speed;
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div style={{ position: "relative", height: 56, overflow: "hidden" }}>
      <div style={{
        position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
        background: "linear-gradient(90deg, white 0%, transparent 6%, transparent 94%, white 100%)",
      }} />
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
}