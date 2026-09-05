import { useMemo, useState } from 'react';
import { Search, X, TrendingUp, Coins, Gauge, MapPin, Calendar, Wheat, Zap, ArrowUpRight, FileText } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Sparkline } from '@/components/charts/LineChart';
import { PriceChart } from '@/components/charts/PriceChart';
import { ChangeBadge } from '@/components/ui/ChangeBadge';
import { activeGroupProducts, productGroups } from '@/lib/mockData';
import { formatPct, formatTRY, trendColor } from '@/lib/format';
import type { Commodity } from '@/types';
import { useMarket } from '@/context/MarketContext';
import { useNav } from '@/App';
import { cn } from '@/lib/cn';
import { ReportModal, type ReportData } from '@/components/ReportModal';

function IconFor({ name }: { name: string }) {
  const Cmp = (Icons as unknown as Record<string, Icons.LucideIcon>)[name.trim()] ?? Wheat;
  return <Cmp className="h-5 w-5" />;
}

export function Commodities() {
  const [query, setQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<number>(0);
  const [selected, setSelected] = useState<Commodity | null>(null);
  const { goTechnical } = useNav();

  const filtered = useMemo(
    () =>
      activeGroupProducts.filter(
        (c) =>
          (selectedGroup === 0 ||
            productGroups.find((g) => g.id === selectedGroup)?.productIds.includes(c.id)) &&
          c.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, selectedGroup],
  );

  return (
    <div className="space-y-5">
      {/* Filtre çubuğu */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300 ring-1 ring-emerald-500/20">
            {filtered.length} ürün
          </span>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(Number(e.target.value))}
            className="ring-focus rounded-lg border border-ink-700 bg-ink-850 px-3 py-1.5 text-sm text-slate-200"
          >
            <option value={0} className="bg-ink-900">Tüm Gruplar</option>
            {productGroups.map((g) => (
              <option key={g.id} value={g.id} className="bg-ink-900">
                {g.id}. {g.name}
              </option>
            ))}
          </select>
        </div>
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ürün ara..."
            className="ring-focus w-full rounded-lg border border-ink-700 bg-ink-850 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* Ürün kartları */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((c) => (
          <div
            key={c.id}
            role="button"
            tabIndex={0}
            onClick={() => setSelected(c)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') setSelected(c);
            }}
            className="card card-hover group cursor-pointer p-4 text-left"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
                  <IconFor name={c.icon} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{c.name}</div>
                  <div className="text-xs text-slate-500">{c.category}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ChangeBadge value={c.changeDay} />
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    goTechnical(c.id);
                  }}
                  className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 px-2 py-1 text-[10px] font-semibold text-sky-300 ring-1 ring-sky-500/20 transition-colors hover:bg-sky-500/20 hover:text-sky-200"
                  title={`${c.name} teknik analizini gör`}
                >
                  <ArrowUpRight className="h-3 w-3" /> Teknik Analiz Gör
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="tabular text-2xl font-bold text-white">
                {c.price.toLocaleString('tr-TR')}
              </span>
              <span className="text-xs text-slate-500">{c.unit}</span>
            </div>

            <div className="mt-3">
              <Sparkline data={c.history} color={c.changeDay >= 0 ? '#10b981' : '#f43f5e'} width={280} height={40} />
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
              {[
                { l: 'Gün', v: c.changeDay },
                { l: 'Hafta', v: c.changeWeek },
                { l: 'Ay', v: c.changeMonth },
                { l: 'Yıl', v: c.changeYear },
              ].map((x) => (
                <div key={x.l} className="rounded-md bg-ink-850/60 py-1.5">
                  <div className="text-[10px] uppercase text-slate-600">{x.l}</div>
                  <div className={cn('tabular text-xs font-medium', trendColor(x.v))}>{formatPct(x.v)}</div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-ink-700/50 pt-3 text-xs">
              <span className="flex items-center gap-1 text-slate-500">
                <Gauge className="h-3.5 w-3.5" /> Verim: <span className="text-slate-300">{c.efficiencyScore}</span>
              </span>
              <span className="flex items-center gap-1 text-slate-500">
                <Coins className="h-3.5 w-3.5" /> Kâr oranı: <span className="text-emerald-400">{c.profitabilityRatio.toFixed(2)}x</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card p-10 text-center text-slate-500">Aramanızla eşleşen ürün bulunamadı.</div>
      )}

      {selected && <DetailDrawer commodity={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function DetailDrawer({ commodity, onClose }: { commodity: Commodity; onClose: () => void }) {
  const { data } = useMarket();
  const { sulama: sulamaVeri, tohum: tohumVeri, gubre: gubreVeri, mazot: mazotVeri } = data;
  const sulamaCarpan = sulamaVeri.endIndex / 1512.8;
  const tohumCarpan = tohumVeri.endIndex / 1298.8;
  const gubreCarpan = gubreVeri.endIndex / 2234.1;
  const mazotCarpan = mazotVeri.endIndex / 1641.3;

  const adjustedCostBreakdown = useMemo(
    () =>
      commodity.costBreakdown.map((c) => {
        if (c.label === 'Sulama') return { ...c, amount: Math.round(c.amount * sulamaCarpan) };
        if (c.label === 'Tohum') return { ...c, amount: Math.round(c.amount * tohumCarpan) };
        if (c.label === 'Gübre') return { ...c, amount: Math.round(c.amount * gubreCarpan) };
        if (c.label === 'Mazot/Makine') return { ...c, amount: Math.round(c.amount * mazotCarpan) };
        return c;
      }),
    [commodity.costBreakdown, sulamaCarpan, tohumCarpan, gubreCarpan, mazotCarpan],
  );

  const totalCost = adjustedCostBreakdown.reduce((s, c) => s + c.amount, 0);
  const revenuePerDekar =
    commodity.yieldPerDekar > 0 ? commodity.yieldPerDekar * commodity.price : 0;
  const profitPerDekar = revenuePerDekar - totalCost;
  const margin = revenuePerDekar > 0 ? (profitPerDekar / revenuePerDekar) * 100 : 0;

  const [reportOpen, setReportOpen] = useState(false);

  const reportData: ReportData = {
    commodity,
    costBreakdown: adjustedCostBreakdown,
    totalCost,
    revenuePerDekar,
    profitPerDekar,
    margin,
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col border-l border-ink-700 bg-ink-900 shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-700/60 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
              <IconFor name={commodity.icon} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">{commodity.name}</h3>
              <p className="text-xs text-slate-500">{commodity.category}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-ink-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {/* Rapor butonu */}
          <button
            onClick={() => setReportOpen(true)}
            className="ring-focus flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-400 hover:to-emerald-500"
          >
            <FileText className="h-4 w-4" />
            Kapsamlı Ürün Raporu İndir (PDF)
          </button>
          {/* Fiyat + değişim */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="card p-3">
              <div className="stat-label">Güncel Fiyat</div>
              <div className="mt-1 tabular text-lg font-bold text-white">
                {commodity.price.toLocaleString('tr-TR')}
                <span className="ml-1 text-xs text-slate-500">{commodity.unit}</span>
              </div>
            </div>
            <div className="card p-3">
              <div className="stat-label">Aylık</div>
              <div className={cn('mt-1 tabular text-lg font-bold', trendColor(commodity.changeMonth))}>
                {formatPct(commodity.changeMonth)}
              </div>
            </div>
            <div className="card p-3">
              <div className="stat-label">Yıllık</div>
              <div className={cn('mt-1 tabular text-lg font-bold', trendColor(commodity.changeYear))}>
                {formatPct(commodity.changeYear)}
              </div>
            </div>
            <div className="card p-3">
              <div className="stat-label">Kâr Oranı</div>
              <div className="mt-1 tabular text-lg font-bold text-emerald-400">
                {commodity.profitabilityRatio.toFixed(2)}x
              </div>
            </div>
          </div>

          {/* Geçmiş fiyat grafiği — interaktif Recharts */}
          <div className="card p-4">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              Geçmiş Fiyat Değişimi
            </h4>
            <PriceChart
              data={commodity.priceHistory}
              unit={commodity.unit}
              color="#10b981"
              height={240}
              defaultRange="3A"
              showBrush
              showVolume
            />
          </div>

          {/* Meta bilgiler */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex items-center gap-2 rounded-lg border border-ink-700/50 bg-ink-850/50 p-3 text-sm">
              <MapPin className="h-4 w-4 text-slate-500" />
              <div>
                <div className="stat-label">Bölge</div>
                <div className="text-slate-200">{commodity.region}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-ink-700/50 bg-ink-850/50 p-3 text-sm">
              <Calendar className="h-4 w-4 text-slate-500" />
              <div>
                <div className="stat-label">Hasat</div>
                <div className="text-slate-200">{commodity.harvestMonths}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-ink-700/50 bg-ink-850/50 p-3 text-sm">
              <Gauge className="h-4 w-4 text-slate-500" />
              <div>
                <div className="stat-label">Verimlilik</div>
                <div className="text-slate-200">{commodity.efficiencyScore}/100</div>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-ink-700/50 bg-ink-850/50 p-3 text-sm">
              <Wheat className="h-4 w-4 text-slate-500" />
              <div>
                <div className="stat-label">Dekar Verim</div>
                <div className="text-slate-200">
                  {commodity.yieldPerDekar > 0 ? `${commodity.yieldPerDekar} ${commodity.yieldUnit}` : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Üretim maliyeti dökümü */}
          <div className="card p-4">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              Üretim Maliyeti Dökümü (dekar başı)
              {sulamaVeri?.isReal && (
                <span className="flex items-center gap-0.5 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-medium text-emerald-300 ring-1 ring-emerald-500/20">
                  <Zap className="h-2.5 w-2.5" /> Sulama canlı
                </span>
              )}
            </h4>
            <div className="space-y-2.5">
              {adjustedCostBreakdown.map((c) => (
                <div key={c.label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-slate-300">{c.label}</span>
                    <span className="tabular text-slate-400">
                      {formatTRY(c.amount)} <span className="text-slate-600">· %{c.sharePct}</span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                      style={{ width: `${c.sharePct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-ink-700/50 pt-3 text-sm">
              <span className="font-medium text-slate-300">Toplam Maliyet</span>
              <span className="tabular text-base font-bold text-white">{formatTRY(totalCost)}</span>
            </div>
          </div>

          {/* Kârlılık özeti */}
          {revenuePerDekar > 0 && (
            <div className="card bg-emerald-500/5 p-4 ring-1 ring-emerald-500/20">
              <h4 className="mb-3 text-sm font-semibold text-emerald-300">Tahmini Kârlılık (dekar başı)</h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="stat-label">Hasılata</div>
                  <div className="tabular text-base font-bold text-white">{formatTRY(revenuePerDekar)}</div>
                </div>
                <div>
                  <div className="stat-label">Net Kâr</div>
                  <div className="tabular text-base font-bold text-emerald-400">{formatTRY(profitPerDekar)}</div>
                </div>
                <div>
                  <div className="stat-label">Marj</div>
                  <div className="tabular text-base font-bold text-emerald-400">{margin.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} data={reportData} />
    </>
  );
}
