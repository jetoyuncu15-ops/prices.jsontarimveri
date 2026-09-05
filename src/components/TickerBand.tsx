import { useEffect, useRef, useState, useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { tickerItems as initialTicker } from '@/lib/mockData';
import { useHalTicker } from '@/hooks/useHalData';
import { formatPct } from '@/lib/format';
import { useNav } from '@/App';
import { cn } from '@/lib/cn';

export function TickerBand() {
  const { items: halItems } = useHalTicker(40);
  const { goProduct } = useNav();
  const [driftItems, setDriftItems] = useState(initialTicker);
  const containerRef = useRef<HTMLDivElement>(null);

  const merged = useMemo(() => {
    const halMapped = halItems.map((h) => ({
      name: h.name,
      displayName: `${h.name} (Hal)`,
      price: h.price,
      unit: h.unit,
      changePct: h.changePct,
      isHal: true,
    }));
    const tickerMapped = driftItems.map((it) => ({
      name: it.name,
      displayName: it.name,
      price: it.price,
      unit: it.unit,
      changePct: it.changePct,
      isHal: false,
    }));
    return [...halMapped, ...tickerMapped];
  }, [halItems, driftItems]);

  useEffect(() => {
    const id = setInterval(() => {
      setDriftItems((prev) =>
        prev.map((it) => {
          const drift = (Math.random() - 0.5) * 0.08;
          const newChange = Number((it.changePct + drift).toFixed(2));
          return {
            ...it,
            changePct: Math.max(-9, Math.min(9, newChange)),
            price: Number((it.price * (1 + drift / 100)).toFixed(2)),
          };
        }),
      );
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const loop = [...merged, ...merged];

  return (
    <div className="relative overflow-hidden border-y border-ink-700/60 bg-ink-900/80">
      <div className="mask-fade-x flex">
        <div ref={containerRef} className="flex animate-ticker whitespace-nowrap py-2 will-change-transform">
          {loop.map((it, i) => {
            const up = it.changePct >= 0;
            return (
              <button
                key={i}
                onClick={() => goProduct(it.name, 'technical')}
                className="flex items-center gap-2 px-5 text-sm transition-colors hover:bg-ink-800/40"
                title={`${it.name} — Teknik Analiz'e git`}
              >
                <span className="font-medium text-slate-200">{it.displayName}</span>
                <span className="tabular text-slate-400">
                  {it.price.toLocaleString('tr-TR')} <span className="text-slate-600">{it.unit}</span>
                </span>
                <span className={cn('tabular flex items-center gap-0.5 font-medium', up ? 'text-emerald-400' : 'text-rose-400')}>
                  {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {formatPct(it.changePct)}
                </span>
                {it.isHal && (
                  <span className="rounded bg-amber-500/10 px-1 py-0.5 text-[8px] font-semibold uppercase text-amber-300 ring-1 ring-amber-500/20">
                    Canlı Hal
                  </span>
                )}
                <span className="ml-2 h-3 w-px bg-ink-600" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
