import { useMemo, useState } from 'react';
import { Calculator, Filter, Sparkles, TrendingUp, Coins, Gauge, ArrowRight, FileText } from 'lucide-react';
import { commodities, screenFilters } from '@/lib/mockData';
import { formatPct, formatTRY, trendColor } from '@/lib/format';
import type { Commodity } from '@/types';
import { cn } from '@/lib/cn';
import { ReportModal, type ReportData } from '@/components/ReportModal';

export function CalculatorPage() {
  return (
    <div className="space-y-6">
      <ProfitSimulator />
      <Screener />
    </div>
  );
}

function ProfitSimulator() {
  const [productId, setProductId] = useState(commodities[0].id);
  const [area, setArea] = useState(100); // dekar
  const [yieldPerDekar, setYieldPerDekar] = useState(commodities[0].yieldPerDekar || 500);
  const [price, setPrice] = useState(commodities[0].price);
  const [costPerDekar, setCostPerDekar] = useState(
    commodities[0].costBreakdown.reduce((s, c) => s + c.amount, 0),
  );

  const product = commodities.find((c) => c.id === productId)!;

  const recalc = (id: string) => {
    const c = commodities.find((x) => x.id === id)!;
    setProductId(id);
    setYieldPerDekar(c.yieldPerDekar || 500);
    setPrice(c.price);
    setCostPerDekar(c.costBreakdown.reduce((s, x) => s + x.amount, 0));
  };

  const revenue = area * yieldPerDekar * price;
  const totalCost = area * costPerDekar;
  const netProfit = revenue - totalCost;
  const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
  const breakEvenYield = price > 0 ? costPerDekar / price : 0;

  const [reportOpen, setReportOpen] = useState(false);

  const reportData: ReportData = {
    commodity: product,
    costBreakdown: product.costBreakdown,
    totalCost: costPerDekar,
    revenuePerDekar: yieldPerDekar * price,
    profitPerDekar: yieldPerDekar * price - costPerDekar,
    margin,
    area,
    totalRevenue: revenue,
    totalCostScaled: totalCost,
    netProfit,
    roi,
    breakEvenYield,
  };

  return (
    <div className="card p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
        <Calculator className="h-4 w-4 text-emerald-400" />
        Dekar Başına Karlılık Simülasyonu
      </h3>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Form */}
        <div className="space-y-4">
          <Field label="Ürün Seçimi">
            <select
              value={productId}
              onChange={(e) => recalc(e.target.value)}
              className="ring-focus w-full rounded-lg border border-ink-700 bg-ink-850 px-3 py-2.5 text-sm text-slate-200"
            >
              {commodities.map((c) => (
                <option key={c.id} value={c.id} className="bg-ink-900">
                  {c.name} — {c.category}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Ekim Alanı (dekar)">
              <NumberInput value={area} onChange={setArea} step={10} />
            </Field>
            <Field label="Dekar Verim (kg/lt)">
              <NumberInput value={yieldPerDekar} onChange={setYieldPerDekar} step={10} />
            </Field>
            <Field label="Satış Fiyatı (₺)">
              <NumberInput value={price} onChange={setPrice} step={0.1} decimals={2} />
            </Field>
            <Field label="Dekar Maliyet (₺)">
              <NumberInput value={costPerDekar} onChange={setCostPerDekar} step={50} />
            </Field>
          </div>

          <div className="rounded-lg border border-ink-700/50 bg-ink-850/50 p-3 text-xs text-slate-400">
            <div className="mb-1 flex items-center gap-1.5 font-medium text-slate-300">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" /> Otomatik dolduruldu
            </div>
            {product.name} için güncel piyasa fiyatı, tahmini verim ve maliyet kalemleri referans alınmıştır. Değerleri kendi koşullarınıza göre düzenleyebilirsiniz.
          </div>
        </div>

        {/* Sonuç */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <ResultTile label="Toplam Hasılat" value={formatTRY(revenue)} icon={<Coins className="h-4 w-4" />} accent="slate" />
            <ResultTile label="Toplam Maliyet" value={formatTRY(totalCost)} icon={<Calculator className="h-4 w-4" />} accent="amber" />
          </div>
          <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-4">
            <div className="stat-label text-emerald-300/80">Net Kâr</div>
            <div className={cn('mt-1 tabular text-3xl font-bold', netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
              {formatTRY(netProfit)}
            </div>
            <div className="mt-3 flex gap-4 text-xs">
              <div>
                <span className="text-slate-400">Kâr Marjı </span>
                <span className={cn('tabular font-semibold', margin >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                  {margin.toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-slate-400">Yatırım Getirisi (ROI) </span>
                <span className={cn('tabular font-semibold', roi >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                  {roi.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ResultTile
              label="Başabaş Verim"
              value={`${breakEvenYield.toFixed(0)} kg/dkr`}
              icon={<Gauge className="h-4 w-4" />}
              accent="slate"
              sub="Kâr için gereken min. verim"
            />
            <ResultTile
              label="Dekar Net Kâr"
              value={formatTRY(netProfit / area)}
              icon={<TrendingUp className="h-4 w-4" />}
              accent={netProfit >= 0 ? 'emerald' : 'rose'}
            />
          </div>
        </div>
      </div>
      <button
        onClick={() => setReportOpen(true)}
        className="ring-focus mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-400 hover:to-emerald-500"
      >
        <FileText className="h-4 w-4" />
        Kapsamlı Ürün Raporu İndir (PDF)
      </button>
      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} data={reportData} />
    </div>
  );
}

function Screener() {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const preds = screenFilters.filter((f) => activeFilters.includes(f.id));
    return commodities.filter((c) => preds.every((p) => p.predicate(c)));
  }, [activeFilters]);

  const toggle = (id: string) =>
    setActiveFilters((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-white">Akıllı Ürün Screener</h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {screenFilters.map((f) => {
          const active = activeFilters.includes(f.id);
          return (
            <button
              key={f.id}
              onClick={() => toggle(f.id)}
              title={f.description}
              className={cn(
                'group rounded-lg border px-3 py-2 text-left text-xs transition-all',
                active
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                  : 'border-ink-700 bg-ink-850 text-slate-400 hover:border-ink-600 hover:text-slate-200',
              )}
            >
              <div className="flex items-center gap-1.5 font-medium">
                <span className={cn('h-2 w-2 rounded-full', active ? 'bg-emerald-400' : 'bg-slate-600')} />
                {f.label}
              </div>
              <div className="mt-0.5 text-[10px] text-slate-500">{f.description}</div>
            </button>
          );
        })}
        {activeFilters.length > 0 && (
          <button
            onClick={() => setActiveFilters([])}
            className="rounded-lg border border-ink-700 bg-ink-850 px-3 py-2 text-xs text-slate-400 hover:text-rose-400"
          >
            Filtreleri temizle ({activeFilters.length})
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-6 gap-2 border-b border-ink-700/60 bg-ink-850/60 px-4 py-2.5 text-xs uppercase tracking-wider text-slate-500">
          <div className="font-medium">Ürün</div>
          <div className="text-right font-medium">Fiyat</div>
          <div className="text-right font-medium">Maliyet/dkr</div>
          <div className="text-right font-medium">Kâr Oranı</div>
          <div className="text-right font-medium">Verimlilik</div>
          <div className="text-right font-medium">Hafta</div>
        </div>
        <div className="divide-y divide-ink-800/50">
          {filtered.map((c) => (
            <ScreenerRow key={c.id} c={c} />
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              Seçili filtrelerle eşleşen ürün yok. Filtreleri gevşetin.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScreenerRow({ c }: { c: Commodity }) {
  const cost = c.costBreakdown.reduce((s, x) => s + x.amount, 0);
  return (
    <div className="grid grid-cols-6 items-center gap-2 px-4 py-3 text-sm transition-colors hover:bg-ink-800/30">
      <div className="min-w-0">
        <div className="truncate font-medium text-slate-200">{c.name}</div>
        <div className="text-[10px] text-slate-600">{c.category}</div>
      </div>
      <div className="text-right tabular text-white">
        {c.price.toLocaleString('tr-TR')} <span className="text-[10px] text-slate-600">{c.unit}</span>
      </div>
      <div className="text-right tabular text-slate-300">{formatTRY(cost)}</div>
      <div className="text-right tabular font-medium text-emerald-400">{c.profitabilityRatio.toFixed(2)}x</div>
      <div className="text-right tabular text-slate-300">{c.efficiencyScore}/100</div>
      <div className={cn('text-right tabular font-medium', trendColor(c.changeWeek))}>{formatPct(c.changeWeek)}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 stat-label">{label}</div>
      {children}
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  step = 1,
  decimals = 0,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  decimals?: number;
}) {
  return (
    <div className="relative">
      <input
        type="number"
        value={value}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="ring-focus tabular w-full rounded-lg border border-ink-700 bg-ink-850 px-3 py-2.5 text-sm text-white"
      />
      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 flex-col">
        <button
          onClick={() => onChange(Number((value + step).toFixed(decimals)))}
          className="text-slate-600 hover:text-emerald-400"
          aria-label="Artır"
        >
          <ArrowRight className="h-3 w-3 -rotate-90" />
        </button>
        <button
          onClick={() => onChange(Number((value - step).toFixed(decimals)))}
          className="text-slate-600 hover:text-emerald-400"
          aria-label="Azalt"
        >
          <ArrowRight className="h-3 w-3 rotate-90" />
        </button>
      </div>
    </div>
  );
}

function ResultTile({
  label,
  value,
  icon,
  accent,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: 'emerald' | 'rose' | 'amber' | 'slate';
  sub?: string;
}) {
  const colors = {
    emerald: 'text-emerald-400',
    rose: 'text-rose-400',
    amber: 'text-amber-400',
    slate: 'text-slate-200',
  };
  return (
    <div className="rounded-xl border border-ink-700/50 bg-ink-850/50 p-3">
      <div className="flex items-center gap-1.5 text-slate-500">
        {icon}
        <span className="stat-label">{label}</span>
      </div>
      <div className={cn('mt-1 tabular text-lg font-bold', colors[accent])}>{value}</div>
      {sub && <div className="mt-0.5 text-[10px] text-slate-600">{sub}</div>}
    </div>
  );
}
