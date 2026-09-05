import { useMemo, useState } from 'react';
import { MapPin, TrendingUp, TrendingDown, Scale, Search, Filter, ArrowUpDown, X } from 'lucide-react';
import { regionSupply, allProvinceProducts } from '@/lib/mockData';
import { TurkeyMap } from '@/components/charts/TurkeyMap';
import { formatNumber, formatPct } from '@/lib/format';
import type { RegionSupply, MarketStatus } from '@/types';
import { cn } from '@/lib/cn';

type StatusFilter = 'all' | MarketStatus;
type SortKey = 'supply' | 'demand' | 'balance' | 'city';

const statusMeta: Record<MarketStatus, { label: string; color: string; bg: string }> = {
  surplus: { label: 'Arz Fazlası', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  deficit: { label: 'Arz Açığı', color: 'text-rose-400', bg: 'bg-rose-500/10' },
  balanced: { label: 'Dengede', color: 'text-amber-400', bg: 'bg-amber-500/10' },
};

export function Regions() {
  const [selected, setSelected] = useState<RegionSupply>(regionSupply[0]);
  const [search, setSearch] = useState('');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortKey>('supply');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Filtrelenmiş veri
  const filtered = useMemo(() => {
    let result = [...regionSupply];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) => r.city.toLowerCase().includes(q) || r.zone.toLowerCase().includes(q));
    }

    if (productFilter !== 'all') {
      result = result.filter((r) => r.products.some((p) => p.name === productFilter));
    }

    if (statusFilter !== 'all') {
      result = result.filter((r) => r.status === statusFilter);
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'city') cmp = a.city.localeCompare(b.city, 'tr');
      else if (sortBy === 'supply') cmp = a.totalSupply - b.totalSupply;
      else if (sortBy === 'demand') cmp = a.totalDemand - b.totalDemand;
      else cmp = a.balance - b.balance;
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return result;
  }, [search, productFilter, statusFilter, sortBy, sortDir]);

  // Özet istatistikler
  const summary = useMemo(() => {
    const totalSupply = filtered.reduce((s, r) => s + r.totalSupply, 0);
    const totalDemand = filtered.reduce((s, r) => s + r.totalDemand, 0);
    const surplus = filtered.filter((r) => r.status === 'surplus').length;
    const deficit = filtered.filter((r) => r.status === 'deficit').length;
    const balanced = filtered.filter((r) => r.status === 'balanced').length;
    return { totalSupply, totalDemand, surplus, deficit, balanced, count: filtered.length };
  }, [filtered]);

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else {
      setSortBy(key);
      setSortDir(key === 'city' ? 'asc' : 'desc');
    }
  };

  const activeFilters = (productFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (search.trim() ? 1 : 0);
  const clearFilters = () => {
    setSearch('');
    setProductFilter('all');
    setStatusFilter('all');
  };

  return (
    <div className="space-y-5">
      {/* Özet kartları */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <SummaryTile label="Görünen İl" value={String(summary.count)} sub={`/ ${regionSupply.length} il`} />
        <SummaryTile label="Toplam Arz" value={`${formatNumber(summary.totalSupply)}`} sub="ton" accent="emerald" />
        <SummaryTile label="Toplam Talep" value={`${formatNumber(summary.totalDemand)}`} sub="ton" accent="amber" />
        <SummaryTile label="Arz Fazlası" value={String(summary.surplus)} sub="il" accent="emerald" />
        <SummaryTile label="Dengede" value={String(summary.balanced)} sub="il" accent="amber" />
        <SummaryTile label="Arz Açığı" value={String(summary.deficit)} sub="il" accent="rose" />
      </div>

      {/* Filtre çubuğu */}
      <div className="card flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İl veya bölge ara..."
            className="ring-focus w-full rounded-lg border border-ink-700 bg-ink-850 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-slate-500">
            <Filter className="h-3.5 w-3.5" /> Durum
          </span>
          <div className="flex gap-1">
            {(['all', 'surplus', 'balanced', 'deficit'] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                  statusFilter === s
                    ? s === 'surplus' ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30'
                    : s === 'deficit' ? 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30'
                    : s === 'balanced' ? 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30'
                    : 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30'
                    : 'bg-ink-850 text-slate-400 hover:text-slate-200',
                )}
              >
                {s === 'all' ? 'Tümü' : statusMeta[s as MarketStatus].label}
              </button>
            ))}
          </div>

          <span className="mx-1 h-5 w-px bg-ink-700" />

          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Ürün</span>
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="ring-focus rounded-lg border border-ink-700 bg-ink-850 px-2.5 py-1.5 text-xs text-slate-200"
          >
            <option value="all" className="bg-ink-900">Tüm Ürünler</option>
            {allProvinceProducts.map((p) => (
              <option key={p} value={p} className="bg-ink-900">{p}</option>
            ))}
          </select>

          {activeFilters > 0 && (
            <button onClick={clearFilters} className="flex items-center gap-1 rounded-md bg-ink-850 px-2.5 py-1.5 text-xs text-rose-400/70 hover:text-rose-400">
              <X className="h-3.5 w-3.5" /> Temizle ({activeFilters})
            </button>
          )}
        </div>
      </div>

      {/* Harita + detay paneli */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="card p-5 lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <MapPin className="h-4 w-4 text-emerald-400" />
              Bölgesel Arz Yoğunluğu
            </h3>
          </div>
          <TurkeyMap data={filtered} selected={selected} onSelect={setSelected} />
        </div>

        {/* Seçili il detayı */}
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">{selected.city}</h3>
              <p className="text-xs text-slate-500">{selected.zone} bölgesi · arz-talep özeti</p>
            </div>
            <div className={cn('flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium', statusMeta[selected.status].bg, statusMeta[selected.status].color)}>
              {selected.status === 'surplus' ? <TrendingUp className="h-3.5 w-3.5" /> : selected.status === 'deficit' ? <TrendingDown className="h-3.5 w-3.5" /> : <Scale className="h-3.5 w-3.5" />}
              {statusMeta[selected.status].label}
            </div>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-ink-700/50 bg-ink-850/50 p-3">
              <div className="stat-label">Toplam Arz</div>
              <div className="tabular mt-1 text-base font-bold text-emerald-400">
                {formatNumber(selected.totalSupply)}
              </div>
              <div className="text-[10px] text-slate-600">ton</div>
            </div>
            <div className="rounded-lg border border-ink-700/50 bg-ink-850/50 p-3">
              <div className="stat-label">Toplam Talep</div>
              <div className="tabular mt-1 text-base font-bold text-amber-400">
                {formatNumber(selected.totalDemand)}
              </div>
              <div className="text-[10px] text-slate-600">ton</div>
            </div>
            <div className="rounded-lg border border-ink-700/50 bg-ink-850/50 p-3">
              <div className="stat-label">Denge</div>
              <div className={cn('tabular mt-1 text-base font-bold', selected.balance >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                {formatPct(selected.balance)}
              </div>
              <div className="text-[10px] text-slate-600">arz-talep</div>
            </div>
          </div>

          <div className="stat-label mb-2">Ürün bazında arz / talep</div>
          <div className="space-y-2.5">
            {selected.products.map((p) => {
              const ratio = p.demand > 0 ? (p.supply / p.demand) * 100 : 100;
              const surplus = p.supply >= p.demand;
              return (
                <div key={p.name}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-slate-300">{p.name}</span>
                    <span className="tabular text-slate-500">
                      {formatNumber(p.supply)} <span className="text-slate-600">/</span> {formatNumber(p.demand)} <span className="text-slate-600">t</span>
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
        </div>
      </div>

      {/* İl tablosu */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink-700/60 px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Scale className="h-4 w-4 text-emerald-400" />
            İl Bazlı Arz-Talep Tablosu
            <span className="ml-1 text-xs font-normal text-slate-500">({filtered.length} il)</span>
          </h3>
        </div>

        {/* Tablo başlığı — sıralanabilir */}
        <div className="grid grid-cols-12 gap-2 border-b border-ink-700/60 bg-ink-850/40 px-4 py-2.5 text-[11px] uppercase tracking-wider text-slate-500">
          <SortHeader label="İl" col="col-span-3" active={sortBy === 'city'} dir={sortDir} onClick={() => toggleSort('city')} />
          <SortHeader label="Bölge" col="col-span-2" />
          <SortHeader label="Arz" col="col-span-2 text-right" active={sortBy === 'supply'} dir={sortDir} onClick={() => toggleSort('supply')} />
          <SortHeader label="Talep" col="col-span-2 text-right" active={sortBy === 'demand'} dir={sortDir} onClick={() => toggleSort('demand')} />
          <SortHeader label="Denge" col="col-span-1 text-right" active={sortBy === 'balance'} dir={sortDir} onClick={() => toggleSort('balance')} />
          <div className="col-span-2 text-right font-medium">Durum</div>
        </div>

        {/* Tablo gövdesi — kaydırılabilir */}
        <div className="max-h-[480px] divide-y divide-ink-800/50 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              Filtrelerle eşleşen il bulunamadı.
            </div>
          ) : (
            filtered.map((r) => {
              const top = [...r.products].sort((a, b) => b.supply - a.supply)[0];
              return (
                <button
                  key={r.city}
                  onClick={() => setSelected(r)}
                  className={cn(
                    'grid w-full grid-cols-12 items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors',
                    selected.city === r.city ? 'bg-emerald-500/5' : 'hover:bg-ink-800/30',
                  )}
                >
                  <div className="col-span-3 flex items-center gap-2 font-medium text-slate-200">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                    <span className="truncate">{r.city}</span>
                    <span className="ml-auto hidden truncate text-[10px] text-slate-600 sm:inline">{top?.name}</span>
                  </div>
                  <div className="col-span-2 truncate text-xs text-slate-500">{r.zone}</div>
                  <div className="col-span-2 text-right tabular text-white">{formatNumber(r.totalSupply)} <span className="text-[10px] text-slate-600">t</span></div>
                  <div className="col-span-2 text-right tabular text-slate-300">{formatNumber(r.totalDemand)} <span className="text-[10px] text-slate-600">t</span></div>
                  <div className={cn('col-span-1 text-right tabular font-medium', r.balance >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                    {formatPct(r.balance)}
                  </div>
                  <div className="col-span-2 text-right">
                    <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium', statusMeta[r.status].bg, statusMeta[r.status].color)}>
                      {statusMeta[r.status].label}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryTile({ label, value, sub, accent = 'slate' }: { label: string; value: string; sub?: string; accent?: 'emerald' | 'amber' | 'rose' | 'slate' }) {
  const colors = {
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400',
    slate: 'text-slate-200',
  };
  return (
    <div className="card p-3">
      <div className="stat-label">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className={cn('tabular text-lg font-bold', colors[accent])}>{value}</span>
        {sub && <span className="text-[10px] text-slate-600">{sub}</span>}
      </div>
    </div>
  );
}

function SortHeader({ label, col, textRight, active, dir, onClick }: { label: string; col: string; textRight?: boolean; active?: boolean; dir?: 'asc' | 'desc'; onClick?: () => void }) {
  if (!onClick) {
    return <div className={cn(col, textRight && 'text-right', 'font-medium')}>{label}</div>;
  }
  return (
    <button onClick={onClick} className={cn(col, textRight && 'text-right', 'flex items-center gap-1 font-medium transition-colors', active ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300', textRight && 'justify-end')}>
      {label}
      <ArrowUpDown className={cn('h-3 w-3 transition-transform', active && dir === 'asc' && 'rotate-180', !active && 'opacity-40')} />
    </button>
  );
}
