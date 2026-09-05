import { useState, useCallback } from 'react';
import { Sparkles, Loader2, AlertTriangle, Zap, Fuel, TrendingUp, ShieldAlert, Lightbulb, RefreshCw } from 'lucide-react';
import { getRealElectricityPrices, generateAiAnalysisPrompt, getAiAnalysis } from '@/services/api';
import type { AiAnalysisResult, ElectricityPriceData } from '@/types';
import { cn } from '@/lib/cn';
import { formatPct } from '@/lib/format';

export function AiAnalysisPanel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AiAnalysisResult | null>(null);
  const [priceData, setPriceData] = useState<ElectricityPriceData | null>(null);
  const [source, setSource] = useState<'ai' | 'heuristic' | null>(null);

  const handleAnalyse = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAiResult(null);
    setPriceData(null);
    setSource(null);

    try {
      const realPrices = await getRealElectricityPrices();
      setPriceData(realPrices);

      const prompt = generateAiAnalysisPrompt(realPrices);
      const { result, source: src } = await getAiAnalysis(prompt, realPrices);
      setAiResult(result);
      setSource(src);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, []);

  const statusColor =
    aiResult?.maliyetStatus === 'Yüksek'
      ? 'text-rose-400 bg-rose-500/10 ring-rose-500/30'
      : aiResult?.maliyetStatus === 'Dengeli'
        ? 'text-amber-400 bg-amber-500/10 ring-amber-500/30'
        : 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/30';

  const riskColor =
    aiResult == null
      ? 'text-slate-400'
      : aiResult.riskSkoru >= 70
        ? 'text-rose-400'
        : aiResult.riskSkoru >= 40
          ? 'text-amber-400'
          : 'text-emerald-400';

  const riskBarColor =
    aiResult == null
      ? 'bg-slate-600'
      : aiResult.riskSkoru >= 70
        ? 'bg-gradient-to-r from-rose-600 to-rose-400'
        : aiResult.riskSkoru >= 40
          ? 'bg-gradient-to-r from-amber-600 to-amber-400'
          : 'bg-gradient-to-r from-emerald-600 to-emerald-400';

  return (
    <div className="card overflow-hidden p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Yapay Zeka Tarım Maliyet Analizi</h3>
            <p className="text-xs text-slate-500">Canlı enerji verisi + AI makro yorumlama</p>
          </div>
        </div>
        {source && (
          <span
            className={cn(
              'rounded-md px-2 py-0.5 text-[10px] font-medium ring-1',
              source === 'ai'
                ? 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20'
                : 'bg-amber-500/10 text-amber-300 ring-amber-500/20',
            )}
          >
            {source === 'ai' ? 'AI Motoru' : 'Yerel Analiz'}
          </span>
        )}
      </div>

      {/* Action button */}
      <button
        onClick={handleAnalyse}
        disabled={loading}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-200',
          loading
            ? 'cursor-not-allowed bg-ink-800 text-slate-500'
            : 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-emerald-400 hover:shadow-emerald-500/30',
        )}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Yapay Zeka Analiz Ediyor...
          </>
        ) : aiResult ? (
          <>
            <RefreshCw className="h-4 w-4" />
            Analizi Yenile
          </>
        ) : (
          <>
            <Zap className="h-4 w-4" />
            Canlı Veriyi Çek ve Yapay Zekaya Yorumlat
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Price data preview */}
      {priceData && !loading && (
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <PriceTile
            icon={<Zap className="h-3.5 w-3.5" />}
            label="Ort. Elektrik"
            value={`${priceData.averagePrice.toFixed(2)} ₺/kWh`}
            sub={priceData.source}
          />
          <PriceTile
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            label="Günlük Eğilim"
            value={formatPct(priceData.changePct)}
            sub={priceData.trend === 'up' ? 'Yükseliş' : priceData.trend === 'down' ? 'Düşüş' : 'İstikrarlı'}
            accent={priceData.trend === 'up' ? 'rose' : priceData.trend === 'down' ? 'emerald' : 'slate'}
          />
          <PriceTile
            icon={<Fuel className="h-3.5 w-3.5" />}
            label="Mazot Fiyatı"
            value={`${priceData.dieselPrice.toFixed(2)} ₺/lt`}
            sub={formatPct(priceData.dieselChangePct)}
            accent={priceData.dieselChangePct > 0 ? 'rose' : 'emerald'}
          />
          <PriceTile
            icon={<Zap className="h-3.5 w-3.5" />}
            label="Tepe Fiyat"
            value={`${priceData.maxPrice.toFixed(2)} ₺/kWh`}
            sub={`Min: ${priceData.minPrice.toFixed(2)}`}
          />
        </div>
      )}

      {/* AI Result panel */}
      {aiResult && !loading && (
        <div className="mt-4 animate-fade-in rounded-lg border border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent p-4">
          {/* Title bar */}
          <div className="mb-4 flex items-center gap-2 border-b border-emerald-500/20 pb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <h4 className="text-sm font-bold text-white">Yapay Zeka Tarım Raporu</h4>
            <span
              className={cn(
                'ml-auto rounded-md px-2.5 py-1 text-xs font-bold ring-1',
                statusColor,
              )}
            >
              {aiResult.maliyetStatus}
            </span>
          </div>

          {/* Risk score bar */}
          <div className="mb-4">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-400">
                <ShieldAlert className="h-3.5 w-3.5" />
                Risk Skoru
              </span>
              <span className={cn('tabular text-sm font-bold', riskColor)}>%{aiResult.riskSkoru}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-ink-800">
              <div
                className={cn('h-full rounded-full transition-all duration-700', riskBarColor)}
                style={{ width: `${aiResult.riskSkoru}%` }}
              />
            </div>
          </div>

          {/* Analysis text */}
          <div className="mb-3 rounded-lg border border-ink-700/50 bg-ink-850/50 p-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              Etki Analizi
            </div>
            <p className="text-sm leading-relaxed text-slate-200">{aiResult.tarimsalEtkiYorumu}</p>
          </div>

          {/* Recommendation */}
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-400">
              <Lightbulb className="h-3.5 w-3.5" />
              Stratejik Tavsiye
            </div>
            <p className="text-sm leading-relaxed text-slate-200">{aiResult.tavsiyeEdinenAksiyon}</p>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="mt-4 space-y-3">
          <div className="h-20 animate-pulse rounded-lg bg-ink-800/50" />
          <div className="h-24 animate-pulse rounded-lg bg-ink-800/50" />
          <div className="h-16 animate-pulse rounded-lg bg-ink-800/50" />
        </div>
      )}
    </div>
  );
}

function PriceTile({
  icon,
  label,
  value,
  sub,
  accent = 'slate',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: 'emerald' | 'rose' | 'slate';
}) {
  const accentColor =
    accent === 'emerald' ? 'text-emerald-400' : accent === 'rose' ? 'text-rose-400' : 'text-slate-200';
  return (
    <div className="rounded-lg border border-ink-700/50 bg-ink-850/50 p-3">
      <div className="flex items-center gap-1.5 text-slate-500">
        {icon}
        <span className="stat-label">{label}</span>
      </div>
      <div className={cn('tabular mt-1 text-sm font-bold', accentColor)}>{value}</div>
      {sub && <div className="mt-0.5 truncate text-[10px] text-slate-600">{sub}</div>}
    </div>
  );
}
