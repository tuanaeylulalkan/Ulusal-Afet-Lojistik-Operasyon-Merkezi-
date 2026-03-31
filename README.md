# Ulusal Afet Lojistik Operasyon Merkezi

**Yapay Zeka Destekli Hibrit Veri Akışı ve Dinamik Lojistik Optimizasyon Paneli**

Bu sistem; afet anlarındaki iletişim kopukluklarını ve lojistik darboğazları yönetmek amacıyla tasarlanmış, iki ana sekmeden oluşan kapsamlı bir operasyon merkezidir.

##  Problem
Afet anlarında sahadan gelen binlerce karmaşık talebin (sosyal medya, SMS, telsiz) manuel olarak sınıflandırılması ve önceliklendirilmesi imkansıza yakındır. Yanlış önceliklendirme, tırların trafik veya enkaz nedeniyle takılması ve lojistik kaynakların verimsiz dağılımı, operasyonel gecikmelere sebep olan temel problemlerdir.

##  Amaç
Bu proje, afet yönetiminde karar destek sistemlerini güçlendirmek ve yapay zeka ile lojistik süreçleri optimize etmek amacıyla geliştirilmiştir.

##  Çözüm ve Operasyonel Akış
Bu operasyonel altyapı sayesinde, afet anındaki veri kargaşası ve operasyonel belirsizlik, veriye dayalı profesyonel bir Karar Destek Sistemine dönüşüyor. İnternet altyapısı çöktüğünde dahi kesintisiz çalışan hibrit veri girişi mekanizmasıyla toplanan binlerce karmaşık ihbar, Google Gemini 1.5-Flash tarafından saniyeler içinde analiz edilerek 0-100 arası somut bir Öncelik Skoruna atanıyor. Bu akıllı triyaj süreci, insan hızını aşan bir süratle en kritik vakaları öne çıkarırken; arka planda çalışan Dijkstra ve BFS algoritmaları sahadaki enkaz ve engelleri gerçek zamanlı hesaplayarak lojistik araçlarını en verimli rotalara yönlendiriyor. Sonuç olarak sistem, afet yönetimindeki en büyük darboğaz olan "karar verme süresini" minimize ederek kısıtlı kaynakların en doğru noktaya, en hızlı şekilde ulaşmasını sağlıyor.

### 1. Sekme: Akıllı Talep Merkezi ve Triyaj
* **Hibrit Veri Girişi:** Veriler; standart **İnternet**, altyapı çöktüğünde devreye giren **Mesh Network** veya merkeze ulaşan telsiz ihbarlarının manuel Girişi ile toplanır.
* **AI Önceliklendirme:** Toplanan veriler **Google Gemini 1.5-Flash** tarafından analiz edilerek 0 ile 100 arasında bir öncelik skoru alır.
* **Vaka Yönetimi:** Kritik vakalar detaylandırılarak doğrudan lojistik birimine (2. Sekme) aktarılır.

### 2. Sekme: Stratejik Lojistik ve Simülasyon (Canvas)
* **Stratejik Analiz:** AI, vakanın durumuna göre tır ve ekipman sayısı önerisinde bulunur; onay mekanizmasıyla sevkiyat başlatılır.
* **Dinamik Rotalama (BFS):** Mavi noktalar (Tırlar) ve Kırmızı noktalar (Ambulanslar) harita üzerinde yola çıkar.
* **Kapasite ve Darboğaz Analizi:** * **AI Optimizasyonu Kapalı:** Tek hat üzerinde biriken yük kırmızı grafiklenir, aktif rota listesi tıkanır ve zaman kazancı durur.
  * **AI Optimizasyonu Açık:** Yollar yeşile döner, yük tüm hatlara eşit dağıtılır ve zaman kazancı (efficiency) artmaya başlar.
* **Saha Müdahalesi:** Hava durumu (hız etkisi) ve yollara enkaz koyma özellikleri mevcuttur. Sarı noktalar (İş Makineleri) enkazı kaldırarak yolun tekrar açılmasını sağlar.

##  Canlı Demo
* **Yayın Linki:** [Ulusal Afet Lojistik Paneli - Vercel](https://ulusal-afet-lojistik-operasyon-merk.vercel.app/)
* **Demo Video:** [ Video Linki](https://youtu.be/gdnuV2_zbME?si=uZn21gYN0cd2Eiam)

## 🛠️ Kullanılan Teknolojiler & Araçlar
* **Yapay Zeka Core:** Google Gemini 1.5-Flash (NLP & Triyaj)
* **Frontend:** HTML5, Vanilla JS (ES Modules)
* **Styling:** Tailwind CSS (Premium Dark Theme)
* **Grafik & Simülasyon:** HTML5 Canvas API
* **AI Geliştirme Ekosistemi:** Gemini Pro, ChatGPT Pro, Claude & Google AI Studio
* **IDE & Agentic Coding:** Cursor & Antigravity (Advanced AI Code Generation)
* **Algoritmalar:** Dijkstra & BFS (Rota Optimizasyonu)
* **Deployment:** Vercel (Cloud Delivery)

 ##  Nasıl Çalıştırılır?

Proje JavaScript modülleri (ESM) kullandığı için bir HTTP sunucusu üzerinden çalıştırılmalıdır.

1. Projeyi klonlayın:
git clone https://github.com/tuanaeylulalkan/Ulusal-Afet-Lojistik-Operasyon-Merkezi.git
cd Ulusal-Afet-Lojistik-Operasyon-Merkezi

2. API Anahtarı Ekleyin:
   features/index.html dosyasında bulunan window.__GEMINI_API_KEY__ kısmına geçerli bir API anahtarı girin.

3. Yerel sunucu başlatın:
npx http-server
(veya VS Code Live Server kullanabilirsiniz)

4. Tarayıcıdan açın:
http://localhost:8080
