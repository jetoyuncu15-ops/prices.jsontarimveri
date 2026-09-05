// ─────────────────────────────────────────────────────────────
// MERKEZİ FİYAT AYAR DOSYASI
// Tüm tarım emtiaları ve tarımsal endekslerin baz fiyat/puanları
// burada tek yerde toplanır. Rakamları elle değiştirdiğinizde
// tüm platform otomatik olarak bu değerleri kullanır.
// ─────────────────────────────────────────────────────────────

export const marketPrices = {
  // ── Tarımsal Endeksler (puan) ──────────────────────────────
  indices: {
    girdiMaliyet: 1842.6,
    gubre: 2234.1,
    mazot: 1641.3,
    tohum: 1298.8,
    sulama: 1512.8,
    iscilik: 1398.4,
  },

  // ── Tarım Emtiaları (₺/kg veya belirtilen birim) ──────────
  commodities: {
    bugday: { price: 16.45, unit: '₺/kg' },
    misir: { price: 7.85, unit: '₺/kg' },
    sut: { price: 24.30, unit: '₺/lt' },
    pamuk: { price: 84.90, unit: '₺/kg' },
    aycicegi: { price: 32.4, unit: '₺/kg' },
    canlihayvan: { price: 320, unit: '₺/kg' },
    mercimek: { price: 42.0, unit: '₺/kg' },
    antepfistigi: { price: 585, unit: '₺/kg' },
    zeytinyagi: { price: 240, unit: '₺/lt' },
  },

  // ── İşçilik alt kalemleri ─────────────────────────────────
  iscilik: {
    mevsimlikGunluk: 1299, // ₺/gün
    surekliAylik: 37305, // ₺/ay
  },
} as const;

// Tip yardımcıları
export type IndexId = keyof typeof marketPrices.indices;
export type CommodityId = keyof typeof marketPrices.commodities;
