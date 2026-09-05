import { createContext, useCallback, useContext, useState } from 'react';
import { Sidebar, type PageId } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import type { AuthUser } from '@/components/AuthModal';
import { TickerBand } from '@/components/TickerBand';
import { Dashboard } from '@/pages/Dashboard';
import { Commodities } from '@/pages/Commodities';
import { Compare } from '@/pages/Compare';
import { CalculatorPage } from '@/pages/CalculatorPage';
import { Regions } from '@/pages/Regions';
import { TechnicalAnalysis } from '@/pages/TechnicalAnalysis';
import { ExchangeDetail } from '@/pages/ExchangeDetail';
import { LivestockPage } from '@/pages/LivestockPage';
import { LogisticsPage } from '@/pages/LogisticsPage';
import { ClimatePage } from '@/pages/ClimatePage';
import { NewsPage } from '@/pages/NewsPage';
import { HalPiyasalari } from '@/pages/HalPiyasalari';
import { matchCommodityId } from '@/lib/mockData';

interface NavContext {
  exchangeId: string | null;
  technicalSymbolId: string | null;
  selectedProductName: string | null;
  goExchange: (exchangeId: string) => void;
  goTechnical: (symbolId: string) => void;
  goProduct: (productName: string, targetPage?: PageId) => void;
  goPage: (page: PageId) => void;
}

const Ctx = createContext<NavContext>({
  exchangeId: null,
  technicalSymbolId: null,
  selectedProductName: null,
  goExchange: () => {},
  goTechnical: () => {},
  goProduct: () => {},
  goPage: () => {},
});

export const useNav = () => useContext(Ctx);

const pageMeta: Record<PageId, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Gösterge Paneli',
    subtitle: 'Tarımsal endeksler, girdi maliyetleri ve güncel borsa fiyatları',
  },
  commodities: {
    title: 'Emtia ve Ürün Analizi',
    subtitle: 'Ürün bazlı fiyat geçmişi, maliyet dökümü ve kârlılık oranları',
  },
  exchange: {
    title: 'Borsa Detayı',
    subtitle: 'Borsa bazlı ürün listesi ve teknik analiz entegrasyonu',
  },
  technical: {
    title: 'Teknik Analiz',
    subtitle: 'Mum grafikleri, indikatörler ve elle çizim araçları',
  },
  compare: {
    title: 'Ürün Karşılaştırma',
    subtitle: 'İki tarım ürününün dönemsel maliyet ve getiri kıyaslaması',
  },
  calculator: {
    title: 'Karlılık Hesaplama & Screener',
    subtitle: 'Dekar başına maliyet simülasyonu ve akıllı ürün filtreleme',
  },
  regions: {
    title: 'Bölgesel Arz ve Talep',
    subtitle: 'İl bazlı tarımsal ürün arz yoğunluğu ve arz-talep dengesi',
  },
  livestock: {
    title: 'Hayvan Kesim Fiyatları',
    subtitle: 'İl bazlı karkas et fiyatları ve çiftçi kâr/maliyet simülasyonu',
  },
  logistics: {
    title: 'Akıllı Lojistik ve ELÜS',
    subtitle: 'Lisanslı depoculuk, ELÜS takibi ve navlun maliyet hesaplayıcı',
  },
  climate: {
    title: 'İklim Risk Sigortası ve NDVI',
    subtitle: 'Parametrik sigorta simülasyonu ve uydu tabanlı tarla sağlık skoru',
  },
  news: {
    title: 'Tarım Haberleri & Piyasa Akışı',
    subtitle: 'Küresel tarım haberleri, piyasa etkileri ve risk haritası',
  },
  hal: {
    title: 'Hal Piyasaları',
    subtitle: 'Toptancı hal fiyatları ve şehir bazlı ürün bültenleri',
  },
};

function App() {
  const [page, setPage] = useState<PageId>(() => {
    const params = new URLSearchParams(window.location.search);
    return window.location.pathname === '/teknik-analiz' || params.has('urun') ? 'technical' : 'dashboard';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [exchangeId, setExchangeId] = useState<string | null>(null);
  const [technicalSymbolId, setTechnicalSymbolId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('urun');
  });
  const [selectedProductName, setSelectedProductName] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem('tf_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const handleLogin = useCallback((u: AuthUser) => {
    setUser(u);
    localStorage.setItem('tf_user', JSON.stringify(u));
    setAuthOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('tf_user');
  }, []);

  const meta = pageMeta[page];

  const goPage = useCallback((p: PageId) => {
    setPage(p);
    setSidebarOpen(false);
  }, []);

  const goExchange = useCallback((id: string) => {
    setExchangeId(id);
    setPage('exchange');
    setSidebarOpen(false);
  }, []);

  const goTechnical = useCallback((symbolId: string) => {
    setTechnicalSymbolId(symbolId);
    window.history.pushState({}, '', `/teknik-analiz?urun=${encodeURIComponent(symbolId)}`);
    setPage('technical');
    setSidebarOpen(false);
  }, []);

  const goProduct = useCallback((productName: string, targetPage: PageId = 'technical') => {
    setSelectedProductName(productName);
    const commodityId = matchCommodityId(productName);
    if (commodityId) {
      setTechnicalSymbolId(commodityId);
      window.history.pushState({}, '', `/teknik-analiz?urun=${encodeURIComponent(commodityId)}`);
    }
    setPage(targetPage);
    setSidebarOpen(false);
  }, []);

  const navigate = (p: PageId) => goPage(p);

  const nav: NavContext = { exchangeId, technicalSymbolId, selectedProductName, goExchange, goTechnical, goProduct, goPage };

  return (
    <Ctx.Provider value={nav}>
      <div className="min-h-screen bg-ink-950 text-slate-200">
        <Sidebar current={page} onNavigate={navigate} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="lg:pl-64">
          <TopBar
            title={meta.title}
            subtitle={meta.subtitle}
            onMenu={() => setSidebarOpen(true)}
            authOpen={authOpen}
            onAuthOpen={() => setAuthOpen(true)}
            onAuthClose={() => setAuthOpen(false)}
            onLogin={handleLogin}
            onLogout={handleLogout}
            user={user}
          />
          <TickerBand />

          <main key={page} className="mx-auto max-w-7xl animate-fade-in px-4 py-5 lg:px-6 lg:py-6">
            {page === 'dashboard' && <Dashboard />}
            {page === 'commodities' && <Commodities />}
            {page === 'exchange' && <ExchangeDetail />}
            {page === 'technical' && <TechnicalAnalysis />}
            {page === 'compare' && <Compare />}
            {page === 'calculator' && <CalculatorPage />}
            {page === 'regions' && <Regions />}
            {page === 'livestock' && <LivestockPage />}
            {page === 'logistics' && <LogisticsPage />}
            {page === 'climate' && <ClimatePage />}
            {page === 'news' && <NewsPage />}
            {page === 'hal' && <HalPiyasalari />}
          </main>
        </div>
      </div>
    </Ctx.Provider>
  );
}

export default App;
