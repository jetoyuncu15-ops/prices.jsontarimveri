import type { LucideIcon } from 'lucide-react';
import {
  TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight,
  GitCompare, ArrowUpDown, Triangle, Flag, Spline,
  Waves, Activity, BarChart3, Target, Layers, Grid3x3,
  Circle, Square, Slash, ChevronUp, ChevronDown, Network, Cloud,
} from 'lucide-react';

export type RenderKind =
  | 'line' | 'horizontal' | 'fibonacci' | 'fib-extension' | 'fib-fan'
  | 'channel' | 'triangle' | 'flag' | 'wedge' | 'megaphone'
  | 'box' | 'hline-label' | 'multi-line' | 'annotation';

export type ToolCategory =
  | 'trend-seviye' | 'kanal' | 'geometrik' | 'donus'
  | 'fibonacci' | 'dalga' | 'indikatör' | 'smc';

export interface DrawToolDef {
  id: string;
  label: string;
  shortLabel: string;
  category: ToolCategory;
  icon: LucideIcon;
  kind: RenderKind;
  points: 2 | 3 | 4;
  color: string;
  hint: string;
}

export const TOOL_CATEGORIES: { id: ToolCategory; label: string; icon: LucideIcon }[] = [
  { id: 'trend-seviye', label: 'Trend & Seviyeler', icon: TrendingUp },
  { id: 'kanal', label: 'Fiyat Kanalları', icon: ArrowUpDown },
  { id: 'geometrik', label: 'Geometrik Sıkışma', icon: Triangle },
  { id: 'donus', label: 'Trend Dönüşü', icon: Spline },
  { id: 'fibonacci', label: 'Fibonacci', icon: GitCompare },
  { id: 'dalga', label: 'Dalga & Harmonik', icon: Waves },
  { id: 'indikatör', label: 'İndikatör Çizgileri', icon: Activity },
  { id: 'smc', label: 'SMC (Smart Money)', icon: Network },
];

