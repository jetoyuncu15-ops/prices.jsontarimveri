export type NewsCategory =
  | 'son-dakika'
  | 'jeopolitik'
  | 'usda-makro'
  | 'borsa-emtia'
  | 'hava-kuraklik';

export type ImpactSignal = 'bullish' | 'bearish' | 'neutral' | 'warning';

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceLogo: string;
  publishedMinAgo: number;
  category: NewsCategory;
  region: string;
  tags: string[];
  impact: ImpactSignal;
  impactLabel: string;
  impactDesc: string;
  commodityTag: string;
  commodityPrice: number;
  commodityUnit: string;
  commodityChangePct: number;
  isHero?: boolean;
  imageUrl?: string;
}

export interface CalendarEvent {
  id: string;
  time: string;
  title: string;
  source: string;
  importance: 'high' | 'medium' | 'low';
  countdownMin: number;
}

export interface RiskBullet {
  id: string;
  region: string;
  risk: string;
  commodity: string;
  level: 'critical' | 'high' | 'moderate';
}

export const newsCategories: { key: NewsCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'Tümü' },
  { key: 'son-dakika', label: 'Son Dakika' },
  { key: 'jeopolitik', label: 'Jeopolitik & Riskler' },
  { key: 'usda-makro', label: 'USDA & Makro Veriler' },
  { key: 'borsa-emtia', label: 'Borsa & Emtia' },
  { key: 'hava-kuraklik', label: 'Hava Durumu & Kuraklık' },
];

export const newsRegions = [
  'Global',
  'Türkiye',
  'AB',
  'ABD',
  'Latin Amerika',
  'Asya Pasifik',
  'Orta Doğu',
  'Afrika',
];

