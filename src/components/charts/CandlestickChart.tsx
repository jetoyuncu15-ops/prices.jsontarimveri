import { useCallback, useMemo, useRef, useState } from 'react';
import type { Candle } from '@/types';
import { sma, ema, bollinger, closesOf } from '@/lib/indicators';
import { TOOL_MAP } from '@/lib/drawingTools';
import { cn } from '@/lib/cn';

export type ChartType = 'candle' | 'line' | 'bar';

export type DrawTool = string;

export interface Drawing {
  id: string;
  tool: DrawTool;
  points: { x: number; y: number }[];
}

interface CandlestickChartProps {
  candles: Candle[];
  unit: string;
  chartType: ChartType;
  showSMA: boolean;
  showEMA: boolean;
  showBollinger: boolean;
  smaPeriod: number;
  emaPeriod: number;
  tool: DrawTool;
  drawings: Drawing[];
  onAddDrawing: (d: Drawing) => void;
  onClearDrawings: () => void;
}

const W = 900;
const H = 380;
const PAD = { top: 12, right: 58, bottom: 28, left: 8 };

interface Scale {
  x: (i: number) => number;
  y: (price: number) => number;
  priceAt: (py: number) => number;
  indexAt: (px: number) => number;
}

const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
const FIB_LABELS = ['0%', '23.6%', '38.2%', '50%', '61.8%', '78.6%', '100%'];
const FIB_COLORS = ['#f43f5e', '#f59e0b', '#38bdf8', '#a78bfa', '#38bdf8', '#f59e0b', '#10b981'];

const FIB_EXT_LEVELS = [0, 0.618, 1, 1.272, 1.618, 2.618];
const FIB_EXT_LABELS = ['0%', '61.8%', '100%', '127.2%', '161.8%', '261.8%'];

function toolColor(tool: string): string {
  return TOOL_MAP[tool]?.color ?? '#f59e0b';
}

function toolKind(tool: string): string {
  return TOOL_MAP[tool]?.kind ?? 'line';
}

function toolPoints(tool: string): number {
  return TOOL_MAP[tool]?.points ?? 2;
}

