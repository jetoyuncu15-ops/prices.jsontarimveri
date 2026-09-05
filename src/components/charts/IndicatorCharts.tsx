import { useMemo } from 'react';
import { rsi, macd, closesOf } from '@/lib/indicators';
import type { Candle } from '@/types';

const W = 900;
const H = 110;
const PAD = { top: 10, right: 58, bottom: 8, left: 8 };

function buildPath(values: (number | null)[], scaleY: (v: number) => number, len: number) {
  let d = '';
  let started = false;
  values.forEach((v, i) => {
    if (v === null) return;
    d += `${started ? 'L' : 'M'}${scaleX(i, len).toFixed(1)},${scaleY(v).toFixed(1)} `;
    started = true;
  });
  return d;
}

function scaleX(i: number, len: number) {
  return PAD.left + (i / Math.max(1, len - 1)) * (W - PAD.left - PAD.right);
}

// ── RSI Göstergesi ────────────────────────────────────────────
export function RsiChart({ candles, period = 14 }: { candles: Candle[]; period?: number }) {
  const data = useMemo(() => {
    const closes = closesOf(candles);
    const rsiArr = rsi(closes, period);
    const last = rsiArr[rsiArr.length - 1];
    return { rsiArr, last };
  }, [candles, period]);

  const plotH = H - PAD.top - PAD.bottom;
  const scaleY = (v: number) => PAD.top + (1 - v / 100) * plotH;
  const len = candles.length;

  // RSI çizgisi — aşırı alım/satım dolgusuyla birlikte
  const fillPath = (() => {
    let d = '';
    let started = false;
    data.rsiArr.forEach((v, i) => {
      if (v === null) return;
      d += `${started ? 'L' : 'M'}${scaleX(i, len).toFixed(1)},${scaleY(v).toFixed(1)} `;
      started = true;
    });
    return d;
  })();

  const status =
    data.last === null ? '—' : data.last > 70 ? 'Aşırı Alım' : data.last < 30 ? 'Aşırı Satım' : 'Nötr';
  const statusColor = data.last !== null && data.last > 70 ? 'text-rose-400' : data.last !== null && data.last < 30 ? 'text-emerald-400' : 'text-slate-400';

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">RSI ({period})</span>
        <span className={`tabular text-xs font-semibold ${statusColor}`}>
          {data.last !== null ? data.last.toFixed(1) : '—'} · {status}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', aspectRatio: `${W}/${H}` }}>
        {/* Aşırı bölgeler */}
        <rect x={PAD.left} y={scaleY(70)} width={W - PAD.left - PAD.right} height={scaleY(100) - scaleY(70)} fill="#f43f5e" opacity="0.06" />
        <rect x={PAD.left} y={scaleY(30)} width={W - PAD.left - PAD.right} height={scaleY(0) - scaleY(30)} fill="#10b981" opacity="0.06" />
        {/* Çizgiler */}
        {[30, 50, 70].map((lvl) => (
          <g key={lvl}>
            <line x1={PAD.left} y1={scaleY(lvl)} x2={W - PAD.right} y2={scaleY(lvl)} stroke={lvl === 50 ? '#283445' : '#3a485c'} strokeWidth="1" strokeDasharray={lvl === 50 ? '2 4' : '4 3'} />
            <text x={W - PAD.right + 4} y={scaleY(lvl) + 3} fill={lvl === 70 ? '#f43f5e' : lvl === 30 ? '#10b981' : '#64748b'} fontSize="9" fontFamily="JetBrains Mono, monospace">{lvl}</text>
          </g>
        ))}
        <path d={fillPath} fill="none" stroke="#a78bfa" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

// ── MACD Göstergesi ───────────────────────────────────────────
export function MacdChart({ candles }: { candles: Candle[] }) {
  const data = useMemo(() => macd(closesOf(candles)), [candles]);
  const len = candles.length;

  const allVals = data.flatMap((d) => [d.macd, d.signal, d.histogram]).filter((v): v is number => v !== null);
  const maxAbs = Math.max(...allVals.map((v) => Math.abs(v)), 1);
  const midY = PAD.top + (H - PAD.top - PAD.bottom) / 2;
  const plotH = (H - PAD.top - PAD.bottom) / 2;
  const scaleY = (v: number) => midY - (v / maxAbs) * plotH;

  const macdPath = buildPath(data.map((d) => d.macd), scaleY, len);
  const signalPath = buildPath(data.map((d) => d.signal), scaleY, len);

  const last = data[data.length - 1];
  const cross = last?.macd !== null && last?.signal !== null
    ? (last.macd! > last.signal! ? 'Pozitif kesişim' : 'Negatif kesişim')
    : '—';
  const crossColor = last?.macd !== null && last?.signal !== null && last.macd! > last.signal! ? 'text-emerald-400' : 'text-rose-400';

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">MACD (12, 26, 9)</span>
        <span className={`tabular text-xs font-semibold ${crossColor}`}>
          {last?.macd !== null ? last.macd!.toFixed(2) : '—'} / {last?.signal !== null ? last.signal!.toFixed(2) : '—'} · {cross}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', aspectRatio: `${W}/${H}` }}>
        {/* Zero line */}
        <line x1={PAD.left} y1={midY} x2={W - PAD.right} y2={midY} stroke="#283445" strokeWidth="1" strokeDasharray="2 4" />
        <text x={W - PAD.right + 4} y={midY + 3} fill="#64748b" fontSize="9" fontFamily="JetBrains Mono, monospace">0</text>

        {/* Histogram */}
        {data.map((d, i) => {
          if (d.histogram === null) return null;
          const x = scaleX(i, len);
          const y = scaleY(d.histogram);
          const pos = d.histogram >= 0;
          return (
            <rect
              key={i}
              x={x - 1.5}
              y={pos ? y : midY}
              width={3}
              height={Math.abs(midY - y)}
              fill={pos ? '#10b981' : '#f43f5e'}
              opacity="0.5"
            />
          );
        })}

        {/* MACD & signal lines */}
        <path d={macdPath} fill="none" stroke="#38bdf8" strokeWidth="1.5" />
        <path d={signalPath} fill="none" stroke="#f59e0b" strokeWidth="1.5" />

        {/* Legend */}
        <g>
          <line x1={PAD.left + 4} y1={PAD.top + 4} x2={PAD.left + 16} y2={PAD.top + 4} stroke="#38bdf8" strokeWidth="1.5" />
          <text x={PAD.left + 20} y={PAD.top + 7} fill="#38bdf8" fontSize="9" fontFamily="JetBrains Mono, monospace">MACD</text>
          <line x1={PAD.left + 56} y1={PAD.top + 4} x2={PAD.left + 68} y2={PAD.top + 4} stroke="#f59e0b" strokeWidth="1.5" />
          <text x={PAD.left + 72} y={PAD.top + 7} fill="#f59e0b" fontSize="9" fontFamily="JetBrains Mono, monospace">Signal</text>
        </g>
      </svg>
    </div>
  );
}