export const DRAW_TOOLS: DrawToolDef[] = [
  // a) Klasik Trend ve Seviyeler
  { id: 'rising-trend', label: 'Yükselen Trend', shortLabel: 'Y. Trend', category: 'trend-seviye', icon: TrendingUp, kind: 'line', points: 2, color: '#10b981', hint: 'Yükselen trend çizgisi — dip noktalarından yukarı' },
  { id: 'falling-trend', label: 'Alçalan Trend', shortLabel: 'A. Trend', category: 'trend-seviye', icon: TrendingDown, kind: 'line', points: 2, color: '#f43f5e', hint: 'Alçalan trend çizgisi — tepe noktalarından aşağı' },
  { id: 'support', label: 'Yatay Destek', shortLabel: 'Destek', category: 'trend-seviye', icon: Minus, kind: 'horizontal', points: 2, color: '#10b981', hint: 'Yatay destek hattı' },
  { id: 'resistance', label: 'Yatay Direnç', shortLabel: 'Direnç', category: 'trend-seviye', icon: Minus, kind: 'horizontal', points: 2, color: '#f43f5e', hint: 'Yatay direnç hattı' },
  { id: 'retest', label: 'Kırılım/Onay (Retest)', shortLabel: 'Retest', category: 'trend-seviye', icon: ArrowUpRight, kind: 'line', points: 2, color: '#38bdf8', hint: 'Kırılım sonrası retest çizgisi' },

  // b) Fiyat Kanalları
  { id: 'rising-channel', label: 'Yükselen Kanal', shortLabel: 'Y. Kanal', category: 'kanal', icon: ArrowUpRight, kind: 'channel', points: 4, color: '#10b981', hint: 'Paralel yükselen kanal — üst ve alt bant' },
  { id: 'falling-channel', label: 'Alçalan Kanal', shortLabel: 'A. Kanal', category: 'kanal', icon: ArrowDownRight, kind: 'channel', points: 4, color: '#f43f5e', hint: 'Paralel alçalan kanal — üst ve alt bant' },
  { id: 'flat-channel', label: 'Yatay Kanal (Konsolidasyon)', shortLabel: 'Yatay Kanal', category: 'kanal', icon: Minus, kind: 'channel', points: 4, color: '#f59e0b', hint: 'Yatay konsolidasyon kanalı' },
  { id: 'regression', label: 'Regresyon Kanalı', shortLabel: 'Regresyon', category: 'kanal', icon: BarChart3, kind: 'channel', points: 4, color: '#a78bfa', hint: 'Lineer regresyon kanalı' },

  // c) Geometrik Sıkışma ve Devam
  { id: 'sym-triangle', label: 'Simetrik Üçgen', shortLabel: 'Sim. Üçgen', category: 'geometrik', icon: Triangle, kind: 'triangle', points: 4, color: '#38bdf8', hint: 'Simetrik üçgen sıkışması' },
  { id: 'asc-triangle', label: 'Yükselen Üçgen', shortLabel: 'Y. Üçgen', category: 'geometrik', icon: Triangle, kind: 'triangle', points: 4, color: '#10b981', hint: 'Yükselen üçgen — düz direnç, yükselen destek' },
  { id: 'desc-triangle', label: 'Alçalan Üçgen', shortLabel: 'A. Üçgen', category: 'geometrik', icon: Triangle, kind: 'triangle', points: 4, color: '#f43f5e', hint: 'Alçalan üçgen — düz destek, alçalan direnç' },
  { id: 'bull-flag', label: 'Boğa Bayrağı', shortLabel: 'Boğa Bayrak', category: 'geometrik', icon: Flag, kind: 'flag', points: 4, color: '#10b981', hint: 'Boğa bayrağı devam formasyonu' },
  { id: 'bear-flag', label: 'Ayı Bayrağı', shortLabel: 'Ayı Bayrak', category: 'geometrik', icon: Flag, kind: 'flag', points: 4, color: '#f43f5e', hint: 'Ayı bayrağı devam formasyonu' },
  { id: 'pennant', label: 'Flama', shortLabel: 'Flama', category: 'geometrik', icon: Triangle, kind: 'triangle', points: 4, color: '#a78bfa', hint: 'Flama (pennant) sıkışması' },
  { id: 'megaphone', label: 'Genişleyen Takoz (Megafon)', shortLabel: 'Megafon', category: 'geometrik', icon: Slash, kind: 'megaphone', points: 4, color: '#f59e0b', hint: 'Genişleyen takoz — giderek artan volatilite' },

  // d) Trend Dönüş Formasyonları
  { id: 'hns', label: 'OBO (Omuz Baş Omuz)', shortLabel: 'OBO', category: 'donus', icon: Spline, kind: 'multi-line', points: 4, color: '#f43f5e', hint: 'Omuz-Baş-Omuz tepa formasyonu' },
  { id: 'inv-hns', label: 'TOBO (Ters OBO)', shortLabel: 'TOBO', category: 'donus', icon: Spline, kind: 'multi-line', points: 4, color: '#10b981', hint: 'Ters Omuz-Baş-Omuz dip formasyonu' },
  { id: 'double-top', label: 'İkili Tepe', shortLabel: 'İki Tepe', category: 'donus', icon: Spline, kind: 'hline-label', points: 2, color: '#f43f5e', hint: 'İkili tepe (double top) formasyonu' },
  { id: 'double-bottom', label: 'İkili Dip', shortLabel: 'İki Dip', category: 'donus', icon: Spline, kind: 'hline-label', points: 2, color: '#10b981', hint: 'İkili dip (double bottom) formasyonu' },
  { id: 'triple-top', label: 'Üçlü Tepe', shortLabel: '3 Tepe', category: 'donus', icon: Spline, kind: 'hline-label', points: 2, color: '#f43f5e', hint: 'Üçlü tepe formasyonu' },
  { id: 'triple-bottom', label: 'Üçlü Dip', shortLabel: '3 Dip', category: 'donus', icon: Spline, kind: 'hline-label', points: 2, color: '#10b981', hint: 'Üçlü dip formasyonu' },
  { id: 'rising-wedge', label: 'Yükselen Takoz', shortLabel: 'Y. Takoz', category: 'donus', icon: ChevronUp, kind: 'wedge', points: 4, color: '#f43f5e', hint: 'Yükselen takoz (wedge) — alım tuzağı' },
  { id: 'falling-wedge', label: 'Alçalan Takoz', shortLabel: 'A. Takoz', category: 'donus', icon: ChevronDown, kind: 'wedge', points: 4, color: '#10b981', hint: 'Alçalan takoz (wedge) — satım tuzağı' },
  { id: 'cup-handle', label: 'Fincan Kulp', shortLabel: 'Fincan', category: 'donus', icon: Circle, kind: 'multi-line', points: 4, color: '#10b981', hint: 'Fincan-kulp (cup and handle) formasyonu' },
  { id: 'rounding', label: 'Çanak', shortLabel: 'Çanak', category: 'donus', icon: Circle, kind: 'multi-line', points: 4, color: '#10b981', hint: 'Çanak (rounding bottom) formasyonu' },
  { id: 'inv-rounding', label: 'Ters Çanak', shortLabel: 'T. Çanak', category: 'donus', icon: Circle, kind: 'multi-line', points: 4, color: '#f43f5e', hint: 'Ters çanak (rounding top) formasyonu' },

  // e) Fibonacci Araçları
  { id: 'fib-retracement', label: 'Fibo Düzeltmesi', shortLabel: 'Fibo Düzeltme', category: 'fibonacci', icon: GitCompare, kind: 'fibonacci', points: 2, color: '#a78bfa', hint: 'Fibonacci geri çekilme seviyeleri (0.382, 0.50, 0.618)' },
  { id: 'fib-extension', label: 'Fibo Uzatması', shortLabel: 'Fibo Uzatma', category: 'fibonacci', icon: ArrowUpDown, kind: 'fib-extension', points: 3, color: '#a78bfa', hint: 'Fibonacci uzatma seviyeleri (1.272, 1.618, 2.618)' },
  { id: 'fib-fan', label: 'Hız Direnç Fanları', shortLabel: 'Fibo Fan', category: 'fibonacci', icon: Network, kind: 'fib-fan', points: 2, color: '#a78bfa', hint: 'Fibonacci hız direnç fanları' },
  { id: 'fib-time', label: 'Zaman Dilimleri', shortLabel: 'Fibo Zaman', category: 'fibonacci', icon: Grid3x3, kind: 'multi-line', points: 2, color: '#a78bfa', hint: 'Fibonacci zaman dilimi dikey hatları' },

  // f) İleri Düzey Dalga ve Harmonikler
  { id: 'elliott-impulse', label: 'Elliott Dalga (1-5 İtki)', shortLabel: 'Elliott 1-5', category: 'dalga', icon: Waves, kind: 'multi-line', points: 4, color: '#38bdf8', hint: 'Elliott dalga teorisi — 1-5 itki dalgaları' },
  { id: 'elliott-corrective', label: 'Elliott (A-B-C Düzeltme)', shortLabel: 'Elliott ABC', category: 'dalga', icon: Waves, kind: 'multi-line', points: 4, color: '#f59e0b', hint: 'Elliott A-B-C düzeltme dalgası' },
  { id: 'harmonic-gartley', label: 'Harmonik (Gartley/Bat)', shortLabel: 'Harmonik', category: 'dalga', icon: Spline, kind: 'multi-line', points: 4, color: '#a78bfa', hint: 'Harmonik formasyon — Gartley, Bat, Butterfly' },
  { id: 'gann-fan', label: 'Gann Fanı (1x1, 1x2)', shortLabel: 'Gann Fan', category: 'dalga', icon: Network, kind: 'multi-line', points: 2, color: '#f59e0b', hint: 'Gann fan açıları — 1x1, 1x2, 1x3 ışınları' },

  // g) İndikatör Çizgileri (Grafik Üzeri)
  { id: 'ma-overlay', label: 'Hareketli Ortalama (MA/EMA)', shortLabel: 'MA/EMA', category: 'indikatör', icon: Activity, kind: 'annotation', points: 2, color: '#38bdf8', hint: 'MA/EMA overlay — indikatör panelinden etkinleştirin' },
  { id: 'ichimoku', label: 'Ichimoku Bulutu', shortLabel: 'Ichimoku', category: 'indikatör', icon: Cloud, kind: 'annotation', points: 2, color: '#10b981', hint: 'Ichimoku Kinko Hyo bulut sistemi' },
  { id: 'pivot-points', label: 'Pivot Noktaları (Günlük)', shortLabel: 'Pivot', category: 'indikatör', icon: Target, kind: 'multi-line', points: 2, color: '#f59e0b', hint: 'Günlük pivot, R1, R2, S1, S2 seviyeleri' },

  // h) SMC (Smart Money Concepts)
  { id: 'order-block', label: 'Order Block (Emir Bloğu)', shortLabel: 'Order Block', category: 'smc', icon: Square, kind: 'box', points: 4, color: '#38bdf8', hint: 'Emir bloğu kutusu — kurumsal alım/satım bölgesi' },
  { id: 'fvg', label: 'Fair Value Gap (FVG)', shortLabel: 'FVG', category: 'smc', icon: Layers, kind: 'box', points: 4, color: '#a78bfa', hint: 'FVG boşluk kutusu — fiyat boşluğu bölgesi' },
  { id: 'bos', label: 'BOS Kırılım Etiketi', shortLabel: 'BOS', category: 'smc', icon: ArrowUpRight, kind: 'hline-label', points: 2, color: '#10b981', hint: 'Break of Structure kırılım etiketi' },
  { id: 'choch', label: 'CHoCH Kırılım Etiketi', shortLabel: 'CHoCH', category: 'smc', icon: ArrowDownRight, kind: 'hline-label', points: 2, color: '#f43f5e', hint: 'Change of Character kırılım etiketi' },
  { id: 'liquidity', label: 'Likidite Bölgeleri', shortLabel: 'Likidite', category: 'smc', icon: Minus, kind: 'horizontal', points: 2, color: '#f59e0b', hint: 'Likidite bölgesi yatay hatları' },
];

export const TOOL_MAP: Record<string, DrawToolDef> = Object.fromEntries(
  DRAW_TOOLS.map((t) => [t.id, t]),
);