export function CandlestickChart({
  candles,
  unit,
  chartType,
  showSMA,
  showEMA,
  showBollinger,
  smaPeriod,
  emaPeriod,
  tool,
  drawings,
  onAddDrawing,
  onClearDrawings,
}: CandlestickChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draftPts, setDraftPts] = useState<{ x: number; y: number }[]>([]);
  const [hover, setHover] = useState<{ idx: number; x: number; y: number } | null>(null);

  const view = candles;
  const len = view.length;

  const { min, max } = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    for (const c of view) {
      lo = Math.min(lo, c.low);
      hi = Math.max(hi, c.high);
    }
    if (showBollinger) {
      const bb = bollinger(closesOf(view), 20, 2);
      for (const b of bb) {
        if (b.upper !== null) hi = Math.max(hi, b.upper);
        if (b.lower !== null) lo = Math.min(lo, b.lower);
      }
    }
    const pad = (hi - lo) * 0.08 || 1;
    return { min: lo - pad, max: hi + pad };
  }, [view, showBollinger]);

  const scale: Scale = useMemo(() => {
    const plotW = W - PAD.left - PAD.right;
    const plotH = H - PAD.top - PAD.bottom;
    const x = (i: number) => PAD.left + (i / Math.max(1, len - 1)) * plotW;
    const y = (price: number) => PAD.top + (1 - (price - min) / (max - min || 1)) * plotH;
    const priceAt = (py: number) => max - ((py - PAD.top) / plotH) * (max - min || 1);
    const indexAt = (px: number) =>
      Math.round(((px - PAD.left) / plotW) * Math.max(1, len - 1));
    return { x, y, priceAt, indexAt };
  }, [len, min, max]);

  const cw = (W - PAD.left - PAD.right) / Math.max(1, len);
  const bodyW = Math.max(2, cw * 0.62);

  const closes = closesOf(view);
  const smaArr = useMemo(() => sma(closes, smaPeriod), [closes, smaPeriod]);
  const emaArr = useMemo(() => ema(closes, emaPeriod), [closes, emaPeriod]);
  const bbArr = useMemo(() => bollinger(closes, 20, 2), [closes]);

  const toPath = (arr: (number | null)[]) => {
    let d = '';
    let started = false;
    arr.forEach((v, i) => {
      if (v === null) return;
      d += `${started ? 'L' : 'M'}${scale.x(i).toFixed(1)},${scale.y(v).toFixed(1)} `;
      started = true;
    });
    return d;
  };

  const toAreaPath = (arr: (number | null)[], fillTo: (number | null)[]) => {
    let top = '';
    let started = false;
    const pts: { x: number; y: number }[] = [];
    arr.forEach((v, i) => {
      if (v === null) return;
      top += `${started ? 'L' : 'M'}${scale.x(i).toFixed(1)},${scale.y(v).toFixed(1)} `;
      pts.push({ x: scale.x(i), y: scale.y(v) });
      started = true;
    });
    if (pts.length < 2) return '';
    let bottom = '';
    for (let i = pts.length - 1; i >= 0; i--) {
      const fi = Math.round((pts[i].x - PAD.left) / ((W - PAD.left - PAD.right) / Math.max(1, len - 1)));
      const fv = fillTo[fi];
      if (fv === null) continue;
      bottom += `L${pts[i].x.toFixed(1)},${scale.y(fv).toFixed(1)} `;
    }
    return top + bottom + 'Z';
  };

  // ── Çizim etkileşimi ──────────────────────────────────────
  const getPt = useCallback(
    (e: React.PointerEvent): { x: number; y: number } => {
      const rect = svgRef.current!.getBoundingClientRect();
      const sx = (e.clientX - rect.left) / rect.width * W;
      const sy = (e.clientY - rect.top) / rect.height * H;
      return { x: sx, y: sy };
    },
    [],
  );

  const needPts = tool === 'none' ? 0 : toolPoints(tool);

  const handleDown = (e: React.PointerEvent) => {
    if (tool === 'none') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = getPt(e);
    if (needPts <= 2) {
      setDraftPts([pt]);
    } else {
      setDraftPts((prev) => (prev.length === 0 ? [pt] : [...prev, pt]));
    }
  };

  const handleMove = (e: React.PointerEvent) => {
    const pt = getPt(e);
    const idx = scale.indexAt(pt.x);
    if (tool === 'none') {
      setHover({ idx: Math.max(0, Math.min(len - 1, idx)), x: pt.x, y: pt.y });
    }
    if (draftPts.length >= 1 && tool !== 'none') {
      if (needPts <= 2) {
        setDraftPts((prev) => [prev[0], pt]);
      }
    }
  };

  const handleUp = (e: React.PointerEvent) => {
    if (tool === 'none') return;
    const pt = getPt(e);

    if (needPts <= 2) {
      const start = draftPts[0] ?? pt;
      const dist = Math.hypot(pt.x - start.x, pt.y - start.y);
      if (dist > 6) {
        onAddDrawing({ id: `dw-${Date.now()}`, tool, points: [start, pt] });
      }
      setDraftPts([]);
    } else {
      // 3 or 4 point tools — accumulate clicks
      setDraftPts((prev) => {
        const next = [...prev, pt];
        if (next.length >= needPts) {
          onAddDrawing({ id: `dw-${Date.now()}`, tool, points: next });
          return [];
        }
        return next;
      });
    }
  };

  const handleLeave = () => {
    setHover(null);
  };

  // Çizim render yardımcıları
  const renderDrawing = (d: Drawing, isDraft = false) => {
    const color = toolColor(d.tool);
    const kind = toolKind(d.tool);
    const opacity = isDraft ? 0.5 : 0.9;
    const pts = d.points;
    const p1 = pts[0];
    const p2 = pts[1] ?? p1;
    const p3 = pts[2];
    const p4 = pts[3];

    if (kind === 'line') {
      return (
        <g key={d.id} opacity={opacity}>
          <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={color} strokeWidth="1.5" />
          <circle cx={p1.x} cy={p1.y} r="3" fill={color} />
          <circle cx={p2.x} cy={p2.y} r="3" fill={color} />
        </g>
      );
    }

    if (kind === 'horizontal') {
      const y = (p1.y + p2.y) / 2;
      return (
        <g key={d.id} opacity={opacity}>
          <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke={color} strokeWidth="1.5" strokeDasharray="6 4" />
          <text x={W - PAD.right + 4} y={y + 3} fill={color} fontSize="10" fontFamily="JetBrains Mono, monospace">
            {scale.priceAt(y).toFixed(2)}
          </text>
        </g>
      );
    }

    if (kind === 'hline-label') {
      const y = (p1.y + p2.y) / 2;
      const label = TOOL_MAP[d.tool]?.shortLabel ?? d.tool;
      return (
        <g key={d.id} opacity={opacity}>
          <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke={color} strokeWidth="1.5" strokeDasharray="6 4" />
          <rect x={PAD.left} y={y - 9} width={label.length * 6 + 12} height="16" fill="#0a0f16" opacity="0.85" rx="3" />
          <text x={PAD.left + 6} y={y + 3} fill={color} fontSize="10" fontFamily="JetBrains Mono, monospace" fontWeight="600">
            {label}
          </text>
          <text x={W - PAD.right + 4} y={y + 3} fill={color} fontSize="10" fontFamily="JetBrains Mono, monospace">
            {scale.priceAt(y).toFixed(2)}
          </text>
        </g>
      );
    }

    if (kind === 'fibonacci') {
      const yHigh = Math.min(p1.y, p2.y);
      const yLow = Math.max(p1.y, p2.y);
      const priceHigh = scale.priceAt(yHigh);
      const priceLow = scale.priceAt(yLow);
      const range = priceHigh - priceLow;
      return (
        <g key={d.id} opacity={opacity}>
          {FIB_LEVELS.map((lvl, i) => {
            const y = yHigh + lvl * (yLow - yHigh);
            const price = priceHigh - lvl * range;
            return (
              <g key={i}>
                <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke={FIB_COLORS[i]} strokeWidth="1" strokeDasharray="4 3" opacity="0.7" />
                <rect x={PAD.left} y={y - 8} width="52" height="16" fill="#0a0f16" opacity="0.8" />
                <text x={PAD.left + 4} y={y + 3} fill={FIB_COLORS[i]} fontSize="10" fontFamily="JetBrains Mono, monospace">
                  {FIB_LABELS[i]} · {price.toFixed(2)}
                </text>
              </g>
            );
          })}
          <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={color} strokeWidth="1" opacity="0.4" />
        </g>
      );
    }

    if (kind === 'fib-extension') {
      if (!p3) return null;
      const yHigh = Math.min(p1.y, p2.y);
      const yLow = Math.max(p1.y, p2.y);
      const priceHigh = scale.priceAt(yHigh);
      const priceLow = scale.priceAt(yLow);
      const range = Math.abs(priceHigh - priceLow);
      const extPrice = scale.priceAt(p3.y);
      return (
        <g key={d.id} opacity={opacity}>
          {FIB_EXT_LEVELS.map((lvl, i) => {
            const price = extPrice + lvl * range;
            const y = scale.y(price);
            return (
              <g key={i}>
                <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke={FIB_COLORS[i % FIB_COLORS.length]} strokeWidth="1" strokeDasharray="4 3" opacity="0.7" />
                <rect x={PAD.left} y={y - 8} width="58" height="16" fill="#0a0f16" opacity="0.8" />
                <text x={PAD.left + 4} y={y + 3} fill={FIB_COLORS[i % FIB_COLORS.length]} fontSize="10" fontFamily="JetBrains Mono, monospace">
                  {FIB_EXT_LABELS[i]} · {price.toFixed(2)}
                </text>
              </g>
            );
          })}
        </g>
      );
    }

    if (kind === 'fib-fan') {
      const yHigh = Math.min(p1.y, p2.y);
      const yLow = Math.max(p1.y, p2.y);
      const xStart = Math.min(p1.x, p2.x);
      const fanLevels = [0.382, 0.5, 0.618];
      return (
        <g key={d.id} opacity={opacity}>
          <line x1={xStart} y1={yLow} x2={xStart} y2={yHigh} stroke={color} strokeWidth="1" />
          {fanLevels.map((lvl, i) => {
            const yEnd = yLow - lvl * (yLow - yHigh);
            return (
              <line key={i} x1={xStart} y1={yLow} x2={W - PAD.right} y2={yEnd} stroke={FIB_COLORS[i + 1]} strokeWidth="1" opacity="0.7" />
            );
          })}
        </g>
      );
    }

    if (kind === 'channel') {
      if (!p3 || !p4) return null;
      return (
        <g key={d.id} opacity={opacity}>
          <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={color} strokeWidth="1.5" />
          <line x1={p3.x} y1={p3.y} x2={p4.x} y2={p4.y} stroke={color} strokeWidth="1.5" />
          <line x1={p1.x} y1={p1.y} x2={p3.x} y2={p3.y} stroke={color} strokeWidth="0.8" strokeDasharray="3 3" opacity="0.5" />
          <line x1={p2.x} y1={p2.y} x2={p4.x} y2={p4.y} stroke={color} strokeWidth="0.8" strokeDasharray="3 3" opacity="0.5" />
        </g>
      );
    }

    if (kind === 'triangle') {
      if (!p3 || !p4) return null;
      return (
        <g key={d.id} opacity={opacity}>
          <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={color} strokeWidth="1.5" />
          <line x1={p2.x} y1={p2.y} x2={p3.x} y2={p3.y} stroke={color} strokeWidth="1.5" />
          <line x1={p3.x} y1={p3.y} x2={p4.x} y2={p4.y} stroke={color} strokeWidth="1.5" />
        </g>
      );
    }

    if (kind === 'flag') {
      if (!p3 || !p4) return null;
      return (
        <g key={d.id} opacity={opacity}>
          <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={color} strokeWidth="2" />
          <line x1={p3.x} y1={p3.y} x2={p4.x} y2={p4.y} stroke={color} strokeWidth="1.5" />
          <line x1={p3.x} y1={p3.y} x2={p4.x} y2={p4.y} stroke={color} strokeWidth="1" opacity="0.3" fill={color} fillOpacity="0.1" />
        </g>
      );
    }

    if (kind === 'wedge') {
      if (!p3 || !p4) return null;
      return (
        <g key={d.id} opacity={opacity}>
          <line x1={p1.x} y1={p1.y} x2={p3.x} y2={p3.y} stroke={color} strokeWidth="1.5" />
          <line x1={p2.x} y1={p2.y} x2={p4.x} y2={p4.y} stroke={color} strokeWidth="1.5" />
        </g>
      );
    }

    if (kind === 'megaphone') {
      if (!p3 || !p4) return null;
      return (
        <g key={d.id} opacity={opacity}>
          <line x1={p1.x} y1={p1.y} x2={p3.x} y2={p3.y} stroke={color} strokeWidth="1.5" />
          <line x1={p2.x} y1={p2.y} x2={p4.x} y2={p4.y} stroke={color} strokeWidth="1.5" />
          <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
          <line x1={p3.x} y1={p3.y} x2={p4.x} y2={p4.y} stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
        </g>
      );
    }

    if (kind === 'box') {
      if (!p3 || !p4) return null;
      const x = Math.min(p1.x, p3.x);
      const y = Math.min(p1.y, p3.y);
      const w = Math.abs(p3.x - p1.x);
      const h = Math.abs(p3.y - p1.y);
      return (
        <g key={d.id} opacity={opacity}>
          <rect x={x} y={y} width={w} height={h} fill={color} fillOpacity="0.12" stroke={color} strokeWidth="1.5" strokeDasharray="4 3" rx="2" />
          <text x={x + 4} y={y + 12} fill={color} fontSize="10" fontFamily="JetBrains Mono, monospace" fontWeight="600">
            {TOOL_MAP[d.tool]?.shortLabel ?? ''}
          </text>
        </g>
      );
    }

    if (kind === 'multi-line') {
      const lines = pts.length >= 4 ? [[p1, p2], [p2, p3!], [p3!, p4!]] : pts.length === 3 ? [[p1, p2], [p2, p3!]] : [[p1, p2]];
      return (
        <g key={d.id} opacity={opacity}>
          {lines.map(([a, b], i) => (
            <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth="1.5" />
          ))}
          {pts.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={color} />
          ))}
        </g>
      );
    }

    if (kind === 'annotation') {
      const label = TOOL_MAP[d.tool]?.shortLabel ?? d.tool;
      return (
        <g key={d.id} opacity={opacity}>
          <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
          <rect x={p2.x} y={p2.y - 10} width={label.length * 6 + 10} height="16" fill="#0a0f16" opacity="0.85" rx="3" />
          <text x={p2.x + 5} y={p2.y + 2} fill={color} fontSize="10" fontFamily="JetBrains Mono, monospace" fontWeight="600">
            {label}
          </text>
        </g>
      );
    }

    return null;
  };

  const gridYs = [0, 0.25, 0.5, 0.75, 1].map((t) => PAD.top + t * (H - PAD.top - PAD.bottom));
  const hoverCandle = hover ? view[Math.min(hover.idx, len - 1)] : null;
  const lastClose = view[len - 1]?.close ?? 0;
  const firstClose = view[0]?.close ?? 0;
  const periodChange = firstClose > 0 ? ((lastClose - firstClose) / firstClose) * 100 : 0;

  const draftDrawing: Drawing | null = draftPts.length > 0
    ? { id: 'draft', tool, points: draftPts.length === 1 ? [draftPts[0], draftPts[0]] : draftPts }
    : null;

  return (
    <div className="relative">
      {/* Crosshair tooltip */}
      {hoverCandle && tool === 'none' && (
        <div className="pointer-events-none absolute right-2 top-2 z-10 rounded-lg border border-ink-600 bg-ink-900/95 px-3 py-2 text-xs shadow-xl">
          <div className="tabular text-slate-500">{formatDateShort(hoverCandle.date)}</div>
          <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 tabular">
            <span className="text-slate-500">A:</span><span className="text-slate-200">{hoverCandle.open.toFixed(2)}</span>
            <span className="text-slate-500">Y:</span><span className="text-emerald-400">{hoverCandle.high.toFixed(2)}</span>
            <span className="text-slate-500">D:</span><span className="text-rose-400">{hoverCandle.low.toFixed(2)}</span>
            <span className="text-slate-500">K:</span><span className="text-slate-200">{hoverCandle.close.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Drawing status indicator */}
      {tool !== 'none' && (
        <div className="pointer-events-none absolute left-2 top-2 z-10 rounded-lg border border-ink-600 bg-ink-900/95 px-3 py-1.5 text-xs shadow-xl">
          <span className="text-amber-300">{TOOL_MAP[tool]?.label ?? tool}</span>
          <span className="ml-2 text-slate-500">
            {draftPts.length}/{needPts} nokta
          </span>
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className={cn('w-full', tool !== 'none' ? 'cursor-crosshair' : 'cursor-default')}
        style={{ height: 'auto', aspectRatio: `${W}/${H}` }}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerLeave={handleLeave}
      >
        <defs>
          <linearGradient id="bb-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#64748b" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#64748b" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid */}
        {gridYs.map((y, i) => (
          <line key={i} x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#1b2636" strokeWidth="1" strokeDasharray="2 4" />
        ))}

        {/* Y-axis labels */}
        {gridYs.map((y, i) => {
          const price = scale.priceAt(y);
          return (
            <text key={i} x={W - PAD.right + 4} y={y + 3} fill="#64748b" fontSize="10" fontFamily="JetBrains Mono, monospace">
              {price.toFixed(2)}
            </text>
          );
        })}

        {/* X-axis labels */}
        {Array.from({ length: 6 }).map((_, i) => {
          const idx = Math.floor((i / 5) * (len - 1));
          return (
            <text key={i} x={scale.x(idx)} y={H - 8} fill="#64748b" fontSize="10" fontFamily="JetBrains Mono, monospace" textAnchor="middle">
              {formatDateShort(view[idx]?.date ?? '')}
            </text>
          );
        })}

        {/* Bollinger fill */}
        {showBollinger && (
          <path d={toAreaPath(bbArr.map((b) => b.upper), bbArr.map((b) => b.lower))} fill="url(#bb-fill)" />
        )}
        {showBollinger && (
          <>
            <path d={toPath(bbArr.map((b) => b.upper))} fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
            <path d={toPath(bbArr.map((b) => b.lower))} fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
            <path d={toPath(bbArr.map((b) => b.middle))} fill="none" stroke="#64748b" strokeWidth="1" opacity="0.4" />
          </>
        )}

        {/* Candles / Line / Bar */}
        {chartType === 'line' ? (
          <path d={toPath(closes)} fill="none" stroke="#10b981" strokeWidth="2" strokeLinejoin="round" />
        ) : chartType === 'bar' ? (
          view.map((c, i) => {
            const x = scale.x(i);
            const color = c.close >= c.open ? '#10b981' : '#f43f5e';
            const yTop = scale.y(c.high);
            const yBot = scale.y(c.low);
            return (
              <line key={i} x1={x} y1={yTop} x2={x} y2={yBot} stroke={color} strokeWidth={Math.max(1.5, bodyW * 0.5)} opacity="0.85" />
            );
          })
        ) : (
          view.map((c, i) => {
            const x = scale.x(i);
            const color = c.close >= c.open ? '#10b981' : '#f43f5e';
            const yOpen = scale.y(c.open);
            const yClose = scale.y(c.close);
            const yHigh = scale.y(c.high);
            const yLow = scale.y(c.low);
            const top = Math.min(yOpen, yClose);
            const h = Math.max(1, Math.abs(yClose - yOpen));
            return (
              <g key={i}>
                <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth="1" />
                <rect
                  x={x - bodyW / 2}
                  y={top}
                  width={bodyW}
                  height={h}
                  fill={color}
                  opacity={hover?.idx === i ? 1 : 0.92}
                  rx="0.5"
                />
              </g>
            );
          })
        )}

        {/* SMA / EMA overlays */}
        {showSMA && <path d={toPath(smaArr)} fill="none" stroke="#38bdf8" strokeWidth="1.5" opacity="0.85" />}
        {showEMA && <path d={toPath(emaArr)} fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity="0.85" />}

        {/* Crosshair */}
        {hover && tool === 'none' && (
          <g>
            <line x1={hover.x} y1={PAD.top} x2={hover.x} y2={H - PAD.bottom} stroke="#3a485c" strokeWidth="1" strokeDasharray="3 3" />
            <line x1={PAD.left} y1={hover.y} x2={W - PAD.right} y2={hover.y} stroke="#3a485c" strokeWidth="1" strokeDasharray="3 3" />
          </g>
        )}

        {/* Drawings */}
        {drawings.map((d) => renderDrawing(d))}
        {draftDrawing && renderDrawing(draftDrawing, true)}

        {/* Period change badge */}
        <text x={PAD.left} y={16} fill={periodChange >= 0 ? '#10b981' : '#f43f5e'} fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="600">
          {periodChange >= 0 ? '+' : ''}{periodChange.toFixed(2)}% · {lastClose.toFixed(2)} {unit}
        </text>
      </svg>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
        {chartType === 'candle' && <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Mum</span>}
        {chartType === 'line' && <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-emerald-400" /> Çizgi</span>}
        {chartType === 'bar' && <span className="flex items-center gap-1.5"><span className="h-2.5 w-1 bg-emerald-500" /> Bar</span>}
        {showSMA && <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-sky-400" /> SMA({smaPeriod})</span>}
        {showEMA && <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-amber-400" /> EMA({emaPeriod})</span>}
        {showBollinger && <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-slate-500" /> BB(20,2)</span>}
        {drawings.length > 0 && (
          <button onClick={onClearDrawings} className="ml-auto text-rose-400/70 hover:text-rose-400">
            Çizimleri temizle ({drawings.length})
          </button>
        )}
      </div>
    </div>
  );
}

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
}
