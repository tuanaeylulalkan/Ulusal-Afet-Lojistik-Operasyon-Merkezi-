# Afet Lojistik Kontrol Sistemi: Kullanıcı Akışı (User Flow)

## Amaç
Bu belge, kullanıcının sistem içerisindeki etkileşimlerini ve sistemin bu etkileşimlere verdiği yanıtları adım adım açıklamak amacıyla hazırlanmıştır.


##  Akış Diyagramı
```
Şehir Seçimi
   ↓
Hibrit Veri Toplama
   ↓
AI Triyaj (Gemini)
   ↓
Vaka Seçimi
   ↓
Sekme 2: Lojistik Operasyon
   ↓
Stratejik Analiz & Onay
   ↓
Simülasyon Başlatma
   ↓
Dinamik Müdahale (Enkaz / Hava)
   ↓
AI Optimizasyonu
   ↓
Operasyon Tamamlanır
```


##  Adım Adım Kullanıcı Deneyimi

### SEKME 1: AKILLI TALEP MERKEZİ VE TRİYAJ

Adım 1: Giriş ve Kriz Bölgesi Seçimi  
- Kullanıcı: "Aktif Kriz Bölgesi" menüsünden operasyon yapılacak şehri seçer.  
- Sistem: Seçilen şehre ait arayüzü aktif hale getirir.



Adım 2: Hibrit Veri Senkronizasyonu  
- Kullanıcı: İnternet, Mesh Network veya manuel giriş ile sahadan veri girer.  
- Sistem (AI): Google Gemini modeli gelen metinleri analiz eder:
  - 0-100 arası öncelik skoru oluşturur  
  - Vaka türünü belirler  
  - Gerekli lojistik kaynağı (Tır, Ambulans, İş Makinesi) önerir  



Adım 3: Vaka Seçimi ve Lojistiğe Aktarım  
- Kullanıcı: Kritik vakayı seçer ve "Lojistiğe Gönder" butonuna basar.  
- Sistem: Veriyi paketler ve otomatik olarak Sekme 2'ye geçiş yapar.


### SEKME 2: LOJİSTİK OPERASYON VE SİMÜLASYON

Adım 4: Stratejik Analiz ve Kapasite Onayı  
- Kullanıcı: "Stratejik Analiz Raporu Al" butonuna basar, önerilen araç sayılarını inceler ve onaylar.  
- Sistem: Canvas üzerinde araçları (Tır, Ambulans) sahaya gönderir.


Adım 5: Darboğaz Tespiti (AI Kapalı Durum)  
- Sistem: Araçlar tek bir hatta yoğunlaşır.  
- Sonuç: Kapasite yükü artar, grafik kırmızıya döner ve zaman kazancı oluşmaz.


Adım 6: AI Optimizasyonunun Devreye Alınması  
- Kullanıcı: "AI Optimizasyonu" özelliğini aktif eder.  
- Sistem: BFS algoritması ile alternatif rotalar oluşturur:
  - Yük dengeli dağıtılır  
  - Trafik azalır  
  - Zaman kazancı artar  


Adım 7: Dinamik Saha Müdahalesi  
- Kullanıcı: Hava durumunu kötüleştirir veya yola enkaz ekler.  
- Sistem:
  - Araç hızlarını düşürür  
  - Yolları kapatır  
  - İş makinelerini bölgeye yönlendirir  

- Sonuç: Enkaz kaldırılır, yollar açılır ve operasyon devam eder.


Adım 8: Operasyon Kapanışı  
- Sistem: Tüm araçlar hedefe ulaştığında:
  - Rotalar açık hale gelir  
  - Verimlilik maksimize edilir  
  - Operasyon başarıyla tamamlanır  
