import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Target, MonitorPlay, MousePointer2, ChevronUp, ChevronDown, Layers } from 'lucide-react';

const PRELOAD_AHEAD = 6;   // slices to warm on each side of the cursor
const CACHE_LIMIT = 60;    // hard cap on retained HTMLImageElements

/**
 * PACS-style scrollable CT viewer.
 *  - Mouse wheel / ArrowUp / ArrowDown scroll through axial slices.
 *  - The annotation is anchored to the slice it was drawn on, so scrolling
 *    away hides the trace (just like a real workstation).
 *  - Modality is intentionally hidden — this is a blinded reader study.
 */
export default function CTViewer({ caseData, marking, setMarking }) {
  const { sliceUrls, sliceCount, patientId, region } = caseData;

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const cacheRef = useRef(new Map()); // idx -> HTMLImageElement
  const lruRef = useRef([]);          // recency list of idx

  const [sliceIdx, setSliceIdx] = useState(Math.floor(sliceCount / 2));
  const [, forceRender] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);

  // Reset cursor + cache when the case changes.
  useEffect(() => {
    cacheRef.current.clear();
    lruRef.current = [];
    setSliceIdx(Math.floor(sliceCount / 2));
  }, [caseData.id, sliceCount]);

  const touchLru = useCallback((idx) => {
    const lru = lruRef.current;
    const pos = lru.indexOf(idx);
    if (pos !== -1) lru.splice(pos, 1);
    lru.push(idx);
    while (lru.length > CACHE_LIMIT) {
      const drop = lru.shift();
      cacheRef.current.delete(drop);
    }
  }, []);

  const loadSlice = useCallback((idx) => {
    if (idx < 0 || idx >= sliceCount) return;
    if (cacheRef.current.has(idx)) {
      touchLru(idx);
      return;
    }
    const img = new Image();
    img.decoding = 'async';
    img.src = sliceUrls[idx];
    cacheRef.current.set(idx, img);
    touchLru(idx);
    img.onload = () => forceRender((n) => n + 1);
  }, [sliceCount, sliceUrls, touchLru]);

  // Warm current + neighbour slices.
  useEffect(() => {
    loadSlice(sliceIdx);
    for (let d = 1; d <= PRELOAD_AHEAD; d++) {
      loadSlice(sliceIdx + d);
      loadSlice(sliceIdx - d);
    }
  }, [sliceIdx, loadSlice]);

  // Draw the current slice + marking overlay.
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = cacheRef.current.get(sliceIdx);
    if (img && img.complete && img.naturalWidth > 0) {
      const scale = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      const x = (canvas.width - w) / 2;
      const y = (canvas.height - h) / 2;
      ctx.drawImage(img, x, y, w, h);
    }

    if (marking && marking.sliceIdx === sliceIdx && marking.points.length > 0) {
      drawPath(ctx, marking.points, isDrawing);
    }
  }, [sliceIdx, marking, isDrawing, caseData.id]);

  // Resize observer keeps the canvas crisp.
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => forceRender((n) => n + 1));
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Mouse wheel scrolls slices; preventDefault stops the page from scrolling.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const step = e.deltaY > 0 ? 1 : -1;
      setSliceIdx((i) => clamp(i + step, 0, sliceCount - 1));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [sliceCount]);

  // Keyboard scroll.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        setSliceIdx((i) => clamp(i + 1, 0, sliceCount - 1));
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        setSliceIdx((i) => clamp(i - 1, 0, sliceCount - 1));
      } else if (e.key === 'Home') {
        setSliceIdx(0);
      } else if (e.key === 'End') {
        setSliceIdx(sliceCount - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sliceCount]);

  // Lesion-trace drawing — anchored to the current slice.
  const localXY = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: Math.round(e.clientX - rect.left), y: Math.round(e.clientY - rect.top) };
  };

  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    const p = localXY(e);
    setIsDrawing(true);
    setMarking({ sliceIdx, points: [p] });
  };

  const onMouseMove = (e) => {
    if (!isDrawing) return;
    const p = localXY(e);
    setMarking((prev) => prev ? { ...prev, points: [...prev.points, p] } : { sliceIdx, points: [p] });
  };

  const onMouseUp = () => setIsDrawing(false);

  const cached = cacheRef.current.has(sliceIdx) && cacheRef.current.get(sliceIdx).complete;

  return (
    <section className="flex-1 flex flex-col h-full bg-slate-950/80 w-full relative overflow-hidden">
      {/* Top-left identifier */}
      <div className="absolute top-4 left-6 z-10 flex items-center gap-2 pointer-events-none">
        <MonitorPlay size={18} className="text-cyan-500" />
        <span className="text-sm font-semibold text-slate-200 tracking-wide bg-slate-900/60 px-3 py-1.5 rounded backdrop-blur-sm border border-slate-700/50">
          {region} &middot; {patientId}
        </span>
      </div>

      {/* Tool hint */}
      <div className="absolute top-4 right-6 z-10 flex items-center gap-2 pointer-events-none bg-slate-900/60 backdrop-blur-sm px-4 py-2 border border-cyan-900/40 rounded-full shadow-lg">
        <MousePointer2 size={14} className="text-cyan-400 animate-pulse" />
        <span className="text-xs font-medium text-slate-300">Kesitler arası geçiş için fare tekerleği &middot; Çizmek için tıkla-sürükle</span>
      </div>

      {/* Stack canvas */}
      <div
        ref={containerRef}
        className="flex-1 w-full relative cursor-crosshair overflow-hidden select-none"
      >
        {!cached && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-20 pointer-events-none">
            <div className="w-10 h-10 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin mb-3"></div>
            <p className="text-slate-400 font-medium text-sm">Kesit {sliceIdx + 1} yükleniyor…</p>
          </div>
        )}
        <canvas
          ref={canvasRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          className="block absolute inset-0 w-full h-full"
        />

        {/* Slice counter (bottom-right) — PACS convention */}
        <div className="absolute bottom-4 right-6 z-10 pointer-events-none">
          <div className="bg-black/70 border border-slate-700/60 px-3 py-1.5 rounded font-mono text-sm text-cyan-300 tracking-wider">
            Kesit <span className="text-white">{sliceIdx + 1}</span> / {sliceCount}
          </div>
        </div>

        {/* Slice-scroll buttons (touch-friendly fallback) */}
        <div className="absolute bottom-4 left-6 z-10 flex flex-col gap-1">
          <button
            onClick={() => setSliceIdx((i) => clamp(i - 1, 0, sliceCount - 1))}
            className="w-8 h-8 rounded bg-slate-900/70 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-center"
            title="Önceki kesit (↑)"
          >
            <ChevronUp size={16} />
          </button>
          <button
            onClick={() => setSliceIdx((i) => clamp(i + 1, 0, sliceCount - 1))}
            className="w-8 h-8 rounded bg-slate-900/70 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-center"
            title="Sonraki kesit (↓)"
          >
            <ChevronDown size={16} />
          </button>
        </div>

        {/* Vertical scrubber */}
        <input
          type="range"
          min={0}
          max={sliceCount - 1}
          value={sliceIdx}
          onChange={(e) => setSliceIdx(Number(e.target.value))}
          className="ct-scrubber"
          aria-label="Kesit konumu"
        />
      </div>

      {/* Status bar */}
      <div className="h-12 bg-slate-900 border-t border-slate-800 flex items-center px-6 shrink-0 z-10">
        <div className="flex items-center gap-4 w-full">
          <Layers size={16} className="text-slate-500" />
          <span className="text-xs font-mono text-slate-400 tracking-wider">
            Seri {sliceIdx + 1}/{sliceCount}
          </span>
          <span className="h-4 w-px bg-slate-700" />
          <Target size={16} className={marking && marking.points.length > 5 ? 'text-emerald-400' : 'text-slate-500'} />
          {marking && marking.points.length > 0 ? (
            <div className="font-mono text-xs font-medium text-emerald-400 tracking-wider flex gap-4 bg-emerald-950/30 px-3 py-1.5 rounded border border-emerald-900/50">
              <span>Nokta: {marking.points.length}</span>
              <span>Sabit kesit: {marking.sliceIdx + 1}</span>
            </div>
          ) : (
            <span className="text-xs font-mono text-slate-500 tracking-wide">
              Lezyon işaretlenmedi &mdash; lezyona kadar kaydırın ve tıkla-sürükle ile çizin
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function drawPath(ctx, points, isDrawing) {
  if (points.length === 0) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 3;
  ctx.setLineDash([4, 4]);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
  if (points.length > 5 && !isDrawing) {
    ctx.beginPath();
    ctx.moveTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.lineTo(points[0].x, points[0].y);
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.4)';
    ctx.stroke();
  }
}
