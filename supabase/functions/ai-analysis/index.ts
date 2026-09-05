import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RealData {
  averagePrice: number;
  trend: string;
  changePct: number;
  dieselPrice: number;
  dieselChangePct: number;
}

function heuristicAnalysis(realData: RealData) {
  const avg = realData.averagePrice ?? 3.0;
  const trend = realData.trend ?? 'flat';
  const changePct = realData.changePct ?? 0;
  const dieselChange = realData.dieselChangePct ?? 0;

  let status: string;
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
    yorum = 'Elektrik fiyatlarındaki yükseliş, sulama bağımlı ürünlerde (mısır, pamuk) üretim maliyetlerini doğrudan artırmaktadır. Bu durum, gelecek dönem hasatta çiftçi marjlarını baskılayabilir.';
  } else if (trend === 'down') {
    yorum = 'Elektrik fiyatlarındaki düşüş, sulama maliyetlerini hafifleterek mısır ve pamuk gibi su yoğunluklu ürünlerde maliyet baskısını azaltmaktadır. Bu durum üretici kârlılığını olumlu etkileyebilir.';
  } else {
    yorum = 'Elektrik fiyatlarındaki istikrarlı seyir, sulama maliyetlerini öngörülebilir tutmakta ve üreticilerin planlama yapmasını kolaylaştırmaktadır. Mazot fiyatlarındaki eğilim de dikkate alınmalıdır.';
  }

  let tavsiye: string;
  if (status === 'Yüksek') {
    tavsiye = 'Üreticiler sulama verimliliğini artırmalı, tüccarlar ise mısır ve pamuk tedarik sözleşmelerini öne çekmelidir.';
  } else if (status === 'Dengeli') {
    tavsiye = 'Mevcut maliyet seviyesi planlanabilir; üreticiler enerji verimli sulama sistemlerine yatırım yapmalıdır.';
  } else {
    tavsiye = 'Düşük enerji maliyetleri üretim için fırsat; üreticiler ekim alanlarını genişletmeyi değerlendirmelidir.';
  }

  return {
    maliyetStatus: status,
    tarimsalEtkiYorumu: yorum,
    riskSkoru: riskScore,
    tavsiyeEdinenAksiyon: tavsiye,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const prompt: string = body.prompt ?? '';
    const realData: RealData = body.realData ?? {};

    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (openaiKey) {
      const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const text = aiData.choices[0].message.content;
        return new Response(JSON.stringify({ text }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const result = heuristicAnalysis(realData);
    return new Response(
      JSON.stringify({ text: JSON.stringify(result), heuristic: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
