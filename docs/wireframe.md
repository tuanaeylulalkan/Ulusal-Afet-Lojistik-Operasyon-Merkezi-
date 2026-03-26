# UI wireframe — ekran alanları

Referans: `user-flow.md`, `prd.md`.

## Genel kabuk

- **Üst şerit (dashboard):** KPI kartları — açık talep sayısı, kritik vaka, aktif rota, toplam kurtarılan süre (placeholder).
- **Sekme çubuğu:** Sekme 1 — Gelen Talep Yönetim Merkezi | Sekme 2 — Operasyonel Akış Kontrolü.
- **Arka plan:** Ulusal harita / silüet + şehir ışığı katmanı (glass üstünde okunabilirlik).

## Sekme 1 — Gelen Talep Yönetim Merkezi

| Alan | İçerik |
|------|--------|
| Sol sütun | 81 il şehir seçici, senkron butonları (İnternet / Mesh), acil bildirim girişi (ileride) |
| Orta | Talep listesi — skor, öncelik rozeti, kaynak, zaman |
| Sağ (veya alt mobil) | Seçili vaka detayı, “Kritik lojistik akışına aktar” (ileride) |

## Sekme 2 — Operasyonel Akış Kontrolü

| Alan | İçerik |
|------|--------|
| Ana | Canvas — yol ağı ve tır simülasyonu (ileride) |
| Yan panel | AI sevkiyat önerisi, manuel tır sayısı, onay |
| Liste | Aktif rotalar — darboğaz / akışkan (kararlı gösterim, yanıp sönme yok) |

## Tablet / dar ekran

- KPI’lar yatay kaydırmalı veya 2 sütun grid.
- Sekme 1: şehir + liste üstte, detay altta tam genişlik.
- Sekme 2: canvas üstte, kontroller altta.
