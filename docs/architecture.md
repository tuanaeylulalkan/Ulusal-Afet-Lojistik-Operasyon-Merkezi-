# Modüler mimari — katmanlar

Bu prototip, `prd.md` kapsamına uygun olarak dört mantıksal katmana ayrılır. Kod `frontend/js/layers/` altında modül kökleriyle hizalanır.

## 1. Veri toplama (`dataCollector`)

- İnternet kanalı: kurumsal / makro veri adaptörleri (şimdilik mock endpoint).
- Mesh kanalı: çevrimdışı paket formatı, birleştirme ve tekil kimlik (duplication) kontrolü.
- Çıktı: normalize edilmiş talep kayıtları.

## 2. AI analiz (`aiAnalyzer`)

- Gemini ile doğal dil / yapılandırılmış vaka metninden 0–100 öncelik skoru.
- Eşikler: kritik / orta / düşük sınıflandırma, sıralama ve açıklama logları.

## 3. Sevkiyat (`logistics`)

- Sekme 1’den onaylı vakaların Sekme 2’ye aktarımı.
- Yol ağı modeli, rota durumu, AI kapalı/açık trafik senaryoları ve Canvas simülasyonu.

## 4. Raporlama (`reporting`)

- Chart.js metrikleri, zaman kazancı toplamları, Gemini ile stratejik aksiyon metni.

Bağımlılık yönü: veri toplama → AI analiz → sevkiyat → raporlama. Üst katmanlar alt katmanların sözleşmelerine (düz nesne / JSON şeması) bağlı kalır; gerçek AFAD/AKOM entegrasyonu veri katmanı adaptörleriyle eklenir.
