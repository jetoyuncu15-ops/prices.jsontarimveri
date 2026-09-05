import { LayoutDashboard, BarChart3, GitCompareArrows, Calculator, Map, Sprout, Radio, CandlestickChart, Building2, Beef, Truck, CloudSun, Newspaper, Store, Lock } from 'lucide-react';
import { cn } from '@/lib/cn';

export type PageId = 'dashboard' | 'commodities' | 'technical' | 'compare' | 'calculator' | 'regions' | 'exchange' | 'livestock' | 'logistics' | 'climate' | 'news' | 'hal';

interface SidebarProps {
  current: PageId;
  onNavigate: (page: PageId) => void;
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  id: PageId;
  label: string;
  desc: string;
  icon: typeof LayoutDashboard;
  disabled?: boolean;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Gösterge Paneli', desc: 'Endeksler & borsalar', icon: LayoutDashboard },
  { id: 'exchange', label: 'Borsa Detay', desc: 'Borsa bazlı ürün listesi', icon: Building2 },
  { id: 'hal', label: 'Hal Piyasaları', desc: 'Toptancı hal fiyatları', icon: Store },
  { id: 'commodities', label: 'Emtia Analizi', desc: 'Ürün detay & grafik', icon: BarChart3 },
  { id: 'regions', label: 'Bölgesel Arz', desc: 'İl bazlı arz-talep', icon: Map },
  { id: 'technical', label: 'Teknik Analiz', desc: 'Mum, indikatör & çizim', icon: CandlestickChart },
  { id: 'compare', label: 'Karşılaştırma', desc: 'Yan yana ürün kıyası', icon: GitCompareArrows },
  { id: 'livestock', label: 'Kesim Fiyatları', desc: 'Karkas et & kâr sim.', icon: Beef },
  { id: 'calculator', label: 'Karlılık Hesapla', desc: 'Screener & simülasyon', icon: Calculator },
  { id: 'logistics', label: 'Lojistik & ELÜS', desc: 'Navlun hesabı & ELÜS', icon: Truck, disabled: true },
  { id: 'climate', label: 'İklim Risk & NDVI', desc: 'Sigorta & uydu skoru', icon: CloudSun, disabled: true },
  { id: 'news', label: 'Tarım Haberleri', desc: 'Küresel haber & risk', icon: Newspaper, disabled: true },
];

export function Sidebar({ current, onNavigate, open, onClose }: SidebarProps) {
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-ink-700/60 bg-ink-900/95 transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/20">
            <Sprout className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight text-white">TarımFinans</div>
            <div className="text-[10px] uppercase tracking-widest text-emerald-500/80">Çiftçi Pazarım</div>
          </div>
        </div>

        <div className="mx-3 mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
          <Radio className="h-3.5 w-3.5 animate-pulse-dot text-emerald-400" />
          <span className="text-[11px] font-medium text-emerald-300">Canlı piyasa · açık</span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-2 thin-scroll">
          {navItems.map((item) => {
            const active = current === item.id;
            const Icon = item.icon;
            const disabled = item.disabled;

            if (disabled) {
              return (
                <div
                  key={item.id}
                  className="group flex w-full cursor-not-allowed items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 opacity-50"
                  title="Bu modül çok yakında kullanıma sunulacak"
                >
                  <Icon className="h-5 w-5 shrink-0 text-slate-600" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium leading-tight text-slate-500">{item.label}</span>
                      <Lock className="h-2.5 w-2.5 shrink-0 text-slate-600" />
                    </div>
                    <div className="truncate text-[11px] text-slate-600">{item.desc}</div>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-700/40 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-slate-400 ring-1 ring-slate-600/30">
                    Çok Yakında
                  </span>
                </div>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                  active
                    ? 'border border-emerald-500/30 bg-emerald-500/10 text-white'
                    : 'border border-transparent text-slate-400 hover:bg-ink-800/60 hover:text-slate-200',
                )}
              >
                <Icon className={cn('h-5 w-5 shrink-0', active ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300')} />
                <div className="min-w-0">
                  <div className="text-sm font-medium leading-tight">{item.label}</div>
                  <div className="truncate text-[11px] text-slate-500">{item.desc}</div>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-ink-700/60 px-5 py-4">
          <div className="text-[10px] uppercase tracking-widest text-slate-600">Veri kaynağı</div>
          <div className="mt-1 text-xs text-slate-400">TİB · Hal Fiyatları · Mock simülasyon</div>
          <div className="mt-1 text-[10px] text-slate-600">Son sync: {new Date().toLocaleTimeString('tr-TR')}</div>
        </div>
      </aside>
    </>
  );
}