export const newsItems: NewsItem[] = [
  {
    id: 'n1',
    title: 'Brezilya\'da Güney Bölgesinde Rekor Kuraklık, Soya ve Mısır Üretimi Tehdit Altında',
    summary:
      'Rio Grande do Sul eyaletinde son 40 yılın en şiddetli kuraklığı yaşanıyor. Soya ekim alanlarının %15\'i etkilenmiş durumda. CBOT soya fiyatları %4.66 yükselişle 6 ayın zirvesine çıktı. Analistler, küresel soya arzında %3-5 daralma öngörüyor.',
    source: 'Reuters',
    sourceLogo: 'REU',
    publishedMinAgo: 15,
    category: 'hava-kuraklik',
    region: 'Latin Amerika',
    tags: ['#Soya', '#Mısır', '#Kuraklık'],
    impact: 'bullish',
    impactLabel: 'Boğa Sinyali',
    impactDesc: 'Yükseliş Baskısı — Arz şoku beklentisi fiyatları yukarı çekiyor',
    commodityTag: 'Soya',
    commodityPrice: 12.14,
    commodityUnit: '$/kg',
    commodityChangePct: 4.66,
    isHero: true,
  },
  {
    id: 'n2',
    title: 'Karadeniz Tahıl Koridoru\'nda Yeni Anlaşma Sinyalleri — Buğday Fiyatlarında Düşüş Baskısı',
    summary:
      'Uluslararası arabuluculuk çabaları sonucunda tahıl ihracat koridorunun yeniden açılması gündemde. Ukrayna ve Rusya tarafı müzakerelere sıcak bakıyor. CBOT buğday vadeli işlemleri %2.3 geriledi.',
    source: 'Bloomberg',
    sourceLogo: 'BBG',
    publishedMinAgo: 38,
    category: 'jeopolitik',
    region: 'Global',
    tags: ['#Buğday', '#TahılKoridoru', '#Ukrayna'],
    impact: 'bearish',
    impactLabel: 'Ayı Sinyali',
    impactDesc: 'Düşüş Baskısı — Arz artışı beklentisi fiyatları aşağı çekiyor',
    commodityTag: 'Buğday',
    commodityPrice: 11.45,
    commodityUnit: '₺/kg',
    commodityChangePct: -2.31,
  },
  {
    id: 'n3',
    title: 'USDA WASDE Raporu: Küresel Mısır Stoku 12 Milyon Ton Düşürüldü',
    summary:
      'ABD Tarım Bakanlığı\'nın tarım arz ve talep tahmin raporu, küresel mısır bitiş stokunu beklentilerin altında revize etti. Çin talebi tahminleri %8 artırıldı. Mısır vadeli işlemleri güne %2.1 yükselişle başladı.',
    source: 'USDA',
    sourceLogo: 'USDA',
    publishedMinAgo: 72,
    category: 'usda-makro',
    region: 'ABD',
    tags: ['#Mısır', '#USDA', '#WASDE'],
    impact: 'bullish',
    impactLabel: 'Boğa Sinyali',
    impactDesc: 'Yükseliş Baskısı — Stok revizyonu arz sıkışıklığını doğruluyor',
    commodityTag: 'Mısır',
    commodityPrice: 7.85,
    commodityUnit: '₺/kg',
    commodityChangePct: 2.12,
  },
  {
    id: 'n4',
    title: 'Türkiye Pamuk İthalatında Rekor — 2026 İç Pazar Talebi %18 Arttı',
    summary:
      'TÜİK verilerine göre tekstil sektörünün pamuk talebi yıllık bazda %18 büyüdü. Yerli üretim talebi karşılamayınca ithalat rekor kırdı. İzmir borsasında pamuk fiyatı 92.5 ₺/kg\'a yükseldi.',
    source: 'Dünya Gazetesi',
    sourceLogo: 'DG',
    publishedMinAgo: 95,
    category: 'borsa-emtia',
    region: 'Türkiye',
    tags: ['#Pamuk', '#Tekstil', '#İthalat'],
    impact: 'bullish',
    impactLabel: 'Yükseliş Baskısı',
    impactDesc: 'İç talep artışı fiyatları yukarı destekliyor',
    commodityTag: 'Pamuk',
    commodityPrice: 92.5,
    commodityUnit: '₺/kg',
    commodityChangePct: 2.41,
  },
  {
    id: 'n5',
    title: 'AB Gübre İhracat Kısıtlamasını Uzatma Kararı Aldı — Azot Fiyatları Zıpladı',
    summary:
      'Brüksel, enerji maliyetleri gerekçesiyle gübre ihracat kısıtlamasını 2026 sonuna kadar uzattı. TTF doğalgaz fiyatlarındaki artış gübre üretim maliyetlerini yukarı çekti. Türkiye gübre ithalat maliyeti %12 arttı.',
    source: 'Financial Times',
    sourceLogo: 'FT',
    publishedMinAgo: 130,
    category: 'jeopolitik',
    region: 'AB',
    tags: ['#Gübre', '#Azot', '#Doğalgaz'],
    impact: 'bearish',
    impactLabel: 'Ayı Sinyali',
    impactDesc: 'Maliyet Baskısı — Girdi maliyetleri çiftçiyi zorluyor, marjları düşürüyor',
    commodityTag: 'Gübre',
    commodityPrice: 2234.1,
    commodityUnit: 'puan',
    commodityChangePct: 4.2,
  },
  {
    id: 'n6',
    title: 'Arjantin Soya Kırımı Geç Geliyor — Küresel Yağ Piyasasında Sıkışıklık',
    summary:
      'Arjantin\'de soya kırım tesisleri kapasite yetersizliği nedeniyle %20 geriledi. Küresel soya yağı arzında daralma oluştu. Hindistan palm yağı ithalatını artırınca fiyatlar yükseldi.',
    source: 'Argus Media',
    sourceLogo: 'ARG',
    publishedMinAgo: 165,
    category: 'borsa-emtia',
    region: 'Latin Amerika',
    tags: ['#Soya', '#PalmYağı', '#Yağ'],
    impact: 'bullish',
    impactLabel: 'Boğa Sinyali',
    impactDesc: 'Yükseliş Baskısı — Kırım kapasitesi sıkışıklığı arzı daraltıyor',
    commodityTag: 'Ayçiçeği',
    commodityPrice: 34.2,
    commodityUnit: '₺/kg',
    commodityChangePct: -1.14,
  },
  {
    id: 'n7',
    title: 'Anadolu\'da Geç Dönem Don Bekleniyor — Kayısı ve Şeftali Hasadı Risk Altında',
    summary:
      'Meteoroloji Genel Müdürlüğü\'ne göre bu hafta sonu İç Anadolu ve Doğu Anadolu\'da sıfırın altına düşecek sıcaklıklar bekleniyor. Çiçeklenme dönemindeki meyve ağaçları don riski taşıyor.',
    source: 'Anadolu Ajansı',
    sourceLogo: 'AA',
    publishedMinAgo: 210,
    category: 'hava-kuraklik',
    region: 'Türkiye',
    tags: ['#Kayısı', '#Şeftali', '#Don'],
    impact: 'warning',
    impactLabel: 'Risk Uyarısı',
    impactDesc: 'Üretim Riski — Don olayı verim kaybına yol açabilir',
    commodityTag: 'Kayısı',
    commodityPrice: 145.0,
    commodityUnit: '₺/kg',
    commodityChangePct: 0.0,
  },
  {
    id: 'n8',
    title: 'Çin Tarafından ABD Soya İthalatında Yeni Gümrük İndirimi — Ticaret Savaşı Yumuşuyor',
    summary:
      'Pekin, ABD menşeli soya ithalatında gümrük tarifelerini %3 indirdi. İki ülke arasındaki ticaret gerilimi son aylarda hafifledi. CBOT soya vadeli işlemleri %1.8 yükseldi.',
    source: 'CNBC',
    sourceLogo: 'CNBC',
    publishedMinAgo: 280,
    category: 'jeopolitik',
    region: 'Asya Pasifik',
    tags: ['#Soya', '#Çin', '#TicaretSavaşı'],
    impact: 'bullish',
    impactLabel: 'Boğa Sinyali',
    impactDesc: 'Talep Artışı — Çin ithalatındaki canlanma fiyatları destekliyor',
    commodityTag: 'Soya',
    commodityPrice: 12.14,
    commodityUnit: '$/kg',
    commodityChangePct: 4.66,
  },
  {
    id: 'n9',
    title: 'Hindistan Pirinç İhracat Yasağını Kısmi Kaldırdı — Küresel Pirinç Fiyatları Geriledi',
    summary:
      'Yeni Delhi, basmati pirinç dışındaki ihracat yasağını kısmen kaldırdı. Küresel pirinç fiyatları %3.2 geriledi. Afrika ülkeleri nefes aldı.',
    source: 'Reuters',
    sourceLogo: 'REU',
    publishedMinAgo: 340,
    category: 'borsa-emtia',
    region: 'Asya Pasifik',
    tags: ['#Pirinç', '#Hindistan', '#İhracat'],
    impact: 'bearish',
    impactLabel: 'Ayı Sinyali',
    impactDesc: 'Düşüş Baskısı — İhracat yasağının kalkması arzı rahatlatıyor',
    commodityTag: 'Pirinç',
    commodityPrice: 28.5,
    commodityUnit: '₺/kg',
    commodityChangePct: -3.2,
  },
  {
    id: 'n10',
    title: 'TÜFE Enflasyon Beklentileri Tarım Girdi Maliyetlerini Yine Zorluyor',
    summary:
      'TCMB verilerine göre yıllık enflasyon tarım girdi maliyetlerini %22 oranında etkiledi. Mazot ve gübre fiyatlarındaki artış çiftçi marjlarını daraltıyor.',
    source: 'Bloomberg HT',
    sourceLogo: 'BBGHT',
    publishedMinAgo: 420,
    category: 'usda-makro',
    region: 'Türkiye',
    tags: ['#Enflasyon', '#Gübre', '#Mazot'],
    impact: 'warning',
    impactLabel: 'Maliyet Uyarısı',
    impactDesc: 'Marj Baskısı — Girdi enflasyonu kârlılığı eritiyor',
    commodityTag: 'Mazot',
    commodityPrice: 1641.3,
    commodityUnit: 'puan',
    commodityChangePct: -1.6,
  },
];

