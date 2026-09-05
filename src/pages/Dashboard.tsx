import { useMemo } from 'react';
import { TrendingUp, Building2, Activity, Layers, ArrowRight, Zap, Store } from 'lucide-react';
import { LineChart, Sparkline } from '@/components/charts/LineChart';
import { ChangeBadge } from '@/components/ui/ChangeBadge';
import { StatCard } from '@/components/ui/StatCard';
import { indexMetrics, inputCostSeries, exchangeMarkets, commodities } from '@/lib/mockData';
import { formatNumber, formatPct, formatTRY, trendColor } from '@/lib/format';
import { useNav } from '@/App';
import { useMarket } from '@/context/MarketContext';
import { useHalMovers } from '@/hooks/useHalData';
import { cn } from '@/lib/cn';

export function Dashboard() {
  const { goExchange, goTechnical } = useNav();
  const { data } = useMarket();
  const { gubre: gubreVeri, mazot: mazotVeri, tohum: tohumVeri, sulama: sulamaVeri, iscilik: iscilikVeri, girdiMaliyet } = data;

  const inputChart = useMemo(
    () => inputCostSeries.map((p) => (p.gubre + p.mazot + p.tohum + p.iscilik + p.elektrik) / 5),
    [],
  );

  const girdiMaliyetEndeksi = girdiMaliyet.endIndex;
  const girdiMaliyetChange = girdiMaliyet.changePct;

  // Canlı verilerle endeks listesini güncelle
  const canliIndexler = useMemo(() => {
    return indexMetrics.map((m) => {
      if (m.id === 'girdi-maliyet') return { ...m, value: girdiMaliyet.endIndex, changePct: girdiMaliyet.changePct };
      if (m.id === 'gubre') return { ...m, value: gubreVeri.endIndex, changePct: gubreVeri.changePct };
      if (m.id === 'mazot') return { ...m, value: mazotVeri.endIndex, changePct: mazotVeri.changePct };
      if (m.id === 'elektrik') return {
        ...m,
        value: sulamaVeri.endIndex,
        changePct: sulamaVeri.changePct,
        description: sulamaVeri.isReal ? 'EPİAŞ canlı veri · Sulama Elektrik Endeksi' : m.description,
      };
      if (m.id === 'iscilik') return { ...m, value: iscilikVeri.endIndex, changePct: iscilikVeri.changePct };
      if (m.id === 'tohum') return { ...m, value: tohumVeri.endIndex, changePct: tohumVeri.changePct };
      return m;
    });
  }, [sulamaVeri, iscilikVeri, tohumVeri, gubreVeri, mazotVeri, girdiMaliyet]);

  const topMovers = useMemo(
    () => [...commodities].sort((a, b) => b.changeDay - a.changeDay).slice(0, 5),
    [],
  );

  const totalVolume = exchangeMarkets.reduce((s, m) => s + m.totalVolume, 0);

  // Öne çıkan borsalar (en yüksek hacimli 6)
  const featuredExchanges = useMemo(
    () => [...exchangeMarkets].sort((a, b) => b.totalVolume - a.totalVolume).slice(0, 6),
    [],
  );

  // Hal piyasasından canlı hareketler
  const { movers: halMovers, isReal: halIsReal } = useHalMovers(8);

  // Borsa hareketlerini topla
  const exchangeMovers = useMemo(() => {
    const all: { name: string; price: number; unit: string; changePct: number; category: string; source: 'borsa'; exchange: string }[] = [];
    exchangeMarkets.forEach((m) => {
      m.quotes.forEach((q) => {
        all.push({
          name: q.product,
          price: q.last,
          unit: q.unit,
          changePct: q.changePct,
          category: 'Borsa',
          source: 'borsa',
          exchange: m.name,
        });
      });
    });
    return all.sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));
  }, []);

  // Hal + Borsa birleştirilmiş dinamik hareketler
  const dynamicMovers = useMemo(() => {
    const halMapped = halMovers.map((h) => ({
      name: h.name,
      price: h.price,
      unit: h.unit,
      changePct: h.changePct,
      category: 'Hal Piyasası',
      source: 'hal' as const,
      exchange: 'Konya Toptancı Hal',
      history: [] as number[],
    }));
    const borsaMapped = exchangeMovers.slice(0, 10).map((e) => ({
      name: e.name,
      price: e.price,
      unit: e.unit,
      changePct: e.changePct,
      category: `${e.exchange}`,
      source: 'borsa' as const,
      exchange: e.exchange,
      history: [] as number[],
    }));
    return [...halMapped, ...borsaMapped]
      .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
      .slice(0, 12);
  }, [halMovers, exchangeMovers]);

  return (
    <div className="space-y-6">
      {/* Üst KPI şeridi */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Girdi Maliyet Endeksi"
          value={girdiMaliyet.endIndex.toFixed(1)}
          unit="puan"
          accent="amber"
          sub={
            <span className="flex items-center gap-1.5">
              <span className="flex items-center gap-0.5 rounded bg-amber-500/15 px-1 py-0.5 text-[9px] font-medium text-amber-300 ring-1 ring-amber-500/20">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" /> Canlı
              </span>
              <ChangeBadge value={girdiMaliyet.changePct} />
            </span>
          }
        />
        <StatCard
          label="Toplam Borsa Hacmi"
          value={formatNumber(totalVolume)}
          unit="ton"
          accent="emerald"
          sub={<span className="text-slate-500">{exchangeMarkets.length} borsa · bugün</span>}
        />
        <StatCard
          label="Yükselen Ürün"
          value={`${topMovers[0].name}`}
          sub={<ChangeBadge value={topMovers[0].changeDay} />}
          accent="emerald"
        />
        <StatCard
          label="Düşen Ürün"
          value={`${[...commodities].sort((a, b) => a.changeDay - b.changeDay)[0].name}`}
          sub={
            <ChangeBadge
              value={[...commodities].sort((a, b) => a.changeDay - b.changeDay)[0].changeDay}
            />
          }
          accent="rose"
        />
      </div>

      {/* Endeks + Girdi maliyet grafiği */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                <Activity className="h-4 w-4 text-emerald-400" />
                Girdi Maliyet Eğilimi (12 Ay)
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">Gübre, mazot, tohum ve işçilik bileşik endeksi</p>
            </div>
            <ChangeBadge value={4.2} size="md" />
          </div>
          <LineChart data={inputChart} color="#f59e0b" height={240} showGrid showAxis />
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            {[
              { label: 'Gübre', color: '#10b981' },
              { label: 'Mazot', color: '#f59e0b' },
              { label: 'Tohum', color: '#38bdf8' },
              { label: 'İşçilik', color: '#a78bfa' },
              { label: 'Elektrik/Sulama', color: '#f472b6' },
            ].map((l) => (
              <span key={l.label} className="flex items-center gap-1.5 text-slate-400">
                <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
                {l.label}
              </span>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <Layers className="h-4 w-4 text-emerald-400" />
            Tarımsal Endeksler
            <span className="ml-auto text-xs font-normal text-slate-500">Karta tıkla → analiz</span>
          </h3>
          <div className="space-y-3">
            {canliIndexler.map((m) => (
              <button
                key={m.id}
                onClick={() => goTechnical(m.id)}
                className="group flex w-full items-center justify-between rounded-lg border border-ink-700/50 bg-ink-850/50 p-3 text-left transition-all hover:border-emerald-500/30 hover:ring-1 hover:ring-emerald-500/20"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium text-slate-200">{m.name}</span>
                    {m.id === 'girdi-maliyet' && (
                      <span className="flex items-center gap-0.5 rounded bg-amber-500/15 px-1 py-0.5 text-[9px] font-medium text-amber-300 ring-1 ring-amber-500/20">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" /> Canlı
                      </span>
                    )}
                    {m.id === 'gubre' && (
                      <span className="flex items-center gap-0.5 rounded bg-amber-500/15 px-1 py-0.5 text-[9px] font-medium text-amber-300 ring-1 ring-amber-500/20">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" /> Canlı
                      </span>
                    )}
                    {m.id === 'mazot' && (
                      <span className="flex items-center gap-0.5 rounded bg-amber-500/15 px-1 py-0.5 text-[9px] font-medium text-amber-300 ring-1 ring-amber-500/20">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" /> Canlı
                      </span>
                    )}
                    {m.id === 'elektrik' && sulamaVeri?.isReal && (
                      <span className="flex items-center gap-0.5 rounded bg-emerald-500/15 px-1 py-0.5 text-[9px] font-medium text-emerald-300 ring-1 ring-emerald-500/20">
                        <Zap className="h-2.5 w-2.5" /> Canlı
                      </span>
                    )}
                    {m.id === 'iscilik' && (
                      <span className="flex items-center gap-0.5 rounded bg-violet-500/15 px-1 py-0.5 text-[9px] font-medium text-violet-300 ring-1 ring-violet-500/20">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" /> Canlı
                      </span>
                    )}
                    {m.id === 'tohum' && (
                      <span className="flex items-center gap-0.5 rounded bg-amber-500/15 px-1 py-0.5 text-[9px] font-medium text-amber-300 ring-1 ring-amber-500/20">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" /> Canlı
                      </span>
                    )}
                    <ArrowRight className="h-3 w-3 shrink-0 text-emerald-400 opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <div className="mt-0.5 flex items-baseline gap-1.5">
                    <span className="tabular text-base font-semibold text-white">
                      {m.value.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-slate-500">{m.unit}</span>
                    <ChangeBadge value={m.changePct} />
                  </div>
                </div>
                <Sparkline data={m.sparkline} color={m.changePct >= 0 ? '#10b981' : '#f43f5e'} width={70} height={28} />
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-ink-700/50 pt-3 text-[10px] text-slate-600">
            <span>{sulamaVeri.source}</span>
          </div>
        </div>
      </div>

      {/* Borsa piyasaları — öne çıkanlar */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Öne Çıkan Borsalar</h3>
          </div>
          <span className="text-xs text-slate-500">{exchangeMarkets.length} borsadan ilk 6 · Karta tıkla → detay</span>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featuredExchanges.map((market) => (
            <button
              key={market.name}
              onClick={() => goExchange(market.name)}
              className="card card-hover group w-full p-4 text-left transition-all hover:ring-1 hover:ring-emerald-500/30"
            >
              <div className="mb-3 flex items-center justify-between border-b border-ink-700/50 pb-3">
                <div>
                  <div className="text-sm font-semibold text-white">{market.name}</div>
                  <div className="text-xs text-slate-500">{market.city}</div>
                </div>
                <div className="text-right">
                  <div className="stat-label">Hacim</div>
                  <div className="tabular text-sm font-medium text-slate-300">
                    {formatNumber(market.totalVolume)} <span className="text-xs text-slate-600">ton</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {market.quotes.map((q) => (
                  <div key={q.symbol} className="flex items-center justify-between text-sm">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-slate-200">{q.product}</div>
                      <div className="tabular text-[10px] text-slate-600">{q.symbol}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="tabular font-medium text-white">
                        {q.last.toLocaleString('tr-TR')}
                        <span className="ml-1 text-[10px] text-slate-500">{q.unit}</span>
                      </span>
                      <ChangeBadge value={q.changePct} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-end gap-1 border-t border-ink-700/50 pt-2 text-xs font-medium text-emerald-400 transition-transform group-hover:translate-x-0.5">
                Borsa Detayı <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Günün öne çıkan hareketleri — hal + borsa dinamik */}
      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            Günün Öne Çıkan Hareketleri
          </h3>
          <div className="flex items-center gap-2 text-[10px]">
            {halIsReal && (
              <span className="flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-300 ring-1 ring-emerald-500/20">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Hal Canlı
              </span>
            )}
            <span className="flex items-center gap-1 rounded bg-sky-500/10 px-2 py-0.5 font-semibold text-sky-300 ring-1 ring-sky-500/20">
              <Store className="h-2.5 w-2.5" /> {exchangeMarkets.length} Borsa
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-700/50 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="pb-2 pr-4 font-medium">Ürün</th>
                <th className="pb-2 pr-4 font-medium">Kaynak</th>
                <th className="pb-2 pr-4 text-right font-medium">Fiyat</th>
                <th className="pb-2 pr-4 text-right font-medium">Değişim</th>
              </tr>
            </thead>
            <tbody>
              {dynamicMovers.map((m, i) => (
                <tr key={`${m.name}-${i}`} className="border-b border-ink-800/50 last:border-0 hover:bg-ink-800/30">
                  <td className="py-2.5 pr-4 font-medium text-slate-200">{m.name}</td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-[10px] font-medium',
                        m.source === 'hal'
                          ? 'bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20',
                      )}
                    >
                      {m.source === 'hal' ? 'Hal' : 'Borsa'}
                    </span>
                    <span className="ml-2 text-[10px] text-slate-600">{m.category}</span>
                  </td>
                  <td className="py-2.5 pr-4 text-right tabular text-white">
                    {m.price.toLocaleString('tr-TR')} <span className="text-xs text-slate-600">{m.unit}</span>
                  </td>
                  <td className={cn('py-2.5 pr-4 text-right tabular font-medium', trendColor(m.changePct))}>
                    {formatPct(m.changePct)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-center text-[11px] text-slate-600">
        Sunulan veriler tanıtım amaçlı mock simülasyon verisidir — gerçek işlem kararı içermez. {formatTRY(0, 0).replace('0,00', '')}
      </p>
    </div>
  );
}
