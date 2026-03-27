#  Teknoloji Yığını ve Seçim Gerekçeleri (Tech Stack)

Bu proje, afet anlarındaki "Altın Saatler" içerisinde maksimum performans ve sıfır kurulum maliyeti hedefleyerek **Serverless (Sunucusuz) İstemci Taraflı (Client-Side)** bir mimari ile inşa edilmiştir.


## 1. Yapay Zeka Motoru: Google Gemini 1.5 Flash
- **Kullanım Amacı:** Sahadan gelen karmaşık verilerin (İnternet, Mesh, Manuel) triyajı, 0-100 arası aciliyet skorlaması ve lojistik araç (Tır, Ambulans, İş Makinesi) tahsisi.

- **Seçim Gerekçesi (Neden?):**
  - **Hız:** Afet anlarında saniyeler kritiktir. "Flash" modeli, verileri saniyeler içinde analiz ederek yapılandırılmış (JSON formatında) çıktılar üretir.  
  - **Bağlam Anlayışı:** "Enkaz altında ses var" gibi kritik ifadeleri doğru yorumlayarak uygun müdahale önerileri oluşturabilir.  

---

## 2. Simülasyon ve Optimizasyon: Vanilla JavaScript (ES6+) & HTML5 Canvas
- **Kullanım Amacı:** Operasyon sekmesinde canlı harita üzerinde araç hareketlerini, darboğazları ve çevresel etkileri (hava durumu, enkaz) gerçek zamanlı simüle etmek.

- **Seçim Gerekçesi (Neden?):**
  - **Performans:** Canvas API, yüksek performanslı grafik çizimi sağlar ve tarayıcıyı yormadan akıcı simülasyon imkanı sunar.  
  - **Algoritmik Esneklik:** BFS (Breadth-First Search) ve Dijkstra gibi rota optimizasyon algoritmaları doğrudan uygulanabilir.  

---

## 3. Veri Analitiği ve Görselleştirme: Chart.js
- **Kullanım Amacı:** Kapasite yükü, darboğazlar ve optimizasyon sonrası verimlilik artışını görsel olarak sunmak.

- **Seçim Gerekçesi (Neden?):**
  - Hafif ve hızlı çalışır  
  - Gerçek zamanlı veri görselleştirme sağlar  
  - Kriz yönetiminde hızlı karar destek sunar  

---

## 4. Kullanıcı Arayüzü (UI): Tailwind CSS & Glassmorphism
- **Kullanım Amacı:** Kullanıcıya sade, okunabilir ve dikkat dağıtmayan bir operasyon paneli sunmak.

- **Seçim Gerekçesi (Neden?):**
  - **Hızlı Geliştirme:** Tailwind ile hızlı ve esnek arayüz geliştirme mümkündür  
  - **Okunabilirlik:** Glassmorphism tasarım yaklaşımı ile veriler ön planda tutulur  

---

## 5. Mimari Karar: Neden Backend (Sunucu) Kullanılmadı?
- **Sıfır Kurulum:** Sistem herhangi bir sunucuya ihtiyaç duymadan çalışabilir  
- **Yüksek Erişilebilirlik:** Afet anlarında merkezi sistemlere bağımlılık azaltılmıştır  
- **Client-Side Çalışma:** Tüm sistem tarayıcı üzerinde çalışarak hızlı erişim sağlar  
- **Modüler Yapı (ESM):** import/export yapısı ile kod yönetimi kolaylaştırılmıştır  

---

##  Genel Değerlendirme

Bu teknoloji seçimi sayesinde sistem:
- Düşük gecikme (low latency) ile çalışır  
- Hızlı karar alma süreçlerini destekler  
- Afet anlarında kesintisiz operasyon sağlar  
- Kaynakların daha verimli kullanılmasına katkıda bulunur  
