Önerilen Teknoloji Yığını (Simple Web Stack)
Dil: HTML5 / CSS3 / JavaScript (Vanilla)

Neden? Hiçbir kurulum gerektirmez, doğrudan tarayıcıda çalışır. Öğrenme eğrisi en düşük dildir.

Tasarım: Tailwind CSS

Neden? Uzun CSS dosyaları yazmak yerine, HTML içine küçük sınıflar ekleyerek (Örn: bg-red-500) profesyonel görünümlü paneller tasarlamanı sağlar.

Yapay Zeka: Gemini API (Google AI SDK)

Neden? Bir "backend" (arka uç) sunucusu kurmadan doğrudan JavaScript üzerinden Google'ın en güçlü modellerine erişebilirsin.

Görselleştirme: Canvas API (Tarayıcının yerleşik özelliği)

Neden? Harita üzerindeki tır hareketlerini ve yol çizgilerini ekstra kütüphane yüklemeden akıcı bir şekilde çizmeni sağlar.

Bu Teknolojileri Neden Seçiyoruz?

Shutterstock
Keşfet
Sıfır Kurulum: Bilgisayarına ağır programlar (SQL Server, Java, Python vb.) yüklemen gerekmez. Sadece bir metin düzenleyici (VS Code) yeterlidir.

Hızlı Prototipleme: Afet anında hız kritiktir. Bu yığın, bir fikri 30 dakika içinde çalışan bir simülasyona dönüştürmek için en hızlı yoldur.

Doğrudan API Bağlantısı: Google AI SDK sayesinde, "Client-Side" (istemci taraflı) kod yazarak yapay zekayı projenin kalbine yerleştirebilirsin.

Adım Adım Kurulum ve Başlangıç Rehberi
1. Çalışma Alanını Hazırla
Bilgisayarına Visual Studio Code (VS Code) indir ve kur.

VS Code içerisinde "Live Server" eklentisini yükle (Kodunu kaydettiğin an tarayıcıda değişikliği görmeni sağlar).

2. Proje Klasörünü Oluştur
Masaüstünde afet-lojistik adında bir klasör oluştur ve içine index.html dosyasını aç.

3. Temel HTML Yapısını Kur
index.html içine şu yapıyı yapıştır. Bu yapı, Tailwind ve Gemini SDK'sını otomatik olarak projene dahil eder:

HTML
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>Afet Lojistik Kontrol</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-white p-10">

    <h1 class="text-3xl font-bold">Afet Lojistik AI</h1>
    <textarea id="userInput" class="text-black p-2 w-full mt-4" placeholder="Durumu yazın..."></textarea>
    <button onclick="analizEt()" class="bg-blue-600 p-2 mt-2 rounded">Analiz Et</button>
    <div id="sonuc" class="mt-4 p-4 border border-slate-700"></div>

    <script type="importmap">
      {
        "imports": {
          "@google/generative-ai": "https://esm.run/@google/generative-ai"
        }
      }
    </script>

    <script type="module">
      import { GoogleGenerativeAI } from "@google/generative-ai";

      // API Anahtarını buraya yaz (Güvenlik notu: Gerçek projede bunu gizli tutmalısın)
      const API_KEY = "BURAYA_API_ANAHTARINI_YAPISTIR";
      const genAI = new GoogleGenerativeAI(API_KEY);

      window.analizEt = async function() {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = document.getElementById("userInput").value;
        const sonucDiv = document.getElementById("sonuc");

        sonucDiv.innerText = "Düşünülüyor...";
        
        try {
            const result = await model.generateContent(prompt);
            sonucDiv.innerText = result.response.text();
        } catch (error) {
            sonucDiv.innerText = "Hata: " + error.message;
        }
      }
    </script>
</body>
</html>
4. Uygulamayı Çalıştır
index.html dosyasındayken sağ alt köşedeki "Go Live" butonuna bas.

Tarayıcında açılan ekrana "Hatay'da 5 tır ekmek ihtiyacı var, yollar tıkalı" yaz ve "Analiz Et" de. Gemini sana anında cevap verecektir.