import { useMemo, useState } from 'react';
import {
  CloudRain, Thermometer, Droplets, Wind, Shield, AlertTriangle,
  TrendingUp, TrendingDown, Satellite, MapPin, Info, ArrowRight,
  Sun, Snowflake, Flame, Leaf, Activity, Eye, ChevronRight,
} from 'lucide-react';
import {
  climateData, calcInsurance, defaultInsuranceInput,
  ndviFields, generateNdviField, ndviColorMap, cityList, cropList,
  type InsuranceInput, type NdviField,
} from '@/lib/climateData';
import { formatTRY, formatNumber, formatPct, sparkPath } from '@/lib/format';
import { cn } from '@/lib/cn';

export function ClimatePage() {
  return (
    <div className="space-y-5">
      {/* Üst özet */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryTile label="Ort. Sıcaklık" value={`${climateData[0].avgTemp.toFixed(1)}°C`} sub="son 30 gün" icon={Thermometer} accent="amber" />
        <SummaryTile label="Toplam Yağış" value={`${climateData[0].rainfall} mm`} sub="son 30 gün" icon={CloudRain} accent="sky" />
        <SummaryTile label="Kuraklık İndeksi" value={`${climateData[0].droughtIndex}/100`} sub="yüksek risk" icon={Flame} accent="rose" />
        <SummaryTile label="Don Riski" value={`${climateData[0].frostRiskDays} gün`} sub="riskli" icon={Snowflake} accent="slate" />
      </div>

      {/* Sigorta Simülatörü */}
      <InsuranceSimulator />

      {/* NDVI Paneli */}
      <NdviPanel />
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// TARSİM SİGORTA SİMÜLATÖRÜ
// ════════════════════════════════════════════════════════════
function InsuranceSimulator() {
  const [input, setInput] = useState<InsuranceInput>(defaultInsuranceInput);

  const climate = useMemo(
    () => climateData.find((c) => c.city === input.city) ?? climateData[0],
    [input.city],
  );
  const result = useMemo(() => calcInsurance(input), [input]);

  const update = (patch: Partial<InsuranceInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const onCropChange = (cropName: string) => {
    const crop = cropList.find((c) => c.name === cropName);
    if (crop) update({ crop: cropName, yieldPerDekar: crop.defaultYield, unitPrice: crop.defaultPrice });
    else update({ crop: cropName });
  };

  const riskColors: Record<string, { text: string; bg: string; ring: string; label: string }> = {
    low:     { text: 'text-emerald-400', bg: 'bg-emerald-500/10',  ring: 'ring-emerald-500/30',  label: 'Düşük' },
    medium:  { text: 'text-amber-400',   bg: 'bg-amber-500/10',    ring: 'ring-amber-500/30',    label: 'Orta' },
    high:    { text: 'text-rose-400',    bg: 'bg-rose-500/10',     ring: 'ring-rose-500/30',     label: 'Yüksek' },
    extreme: { text: 'text-rose-300',    bg: 'bg-rose-500/20',     ring: 'ring-rose-500/50',     label: 'Aşırı' },
  };
  const rc = riskColors[result.riskLevel];

  return (
    <div className="card p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
        <Shield className="h-4 w-4 text-emerald-400" />
        Parametrik Kuraklık ve Don Sigortası Simülasyonu
        <span className="ml-1 text-xs font-normal text-slate-500">(TARSİM modeli)</span>
      </h3>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Form */}
        <div className="space-y-4">
          {/* İklim durumu */}
          <div className="rounded-lg border border-ink-700/50 bg-ink-850/40 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <MapPin className="h-3.5 w-3.5 text-emerald-400" />
              {input.city} — Güncel İklim Verileri
            </div>
            <div className="grid grid-cols-3 gap-2">
              <ClimateMini icon={Thermometer} label="Sıc." value={`${climate.avgTemp.toFixed(1)}°C`} accent="amber" />
              <ClimateMini icon={CloudRain} label="Yağış" value={`${climate.rainfall}mm`} accent="sky" />
              <ClimateMini icon={Droplets} label="Nem" value={`%${climate.humidity}`} accent="slate" />
              <ClimateMini icon={Wind} label="Rüzgâr" value={`${climate.windSpeed}km/s`} accent="slate" />
              <ClimateMini icon={Flame} label="Kuraklık" value={`${climate.droughtIndex}`} accent="rose" />
              <ClimateMini icon={Snowflake} label="Don" value={`${climate.frostRiskDays}g`} accent="sky" />
            </div>
          </div>

          {/* Ürün & il */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ürün">
              <select
                value={input.crop}
                onChange={(e) => onCropChange(e.target.value)}
                className="ring-focus w-full rounded-lg border border-ink-700 bg-ink-850 px-3 py-2.5 text-sm text-slate-200"
              >
                {cropList.map((c) => <option key={c.name} value={c.name} className="bg-ink-900">{c.name}</option>)}
              </select>
            </Field>
            <Field label="İl">
              <select
                value={input.city}
                onChange={(e) => update({ city: e.target.value })}
                className="ring-focus w-full rounded-lg border border-ink-700 bg-ink-850 px-3 py-2.5 text-sm text-slate-200"
              >
                {cityList.map((c) => <option key={c} value={c} className="bg-ink-900">{c}</option>)}
              </select>
            </Field>
          </div>

          {/* Alan & verim & fiyat */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ekim Alanı (dekar)">
              <NumberInput value={input.area} onChange={(v) => update({ area: v })} step={50} />
            </Field>
            <Field label="Dekar Verim (kg)">
              <NumberInput value={input.yieldPerDekar} onChange={(v) => update({ yieldPerDekar: v })} step={10} />
            </Field>
            <Field label="Birim Fiyat (₺/kg)">
              <NumberInput value={input.unitPrice} onChange={(v) => update({ unitPrice: v })} step={0.5} decimals={2} />
            </Field>
            <Field label="Teminat Oranı (%)">
              <NumberInput value={input.coverageLevel} onChange={(v) => update({ coverageLevel: Math.min(100, Math.max(0, v)) })} step={5} />
            </Field>
          </div>

          {/* Risk skoru göstergesi */}
          <div className={cn('rounded-lg border p-3 ring-1', rc.ring, rc.bg)}>
            <div className="flex items-center justify-between">
              <div>
                <div className="stat-label">Risk Skoru</div>
                <div className={cn('mt-1 tabular text-2xl font-bold', rc.text)}>
                  {result.riskScore}/100
                </div>
              </div>
              <span className={cn('rounded-md px-2.5 py-1 text-xs font-semibold', rc.bg, rc.text)}>
                {rc.label} Risk
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-800">
              <div
                className={cn('h-full rounded-full transition-all', result.riskLevel === 'low' ? 'bg-emerald-500' : result.riskLevel === 'medium' ? 'bg-amber-500' : 'bg-rose-500')}
                style={{ width: `${result.riskScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Sonuç */}
        <div className="space-y-3">
          {/* Teminat & prim */}
          <div className="grid grid-cols-2 gap-3">
            <ResultTile label="Toplam Ürün Değeri" value={formatTRY(result.totalValue)} icon={<Leaf className="h-4 w-4" />} accent="emerald" />
            <ResultTile label="Teminat Bedeli" value={formatTRY(result.coverageAmount)} icon={<Shield className="h-4 w-4" />} accent="sky" sub={`%${input.coverageLevel} oran`} />
          </div>

          {/* Prim dökümü */}
          <div className="rounded-lg border border-ink-700/50 bg-ink-850/40 p-3">
            <div className="mb-2 stat-label">Prim Dökümü</div>
            <div className="space-y-1.5">
              <PremiumRow label="Taban Prim" value={formatTRY(result.basePremium)} />
              <PremiumRow label="Kuraklık Ek Prim" value={formatTRY(result.droughtPremium)} icon={Flame} />
              <PremiumRow label="Don Ek Prim" value={formatTRY(result.frostPremium)} icon={Snowflake} />
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-ink-700/50 pt-2">
              <span className="text-sm font-medium text-slate-300">Toplam Prim</span>
              <div className="text-right">
                <span className="tabular text-lg font-bold text-amber-400">{formatTRY(result.totalPremium)}</span>
                <span className="ml-2 text-xs text-slate-500">(%{result.premiumRate.toFixed(2)})</span>
              </div>
            </div>
          </div>

          {/* Tazminat oranları */}
          <div className="space-y-2">
            <div className="stat-label">Olası Afet Tazminatları</div>
            <PayoutRow icon={Flame} label="Kuraklık Tazminatı" value={formatTRY(result.payoutDrought)} pct={75} accent="rose" />
            <PayoutRow icon={Snowflake} label="Don Tazminatı" value={formatTRY(result.payoutFrost)} pct={65} accent="sky" />
            <PayoutRow icon={CloudRain} label="Dolu Tazminatı" value={formatTRY(result.payoutHail)} pct={80} accent="amber" />
          </div>

          {/* Uyarı */}
          {result.riskLevel === 'high' || result.riskLevel === 'extreme' ? (
            <div className="flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2.5 text-xs text-rose-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                Seçili il ve ürün kombinasyonu için iklim risk skoru yüksek. Kuraklık veya don olayı durumunda
                ürün kaybı olası. Teminat oranını artırmayı ve kuraklık/don ek teminatlarını değerlendirmeyi öneririz.
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 text-xs text-emerald-300">
              <Shield className="h-4 w-4 shrink-0" />
              <span>
                İklim risk skoru düşük-orta seviyede. Standart TARSİM teminatı yeterli olabilir,
                ancak kuraklık ek teminatı önerilir.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// NDVI — UYDU TABANLI TARLA SAĞLIK SKORU
// ════════════════════════════════════════════════════════════
function ndviToColor(ndvi: number): string {
  if (ndvi < 0.2) return '#dc2626';
  if (ndvi < 0.4) return '#f59e0b';
  if (ndvi < 0.6) return '#84cc16';
  return '#10b981';
}

function ndviOpacity(ndvi: number): number {
  return 0.35 + ndvi * 0.55;
}

function NdviPanel() {
  const [selectedFieldIdx, setSelectedFieldIdx] = useState(0);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; ndvi: number } | null>(null);

  const fields = ndviFields;
  const selected = fields[selectedFieldIdx];

  const healthLabels: Record<string, { label: string; color: string; desc: string }> = {
    stressed:  { label: 'Stresli',  color: ndviColorMap.stressed,  desc: 'Bitki stresi yüksek, sulama gerekebilir' },
    moderate:  { label: 'Orta',     color: ndviColorMap.moderate,   desc: 'Gelişim orta seviye, takip önerilir' },
    healthy:   { label: 'Sağlıklı', color: ndviColorMap.healthy,    desc: 'Bitki gelişimi iyi gidiyor' },
    vigorous:  { label: 'Verimli',  color: ndviColorMap.vigorous,   desc: 'Maksimum verim, bitki gelişimi mükemmel' },
  };

  const sparkD = sparkPath(selected.trend, 200, 48, 4);
  const trendUp = selected.trend[selected.trend.length - 1] >= selected.trend[0];

  // NDVI heatmap blobs — derived from field cells, positioned in viewBox coords
  const W = 400, H = 300;
  const cellW = W / selected.gridSize;
  const cellH = H / selected.gridSize;
  const heatmapBlobs = selected.cells.map((cell) => ({
    cx: cell.col * cellW + cellW / 2,
    cy: cell.row * cellH + cellH / 2,
    r: Math.max(cellW, cellH) * 0.85,
    color: ndviToColor(cell.ndvi),
    opacity: ndviOpacity(cell.ndvi),
    ndvi: cell.ndvi,
  }));

  // Stylized terrain features — roads, neighboring parcels, field boundary
  const fieldPath = 'M 60,50 L 340,40 L 360,160 L 330,260 L 80,250 L 50,140 Z';

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    // Find nearest cell
    const col = Math.floor(x / cellW);
    const row = Math.floor(y / cellH);
    if (col >= 0 && col < selected.gridSize && row >= 0 && row < selected.gridSize) {
      const cell = selected.cells.find((c) => c.row === row && c.col === col);
      if (cell) {
        setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, ndvi: cell.ndvi });
      }
    }
  };

  return (
    <div className="card p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
        <Satellite className="h-4 w-4 text-emerald-400" />
        Uydu Tabanlı Tarla Sağlık Skoru (NDVI)
        <span className="ml-1 text-xs font-normal text-slate-500">— mock simülasyon</span>
      </h3>

      {/* Tarla seçici */}
      <div className="mb-4 flex flex-wrap gap-2">
        {fields.map((f, i) => (
          <button
            key={i}
            onClick={() => setSelectedFieldIdx(i)}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all',
              selectedFieldIdx === i
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200 ring-1 ring-emerald-500/30'
                : 'border-ink-700 bg-ink-850 text-slate-400 hover:text-slate-200',
            )}
          >
            <MapPin className="h-3.5 w-3.5" />
            {f.city} · {f.fieldName}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* Uydu görüntüsü mock-up + NDVI heatmap */}
        <div className="lg:col-span-3">
          <div className="rounded-lg border border-ink-700/50 bg-ink-850/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-sm font-medium text-white">
                  <Eye className="h-4 w-4 text-slate-500" />
                  {selected.fieldName}
                </div>
                <div className="text-xs text-slate-500">{selected.city} · uydu görüntüsü mock-up</div>
              </div>
              <div className="text-right">
                <div className="stat-label">Ort. NDVI</div>
                <div className="tabular text-lg font-bold text-white">{selected.avgNdvi.toFixed(2)}</div>
              </div>
            </div>

            {/* SVG uydu haritası */}
            <div className="relative overflow-hidden rounded-lg" style={{ background: '#1a1f2e' }}>
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full cursor-crosshair"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setTooltip(null)}
                style={{ display: 'block' }}
              >
                <defs>
                  {/* Terrain noise filter */}
                  <filter id="terrainNoise" x="0%" y="0%" width="100%" height="100%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" seed={selectedFieldIdx + 1} result="noise" />
                    <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0.08  0 0 0 0 0.10  0 0 0 0 0.07  0 0 0 0.5 0" />
                    <feComposite operator="in" in2="SourceGraphic" />
                  </filter>
                  {/* Blur filter for heatmap blobs — smooth gradient transitions */}
                  <filter id="heatBlur" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="14" />
                  </filter>
                  {/* Clip path for field boundary */}
                  <clipPath id="fieldClip">
                    <path d={fieldPath} />
                  </clipPath>
                  {/* Terrain gradient — dark gray-green base */}
                  <radialGradient id="terrainBase" cx="50%" cy="50%" r="70%">
                    <stop offset="0%" stopColor="#2a2f3a" />
                    <stop offset="100%" stopColor="#1a1e28" />
                  </radialGradient>
                </defs>

                {/* Base terrain background */}
                <rect x="0" y="0" width={W} height={H} fill="url(#terrainBase)" />

                {/* Terrain texture overlay — noise pattern */}
                <rect x="0" y="0" width={W} height={H} fill="#2a2f3a" filter="url(#terrainNoise)" opacity="0.4" />

                {/* Neighboring parcels — subtle dark rectangles */}
                <rect x="5" y="5" width="45" height="80" fill="#232830" stroke="#2a2f3a" strokeWidth="0.5" opacity="0.7" />
                <rect x="350" y="5" width="45" height="60" fill="#232830" stroke="#2a2f3a" strokeWidth="0.5" opacity="0.7" />
                <rect x="5" y="200" width="40" height="60" fill="#232830" stroke="#2a2f3a" strokeWidth="0.5" opacity="0.7" />
                <rect x="340" y="220" width="55" height="75" fill="#232830" stroke="#2a2f3a" strokeWidth="0.5" opacity="0.7" />

                {/* Roads — thin lines around field */}
                <path d="M 0,30 L 400,20" stroke="#3a3f4a" strokeWidth="2.5" fill="none" opacity="0.6" />
                <path d="M 0,270 L 400,275" stroke="#3a3f4a" strokeWidth="2.5" fill="none" opacity="0.6" />
                <path d="M 40,0 L 35,300" stroke="#3a3f4a" strokeWidth="2" fill="none" opacity="0.5" />
                <path d="M 365,0 L 370,300" stroke="#3a3f4a" strokeWidth="2" fill="none" opacity="0.5" />

                {/* NDVI heatmap layer — clipped to field boundary, blurred for smooth transitions */}
                <g clipPath="url(#fieldClip)" filter="url(#heatBlur)">
                  {heatmapBlobs.map((blob, i) => (
                    <circle
                      key={i}
                      cx={blob.cx}
                      cy={blob.cy}
                      r={blob.r}
                      fill={blob.color}
                      opacity={blob.opacity}
                    />
                  ))}
                </g>

                {/* Field boundary — dashed outline */}
                <path
                  d={fieldPath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                  opacity="0.7"
                />

                {/* Field label marker */}
                <circle cx={200} cy={150} r="3" fill="#10b981" opacity="0.9" />
                <text x="208" y="153" fill="#10b981" fontSize="9" opacity="0.8" style={{ fontFamily: 'monospace' }}>
                  {selected.fieldName}
                </text>

                {/* Compass */}
                <g transform="translate(370, 30)">
                  <circle r="10" fill="none" stroke="#4a4f5a" strokeWidth="1" opacity="0.5" />
                  <path d="M 0,-7 L 3,0 L 0,7 L -3,0 Z" fill="#6a6f7a" opacity="0.6" />
                  <text y="-13" fill="#5a5f6a" fontSize="7" textAnchor="middle" opacity="0.5">N</text>
                </g>

                {/* Scale bar */}
                <g transform="translate(20, 285)">
                  <rect x="0" y="0" width="60" height="3" fill="#4a4f5a" opacity="0.5" />
                  <text x="30" y="-3" fill="#5a5f6a" fontSize="7" textAnchor="middle" opacity="0.5">200 m</text>
                </g>
              </svg>

              {/* Tooltip — floating info balloon */}
              {tooltip && (
                <div
                  className="pointer-events-none absolute z-10 rounded-lg border border-ink-600/80 bg-ink-900/95 px-2.5 py-1.5 text-xs shadow-xl backdrop-blur-sm"
                  style={{
                    left: `${Math.min(tooltip.x + 12, 280)}px`,
                    top: `${Math.min(tooltip.y - 10, 220)}px`,
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: ndviToColor(tooltip.ndvi) }}
                    />
                    <span className="tabular font-semibold text-white">NDVI: {tooltip.ndvi.toFixed(2)}</span>
                  </div>
                  <div className="mt-0.5 text-[10px] text-slate-500">
                    {tooltip.ndvi < 0.2 ? 'Stresli bölge' : tooltip.ndvi < 0.4 ? 'Orta gelişim' : tooltip.ndvi < 0.6 ? 'Sağlıklı' : 'Verimli bölge'}
                  </div>
                </div>
              )}
            </div>

            {/* Renk skalası */}
            <div className="mt-3">
              <div className="mb-1.5 flex items-center justify-between text-[10px] text-slate-500">
                <span>0.0</span><span>0.2</span><span>0.4</span><span>0.6</span><span>0.8</span><span>1.0</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full" style={{
                background: 'linear-gradient(to right, #dc2626 0%, #f59e0b 25%, #84cc16 50%, #10b981 75%, #059669 100%)',
              }} />
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-600">
                <span>Stresli</span><span>Orta</span><span>Sağlıklı</span><span>Verimli</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sağ panel — skor & detay */}
        <div className="space-y-3 lg:col-span-2">
          {/* Sağlık skoru */}
          <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              <span className="stat-label text-emerald-300/80">Tarla Sağlık Skoru</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="tabular text-4xl font-bold text-emerald-400">{selected.healthScore}</span>
              <span className="text-sm text-slate-500">/ 100</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-800">
              <div className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 transition-all" style={{ width: `${selected.healthScore}%` }} />
            </div>
          </div>

          {/* Dağılım */}
          <div className="rounded-lg border border-ink-700/50 bg-ink-850/40 p-3">
            <div className="mb-2 stat-label">Bitki Sağlık Dağılımı</div>
            <div className="space-y-2">
              {Object.entries(healthLabels).map(([key, meta]) => {
                const count = selected.cells.filter((c) => c.health === key).length;
                const pct = Math.round((count / selected.cells.length) * 100);
                return (
                  <div key={key} className="flex items-center gap-2">
                    <div className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: meta.color }} />
                    <span className="flex-1 text-xs text-slate-300">{meta.label}</span>
                    <span className="tabular text-xs font-medium text-slate-400">{pct}%</span>
                    <span className="tabular text-[10px] text-slate-600">({count})</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 12 haftalık trend */}
          <div className="rounded-lg border border-ink-700/50 bg-ink-850/50 p-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="stat-label">12 Haftalık NDVI Eğilimi</span>
              <span className={cn('flex items-center gap-1 text-xs font-medium', trendUp ? 'text-emerald-400' : 'text-rose-400')}>
                {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {trendUp ? 'Yükseliş' : 'Düşüş'}
              </span>
            </div>
            <svg viewBox="0 0 200 56" className="mt-1 h-14 w-full" preserveAspectRatio="none">
              <path d={sparkD} fill="none" stroke={trendUp ? '#10b981' : '#f43f5e'} strokeWidth="2" strokeLinejoin="round" />
              <path d={`${sparkD} L200,56 L0,56 Z`} fill={trendUp ? '#10b981' : '#f43f5e'} fillOpacity="0.08" />
            </svg>
            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-600">
              <span>12 hafta önce</span>
              <span>bugün</span>
            </div>
          </div>

          {/* Stres uyarısı */}
          {selected.stressedPct > 20 ? (
            <div className="flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2.5 text-xs text-rose-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                Tarlanın %{selected.stressedPct}'lik bölümü stresli. Sulama planını gözden geçirin
                ve bu bölgede verim kaybı bekleyin.
              </span>
            </div>
          ) : selected.vigorousPct > 40 ? (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 text-xs text-emerald-300">
              <Leaf className="h-4 w-4 shrink-0" />
              <span>
                Tarlanın %{selected.vigorousPct}'i verimli bölgede. Bitki gelişimi mükemmel gidiyor,
                yüksek verim bekleyebilirsiniz.
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Bilgi notu */}
      <div className="mt-4 flex items-start gap-2 rounded-lg border border-ink-700/50 bg-ink-850/40 px-4 py-3 text-xs text-slate-500">
        <Info className="h-4 w-4 shrink-0 text-slate-600" />
        <span>
          NDVI (Normalize Edilmiş Bitki İndeksi), uyduların yakın kızılötesi ve kırmızı bant yansımalarından
          hesaplanan bir bitki gelişim göstergesidir. 0–1 arası değerler alır: 0.2 altı stresli,
          0.4–0.6 sağlıklı, 0.6+ verimli bölgeyi ifade eder. Buradaki veriler tanıtım amaçlı mock simülasyondur.
        </span>
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
  icon: typeof CloudRain;
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

function ClimateMini({
  icon: Icon, label, value, accent,
}: {
  icon: typeof Thermometer;
  label: string;
  value: string;
  accent: 'amber' | 'sky' | 'rose' | 'slate';
}) {
  const colors: Record<string, string> = {
    amber: 'text-amber-400',
    sky: 'text-sky-400',
    rose: 'text-rose-400',
    slate: 'text-slate-300',
  };
  return (
    <div className="flex items-center gap-1.5 rounded-md bg-ink-900/50 px-2 py-1.5">
      <Icon className={cn('h-3.5 w-3.5', colors[accent])} />
      <div className="min-w-0">
        <div className="text-[10px] text-slate-600">{label}</div>
        <div className={cn('tabular text-xs font-semibold', colors[accent])}>{value}</div>
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

function ResultTile({
  label, value, icon, accent, sub,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: 'emerald' | 'amber' | 'rose' | 'sky' | 'slate';
  sub?: string;
}) {
  const colors: Record<string, string> = {
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400',
    sky: 'text-sky-400',
    slate: 'text-slate-200',
  };
  return (
    <div className="rounded-xl border border-ink-700/50 bg-ink-850/50 p-3">
      <div className="flex items-center gap-1.5 text-slate-500">
        {icon}
        <span className="stat-label">{label}</span>
      </div>
      <div className={cn('mt-1 tabular text-base font-bold', colors[accent])}>{value}</div>
      {sub && <div className="text-[10px] text-slate-600">{sub}</div>}
    </div>
  );
}

function PremiumRow({
  label, value, icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof Flame;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-1.5 text-slate-400">
        {Icon && <Icon className="h-3.5 w-3.5 text-slate-500" />}
        {label}
      </span>
      <span className="tabular font-medium text-slate-300">{value}</span>
    </div>
  );
}

function PayoutRow({
  icon: Icon, label, value, pct, accent,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  pct: number;
  accent: 'rose' | 'sky' | 'amber';
}) {
  const colors: Record<string, string> = {
    rose: 'text-rose-400 border-rose-500/20 bg-rose-500/5',
    sky: 'text-sky-400 border-sky-500/20 bg-sky-500/5',
    amber: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
  };
  return (
    <div className={cn('flex items-center justify-between rounded-lg border px-3 py-2.5', colors[accent])}>
      <span className="flex items-center gap-2 text-xs">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span className="rounded bg-ink-900/60 px-1.5 py-0.5 text-[10px] text-slate-500">%{pct} tazmin</span>
        <span className="tabular text-sm font-semibold">{value}</span>
      </div>
    </div>
  );
}
