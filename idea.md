#  Proje Fikri ve Vizyonu (Idea)

##  1. Problem Tanımı
Afet anlarında ilk 72 saat ("Altın Saatler" olarak bilinen kritik dönem) hayati önem taşır. Ancak sahadan gelen binlerce yardım talebinin (internet, SMS, telsiz) manuel olarak ayrıştırılması imkansıza yakındır. Dahası, afet durumunda standart iletişim altyapılarının çökmesi veri akışını tamamen kesebilir.

Mevcut sistemlerdeki bu veri kaosu; yanlış önceliklendirmeye, kısıtlı yardım tırlarının tıkanmış yollara yönlendirilmesine ve lojistik kaynakların verimsiz dağıtılmasına neden olarak operasyonel gecikmelere ve darboğazlara yol açmaktadır.


##  2. Hedef Kullanıcı Kitlemiz
- **Kriz Masası Yöneticileri (Örn: AFAD):** Merkezde karmaşık verileri tek ekranda analiz ederek stratejik kararlar alan yetkililer.
- **Saha Lojistik Koordinatörleri:** Tır, ambulans ve iş makinelerinin sahadaki konumlarını yöneten, rota ve müdahale kararlarını veren operasyon sorumluları.


##  3. Yapay Zekanın (AI) ve Teknolojinin Rolü

Bu proje, kaotik veri akışını anlamlı ve yönetilebilir bir yapıya dönüştürmek için yapay zekayı iki temel aşamada kullanır:

### A. Akıllı Triyaj ve Hibrit Veri Toplama
Sistem yalnızca internet altyapısına bağlı kalmaz; altyapının çöktüğü durumlarda **Mesh Network** ve **manuel veri girişleri** ile veri toplamaya devam eder.

Toplanan metinsel veriler, **Google Gemini 1.5-Flash** modeli tarafından analiz edilerek:
- 0-100 arası aciliyet skoru oluşturulur  
- Vaka türü belirlenir  
- Gerekli lojistik kaynak (Tır, Ambulans, İş Makinesi) otomatik olarak önerilir  

Bu sayede karar alma süreci hızlandırılır ve insan hatası minimize edilir.


### B. Dinamik Lojistik Optimizasyonu
Yapay zeka yalnızca veri analizinde değil, sahadaki lojistik operasyonların yönetiminde de aktif rol oynar:

- **Kapasite Yükü Yönetimi:**  
  AI optimizasyonu kapalıyken tüm araçlar tek bir hatta yoğunlaşır (darboğaz oluşur).  
  AI aktif olduğunda ise yük tüm hatlara dengeli dağıtılır, sistem verimliliği artar.

- **Dinamik Rota Optimizasyonu (BFS & Dijkstra):**  
  Hava koşulları, yol kapanmaları veya enkaz gibi değişkenlere bağlı olarak sistem anlık olarak alternatif rotalar üretir.

- **Saha Müdahalesi:**  
  İş makineleri (sarı birimler), kapanan yolları açarak lojistik akışın kesintisiz devam etmesini sağlar.


##  4. Mühendislik Yaklaşımı
Bu proje; afet yönetimini yalnızca tepki veren (reaktif) bir sistemden, **proaktif karar destek sistemine** dönüştürmeyi hedefler.

Endüstri mühendisliği prensipleri kullanılarak:
- Kapasite planlaması yapılır  
- Kaynak dağılımı optimize edilir  
- Sürekli alternatif senaryolar üretilir  

Bu yaklaşım, afet yönetiminde hız, doğruluk ve verimlilik artışı sağlar.


##  5. Beklenen Etki
Bu sistem, afet yönetiminde:
- Müdahale süresini azaltmayı  
- Kaynak israfını minimize etmeyi  
- Kritik vakalara daha hızlı ulaşmayı  

hedefleyerek, insan hayatını doğrudan etkileyen operasyonel verimliliği artırmayı amaçlar.
