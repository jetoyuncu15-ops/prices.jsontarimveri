import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const EPIAS_URL =
  "https://seffaflik.epias.com.tr/transparency/service/v1/markets/dam/data/dam";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Bugünün tarih aralığını hesapla (TR saat dilimi dikkate alınmadan UTC yeterli)
    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    const response = await fetch(EPIAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: `${today}T00:00:00`,
        endDate: `${today}T23:59:59`,
      }),
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: `EPİAŞ HTTP ${response.status}`,
          isReal: false,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const data = await response.json();

    const items: Record<string, unknown>[] =
      (data as { body?: { damList?: Record<string, unknown>[] } })?.body?.damList ??
      (data as { damList?: Record<string, unknown>[] })?.damList ??
      [];

    if (items.length === 0) {
      return new Response(
        JSON.stringify({
          error: "EPİAŞ verisi boş",
          isReal: false,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const prices = items
      .map((item) => ({
        hour: String(item.hour ?? item.date ?? ""),
        price: Number(item.price ?? item.systemMarginalPrice ?? 0),
      }))
      .filter((p) => p.price > 0);

    if (prices.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Fiyat verisi bulunamadı",
          isReal: false,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const allPrices = prices.map((p) => p.price);
    const averagePrice = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;
    const maxPrice = Math.max(...allPrices);
    const minPrice = Math.min(...allPrices);

    const mid = Math.floor(allPrices.length / 2);
    const firstHalf = allPrices.slice(0, mid).reduce((a, b) => a + b, 0) / (mid || 1);
    const secondHalf =
      allPrices.slice(mid).reduce((a, b) => a + b, 0) / (allPrices.length - mid || 1);
    const changePct = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;

    // PTF (₺/kWh) → Sulama Elektrik Endeksi (~1512 puan bandı)
    const endIndex = Number((averagePrice * 504.267).toFixed(1));

    return new Response(
      JSON.stringify({
        prices,
        averagePrice: Number(averagePrice.toFixed(4)),
        maxPrice: Number(maxPrice.toFixed(2)),
        minPrice: Number(minPrice.toFixed(2)),
        changePct: Number(changePct.toFixed(2)),
        endIndex,
        ptfPrice: Number(averagePrice.toFixed(4)),
        timestamp: new Date().toISOString(),
        source: "EPİAŞ Şeffaflık Platformu",
        isReal: true,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: (error as Error).message,
        isReal: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
