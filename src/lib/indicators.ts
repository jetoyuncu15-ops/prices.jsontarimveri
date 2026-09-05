import type { Candle } from '@/types';

// ── Basit Hareketli Ortalama (SMA) ────────────────────────────
export function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      out.push(null);
      continue;
    }
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += values[j];
    out.push(sum / period);
  }
  return out;
}

// ── Üstel Hareketli Ortalama (EMA) ────────────────────────────
export function ema(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  const k = 2 / (period + 1);
  let prev: number | null = null;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      out.push(null);
      continue;
    }
    if (prev === null) {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) sum += values[j];
      prev = sum / period;
      out.push(prev);
      continue;
    }
    prev = values[i] * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}

// ── RSI (Göreli Güç Endeksi) ──────────────────────────────────
export function rsi(closes: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = [];
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      out.push(null);
      continue;
    }
    const change = closes[i] - closes[i - 1];
    const gain = Math.max(0, change);
    const loss = Math.max(0, -change);
    if (i <= period) {
      avgGain += gain;
      avgLoss += loss;
      if (i === period) {
        avgGain /= period;
        avgLoss /= period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        out.push(100 - 100 / (1 + rs));
      } else {
        out.push(null);
      }
      continue;
    }
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    out.push(100 - 100 / (1 + rs));
  }
  return out;
}

// ── MACD (Hareketli Ortalama Yakınsama/Iraksama) ──────────────
export interface MacdPoint {
  macd: number | null;
  signal: number | null;
  histogram: number | null;
}

export function macd(
  closes: number[],
  fast = 12,
  slow = 26,
  signalPeriod = 9,
): MacdPoint[] {
  const emaFast = ema(closes, fast);
  const emaSlow = ema(closes, slow);
  const macdLine: (number | null)[] = closes.map((_, i) =>
    emaFast[i] !== null && emaSlow[i] !== null
      ? (emaFast[i] as number) - (emaSlow[i] as number)
      : null,
  );
  const validMacd = macdLine.map((v) => (v === null ? 0 : v));
  const signalLine = ema(validMacd, signalPeriod);
  return closes.map((_, i) => {
    const m = macdLine[i];
    const s = signalLine[i];
    return {
      macd: m,
      signal: s,
      histogram: m !== null && s !== null ? m - s : null,
    };
  });
}

// ── Bollinger Bantları ────────────────────────────────────────
export interface BollingerPoint {
  middle: number | null;
  upper: number | null;
  lower: number | null;
}

export function bollinger(
  closes: number[],
  period = 20,
  stdDev = 2,
): BollingerPoint[] {
  const mid = sma(closes, period);
  return closes.map((_, i) => {
    if (mid[i] === null) return { middle: null, upper: null, lower: null };
    const m = mid[i] as number;
    let variance = 0;
    for (let j = i - period + 1; j <= i; j++) variance += (closes[j] - m) ** 2;
    const sd = Math.sqrt(variance / period);
    return {
      middle: m,
      upper: m + sd * stdDev,
      lower: m - sd * stdDev,
    };
  });
}

// ── Yardımcı: kapanış dizisi çıkar ────────────────────────────
export function closesOf(candles: Candle[]): number[] {
  return candles.map((c) => c.close);
}
