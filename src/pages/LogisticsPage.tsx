import { useMemo, useState } from 'react';
import {
  Truck, Package, FileText, MapPin, Fuel, Route, Wallet,
  TrendingUp, TrendingDown, ArrowRight, Gauge, Info, Search,
  Tag, Clock, CheckCircle2, AlertCircle, Calculator, Building2,
} from 'lucide-react';
import {
  elusWarrants, calcFreight, defaultFreightInput, cityList,
  type ElusWarrant, type FreightInput,
} from '@/lib/logisticsData';
import { formatTRY, formatNumber, formatPct, sparkPath } from '@/lib/format';
import { cn } from '@/lib/cn';

export function LogisticsPage() {
  return (
    <div className="space-y-5">
      {/* Üst özet şeridi */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryTile label="Aktif ELÜS" value={String(elusWarrants.filter((w) => w.status === 'active').length)} sub="belge" icon={FileText} accent="emerald" />
        <SummaryTile label="Satılık ELÜS" value={String(elusWarrants.filter((w) => w.status === 'listed').length)} sub="ilan" icon={Tag} accent="amber" />
        <SummaryTile
          label="Toplam Hacim"
          value={`${formatNumber(elusWarrants.reduce((s, w) => s + w.quantity, 0))}`}
          sub="ton"
          icon={Package}
          accent="sky"
        />
        <SummaryTile
          label="Ort. Fiyat"
          value={`${formatNumber(Math.round(elusWarrants.reduce((s, w) => s + w.marketPrice, 0) / elusWarrants.length))} ₺`}
          sub="/ ton"
          icon={TrendingUp}
          accent="slate"
        />
      </div>

      {/* ELÜS Takip Paneli */}
      <ElusPanel />

      {/* Akıllı Navlun Hesaplayıcı */}
      <FreightCalculator />
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// ELÜS TAKİP PANELİ
// ════════════════════════════════════════════════════════════
function ElusPanel() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'listed'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = [...elusWarrants];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((w) =>
        w.product.toLowerCase().includes(q) ||
        w.warehouse.toLowerCase().includes(q) ||
        w.city.toLowerCase().includes(q) ||
        w.id.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== 'all') result = result.filter((w) => w.status === statusFilter);
    return result;
  }, [search, statusFilter]);

  const selected = elusWarrants.find((w) => w.id === selectedId) ?? null;

  return (
    <div className="card p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
        <FileText className="h-4 w-4 text-emerald-400" />
        Lisanslı Depoculuk & ELÜS Takibi
        <span className="ml-1 text-xs font-normal text-slate-500">
          ({filtered.length} belge)
        </span>
      </h3>

      {/* Filtre çubuğu */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ürün, depo veya il ara..."
            className="ring-focus w-full rounded-lg border border-ink-700 bg-ink-850 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-600"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'active', 'listed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                statusFilter === s
                  ? s === 'active' ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30'
                  : s === 'listed' ? 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30'
                  : 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30'
                  : 'bg-ink-850 text-slate-400 hover:text-slate-200',
              )}
            >
              {s === 'all' ? 'Tümü' : s === 'active' ? 'Aktif' : 'Satılık'}
            </button>
          ))}
        </div>
      </div>

      {/* ELÜS tablosu + detay paneli */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Tablo */}
        <div className="lg:col-span-3">
          <div className="overflow-hidden rounded-lg border border-ink-700/50">
            <div className="grid grid-cols-12 gap-2 border-b border-ink-700/60 bg-ink-850/60 px-3 py-2 text-[10px] uppercase tracking-wider text-slate-500">
              <div className="col-span-3 font-medium">Ürün / ID</div>
              <div className="col-span-3 font-medium">Depo / İl</div>
              <div className="col-span-2 text-right font-medium">Miktar</div>
              <div className="col-span-2 text-right font-medium">Fiyat (₺/t)</div>
              <div className="col-span-2 text-right font-medium">Değişim</div>
            </div>
            <div className="max-h-[360px] divide-y divide-ink-800/50 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-slate-500">
                  Eşleşen ELÜS belgesi bulunamadı.
                </div>
              ) : (
                filtered.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setSelectedId(w.id)}
                    className={cn(
                      'grid w-full grid-cols-12 items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors',
                      selectedId === w.id ? 'bg-emerald-500/5' : 'hover:bg-ink-800/30',
                    )}
                  >
                    <div className="col-span-3 min-w-0">
                      <div className="truncate font-medium text-slate-200">{w.product}</div>
                      <div className="truncate text-[10px] text-slate-600">{w.id}</div>
                    </div>
                    <div className="col-span-3 min-w-0">
                      <div className="truncate text-xs text-slate-300">{w.warehouse}</div>
                      <div className="text-[10px] text-slate-600">{w.city}</div>
                    </div>
                    <div className="col-span-2 text-right tabular text-slate-300">{formatNumber(w.quantity)} t</div>
                    <div className="col-span-2 text-right tabular text-white">{formatNumber(w.marketPrice)}</div>
                    <div className={cn('col-span-2 text-right tabular text-xs font-medium', w.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                      {formatPct(w.changePct)}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Detay paneli */}
        <div className="lg:col-span-2">
          {selected ? <ElusDetail warrant={selected} /> : <ElusDetailEmpty />}
        </div>
      </div>
    </div>
  );
}

