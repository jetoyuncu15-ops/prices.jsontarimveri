import { useMemo } from 'react';
import { Coins, TrendingUp, Gauge, MapPin, Scale, Wallet, Calculator, ArrowRight } from 'lucide-react';
import type { Commodity } from '@/types';
import { regionSupply } from '@/lib/mockData';
import { formatTRY, formatNumber, formatPct } from '@/lib/format';
import { cn } from '@/lib/cn';

interface ProductDetailPanelsProps {
  commodity: Commodity;
}

export function ProductDetailPanels({ commodity }: ProductDetailPanelsProps) {
  const totalCost = commodity.costBreakdown.reduce((s, c) => s + c.amount, 0);
  const maxCost = Math.max(...commodity.costBreakdown.map((c) => c.amount));

  // Sulama kalemi içindeki elektrik payı (su yoğun ürünlerde daha yüksek)
  const isWaterIntensive = ['misir', 'pamuk', 'aycicegi', 'antepfistigi', 'zeytinyagi'].includes(commodity.id);
  const sulamaEntry = commodity.costBreakdown.find((c) => c.label === 'Sulama');
  const elektrikShareOfSulama = isWaterIntensive ? 0.65 : 0.45;
  const elektrikAmount = sulamaEntry ? Math.round(sulamaEntry.amount * elektrikShareOfSulama) : 0;
  const elektrikSharePct = sulamaEntry ? Math.round(sulamaEntry.sharePct * elektrikShareOfSulama) : 0;

  const revenue = commodity.yieldPerDekar > 0 ? commodity.yieldPerDekar * commodity.price : 0;
  const netProfit = revenue - totalCost;
  const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
  const breakEvenYield = commodity.price > 0 ? totalCost / commodity.price : 0;

  // İlgili ürünün bölgesel arz-talep verisi
  const regionalData = useMemo(() => {
    const cName = commodity.name.toLowerCase();
    const matching = regionSupply
      .map((r) => {
        const prod = r.products.find((p) => p.name.toLowerCase().includes(cName) || cName.includes(p.name.toLowerCase()));
        return prod ? { city: r.city, supply: prod.supply, demand: prod.demand } : null;
      })
      .filter((x): x is { city: string; supply: number; demand: number } => x !== null);
    const totalSupply = matching.reduce((s, r) => s + r.supply, 0);
    const totalDemand = matching.reduce((s, r) => s + r.demand, 0);
    const netBalance = totalSupply - totalDemand;
    return { matching, totalSupply, totalDemand, netBalance };
  }, [commodity.name]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-t border-ink-700/40 pt-4">
        <Coins className="h-4 w-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-white">{commodity.name} — Tarımsal ve Finansal Detaylar</h3>
      </div>

      {/* a. Üretim Maliyeti Dökümü */}
      <div className="card p-5">
        <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
          <Wallet className="h-4 w-4 text-amber-400" />
          Üretim Maliyeti Dökümü
          <span className="ml-auto tabular text-xs text-slate-500">
            Toplam: <span className="font-semibold text-white">{formatTRY(totalCost)}</span> / dekar
          </span>
        </h4>
        <div className="grid grid-cols-1 gap-x-6 gap-y-3 lg:grid-cols-2">
          {/* Çubuk grafik */}
          <div className="space-y-2.5">
            {commodity.costBreakdown.map((c) => (
              <div key={c.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slate-300">{c.label}</span>
                  <span className="tabular text-slate-400">
                    {formatTRY(c.amount)} <span className="text-slate-600">· %{c.sharePct}</span>
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-ink-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all"
                    style={{ width: `${(c.amount / maxCost) * 100}%` }}
                  />
                </div>
                {c.label === 'Sulama' && elektrikAmount > 0 && (
                  <div className="mt-1 ml-3 flex items-center gap-1.5 text-[10px] text-slate-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-pink-400/60" />
                    <span>
                      Elektrik payı: <span className="text-pink-300">{formatTRY(elektrikAmount)}</span> (%{elektrikSharePct} · sulama enerjisi)
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pasta benzeri dağılım tablosu */}
          <div className="rounded-lg border border-ink-700/50 bg-ink-850/50 p-4">
            <div className="stat-label mb-3">Maliyet Dağılımı</div>
            <div className="space-y-2">
              {commodity.costBreakdown.map((c, i) => {
                const colors = ['#f59e0b', '#10b981', '#38bdf8', '#a78bfa', '#f43f5e', '#64748b'];
                return (
                  <div key={c.label} className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: colors[i % colors.length] }} />
                    <span className="flex-1 text-slate-300">{c.label}</span>
                    <span className="tabular text-slate-400">{c.sharePct}%</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 border-t border-ink-700/50 pt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Dekar Maliyet</span>
                <span className="tabular text-sm font-bold text-white">{formatTRY(totalCost)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-slate-400">Birim Maliyet (kg/lt)</span>
                <span className="tabular text-slate-300">
                  {commodity.yieldPerDekar > 0
                    ? formatTRY(totalCost / commodity.yieldPerDekar, 2)
                    : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* b. Tahmini Karlılık */}
      <div className="card p-5">
        <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          Tahmini Karlılık Simülasyonu
          <span className="ml-auto text-xs font-normal text-slate-500">dekar başı hesaplama</span>
        </h4>
        {revenue > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <ProfitTile
                label="Hasılat"
                value={formatTRY(revenue)}
                icon={<Wallet className="h-4 w-4" />}
                accent="slate"
                sub={`${commodity.yieldPerDekar} ${commodity.yieldUnit} × ${commodity.price.toLocaleString('tr-TR')} ${commodity.unit}`}
              />
              <ProfitTile
                label="Net Kâr"
                value={formatTRY(netProfit)}
                icon={<Coins className="h-4 w-4" />}
                accent={netProfit >= 0 ? 'emerald' : 'rose'}
                sub="dekar başına"
              />
              <ProfitTile
                label="Kâr Marjı"
                value={`${margin.toFixed(1)}%`}
                icon={<TrendingUp className="h-4 w-4" />}
                accent={margin >= 0 ? 'emerald' : 'rose'}
                sub="hasılat üzerinden"
              />
              <ProfitTile
                label="Yatırım Getirisi (ROI)"
                value={`${roi.toFixed(1)}%`}
                icon={<Calculator className="h-4 w-4" />}
                accent={roi >= 0 ? 'emerald' : 'rose'}
                sub="maliyet üzerinden"
              />
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-ink-700/50 bg-ink-850/50 p-3">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Gauge className="h-4 w-4" />
                  <span className="stat-label">Başabaş Verim</span>
                </div>
                <div className="tabular mt-1 text-lg font-bold text-amber-400">
                  {breakEvenYield.toFixed(0)} <span className="text-xs text-slate-500">{commodity.yieldUnit}/dkr</span>
                </div>
                <div className="mt-0.5 text-[10px] text-slate-600">Kâr için gereken minimum verim</div>
              </div>
              <div className="rounded-lg border border-ink-700/50 bg-ink-850/50 p-3">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Scale className="h-4 w-4" />
                  <span className="stat-label">Kârlılık Oranı</span>
                </div>
                <div className="tabular mt-1 text-lg font-bold text-emerald-400">
                  {commodity.profitabilityRatio.toFixed(2)}x
                </div>
                <div className="mt-0.5 text-[10px] text-slate-600">Maliyete göre getiri kat sayısı</div>
              </div>
              <div className="rounded-lg border border-ink-700/50 bg-ink-850/50 p-3">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Gauge className="h-4 w-4" />
                  <span className="stat-label">Verimlilik Skoru</span>
                </div>
                <div className="tabular mt-1 text-lg font-bold text-sky-400">
                  {commodity.efficiencyScore}/100
                </div>
                <div className="mt-0.5 text-[10px] text-slate-600">Sektör ortalaması göreceli skor</div>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-ink-700/50 bg-ink-850/50 p-6 text-center text-sm text-slate-500">
            Bu ürün için dekar başına verim hesaplanmamaktadır (ör. hayvancılık ürünleri).
          </div>
        )}
      </div>

      {/* c. Bölgesel Arz ve Talep Durumu */}
      <div className="card p-5">
        <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
          <MapPin className="h-4 w-4 text-emerald-400" />
          Bölgesel Arz ve Talep Durumu
        </h4>

        {regionalData.matching.length > 0 ? (
          <>
            {/* Özet kutular */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-ink-700/50 bg-ink-850/50 p-3">
                <div className="stat-label">Toplam Arz</div>
                <div className="tabular mt-1 text-lg font-bold text-emerald-400">
                  {formatNumber(regionalData.totalSupply)} <span className="text-xs text-slate-600">t</span>
                </div>
              </div>
              <div className="rounded-lg border border-ink-700/50 bg-ink-850/50 p-3">
                <div className="stat-label">Toplam Talep</div>
                <div className="tabular mt-1 text-lg font-bold text-amber-400">
                  {formatNumber(regionalData.totalDemand)} <span className="text-xs text-slate-600">t</span>
                </div>
              </div>
              <div className="rounded-lg border border-ink-700/50 bg-ink-850/50 p-3">
                <div className="stat-label">Arz-Talep Dengesi</div>
                <div
                  className={cn(
                    'tabular mt-1 text-lg font-bold',
                    regionalData.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400',
                  )}
                >
                  {regionalData.netBalance >= 0 ? '+' : ''}
                  {formatNumber(regionalData.netBalance)} <span className="text-xs text-slate-600">t</span>
                </div>
              </div>
              <div className="rounded-lg border border-ink-700/50 bg-ink-850/50 p-3">
                <div className="stat-label">Piyasa Durumu</div>
                <div
                  className={cn(
                    'mt-1 text-sm font-bold',
                    regionalData.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400',
                  )}
                >
                  {regionalData.netBalance >= 0 ? 'Arz Fazlası' : 'Talep Açığı'}
                </div>
              </div>
            </div>

            {/* Bölge bazında çubükler */}
            <div className="space-y-3">
              {regionalData.matching.map((r) => {
                const ratio = r.demand > 0 ? (r.supply / r.demand) * 100 : 100;
                const surplus = r.supply >= r.demand;
                return (
                  <div key={r.city}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-medium text-slate-200">
                        <MapPin className="h-3 w-3 text-slate-500" /> {r.city}
                      </span>
                      <span className="tabular text-slate-400">
                        Arz: <span className="text-emerald-400">{formatNumber(r.supply)}</span>
                        {' / '}Talep: <span className="text-amber-400">{formatNumber(r.demand)}</span>
                        {' '}<span className="text-slate-600">ton</span>
                      </span>
                    </div>
                    <div className="flex h-2.5 overflow-hidden rounded-full bg-ink-800">
                      <div
                        className={cn('h-full transition-all', surplus ? 'bg-emerald-500' : 'bg-amber-500')}
                        style={{ width: `${Math.min(100, ratio)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs">
              <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-slate-400">
                {commodity.name} başlıca <span className="text-slate-200">{commodity.region}</span> bölgesinde üretilmektedir.
                Hasat dönemi: <span className="text-slate-200">{commodity.harvestMonths}</span>.
                {regionalData.netBalance >= 0
                  ? ' Arz talebi karşılamakta, fiyatlar baskılanabilir.'
                  : ' Talep arzı aşmakta, fiyatlar desteklenebilir.'}
              </span>
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-ink-700/50 bg-ink-850/50 p-6 text-center text-sm text-slate-500">
            Bu ürün için bölgesel arz-talep verisi bulunmamaktadır.
          </div>
        )}
      </div>
    </div>
  );
}

function ProfitTile({
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
    <div className="rounded-lg border border-ink-700/50 bg-ink-850/50 p-3">
      <div className="flex items-center gap-1.5 text-slate-500">
        {icon}
        <span className="stat-label">{label}</span>
      </div>
      <div className={cn('tabular mt-1 text-base font-bold', colors[accent])}>{value}</div>
      {sub && <div className="mt-0.5 text-[10px] text-slate-600">{sub}</div>}
    </div>
  );
}
