import { useMemo } from 'react';
import { X, FileText, Printer, TrendingUp, TrendingDown, MapPin, Calendar, Gauge, Wheat, Coins, Scale, BarChart3, Activity, LineChart as LineIcon, Target, AlertTriangle, CheckCircle2, Minus, Newspaper } from 'lucide-react';
import type { Commodity, CostBreakdown } from '@/types';
import { formatTRY, formatNumber, formatPct } from '@/lib/format';
import { regionSupply, exchangeMarkets, matchCommodityId, taSymbols } from '@/lib/mockData';
import { sma, ema, rsi, macd, bollinger, closesOf } from '@/lib/indicators';
import { newsItems } from '@/lib/newsData';
import { cn } from '@/lib/cn';

export interface ReportData {
  commodity: Commodity;
  costBreakdown: CostBreakdown[];
  totalCost: number;
  revenuePerDekar: number;
  profitPerDekar: number;
  margin: number;
  area?: number;
  totalRevenue?: number;
  totalCostScaled?: number;
  netProfit?: number;
  roi?: number;
  breakEvenYield?: number;
}

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  data: ReportData;
}

// ── SVG Donut Chart ──
function DonutChart({ segments, size = 140 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const radius = size / 2 - 12;
  const innerRadius = radius * 0.58;
  const cx = size / 2;
  const cy = size / 2;
  let cumulative = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      {segments.map((seg, i) => {
        const fraction = seg.value / total;
        const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
        cumulative += fraction;
        const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
        const x1 = cx + radius * Math.cos(startAngle);
        const y1 = cy + radius * Math.sin(startAngle);
        const x2 = cx + radius * Math.cos(endAngle);
        const y2 = cy + radius * Math.sin(endAngle);
        const x3 = cx + innerRadius * Math.cos(endAngle);
        const y3 = cy + innerRadius * Math.sin(endAngle);
        const x4 = cx + innerRadius * Math.cos(startAngle);
        const y4 = cy + innerRadius * Math.sin(startAngle);
        const largeArc = fraction > 0.5 ? 1 : 0;
        const path = `M${x1},${y1} A${radius},${radius} 0 ${largeArc} 1 ${x2},${y2} L${x3},${y3} A${innerRadius},${innerRadius} 0 ${largeArc} 0 ${x4},${y4} Z`;
        return <path key={i} d={path} fill={seg.color} stroke="white" strokeWidth={1} />;
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" className="fill-slate-700 text-[11px] font-bold">Toplam</text>
      <text x={cx} y={cy + 10} textAnchor="middle" className="fill-slate-500 text-[9px]">{formatTRY(total, 0)}</text>
    </svg>
  );
}

// ── SVG Horizontal Bar Chart ──
function BarChart({ items, maxVal }: { items: { label: string; value: number; color: string }[]; maxVal: number }) {
  const max = maxVal || Math.max(...items.map((x) => x.value), 1);
  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-20 shrink-0 truncate text-right text-slate-600">{item.label}</span>
          <div className="relative h-4 flex-1 overflow-hidden rounded bg-slate-100">
            <div className="h-full rounded" style={{ width: `${(item.value / max) * 100}%`, backgroundColor: item.color }} />
            <span className="absolute right-1.5 top-0 text-[9px] font-semibold leading-4 text-slate-700">{formatNumber(item.value)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

const COST_COLORS = ['#059669', '#0d9488', '#0891b2', '#0284c7', '#7c3aed', '#c026d3', '#e11d48', '#ea580c', '#ca8a04', '#65a30d'];
const REGION_COLORS = ['#059669', '#0891b2', '#7c3aed', '#ea580c', '#ca8a04', '#0284c7', '#e11d48', '#65a30d'];

export function ReportModal({ open, onClose, data }: ReportModalProps) {
  if (!open) return null;

  const { commodity, costBreakdown, totalCost, revenuePerDekar, profitPerDekar, margin } = data;
  const today = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  const reportId = `TF-${commodity.id.toUpperCase()}-${Date.now().toString(36).slice(-6).toUpperCase()}`;

  const exchangeInfo = useMemo(() => {
    const id = matchCommodityId(commodity.name);
    if (!id) return null;
    for (const m of exchangeMarkets) {
      const q = m.quotes.find((qq) => qq.product === commodity.name || matchCommodityId(qq.product) === id);
      if (q) return { market: m.name, city: m.city, price: q.last, unit: q.unit, volume: q.volume, changePct: q.changePct };
    }
    return null;
  }, [commodity]);

  const regionData = useMemo(() => regionSupply.filter((r) => r.products.some((p) => p.name === commodity.name)), [commodity]);

  const taSymbol = useMemo(() => taSymbols.find((s) => s.id === commodity.id) ?? null, [commodity]);

  const technicalIndicators = useMemo(() => {
    if (!taSymbol) return null;
    const closes = closesOf(taSymbol.candles);
    const sma20 = sma(closes, 20);
    const ema12 = ema(closes, 12);
    const rsi14 = rsi(closes, 14);
    const macdData = macd(closes);
    const boll = bollinger(closes, 20, 2);
    const lastIdx = closes.length - 1;
    const lastClose = closes[lastIdx];
    const periodCloses = closes.slice(-30);
    const periodHigh = Math.max(...periodCloses);
    const periodLow = Math.min(...periodCloses);
    const volatility = (() => {
      const changes: number[] = [];
      for (let i = 1; i < periodCloses.length; i++) changes.push(((periodCloses[i] - periodCloses[i - 1]) / periodCloses[i - 1]) * 100);
      const mean = changes.reduce((s, v) => s + v, 0) / (changes.length || 1);
      return Math.sqrt(changes.reduce((s, v) => s + (v - mean) ** 2, 0) / (changes.length || 1));
    })();
    return {
      lastClose, sma20: sma20[lastIdx], ema12: ema12[lastIdx], rsi: rsi14[lastIdx],
      macd: macdData[lastIdx]?.macd ?? null, macdSignal: macdData[lastIdx]?.signal ?? null, macdHist: macdData[lastIdx]?.histogram ?? null,
      bollUpper: boll[lastIdx]?.upper ?? null, bollLower: boll[lastIdx]?.lower ?? null, bollMiddle: boll[lastIdx]?.middle ?? null,
      periodHigh, periodLow, volatility,
    };
  }, [taSymbol]);

  const signalSummary = useMemo(() => {
    if (!technicalIndicators) return null;
    const { rsi: rsiVal, sma20: smaVal, ema12: emaVal, lastClose, macd: macdVal, macdSignal, macdHist } = technicalIndicators;
    let bullish = 0, bearish = 0;
    const signals: { label: string; signal: 'bull' | 'bear' | 'neutral'; detail: string }[] = [];
    if (rsiVal !== null) {
      if (rsiVal < 30) { bullish++; signals.push({ label: 'RSI', signal: 'bull', detail: `Aşırı satım (${rsiVal.toFixed(1)}) — tepki alımı olası` }); }
      else if (rsiVal > 70) { bearish++; signals.push({ label: 'RSI', signal: 'bear', detail: `Aşırı alım (${rsiVal.toFixed(1)}) — düzeltme riski` }); }
      else signals.push({ label: 'RSI', signal: 'neutral', detail: `Nötr bölge (${rsiVal.toFixed(1)})` });
    }
    if (smaVal !== null && emaVal !== null) {
      if (emaVal > smaVal && lastClose > smaVal) { bullish++; signals.push({ label: 'Trend (SMA/EMA)', signal: 'bull', detail: 'Kısa vadeli ortalama uzun vadelelinin üzerinde — yükseliş trendi' }); }
      else if (emaVal < smaVal && lastClose < smaVal) { bearish++; signals.push({ label: 'Trend (SMA/EMA)', signal: 'bear', detail: 'Kısa vadeli ortalama uzun vadelelinin altında — düşüş trendi' }); }
      else signals.push({ label: 'Trend (SMA/EMA)', signal: 'neutral', detail: 'Karışık sinyaller — yön belirsiz' });
    }
    if (macdVal !== null && macdSignal !== null) {
      if (macdVal > macdSignal && (macdHist ?? 0) > 0) { bullish++; signals.push({ label: 'MACD', signal: 'bull', detail: 'MACD sinyal çizgisinin üzerinde — pozitif momentum' }); }
      else if (macdVal < macdSignal && (macdHist ?? 0) < 0) { bearish++; signals.push({ label: 'MACD', signal: 'bear', detail: 'MACD sinyal çizgisinin altında — negatif momentum' }); }
      else signals.push({ label: 'MACD', signal: 'neutral', detail: 'MACD nötr konumda' });
    }
    return { bullish, bearish, signals, overall: bullish > bearish ? 'AL' : bearish > bullish ? 'SAT' : 'NÖTR' as const };
  }, [technicalIndicators]);

  // Cost breakdown donut segments
  const costSegments = useMemo(() => costBreakdown.map((c, i) => ({ label: c.label, value: c.amount, color: COST_COLORS[i % COST_COLORS.length] })), [costBreakdown]);

  // Region supply bar chart items
  const regionBars = useMemo(() => {
    return regionData.slice(0, 6).map((r, i) => {
      const prod = r.products.find((p) => p.name === commodity.name);
      return { label: r.city, value: prod?.supply ?? 0, color: REGION_COLORS[i % REGION_COLORS.length] };
    });
  }, [regionData, commodity]);

  // Region supply donut segments (market share by region)
  const regionDonutSegments = useMemo(() => {
    return regionData.slice(0, 6).map((r, i) => {
      const prod = r.products.find((p) => p.name === commodity.name);
      return { label: r.city, value: prod?.supply ?? 0, color: REGION_COLORS[i % REGION_COLORS.length] };
    }).filter(s => s.value > 0);
  }, [regionData, commodity]);

  // Profitability donut: cost vs profit
  const profitSegments = useMemo(() => {
    if (revenuePerDekar <= 0) return [];
    return [
      { label: 'Üretim Maliyeti', value: totalCost, color: '#ef4444' },
      { label: 'Net Kâr', value: Math.max(profitPerDekar, 0), color: '#059669' },
    ].filter(s => s.value > 0);
  }, [revenuePerDekar, totalCost, profitPerDekar]);

  // Related news
  const relatedNews = useMemo(() => {
    const commodityTags = [commodity.name, commodity.category];
    return newsItems.filter((n) => {
      if (n.commodityTag === commodity.name) return true;
      if (n.tags.some(t => t.toLowerCase().includes(commodity.name.toLowerCase()))) return true;
      return false;
    }).slice(0, 4);
  }, [commodity]);

  const handlePrint = () => window.print();
  const maxCostItem = Math.max(...costBreakdown.map((c) => c.amount), 1);
  const fullHistory = commodity.history;
  const histMax = Math.max(...fullHistory, 1);
  const histMin = Math.min(...fullHistory);

  return (
    <>
      <div className="fixed inset-0 z-[99998] bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="fixed inset-0 z-[99999] flex items-start justify-center overflow-y-auto p-4 print:static print:p-0 print:overflow-visible">
        <div className="report-modal relative my-4 w-full max-w-3xl rounded-2xl border border-ink-700 bg-white shadow-2xl print:my-0 print:max-w-none print:rounded-none print:border-0 print:shadow-none">
          {/* Screen header */}
          <div className="flex items-center justify-between border-b border-ink-700 bg-ink-900 px-6 py-4 print:hidden">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-400" />
              <h2 className="text-base font-semibold text-white">Master Ürün Raporu — Önizleme</h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handlePrint} className="ring-focus flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-400 hover:to-emerald-500">
                <Printer className="h-4 w-4" />
                PDF Olarak Kaydet / Yazdır
              </button>
              <button onClick={onClose} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-ink-800 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Printable report body */}
          <div className="report-body bg-white px-8 py-8 text-slate-800 print:px-12 print:py-10">
            {/* ── Kurumsal Antet ── */}
            <div className="report-section mb-6 border-b-2 border-emerald-600 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-600 text-white">
                    <Wheat className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">TarımFinans</h1>
                    <p className="text-xs font-medium text-emerald-600">Kapsamlı Ürün Analiz Raporu</p>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <div className="font-medium text-slate-700">Rapor Tarihi</div>
                  <div>{today}</div>
                  <div className="mt-1 font-mono text-[10px] text-slate-400">Rapor No: {reportId}</div>
                </div>
              </div>
            </div>

            {/* ── Ürün Kimlik Kartı ── */}
            <div className="report-section mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Ürün</div>
                <div className="text-lg font-bold text-slate-900">{commodity.name}</div>
                <div className="text-xs text-slate-500">{commodity.category}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Güncel Fiyat</div>
                <div className="text-lg font-bold text-slate-900">{commodity.price.toLocaleString('tr-TR')} <span className="text-sm font-normal text-slate-500">{commodity.unit}</span></div>
              </div>
              {exchangeInfo && (
                <div className="text-right">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Borsa Bilgisi</div>
                  <div className="text-sm font-semibold text-slate-900">{exchangeInfo.market}</div>
                  <div className="text-xs text-slate-500">{exchangeInfo.city} · Hacim: {formatNumber(exchangeInfo.volume)} t</div>
                </div>
              )}
            </div>

            {/* ── Yönetici Özeti ── */}
            <Section title="Yönetici Özeti" icon={<Activity className="h-4 w-4" />}>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
                <p>
                  <span className="font-semibold text-slate-800">{commodity.name}</span>, {commodity.region} bölgesinde {commodity.harvestMonths} döneminde hasat edilen bir {commodity.category.toLowerCase()} ürünüdür.
                  Güncel piyasa fiyatı <span className="font-semibold text-slate-800">{commodity.price.toLocaleString('tr-TR')} {commodity.unit}</span> seviyesindedir.
                  {commodity.changeMonth >= 0 ? ` Son bir ayda fiyat %${commodity.changeMonth.toFixed(1)} yükseliş göstermiştir.` : ` Son bir ayda fiyat %${Math.abs(commodity.changeMonth).toFixed(1)} düşüş göstermiştir.`}
                  {' '}Verimlilik skoru {commodity.efficiencyScore}/100 olup, kârlılık oranı {commodity.profitabilityRatio.toFixed(2)}x olarak hesaplanmıştır.
                  {revenuePerDekar > 0 && (<> Dekar başına tahmini net kâr <span className={cn('font-semibold', profitPerDekar >= 0 ? 'text-emerald-600' : 'text-rose-600')}>{formatTRY(profitPerDekar)}</span> ({margin.toFixed(1)}% marj) düzeyindedir.</>)}
                  {signalSummary && (<> Teknik analiz sinyalleri genel olarak <span className={cn('font-bold', signalSummary.overall === 'AL' ? 'text-emerald-600' : signalSummary.overall === 'SAT' ? 'text-rose-600' : 'text-amber-600')}>{signalSummary.overall}</span> yönündedir.</>)}
                </p>
              </div>
            </Section>

            {/* ── 1. Fiyat Değişim Özeti ── */}
            <Section title="1. Fiyat Değişim Özeti" icon={<TrendingUp className="h-4 w-4" />}>
              <div className="grid grid-cols-4 gap-2">
                {[{ l: 'Günlük', v: commodity.changeDay }, { l: 'Haftalık', v: commodity.changeWeek }, { l: 'Aylık', v: commodity.changeMonth }, { l: 'Yıllık', v: commodity.changeYear }].map((x) => (
                  <div key={x.l} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{x.l}</div>
                    <div className={cn('mt-1 flex items-center justify-center gap-0.5 text-base font-bold', x.v >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                      {x.v >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      {formatPct(x.v)}
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* ── 2. Tam Fiyat Geçmişi ── */}
            <Section title="2. Geçmiş Fiyat Eğilimi (Tüm Dönem)" icon={<LineIcon className="h-4 w-4" />}>
              <div className="flex h-24 items-end gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-2">
                {fullHistory.map((v, i) => {
                  const h = ((v - histMin) / ((histMax - histMin) || 1)) * 100;
                  const isUp = i > 0 && v >= fullHistory[i - 1];
                  return <div key={i} className={cn('flex-1 rounded-t', isUp ? 'bg-emerald-500' : 'bg-rose-400')} style={{ height: `${Math.max(h, 3)}%` }} />;
                })}
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                <span>En Düşük: {histMin.toLocaleString('tr-TR')}</span>
                <span>Ortalama: {(fullHistory.reduce((s, v) => s + v, 0) / fullHistory.length).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
                <span>En Yüksek: {histMax.toLocaleString('tr-TR')}</span>
              </div>
              {commodity.priceHistory.length > 0 && (
                <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-slate-100 text-left text-slate-500"><th className="px-3 py-1.5 font-medium">Tarih</th><th className="px-3 py-1.5 text-right font-medium">Fiyat</th><th className="px-3 py-1.5 text-right font-medium">Hacim</th></tr></thead>
                    <tbody>
                      {commodity.priceHistory.slice(-8).reverse().map((p) => (
                        <tr key={p.date} className="border-t border-slate-100"><td className="px-3 py-1.5 text-slate-600">{p.date}</td><td className="px-3 py-1.5 text-right tabular font-medium text-slate-800">{p.price.toLocaleString('tr-TR')}</td><td className="px-3 py-1.5 text-right tabular text-slate-500">{formatNumber(p.volume)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>

            {/* ── 3. Teknik Analiz Göstergeleri ── */}
            {technicalIndicators && (
              <Section title="3. Teknik Analiz Göstergeleri" icon={<Activity className="h-4 w-4" />}>
                <div className="grid grid-cols-3 gap-2">
                  <MetricTile label="Son Kapanış" value={technicalIndicators.lastClose.toFixed(2)} />
                  <MetricTile label="SMA(20)" value={technicalIndicators.sma20 !== null ? technicalIndicators.sma20.toFixed(2) : '—'} sub={technicalIndicators.sma20 !== null && technicalIndicators.lastClose > technicalIndicators.sma20 ? 'Üzerinde' : 'Altında'} accent={technicalIndicators.sma20 !== null && technicalIndicators.lastClose > technicalIndicators.sma20 ? 'emerald' : 'rose'} />
                  <MetricTile label="EMA(12)" value={technicalIndicators.ema12 !== null ? technicalIndicators.ema12.toFixed(2) : '—'} sub={technicalIndicators.ema12 !== null && technicalIndicators.lastClose > technicalIndicators.ema12 ? 'Üzerinde' : 'Altında'} accent={technicalIndicators.ema12 !== null && technicalIndicators.lastClose > technicalIndicators.ema12 ? 'emerald' : 'rose'} />
                  <MetricTile label="RSI(14)" value={technicalIndicators.rsi !== null ? technicalIndicators.rsi.toFixed(1) : '—'} sub={technicalIndicators.rsi !== null ? (technicalIndicators.rsi < 30 ? 'Aşırı Satım' : technicalIndicators.rsi > 70 ? 'Aşırı Alım' : 'Nötr') : ''} accent={technicalIndicators.rsi !== null ? (technicalIndicators.rsi < 30 ? 'emerald' : technicalIndicators.rsi > 70 ? 'rose' : 'slate') : 'slate'} />
                  <MetricTile label="MACD" value={technicalIndicators.macd !== null ? technicalIndicators.macd.toFixed(2) : '—'} sub={technicalIndicators.macdHist !== null ? `Hist: ${technicalIndicators.macdHist.toFixed(2)}` : ''} accent={technicalIndicators.macdHist !== null ? (technicalIndicators.macdHist >= 0 ? 'emerald' : 'rose') : 'slate'} />
                  <MetricTile label="Volatilite" value={`%${technicalIndicators.volatility.toFixed(2)}`} sub="Aylık oynaklık" accent={technicalIndicators.volatility > 3 ? 'rose' : 'slate'} />
                  <MetricTile label="Bollinger Üst" value={technicalIndicators.bollUpper !== null ? technicalIndicators.bollUpper.toFixed(2) : '—'} />
                  <MetricTile label="Bollinger Alt" value={technicalIndicators.bollLower !== null ? technicalIndicators.bollLower.toFixed(2) : '—'} />
                  <MetricTile label="30G Yüksek/Düşük" value={technicalIndicators.periodHigh.toFixed(0)} sub={`Düşük: ${technicalIndicators.periodLow.toFixed(0)}`} />
                </div>
                {signalSummary && (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"><Target className="h-3.5 w-3.5 text-emerald-600" />Teknik Sinyal Özeti</span>
                      <span className={cn('rounded-md px-2.5 py-1 text-xs font-bold', signalSummary.overall === 'AL' ? 'bg-emerald-100 text-emerald-700' : signalSummary.overall === 'SAT' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700')}>{signalSummary.overall}</span>
                    </div>
                    <div className="space-y-1">
                      {signalSummary.signals.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <span className={cn('mt-0.5', s.signal === 'bull' ? 'text-emerald-500' : s.signal === 'bear' ? 'text-rose-500' : 'text-slate-400')}>
                            {s.signal === 'bull' ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.signal === 'bear' ? <AlertTriangle className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                          </span>
                          <span className="font-medium text-slate-700">{s.label}:</span>
                          <span className="text-slate-500">{s.detail}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-4 text-[10px] text-slate-400">
                      <span>Boğa: <span className="font-semibold text-emerald-600">{signalSummary.bullish}</span></span>
                      <span>Ayı: <span className="font-semibold text-rose-600">{signalSummary.bearish}</span></span>
                    </div>
                  </div>
                )}
              </Section>
            )}

            {/* ── 4. Temel Analiz ── */}
            <Section title="4. Temel Analiz — Ürün Bilgileri" icon={<MapPin className="h-4 w-4" />}>
              <div className="grid grid-cols-4 gap-2 text-sm">
                <InfoItem icon={<MapPin className="h-3.5 w-3.5" />} label="Bölge" value={commodity.region} />
                <InfoItem icon={<Calendar className="h-3.5 w-3.5" />} label="Hasat Dönemi" value={commodity.harvestMonths} />
                <InfoItem icon={<Gauge className="h-3.5 w-3.5" />} label="Verimlilik" value={`${commodity.efficiencyScore}/100`} />
                <InfoItem icon={<Wheat className="h-3.5 w-3.5" />} label="Dekar Verim" value={commodity.yieldPerDekar > 0 ? `${commodity.yieldPerDekar} ${commodity.yieldUnit}` : '—'} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Verimlilik Skoru</div>
                  <div className="mt-1 flex items-center justify-center gap-1">
                    <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${commodity.efficiencyScore}%` }} /></div>
                    <span className="text-xs font-bold text-slate-700">{commodity.efficiencyScore}</span>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Kârlılık Oranı</div>
                  <div className="mt-1 text-base font-bold text-emerald-600">{commodity.profitabilityRatio.toFixed(2)}x</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Yıllık Değişim</div>
                  <div className={cn('mt-1 text-base font-bold', commodity.changeYear >= 0 ? 'text-emerald-600' : 'text-rose-600')}>{formatPct(commodity.changeYear)}</div>
                </div>
              </div>
            </Section>

            {/* ── 5. Üretim Maliyeti — Donut + Bar ── */}
            <Section title="5. Üretim Maliyeti Dökümü (dekar başı)" icon={<Coins className="h-4 w-4" />}>
              <div className="flex gap-6">
                {costSegments.length > 0 && (
                  <div className="flex flex-col items-center">
                    <DonutChart segments={costSegments} size={140} />
                    <div className="mt-2 text-center text-[10px] font-medium text-slate-500">Maliyet Dağılımı</div>
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  {costBreakdown.map((c, i) => (
                    <div key={c.label}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 font-medium text-slate-700">
                          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COST_COLORS[i % COST_COLORS.length] }} />
                          {c.label}
                        </span>
                        <span className="tabular text-slate-600">{formatTRY(c.amount)} <span className="text-slate-400">· %{c.sharePct}</span></span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full" style={{ width: `${(c.amount / maxCostItem) * 100}%`, backgroundColor: COST_COLORS[i % COST_COLORS.length] }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 text-sm">
                <span className="font-semibold text-slate-700">Toplam Maliyet / dekar</span>
                <span className="tabular text-lg font-bold text-slate-900">{formatTRY(totalCost)}</span>
              </div>
              {commodity.yieldPerDekar > 0 && (
                <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                  <span>Birim Maliyet (kg/lt)</span>
                  <span className="tabular font-medium text-slate-600">{formatTRY(totalCost / commodity.yieldPerDekar, 2)}</span>
                </div>
              )}
            </Section>

            {/* ── 6. Kârlılık — Donut + Detay ── */}
            {revenuePerDekar > 0 && (
              <Section title="6. Kârlılık Detayları (dekar başı)" icon={<Scale className="h-4 w-4" />}>
                <div className="flex gap-6">
                  {profitSegments.length > 0 && (
                    <div className="flex flex-col items-center">
                      <DonutChart segments={profitSegments} size={140} />
                      <div className="mt-2 text-center text-[10px] font-medium text-slate-500">Hasılat Dağılımı</div>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                        <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Hasılat</div>
                        <div className="mt-1 tabular text-base font-bold text-slate-900">{formatTRY(revenuePerDekar)}</div>
                        <div className="mt-0.5 text-[10px] text-slate-400">{commodity.yieldPerDekar} {commodity.yieldUnit} × {commodity.price.toLocaleString('tr-TR')}</div>
                      </div>
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center">
                        <div className="text-[10px] font-medium uppercase tracking-wider text-emerald-600">Net Kâr</div>
                        <div className={cn('mt-1 tabular text-base font-bold', profitPerDekar >= 0 ? 'text-emerald-600' : 'text-rose-600')}>{formatTRY(profitPerDekar)}</div>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                        <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Kâr Marjı</div>
                        <div className={cn('mt-1 tabular text-base font-bold', margin >= 0 ? 'text-emerald-600' : 'text-rose-600')}>{margin.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                        <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Kârlılık Oranı</div>
                        <div className="mt-1 text-base font-bold text-emerald-600">{commodity.profitabilityRatio.toFixed(2)}x</div>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                        <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Başabaş Verim</div>
                        <div className="mt-1 text-base font-bold text-amber-600">{commodity.price > 0 ? (totalCost / commodity.price).toFixed(0) : '—'} <span className="text-xs font-normal text-slate-500">{commodity.yieldUnit}/dkr</span></div>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                        <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">ROI</div>
                        <div className={cn('mt-1 text-base font-bold', (data.roi ?? margin) >= 0 ? 'text-emerald-600' : 'text-rose-600')}>{(data.roi ?? margin).toFixed(1)}%</div>
                      </div>
                    </div>
                    {data.area && data.netProfit !== undefined && (
                      <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
                        <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-emerald-600">Simülasyon Özeti ({data.area} dekar)</div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div><span className="text-slate-500">Toplam Hasılat:</span> <span className="tabular font-semibold text-slate-800">{formatTRY(data.totalRevenue ?? 0)}</span></div>
                          <div><span className="text-slate-500">Toplam Maliyet:</span> <span className="tabular font-semibold text-slate-800">{formatTRY(data.totalCostScaled ?? 0)}</span></div>
                          <div><span className="text-slate-500">Net Kâr:</span> <span className={cn('tabular font-bold', data.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600')}>{formatTRY(data.netProfit)}</span></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Section>
            )}

            {/* ── 7. Bölgesel Arz-Talep — Donut + Bar + Table ── */}
            {regionData.length > 0 && (
              <Section title="7. Bölgesel Arz-Talep Dengesi" icon={<BarChart3 className="h-4 w-4" />}>
                <div className="flex gap-6">
                  {regionDonutSegments.length > 0 && (
                    <div className="flex flex-col items-center">
                      <DonutChart segments={regionDonutSegments} size={140} />
                      <div className="mt-2 text-center text-[10px] font-medium text-slate-500">Bölgesel Arz Payı</div>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="mb-3">
                      <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">Bölgesel Arz Dağılımı (t)</div>
                      <BarChart items={regionBars} maxVal={Math.max(...regionBars.map(r => r.value), 1)} />
                    </div>
                    <table className="w-full text-xs">
                      <thead><tr className="border-b border-slate-200 text-left text-slate-500"><th className="pb-1.5 font-medium">İl</th><th className="pb-1.5 text-right font-medium">Arz (t)</th><th className="pb-1.5 text-right font-medium">Talep (t)</th><th className="pb-1.5 text-right font-medium">Denge</th><th className="pb-1.5 text-right font-medium">Durum</th></tr></thead>
                      <tbody>
                        {regionData.map((r) => {
                          const prod = r.products.find((p) => p.name === commodity.name);
                          if (!prod) return null;
                          const balance = prod.supply - prod.demand;
                          const status = balance > 0 ? 'Arz Fazlası' : balance < 0 ? 'Arz Açığı' : 'Dengede';
                          const statusColor = balance > 0 ? 'text-emerald-600' : balance < 0 ? 'text-rose-600' : 'text-amber-600';
                          return (
                            <tr key={r.city} className="border-b border-slate-100">
                              <td className="py-1.5 font-medium text-slate-700">{r.city}</td>
                              <td className="py-1.5 text-right tabular text-slate-600">{formatNumber(prod.supply)}</td>
                              <td className="py-1.5 text-right tabular text-slate-600">{formatNumber(prod.demand)}</td>
                              <td className={cn('py-1.5 text-right tabular font-medium', statusColor)}>{balance >= 0 ? '+' : ''}{formatNumber(balance)}</td>
                              <td className={cn('py-1.5 text-right font-medium', statusColor)}>{status}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-500">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  <span>
                    {commodity.name} başlıca {commodity.region} bölgesinde üretilmektedir. Hasat dönemi: {commodity.harvestMonths}.
                    {regionData.reduce((s, r) => { const p = r.products.find((pp) => pp.name === commodity.name); return s + (p ? p.supply - p.demand : 0); }, 0) >= 0 ? ' Toplam arz talebi karşılamakta, fiyatlar baskılanabilir.' : ' Toplam talep arzı aşmakta, fiyatlar desteklenebilir.'}
                  </span>
                </div>
              </Section>
            )}

            {/* ── 8. Güncel Tarım Haberleri ── */}
            {relatedNews.length > 0 && (
              <Section title="8. Ürünle İlgili Güncel Haberler" icon={<Newspaper className="h-4 w-4" />}>
                <div className="space-y-2">
                  {relatedNews.map((n) => (
                    <div key={n.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-slate-800">{n.title}</div>
                          <div className="mt-1 text-[11px] leading-relaxed text-slate-500">{n.summary}</div>
                        </div>
                        <span className={cn('shrink-0 rounded-md px-2 py-0.5 text-[9px] font-bold', n.impact === 'bullish' ? 'bg-emerald-100 text-emerald-700' : n.impact === 'bearish' ? 'bg-rose-100 text-rose-700' : n.impact === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600')}>
                          {n.impactLabel}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-3 text-[10px] text-slate-400">
                        <span className="font-medium text-slate-500">{n.source}</span>
                        <span>{Math.floor(n.publishedMinAgo / 60)}s {(n.publishedMinAgo % 60)}dk önce</span>
                        <span>{n.tags.join(' ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* ── Footer ── */}
            <div className="report-footer mt-8 border-t-2 border-slate-200 pt-4">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>TarımFinans · Kapsamlı Ürün Raporu</span>
                <span>Rapor No: {reportId}</span>
                <span>{today}</span>
              </div>
              <div className="mt-1 text-center text-[9px] text-slate-300">Bu rapor TarımFinans platformu tarafından otomatik üretilmiştir. Veriler temsilidir, yatırım tavsiyesi değildir.</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="report-section mb-5">
      <h3 className="mb-2.5 flex items-center gap-1.5 text-sm font-bold text-slate-800">
        <span className="text-emerald-600">{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
      <span className="text-slate-400">{icon}</span>
      <div><div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</div><div className="text-sm font-medium text-slate-700">{value}</div></div>
    </div>
  );
}

function MetricTile({ label, value, sub, accent = 'slate' }: { label: string; value: string; sub?: string; accent?: 'emerald' | 'rose' | 'slate' }) {
  const colors = { emerald: 'text-emerald-600', rose: 'text-rose-600', slate: 'text-slate-800' };
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-center">
      <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</div>
      <div className={cn('mt-1 tabular text-sm font-bold', colors[accent])}>{value}</div>
      {sub && <div className="mt-0.5 text-[9px] text-slate-400">{sub}</div>}
    </div>
  );
}
