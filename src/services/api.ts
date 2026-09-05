import type { AiAnalysisResult, ElectricityPriceData } from '@/types';

function generateMockElectricityData(): ElectricityPriceData {
  const prices: { hour: string; price: number }[] = [];
  const basePrice = 3.2 + (Math.random() - 0.5) * 0.8;
  for (let i = 0; i < 24; i++) {
    const hour = i.toString().padStart(2, '0') + ':00';
    const peakMultiplier =
      i >= 7 && i <= 22 ? 1.15 + Math.sin(((i - 7) / 15) * Math.PI) * 0.3 : 0.7;
    const price = Number((basePrice * peakMultiplier + (Math.random() - 0.5) * 0.4).toFixed(2));
    prices.push({ hour, price: Math.max(1.5, price) });
  }

  const allPrices = prices.map((p) => p.price);
  const averagePrice = Number((allPrices.reduce((a, b) => a + b, 0) / allPrices.length).toFixed(2));
  const maxPrice = Math.max(...allPrices);
  const minPrice = Math.min(...allPrices);

  const trendRoll = Math.random();
  const trend: 'up' | 'down' | 'flat' =
    trendRoll > 0.6 ? 'up' : trendRoll > 0.3 ? 'flat' : 'down';
  const changePct = Number(
    (
      trend === 'up'
        ? 1.5 + Math.random() * 3
        : trend === 'down'
          ? -(1 + Math.random() * 2.5)
          : (Math.random() - 0.5) * 1.5
    ).toFixed(2),
  );

  const dieselPrice = Number((41.5 + (Math.random() - 0.5) * 3).toFixed(2));
  const dieselChangePct = Number(((Math.random() - 0.45) * 4).toFixed(2));

  return {
    prices,
    averagePrice,
    maxPrice,
    minPrice,
    trend,
    changePct,
    dieselPrice,
    dieselChangePct,
    timestamp: new Date().toISOString(),
    source: 'Mock veri (EPİAŞ benzeri simülasyon)',
    isReal: false,
  };
}

export async function getRealElectricityPrices(): Promise<ElectricityPriceData> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase yapılandırması eksik');
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/epias-proxy`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    if (data.error || !data.isReal) throw new Error(data.error ?? 'Veri gerçek değil');

    const prices: { hour: string; price: number }[] = data.prices;
    const trend: 'up' | 'down' | 'flat' =
      data.changePct > 1 ? 'up' : data.changePct < -1 ? 'down' : 'flat';

    return {
      prices,
      averagePrice: Number(data.averagePrice),
      maxPrice: Number(data.maxPrice),
      minPrice: Number(data.minPrice),
      trend,
      changePct: Number(data.changePct),
      dieselPrice: 42.3,
      dieselChangePct: 1.2,
      timestamp: data.timestamp,
      source: 'EPİAŞ Şeffaflık Platformu (Sunucu Proxy)',
      isReal: true,
    };
  } catch (error) {
    console.error('Veri çekilemedi, mock dataya dönülüyor:', error);
    return generateMockElectricityData();
  }
}

export function generateAiAnalysisPrompt(realData: ElectricityPriceData): string {
  return `
Sen 'TarımFinans' platformunun kıdemli Tarım Ekonomisi ve Yapay Zeka Analistisin.

SANA GELEN GERÇEK VERİ SETİ:
${JSON.stringify(realData)}

GÖREVİN:
Yukarıdaki güncel enerji/girdi maliyeti verilerini analiz et. Bu maliyet artış veya azalışlarının tarımsal sulama maliyetlerine ve dolayısıyla mısır/pamuk gibi çok su tüketen tarım emtialarının gelecekteki fiyat eğilimine (trendine) nasıl yansıyacağını tahmin et.

