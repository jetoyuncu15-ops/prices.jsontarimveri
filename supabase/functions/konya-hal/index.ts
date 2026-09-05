import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const CKAN_BASE = "https://acikveri.konya.bel.tr/api/3/action/datastore_search";
const RESOURCE_ID = "532c336b-b3b4-42f9-ae46-44d0597e3ff9";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get("limit")) || 100, 1000);
    const offset = Math.max(Number(url.searchParams.get("offset")) || 0, 0);

    const apiUrl = `${CKAN_BASE}?resource_id=${RESOURCE_ID}&limit=${limit}&offset=${offset}`;

    const response = await fetch(apiUrl, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: `Konya CKAN HTTP ${response.status}`,
          isReal: false,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const data = await response.json();

    const result = (data as { result?: { records?: Record<string, unknown>[] } }).result;
    const records = result?.records ?? [];

    const prices = records.map((r) => ({
      tarih: String(r.tarih ?? ""),
      urunAd: String(r.urun_ad ?? ""),
      birim: String(r.birim ?? "kg"),
      tur: Number(r.tur ?? 0),
      turLabel: Number(r.tur) === 1 ? "Meyve" : "Sebze",
      enDusukFiyat: Number(r.en_dusuk_fiyat ?? 0),
      enYuksekFiyat: Number(r.en_yuksek_fiyat ?? 0),
      ortalamaFiyat:
        Number(r.en_dusuk_fiyat) && Number(r.en_yuksek_fiyat)
          ? Number((((Number(r.en_dusuk_fiyat) + Number(r.en_yuksek_fiyat)) / 2)).toFixed(2))
          : 0,
    }));

    return new Response(
      JSON.stringify({
        prices,
        total: result?.total ?? prices.length,
        timestamp: new Date().toISOString(),
        source: "Konya Büyükşehir Belediyesi Açık Veri Portalı",
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
