import { useMemo, useState } from 'react';
import { GitCompareArrows, ArrowRight, Plus, Check, Zap } from 'lucide-react';
import { PriceChart } from '@/components/charts/PriceChart';
import { ChangeBadge } from '@/components/ui/ChangeBadge';
import { commodities } from '@/lib/mockData';
import { formatPct, formatTRY, trendColor } from '@/lib/format';
import type { Commodity } from '@/types';
import { useMarket } from '@/context/MarketContext';
import { cn } from '@/lib/cn';

export function Compare() {
  const [aId, setAId] = useState(commodities[0].id);
  const [bId, setBId] = useState(commodities[3].id);
  const { data } = useMarket();
  const { sulama: sulamaVeri, tohum: tohumVeri, gubre: gubreVeri, mazot: mazotVeri } = data;
  const sulamaCarpan = sulamaVeri.endIndex / 1512.8;
  const tohumCarpan = tohumVeri.endIndex / 1298.8;
  const gubreCarpan = gubreVeri.endIndex / 2234.1;
  const mazotCarpan = mazotVeri.endIndex / 1641.3;

  const a = useMemo(() => commodities.find((c) => c.id === aId)!, [aId]);
  const b = useMemo(() => commodities.find((c) => c.id === bId)!, [bId]);

  const adjustCost = (c: Commodity) =>
    c.costBreakdown.map((item) => {
      if (item.label === 'Sulama') return { ...item, amount: Math.round(item.amount * sulamaCarpan) };
      if (item.label === 'Tohum') return { ...item, amount: Math.round(item.amount * tohumCarpan) };
      if (item.label === 'Gübre') return { ...item, amount: Math.round(item.amount * gubreCarpan) };
      if (item.label === 'Mazot/Makine') return { ...item, amount: Math.round(item.amount * mazotCarpan) };
      return item;
    });

  const aCostAdjusted = useMemo(() => adjustCost(a), [a, sulamaCarpan, tohumCarpan, gubreCarpan, mazotCarpan]);
  const bCostAdjusted = useMemo(() => adjustCost(b), [b, sulamaCarpan, tohumCarpan, gubreCarpan, mazotCarpan]);

  const aCost = aCostAdjusted.reduce((s, c) => s + c.amount, 0);
  const bCost = bCostAdjusted.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="space-y-5">
      <div className="card overflow-visible p-4">
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <ProductPicker label="Ürün A" value={aId} onChange={setAId} exclude={bId} accent="emerald" />
          <div className="hidden items-center justify-center sm:flex">
            <GitCompareArrows className="h-6 w-6 text-slate-500" />
          </div>
          <ProductPicker label="Ürün B" value={bId} onChange={setBId} exclude={aId} accent="sky" />
        </div>
      </div>

      {/* Karşılaştırma başlık kartları */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CompareHeader c={a} accent="emerald" />
        <CompareHeader c={b} accent="sky" />
      </div>

      {/* Yan yana interaktif fiyat grafikleri */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="card p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> {a.name} — Fiyat Eğilimi
          </h3>
          <PriceChart
            data={a.priceHistory}
            unit={a.unit}
            color="#10b981"
            height={180}
            defaultRange="3A"
            showBrush={false}
            showVolume={false}
          />
        </div>
        <div className="card p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-400" /> {b.name} — Fiyat Eğilimi
          </h3>
          <PriceChart
            data={b.priceHistory}
            unit={b.unit}
            color="#38bdf8"
            height={180}
            defaultRange="3A"
            showBrush={false}
            showVolume={false}
          />
        </div>
      </div>

      {/* Karşılaştırma tablosu */}
      <div className="card overflow-hidden">
        <div className="grid grid-cols-3 border-b border-ink-700/60 bg-ink-850/60 text-xs uppercase tracking-wider text-slate-500">
          <div className="px-4 py-2.5 font-medium">Ölçüt</div>
          <div className="px-4 py-2.5 text-right font-medium text-emerald-400">{a.name}</div>
          <div className="px-4 py-2.5 text-right font-medium text-sky-400">{b.name}</div>
        </div>
        <CompareRow label="Güncel Fiyat" a={`${a.price.toLocaleString('tr-TR')} ${a.unit}`} b={`${b.price.toLocaleString('tr-TR')} ${b.unit}`} />
        <CompareRow label="Günlük Değişim" a={<ChangeBadge value={a.changeDay} />} b={<ChangeBadge value={b.changeDay} />} />
        <CompareRow label="Aylık Değişim" a={<span className={trendColor(a.changeMonth)}>{formatPct(a.changeMonth)}</span>} b={<span className={trendColor(b.changeMonth)}>{formatPct(b.changeMonth)}</span>} />
        <CompareRow label="Yıllık Değişim" a={<span className={trendColor(a.changeYear)}>{formatPct(a.changeYear)}</span>} b={<span className={trendColor(b.changeYear)}>{formatPct(b.changeYear)}</span>} />
        <CompareRow label="Toplam Maliyet (dekar)" a={formatTRY(aCost)} b={formatTRY(bCost)} highlight={aCost < bCost ? 'a' : 'b'} />
        <CompareRow
          label="Dekar Verim"
          a={a.yieldPerDekar > 0 ? `${a.yieldPerDekar} ${a.yieldUnit}` : '—'}
          b={b.yieldPerDekar > 0 ? `${b.yieldPerDekar} ${b.yieldUnit}` : '—'}
          highlight={a.yieldPerDekar > b.yieldPerDekar ? 'a' : 'b'}
        />
        <CompareRow
          label="Kârlılık Oranı"
          a={`${a.profitabilityRatio.toFixed(2)}x`}
          b={`${b.profitabilityRatio.toFixed(2)}x`}
          highlight={a.profitabilityRatio > b.profitabilityRatio ? 'a' : 'b'}
        />
        <CompareRow
          label="Verimlilik Skoru"
          a={`${a.efficiencyScore}/100`}
          b={`${b.efficiencyScore}/100`}
          highlight={a.efficiencyScore > b.efficiencyScore ? 'a' : 'b'}
        />
        <CompareRow label="Bölge" a={a.region} b={b.region} />
        <CompareRow label="Hasat Dönemi" a={a.harvestMonths} b={b.harvestMonths} last />
      </div>

      {/* Maliyet karşılaştırma bar chart */}
      <div className="card p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
          Maliyet Kalemleri Karşılaştırması
          {sulamaVeri?.isReal && (
            <span className="flex items-center gap-0.5 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-medium text-emerald-300 ring-1 ring-emerald-500/20">
              <Zap className="h-2.5 w-2.5" /> Sulama canlı
            </span>
          )}
        </h3>
        <div className="space-y-3">
          {unionLabels(a, b).map((label) => {
            const av = aCostAdjusted.find((c) => c.label === label)?.amount ?? 0;
            const bv = bCostAdjusted.find((c) => c.label === label)?.amount ?? 0;
            const maxV = Math.max(av, bv, 1);
            return (
              <div key={label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slate-400">{label}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-800">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(av / maxV) * 100}%` }} />
                    </div>
                    <span className="tabular w-20 text-right text-xs text-slate-400">{formatTRY(av)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-800">
                      <div className="h-full rounded-full bg-sky-400" style={{ width: `${(bv / maxV) * 100}%` }} />
                    </div>
                    <span className="tabular w-20 text-right text-xs text-slate-400">{formatTRY(bv)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function unionLabels(a: Commodity, b: Commodity): string[] {
  const set = new Set<string>([...a.costBreakdown.map((c) => c.label), ...b.costBreakdown.map((c) => c.label)]);
  return Array.from(set);
}

function CompareHeader({ c, accent }: { c: Commodity; accent: 'emerald' | 'sky' }) {
  const ring = accent === 'emerald' ? 'ring-emerald-500/30' : 'ring-sky-500/30';
  const dot = accent === 'emerald' ? 'bg-emerald-400' : 'bg-sky-400';
  return (
    <div className={cn('card p-4 ring-1', ring)}>
      <div className="flex items-center gap-2">
        <span className={cn('h-3 w-3 rounded-full', dot)} />
        <span className="text-sm font-semibold text-white">{c.name}</span>
        <span className="ml-auto text-xs text-slate-500">{c.category}</span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="tabular text-2xl font-bold text-white">{c.price.toLocaleString('tr-TR')}</span>
        <span className="text-xs text-slate-500">{c.unit}</span>
        <ChangeBadge value={c.changeDay} className="ml-auto" />
      </div>
    </div>
  );
}

function CompareRow({
  label,
  a,
  b,
  highlight,
  last,
}: {
  label: string;
  a: React.ReactNode;
  b: React.ReactNode;
  highlight?: 'a' | 'b';
  last?: boolean;
}) {
  return (
    <div className={cn('grid grid-cols-3 items-center text-sm hover:bg-ink-800/20', !last && 'border-b border-ink-800/50')}>
      <div className="px-4 py-3 text-slate-400">{label}</div>
      <div className={cn('px-4 py-3 text-right tabular', highlight === 'a' && 'font-semibold text-emerald-400')}>
        {highlight === 'a' && <Check className="mr-1 inline h-3.5 w-3.5 text-emerald-400" />}
        {a}
      </div>
      <div className={cn('px-4 py-3 text-right tabular', highlight === 'b' && 'font-semibold text-sky-400')}>
        {highlight === 'b' && <Check className="mr-1 inline h-3.5 w-3.5 text-sky-400" />}
        {b}
      </div>
    </div>
  );
}

function ProductPicker({
  label,
  value,
  onChange,
  exclude,
  accent,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
  exclude: string;
  accent: 'emerald' | 'sky';
}) {
  const [open, setOpen] = useState(false);
  const cur = commodities.find((c) => c.id === value)!;
  const ring = accent === 'emerald' ? 'ring-emerald-500/40' : 'ring-sky-500/40';
  return (
    <div className="relative flex-1">
      <div className="mb-1 stat-label">{label}</div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn('ring-focus flex w-full items-center justify-between rounded-lg border border-ink-700 bg-ink-850 px-3 py-2.5 text-left text-sm ring-1', ring)}
      >
        <span className="font-medium text-white">{cur.name}</span>
        <Plus className={cn('h-4 w-4 text-slate-500 transition-transform', open && 'rotate-45')} />
      </button>
      {open && (
        <>
        <div className="fixed inset-0 z-[99998]" onClick={() => setOpen(false)} />
        <div className="absolute z-[99999] mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-ink-700 bg-ink-900 p-1 shadow-2xl pointer-events-auto">
          {commodities
            .filter((c) => c.id !== exclude)
            .map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  onChange(c.id);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-ink-800',
                  c.id === value ? 'text-emerald-300' : 'text-slate-300',
                )}
              >
                {c.name}
                <span className="text-xs text-slate-600">{c.category}</span>
              </button>
            ))}
        </div>
        </>
      )}
    </div>
  );
}
