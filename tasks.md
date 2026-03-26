# Afet Komuta Kontrol Platformu - Gorev Listesi

Bu liste, `prd.md` dokumanindaki kapsam temel alinarak uygulamayi adim adim gelistirmek icin hazirlanmistir.

## 0) Proje Hazirlik ve Mimari
- [x] Proje repo yapisini olustur (`/frontend`, `/docs`, `/mock-data`).
- [x] Teknoloji kararlarini netlestir (HTML5 + Tailwind + Chart.js + Canvas + Gemini API).
- [x] Ortam degiskenleri ve gizli anahtar yonetimi yapisini kur (`.env.example`).
- [x] Moduler mimariyi tanimla (veri toplama, AI analiz, sevkiyat, raporlama katmanlari).
- [x] Temel UI wireframe ve ekran akislarini cikar (Sekme 1, Sekme 2, dashboard alanlari).

## 1) Arayuz Temeli ve Tasarim Sistemi
- [x] Glassmorphism UI temel komponentlerini olustur (panel, kart, buton, badge).
- [x] Turkiye silueti / ulusal harita arka plan katmanini ekle.
- [x] Tipografi, renk tokenlari ve durum renklerini standartlastir (Kritik/Orta/Dusuk).
- [x] Responsive yerlesim kurallari tanimla (kontrol merkezi ekrani + tablet gorunumu).
- [x] Ekran performansi icin temel optimizasyonlari uygula (animasyon ve blur sinirlari).

## 2) Sekme 1 - Gelen Talep Yonetim Merkezi (MVP)
- [x] Sekme 1 arayuzunu kur (talep listesi, filtreler, detay paneli).
- [x] 81 il secimi icin sehir secici componentini gelistir.
- [x] Mock veri modeli tanimla (vaka turu, konum, zaman, kaynak, risk parametreleri).
- [x] Internet senkronizasyonu icin API adaptor katmani olustur (simdilik mock endpoint).
- [x] Mesh senkronizasyonu icin offline paket veri formati ve birlestirme mantigi tasarla.
- [x] Gelen vakalari tekil kimlik ile birlestir (duplication kontrolu).
- [x] Vaka listesinde anlik guncelleme akislarini ekle.

## 3) Gemini AI Vaka Skorlama
- [x] Gemini entegrasyon servis katmanini olustur.
- [x] Vaka metnini skorlamaya uygun prompt formatina donustur.
- [x] 0-100 oncelik skorlama mekanizmasini implemente et.
- [ ] Gemini entegrasyon servis katmanini olustur.
- [ ] Vaka metnini skorlamaya uygun prompt formatina donustur.
- [ ] 0-100 oncelik skorlama mekanizmasini implemente et.
- [ ] Esik kurallarini belirle (kirmizi/sari/yesil siniflandirma).
- [ ] Kritik vakalari otomatik ust siraya tasiyan siralama mekanizmasini yaz.
- [ ] API hata yonetimi, fallback ve yeniden deneme stratejisi ekle.
- [ ] Skor gecmisi ve aciklama alanlarini loglayarak denetlenebilirlik sagla.

## 4) Sekme 2 - Operasyonel Akis Kontrolu (MVP)
- [ ] Sekme 2 arayüzünü kur (Canvas simülasyon alanı + aktif rota listesi).
- [ ] Yol ağı modelini oluştur (Ana arterler ve akıllı alternatif rota döngüsü).
- [ ] Canvas tabanlı tır hareket simülasyonunu geliştir (Hız, doğrultu ve enkaz blokajı).
- [ ] Fiziksel Vinç (İş Makinesi) mekanizması ve enkaz açma senaryosu.
- [ ] Sevkiyat talebi onay akışı (Sekme 1 vaka transferi ve sevkiyat başlatma).

## 5) AI Sevkiyat ve Trafik Optimizasyonu
- [ ] AI sevkiyat önerisi (Dinamik tır sayısı hesaplama algoritması) entegrasyonu.
- [ ] AI Kapalı mod senaryosu (Düşük hız, sabit rota ve manuel trafik yönetimi).
- [ ] AI Açık mod senaryosu (Yüksek hız, sistematik rota dağılımı ve kapasite dengeleme).
- [ ] Kademeli Spawn (Interval) mekanizması ile görsel çakışmaların önlenmesi.
- [ ] Akıllı alternatif rota algoritması (BFS tabanlı dinamik yol seçimi).

## 6) Analitik ve Raporlama
- [ ] Chart.js ile hattın kapasite yükü grafiklerini (Anlık veri beslemeli) ekle.
- [ ] Sevkiyat bazlı Zaman Kazancı (Saved Time) hesaplama ve canlı senkronizasyon.
- [ ] Toplam kurtarılan süre metriğini dashboard'a bağla.
- [ ] Anlık performans KPI kartları (Açık talep, Kritik vaka, Aktif Tir sayısı).
- [ ] Gemini 1.5 Flash ile stratejik analiz raporu üretimi.

## 7) Veri Senkronizasyonu ve Şehir Yönetimi
- [ ] İnternet / Mesh senkronizasyonu ile saha verisi toplama katmanı.
- [ ] Dinamik Şehir Filtreleme (Mock verideki şehirlerin seçili bölgeye otomatik dönüşümü).
- [ ] Manuel talep girişi için Gemini/Yerel Triyaj hibrit mekanizması.
- [ ] Offline-first veri önbellekleme ve tekrar senkronizasyon altyapısı.
- [ ] Veri doğrulama katmanı (Eksik/bozuk veri filtreleme).

## 8) Güvenlik ve Dayanıklılık
- [ ] Olay kayıtlama ve audit log yapısı (Tüm sevkiyat geçmişi).
- [ ] Rol bazlı erişim seviyeleri tasarımı.
- [ ] Temel güvenlik kontrolleri (API key koruma, rate limit, input sanitization).

## 9) Test, Kalite ve Canlıya Hazırlık
- [ ] Simülasyon doğrulama testleri (Rota, yoğunluk, zaman kazancı veritabanı).
- [ ] UI/UX kabul kriterleri ve performans optimizasyonları.
- [ ] AFAD/AKOM benzeri dış veri kaynakları için entegrasyon backlog'u.
- [ ] Operasyon kılavuzu ve kullanici dokümantasyonu.

## Öncelik Sırası (Öneri)
1. Arayüz Temeli + Sekme 1 MVP
2. Gemini Skorlama ve Triyaj
3. Sekme 2 Simülasyon + AI Optimizasyonu
4. Analitik, Raporlama ve Şehir Senkronizasyonu
5. Güvenlik ve Saha Testleri