ÇIKTI FORMATI:
Sadece ve sadece aşağıdaki JSON formatında yanıt ver. Asla ekstra açıklama metni, '\`\`\`json' işareti veya giriş cümlesi yazma. Doğrudan objeyi dön:
{
  "maliyetStatus": "Yüksek" veya "Dengeli" veya "Düşük",
  "tarimsalEtkiYorumu": "Buraya çiftçinin anlayacağı dilde 2 cümlelik makro analiz yaz.",
  "riskSkoru": 1 ile 100 arasında bir sayı,
  "tavsiyeEdinenAksiyon": "Üreticiler ve tüccarlar için 1 cümlelik stratejik tavsiye."
}
  `.trim();
}

export function localAiAnalysis(realData: ElectricityPriceData): AiAnalysisResult {
  const avg = realData.averagePrice;
  const trend = realData.trend;
  const changePct = realData.changePct;
  const dieselChange = realData.dieselChangePct;

  let status: 'Yüksek' | 'Dengeli' | 'Düşük';
  let riskScore: number;

  if (avg > 4) {
    status = 'Yüksek';
    riskScore = Math.min(85, 60 + Math.round(Math.abs(changePct) * 3));
  } else if (avg > 2.5) {
    status = 'Dengeli';
    riskScore = Math.min(60, 35 + Math.round(Math.abs(changePct) * 2));
  } else {
    status = 'Düşük';
    riskScore = Math.max(15, 30 - Math.round(Math.abs(changePct) * 2));
  }

  if (dieselChange > 2) riskScore = Math.min(95, riskScore + 5);
  if (dieselChange < -2) riskScore = Math.max(10, riskScore - 5);

  let yorum: string;
  if (trend === 'up' && status === 'Yüksek') {
    yorum =
      'Elektrik fiyatlarındaki yükseliş, sulama bağımlı ürünlerde (mısır, pamuk) üretim maliyetlerini doğrudan artırmaktadır. Bu durum, gelecek dönem hasatta çiftçi marjlarını baskılayabilir.';
  } else if (trend === 'down') {
    yorum =
      'Elektrik fiyatlarındaki düşüş, sulama maliyetlerini hafifleterek mısır ve pamuk gibi su yoğunluklu ürünlerde maliyet baskısını azaltmaktadır. Bu durum üretici kârlılığını olumlu etkileyebilir.';
  } else {
    yorum =
      'Elektrik fiyatlarındaki istikrarlı seyir, sulama maliyetlerini öngörülebilir tutmakta ve üreticilerin planlama yapmasını kolaylaştırmaktadır. Mazot fiyatlarındaki eğilim de dikkate alınmalıdır.';
  }

  let tavsiye: string;
  if (status === 'Yüksek') {
    tavsiye =
      'Üreticiler sulama verimliliğini artırmalı, tüccarlar ise mısır ve pamuk tedarik sözleşmelerini öne çekmelidir.';
  } else if (status === 'Dengeli') {
    tavsiye =
      'Mevcut maliyet seviyesi planlanabilir; üreticiler enerji verimli sulama sistemlerine yatırım yapmalıdır.';
  } else {
    tavsiye =
      'Düşük enerji maliyetleri üretim için fırsat; üreticiler ekim alanlarını genişletmeyi değerlendirmelidir.';
  }

  return {
    maliyetStatus: status,
    tarimsalEtkiYorumu: yorum,
    riskSkoru: riskScore,
    tavsiyeEdinenAksiyon: tavsiye,
  };
}

export async function getAiAnalysis(
  prompt: string,
  realData: ElectricityPriceData,
): Promise<{ result: AiAnalysisResult; source: 'ai' | 'heuristic' }> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase yapılandırması eksik');
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/ai-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ prompt, realData }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    if (data.error) throw new Error(data.error);

    const text: string = data.text;
    let parsed: AiAnalysisResult;

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      parsed = localAiAnalysis(realData);
    }

    return { result: parsed, source: data.heuristic ? 'heuristic' : 'ai' };
  } catch (error) {
    console.error('AI analizi başarısız, yerel analize dönülüyor:', error);
    return { result: localAiAnalysis(realData), source: 'heuristic' };
  }
}
