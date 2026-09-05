// Hayvan kesim fiyatları — il bazlı karkas et fiyatları (mock simülasyon verisi)
// Dana ve Kuzu karkas fiyatları (₺/kg) + 12 aylık geçmiş

export interface LivestockPrice {
  city: string;
  zone: string;
  cattlePrice: number;   // Dana karkas ₺/kg
  sheepPrice: number;    // Kuzu karkas ₺/kg
  cattleChange: number;  // günlük değişim %
  sheepChange: number;
  cattleHistory: number[]; // 12 aylık
  sheepHistory: number[];
}

// Bölge bazlı temel fiyatlar (₺/kg karkas)
const zoneBase: Record<string, { cattle: number; sheep: number }> = {
  'Akdeniz':           { cattle: 385, sheep: 310 },
  'Ege':               { cattle: 392, sheep: 315 },
  'Marmara':           { cattle: 405, sheep: 325 },
  'Karadeniz':         { cattle: 378, sheep: 298 },
  'İç Anadolu':        { cattle: 368, sheep: 290 },
  'Doğu Anadolu':      { cattle: 355, sheep: 282 },
  'Güneydoğu Anadolu': { cattle: 362, sheep: 288 },
};

// Deterministik varyasyon — şehir adı hash'i ile bölgesel sapma
function cityHash(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function makeHistory(base: number, seed: number): number[] {
  const months: number[] = [];
  let val = base * 0.82;
  for (let i = 0; i < 12; i++) {
    const noise = Math.sin(seed + i * 0.7) * 0.04 + (i / 12) * 0.16;
    val = base * (0.82 + noise + (i / 12) * 0.16);
    months.push(Math.round(val * 10) / 10);
  }
  months[months.length - 1] = base;
  return months;
}

const cityData: { city: string; zone: string }[] = [
  { city: 'Adana', zone: 'Akdeniz' }, { city: 'Adıyaman', zone: 'Güneydoğu Anadolu' },
  { city: 'Afyonkarahisar', zone: 'İç Anadolu' }, { city: 'Ağrı', zone: 'Doğu Anadolu' },
  { city: 'Amasya', zone: 'Karadeniz' }, { city: 'Ankara', zone: 'İç Anadolu' },
  { city: 'Antalya', zone: 'Akdeniz' }, { city: 'Artvin', zone: 'Karadeniz' },
  { city: 'Aydın', zone: 'Ege' }, { city: 'Balıkesir', zone: 'Marmara' },
  { city: 'Bilecik', zone: 'Marmara' }, { city: 'Bingöl', zone: 'Doğu Anadolu' },
  { city: 'Bitlis', zone: 'Doğu Anadolu' }, { city: 'Bolu', zone: 'Karadeniz' },
  { city: 'Burdur', zone: 'Akdeniz' }, { city: 'Bursa', zone: 'Marmara' },
  { city: 'Çanakkale', zone: 'Marmara' }, { city: 'Çankırı', zone: 'İç Anadolu' },
  { city: 'Çorum', zone: 'Karadeniz' }, { city: 'Denizli', zone: 'Ege' },
  { city: 'Diyarbakır', zone: 'Güneydoğu Anadolu' }, { city: 'Edirne', zone: 'Marmara' },
  { city: 'Elazığ', zone: 'Doğu Anadolu' }, { city: 'Erzincan', zone: 'Doğu Anadolu' },
  { city: 'Erzurum', zone: 'Doğu Anadolu' }, { city: 'Eskişehir', zone: 'İç Anadolu' },
  { city: 'Gaziantep', zone: 'Güneydoğu Anadolu' }, { city: 'Giresun', zone: 'Karadeniz' },
  { city: 'Gümüşhane', zone: 'Karadeniz' }, { city: 'Hakkari', zone: 'Doğu Anadolu' },
  { city: 'Hatay', zone: 'Akdeniz' }, { city: 'Isparta', zone: 'Akdeniz' },
  { city: 'Mersin', zone: 'Akdeniz' }, { city: 'İstanbul', zone: 'Marmara' },
  { city: 'İzmir', zone: 'Ege' }, { city: 'Kars', zone: 'Doğu Anadolu' },
  { city: 'Kastamonu', zone: 'Karadeniz' }, { city: 'Kayseri', zone: 'İç Anadolu' },
  { city: 'Kırklareli', zone: 'Marmara' }, { city: 'Kırşehir', zone: 'İç Anadolu' },
  { city: 'Kocaeli', zone: 'Marmara' }, { city: 'Konya', zone: 'İç Anadolu' },
  { city: 'Kütahya', zone: 'Ege' }, { city: 'Malatya', zone: 'Doğu Anadolu' },
  { city: 'Manisa', zone: 'Ege' }, { city: 'Kahramanmaraş', zone: 'Akdeniz' },
  { city: 'Mardin', zone: 'Güneydoğu Anadolu' }, { city: 'Muğla', zone: 'Ege' },
  { city: 'Muş', zone: 'Doğu Anadolu' }, { city: 'Nevşehir', zone: 'İç Anadolu' },
  { city: 'Niğde', zone: 'İç Anadolu' }, { city: 'Ordu', zone: 'Karadeniz' },
  { city: 'Rize', zone: 'Karadeniz' }, { city: 'Sakarya', zone: 'Marmara' },
  { city: 'Samsun', zone: 'Karadeniz' }, { city: 'Siirt', zone: 'Güneydoğu Anadolu' },
  { city: 'Sinop', zone: 'Karadeniz' }, { city: 'Sivas', zone: 'İç Anadolu' },
  { city: 'Tekirdağ', zone: 'Marmara' }, { city: 'Tokat', zone: 'Karadeniz' },
  { city: 'Trabzon', zone: 'Karadeniz' }, { city: 'Tunceli', zone: 'Doğu Anadolu' },
  { city: 'Şanlıurfa', zone: 'Güneydoğu Anadolu' }, { city: 'Uşak', zone: 'Ege' },
  { city: 'Van', zone: 'Doğu Anadolu' }, { city: 'Yozgat', zone: 'İç Anadolu' },
  { city: 'Zonguldak', zone: 'Karadeniz' }, { city: 'Aksaray', zone: 'İç Anadolu' },
  { city: 'Bayburt', zone: 'Karadeniz' }, { city: 'Karaman', zone: 'İç Anadolu' },
  { city: 'Kırıkkale', zone: 'İç Anadolu' }, { city: 'Batman', zone: 'Güneydoğu Anadolu' },
  { city: 'Şırnak', zone: 'Güneydoğu Anadolu' }, { city: 'Bartın', zone: 'Karadeniz' },
  { city: 'Ardahan', zone: 'Doğu Anadolu' }, { city: 'Iğdır', zone: 'Doğu Anadolu' },
  { city: 'Yalova', zone: 'Marmara' }, { city: 'Karabük', zone: 'Karadeniz' },
  { city: 'Kilis', zone: 'Güneydoğu Anadolu' }, { city: 'Osmaniye', zone: 'Akdeniz' },
  { city: 'Düzce', zone: 'Karadeniz' },
];

export const livestockPrices: LivestockPrice[] = cityData.map((c) => {
  const base = zoneBase[c.zone];
  const h = cityHash(c.city);
  const cattleVar = ((h % 40) - 20) * 0.8;
  const sheepVar = (((h >> 3) % 30) - 15) * 0.7;
  const cattlePrice = Math.round((base.cattle + cattleVar) * 10) / 10;
  const sheepPrice = Math.round((base.sheep + sheepVar) * 10) / 10;
  const cattleChange = Math.round((((h % 80) - 40) / 10) * 100) / 100;
  const sheepChange = Math.round(((((h >> 5) % 80) - 40) / 10) * 100) / 100;
  return {
    city: c.city,
    zone: c.zone,
    cattlePrice,
    sheepPrice,
    cattleChange,
    sheepChange,
    cattleHistory: makeHistory(cattlePrice, h),
    sheepHistory: makeHistory(sheepPrice, h >> 2),
  };
});

// Türkiye ortalaması
export const turkeyAverage = {
  cattle: Math.round(livestockPrices.reduce((s, p) => s + p.cattlePrice, 0) / livestockPrices.length * 10) / 10,
  sheep: Math.round(livestockPrices.reduce((s, p) => s + p.sheepPrice, 0) / livestockPrices.length * 10) / 10,
};

// En yüksek / en düşük iller
export const priceExtremes = {
  cattleHighest: [...livestockPrices].sort((a, b) => b.cattlePrice - a.cattlePrice)[0],
  cattleLowest: [...livestockPrices].sort((a, b) => a.cattlePrice - b.cattlePrice)[0],
  sheepHighest: [...livestockPrices].sort((a, b) => b.sheepPrice - a.sheepPrice)[0],
  sheepLowest: [...livestockPrices].sort((a, b) => a.sheepPrice - b.sheepPrice)[0],
};