function ElusDetail({ warrant }: { warrant: ElusWarrant }) {
  const isUp = warrant.changePct >= 0;
  const sparkD = sparkPath(
    Array.from({ length: 12 }).map((_, i) => warrant.referencePrice * (0.9 + (i / 12) * 0.12 + (Math.sin(i) * 0.02))),
    180, 40, 3,
  );
  const bestOffer = warrant.offers.length > 0
    ? warrant.offers.reduce((best, o) => (o.price > best.price ? o : best), warrant.offers[0])
    : null;

  return (
    <div className="card h-full p-4 ring-1 ring-emerald-500/20">
      {/* Başlık */}
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h4 className="text-base font-bold text-white">{warrant.product}</h4>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
            <FileText className="h-3 w-3" /> {warrant.id}
          </div>
        </div>
        <span className={cn(
          'rounded-md px-2 py-0.5 text-[10px] font-medium',
          warrant.status === 'active' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300',
        )}>
          {warrant.status === 'active' ? 'Aktif' : 'Satılık'}
        </span>
      </div>

      {/* Fiyat + sparkline */}
      <div className="mb-3 rounded-lg border border-ink-700/50 bg-ink-850/50 p-3">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="stat-label">Borsa Fiyatı</div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="tabular text-2xl font-bold text-white">{formatNumber(warrant.marketPrice)}</span>
              <span className="text-xs text-slate-500">₺/ton</span>
            </div>
          </div>
          <span className={cn('flex items-center gap-1 text-xs font-medium', isUp ? 'text-emerald-400' : 'text-rose-400')}>
            {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {formatPct(warrant.changePct)}
          </span>
        </div>
        <svg viewBox="0 0 180 44" className="mt-2 h-10 w-full" preserveAspectRatio="none">
          <path d={sparkD} fill="none" stroke={isUp ? '#10b981' : '#f43f5e'} strokeWidth="1.5" strokeLinejoin="round" />
          <path d={`${sparkD} L180,44 L0,44 Z`} fill={isUp ? '#10b981' : '#f43f5e'} fillOpacity="0.08" />
        </svg>
      </div>

      {/* Bilgi satırları */}
      <div className="space-y-1.5 text-xs">
        <InfoRow icon={Building2} label="Depo" value={warrant.warehouse} />
        <InfoRow icon={MapPin} label="İl" value={warrant.city} />
        <InfoRow icon={Package} label="Miktar" value={`${formatNumber(warrant.quantity)} ton`} />
        <InfoRow icon={Clock} label="İhraç" value={warrant.issueDate} />
        <InfoRow icon={Clock} label="Vade" value={warrant.expiryDate} />
        <InfoRow icon={Tag} label="Referans" value={`${formatNumber(warrant.referencePrice)} ₺/ton`} />
      </div>

      {/* Alıcı teklifleri */}
      {warrant.offers.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 stat-label">Alternatif Teklifler ({warrant.offers.length})</div>
          <div className="space-y-1.5">
            {warrant.offers.map((o, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-center justify-between rounded-lg border px-3 py-2 text-xs',
                  bestOffer?.buyer === o.buyer && bestOffer?.price === o.price
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-ink-700/50 bg-ink-850/40',
                )}
              >
                <div>
                  <div className="font-medium text-slate-200">{o.buyer}</div>
                  <div className="text-[10px] text-slate-600">{o.date} · {o.volume} ton</div>
                </div>
                <div className="tabular text-right">
                  <div className="font-semibold text-white">{formatNumber(o.price)} ₺</div>
                  {bestOffer?.buyer === o.buyer && bestOffer?.price === o.price && (
                    <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-400">
                      <CheckCircle2 className="h-2.5 w-2.5" /> En iyi
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Satılığa çıkar butonu */}
      {warrant.status === 'active' && (
        <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 py-2.5 text-sm font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20">
          <Tag className="h-4 w-4" /> Satılığa Çıkar
        </button>
      )}
    </div>
  );
}

function ElusDetailEmpty() {
  return (
    <div className="card flex h-full flex-col items-center justify-center p-8 text-center">
      <FileText className="h-10 w-10 text-slate-700" />
      <p className="mt-3 text-sm text-slate-500">
        Detayları görmek için bir ELÜS belgesi seçin.
      </p>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-slate-500">
        <Icon className="h-3.5 w-3.5" /> {label}
      </span>
      <span className="tabular font-medium text-slate-300">{value}</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// AKILLI NAVLUN / LOJİSTİK MALİYET HESAPLAYICI
// ════════════════════════════════════════════════════════════
function FreightCalculator() {
  const [input, setInput] = useState<FreightInput>(defaultFreightInput);

  const result = useMemo(() => calcFreight(input), [input]);
  const trips = Math.ceil(input.tonnage / input.truckCapacity);

  const update = (patch: Partial<FreightInput>) => setInput((prev) => ({ ...prev, ...patch }));

  return (
    <div className="card p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
        <Truck className="h-4 w-4 text-emerald-400" />
        Akıllı Navlun / Lojistik Maliyet Hesaplayıcı
        <span className="ml-1 text-xs font-normal text-slate-500">
          ({input.fromCity} → {input.toCity})
        </span>
      </h3>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Form */}
        <div className="space-y-4">
          {/* Rota */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Çıkış İli">
              <select
                value={input.fromCity}
                onChange={(e) => update({ fromCity: e.target.value })}
                className="ring-focus w-full rounded-lg border border-ink-700 bg-ink-850 px-3 py-2.5 text-sm text-slate-200"
              >
                {cityList.map((c) => <option key={c} value={c} className="bg-ink-900">{c}</option>)}
              </select>
            </Field>
            <Field label="Varış İli">
              <select
                value={input.toCity}
                onChange={(e) => update({ toCity: e.target.value })}
                className="ring-focus w-full rounded-lg border border-ink-700 bg-ink-850 px-3 py-2.5 text-sm text-slate-200"
              >
                {cityList.map((c) => <option key={c} value={c} className="bg-ink-900">{c}</option>)}
              </select>
            </Field>
          </div>

          {/* Mesafe özeti */}
          <div className="flex items-center gap-3 rounded-lg border border-sky-500/20 bg-sky-500/5 px-4 py-2.5">
            <Route className="h-5 w-5 text-sky-400" />
            <div className="flex-1">
              <div className="text-xs text-slate-400">Tahmini Mesafe</div>
              <div className="tabular text-lg font-bold text-white">{formatNumber(result.distanceKm)} km</div>
            </div>
            <div className="text-right text-xs text-slate-500">
              <div>{trips} sefer · {formatNumber(trips * result.distanceKm * 2)} km toplam</div>
              <div className="text-[10px]">gidiş-dönüş</div>
            </div>
          </div>

          {/* Yük & araç */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Yük Miktarı (ton)">
              <NumberInput value={input.tonnage} onChange={(v) => update({ tonnage: v })} step={5} />
            </Field>
            <Field label="Araç Kapasitesi (ton)">
              <NumberInput value={input.truckCapacity} onChange={(v) => update({ truckCapacity: v })} step={1} />
            </Field>
          </div>

          {/* Yakıt */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mazot Fiyatı (₺/lt)">
              <NumberInput value={input.dieselPrice} onChange={(v) => update({ dieselPrice: v })} step={0.5} decimals={2} />
            </Field>
            <Field label="Yakıt Tüketimi (lt/100km)">
              <NumberInput value={input.fuelConsumption} onChange={(v) => update({ fuelConsumption: v })} step={1} />
            </Field>
          </div>

          {/* Şoför & diğer */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Şoför Ücreti (₺/gün)">
              <NumberInput value={input.driverDailyWage} onChange={(v) => update({ driverDailyWage: v })} step={250} />
            </Field>
            <Field label="Ort. Hız (km/saat)">
              <NumberInput value={input.avgSpeed} onChange={(v) => update({ avgSpeed: v })} step={5} />
            </Field>
            <Field label="Yükleme/Boşaltma (₺)">
              <NumberInput value={input.loadingUnloadCost} onChange={(v) => update({ loadingUnloadCost: v })} step={500} />
            </Field>
            <div className="col-span-1" />
          </div>

          {/* Dekar hesabı */}
          <div className="grid grid-cols-2 gap-3 border-t border-ink-700/50 pt-3">
            <Field label="Ekim Alanı (dekar)">
              <NumberInput value={input.dekarArea} onChange={(v) => update({ dekarArea: v })} step={50} />
            </Field>
            <Field label="Dekar Verim (ton/dkr)">
              <NumberInput value={input.yieldPerDekar} onChange={(v) => update({ yieldPerDekar: v })} step={0.1} decimals={2} />
            </Field>
          </div>
        </div>

        {/* Sonuç */}
        <div className="space-y-3">
          {/* Maliyet dökümü */}
          <div className="space-y-2">
            <CostRow icon={Fuel} label="Yakıt Gideri" value={formatTRY(result.fuelCost)} accent="amber" />
            <CostRow icon={Wallet} label="Şoför Ücreti" value={formatTRY(result.driverCost)} accent="slate" />
            <CostRow icon={Route} label="Otoyol Ücreti" value={formatTRY(result.tollCost)} accent="slate" />
            <CostRow icon={Package} label="Yükleme/Boşaltma" value={formatTRY(result.loadingCost)} accent="slate" />
          </div>

          {/* Toplam nakliye */}
          <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-4">
            <div className="stat-label text-emerald-300/80">Toplam Nakliye Maliyeti</div>
            <div className="mt-1 tabular text-3xl font-bold text-emerald-400">
              {formatTRY(result.totalFreight)}
            </div>
            <div className="mt-3 flex gap-4 text-xs">
              <div>
                <span className="text-slate-400">Ton başına </span>
                <span className="tabular font-semibold text-emerald-400">{formatTRY(result.perTonCost)}</span>
              </div>
              <div>
                <span className="text-slate-400">Dekar başına </span>
                <span className="tabular font-semibold text-emerald-400">{formatTRY(result.perDekarCost)}</span>
              </div>
            </div>
          </div>

          {/* Ton başına maliyet göstergesi */}
          <div className="rounded-xl border border-ink-700/50 bg-ink-850/50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Gauge className="h-4 w-4 text-slate-500" />
              <span className="stat-label">Ton Başına Nakliye Maliyeti</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="tabular text-2xl font-bold text-white">{formatTRY(result.perTonCost)}</span>
              <span className="text-xs text-slate-500">/ ton ürün</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-500 transition-all"
                style={{ width: `${Math.min(100, (result.perTonCost / 500) * 100)}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-slate-600">
              <span>0 ₺</span>
              <span>500+ ₺/ton (yüksek)</span>
            </div>
          </div>

          {/* Bilgi notu */}
          <div className="flex items-start gap-2 rounded-lg border border-ink-700/50 bg-ink-850/40 px-3 py-2.5 text-xs text-slate-500">
            <Info className="h-4 w-4 shrink-0 text-slate-600" />
            <span>
              Hesaplama Haversine mesafe formülü, güncel mazot fiyatı ve araç kapasitesine göre yapılır.
              Dekar başına maliyet; toplam nakliyenin ürünün dekara verimine oranıyla hesaplanır.
              Otoyol ücreti tahmini olup gerçek ücret rota ve araç tipine göre değişir.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Yardımcı bileşenler ──────────────────────────────────────
function SummaryTile({
  label, value, sub, icon: Icon, accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: typeof Truck;
  accent: 'emerald' | 'amber' | 'rose' | 'sky' | 'slate';
}) {
  const colors: Record<string, string> = {
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400',
    sky: 'text-sky-400',
    slate: 'text-slate-200',
  };
  return (
    <div className="card p-3">
      <div className="flex items-center gap-2">
        <Icon className={cn('h-4 w-4', colors[accent])} />
        <div className="stat-label">{label}</div>
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className={cn('tabular text-lg font-bold', colors[accent])}>{value}</span>
        {sub && <span className="text-[10px] text-slate-600">{sub}</span>}
      </div>
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
  value, onChange, step = 1, decimals = 0,
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
          onClick={() => onChange(Number(Math.max(0, value - step).toFixed(decimals)))}
          className="text-slate-600 hover:text-emerald-400"
          aria-label="Azalt"
        >
          <ArrowRight className="h-3 w-3 rotate-90" />
        </button>
      </div>
    </div>
  );
}

function CostRow({
  icon: Icon, label, value, accent,
}: {
  icon: typeof Fuel;
  label: string;
  value: string;
  accent: 'emerald' | 'amber' | 'rose' | 'slate';
}) {
  const colors: Record<string, string> = {
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400',
    slate: 'text-slate-300',
  };
  return (
    <div className="flex items-center justify-between rounded-lg border border-ink-700/50 bg-ink-850/40 px-3 py-2.5">
      <span className="flex items-center gap-2 text-xs text-slate-400">
        <Icon className={cn('h-4 w-4', colors[accent])} />
        {label}
      </span>
      <span className={cn('tabular text-sm font-semibold', colors[accent])}>{value}</span>
    </div>
  );
}