export const calendarEvents: CalendarEvent[] = [
  {
    id: 'c1',
    time: '15:30',
    title: 'USDA WASDE Aylık Raporu',
    source: 'USDA',
    importance: 'high',
    countdownMin: 45,
  },
  {
    id: 'c2',
    time: '17:00',
    title: 'TÜTSB Aylık İşlem Hacmi',
    source: 'TÜTSB',
    importance: 'medium',
    countdownMin: 135,
  },
  {
    id: 'c3',
    time: '16:00',
    title: 'AB Enflasyon Verisi (Çekirdek TÜFE)',
    source: 'Eurostat',
    importance: 'high',
    countdownMin: 75,
  },
  {
    id: 'c4',
    time: '18:30',
    title: 'ABD Crude Oil Stokları (EIA)',
    source: 'EIA',
    importance: 'medium',
    countdownMin: 195,
  },
  {
    id: 'c5',
    time: '20:00',
    title: 'TCMB Faiz Kararı Açıklaması',
    source: 'TCMB',
    importance: 'high',
    countdownMin: 285,
  },
];

export const riskBullets: RiskBullet[] = [
  {
    id: 'r1',
    region: 'G. Brezilya',
    risk: 'Rekor kuraklık — soya/mısır arz şoku',
    commodity: 'Soya, Mısır',
    level: 'critical',
  },
  {
    id: 'r2',
    region: 'Karadeniz',
    risk: 'Tahıl koridoru belirsizliği — arz kesintisi riski',
    commodity: 'Buğday, Arpa',
    level: 'high',
  },
  {
    id: 'r3',
    region: 'İç Anadolu',
    risk: 'Geç don — meyve hasadı risk altında',
    commodity: 'Kayısı, Şeftali',
    level: 'high',
  },
  {
    id: 'r4',
    region: 'AB',
    risk: 'Gübre ihracat kısıtlaması — girdi maliyet artışı',
    commodity: 'Gübre, Azot',
    level: 'moderate',
  },
  {
    id: 'r5',
    region: 'Arjantin',
    risk: 'Soya kırım kapasitesi sıkışıklığı',
    commodity: 'Soya yağı',
    level: 'moderate',
  },
];
