const fs = require('fs');
const path = require('path');

// 1. HTML Update
const idxPath = path.join('c:/Users/tuana/Desktop/afet lojstik/frontend', 'index.html');
let html = fs.readFileSync(idxPath, 'utf8');

const htmlRegex = /(<section\s+id="panel-flow"[\s\S]*?>)[\s\S]*?(<\/section>)/;
const newHtmlContent = `
        <div class="flex flex-col gap-6 w-full max-w-7xl mx-auto">
            <!-- Header (Görsel 1) -->
            <div class="flex flex-col md:flex-row justify-between md:items-start gap-4">
               <div>
                  <h2 id="tab2-city-title" class="text-3xl font-extrabold text-slate-100 tracking-widest uppercase">ACİL OPERASYON</h2>
                  <p id="tab2-case-subtitle" class="text-slate-400 mt-2 text-sm max-w-2xl">Lütfen bir vaka seçin.</p>
               </div>
               <button class="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-transform active:scale-95 shrink-0">
                  <span class="text-xl">✨</span> STRATEJİK ANALİZ RAPORU
               </button>
            </div>
            
            <!-- Canvas Container (Görsel 2) -->
            <div class="glass-card bg-[#0b1121] border border-slate-700/50 rounded-2xl p-0 overflow-hidden relative shadow-2xl h-[450px]">
               <!-- Inner Header -->
               <div class="flex justify-between items-center bg-[#1e293b]/80 backdrop-blur-md px-6 py-4 border-b border-slate-700/50 absolute top-0 left-0 w-full z-10">
                  <h3 id="tab2-canvas-title" class="text-blue-400 font-bold tracking-widest uppercase flex items-center gap-2">
                     BÖLGE <span class="text-slate-500">/ KRİZ SİMÜLASYONU</span>
                  </h3>
                  <div class="flex items-center gap-4">
                      <div id="ai-opt-badge" class="bg-red-500 text-white text-[11px] font-bold px-4 py-2 rounded-lg tracking-wider cursor-pointer hover:bg-red-400 transition-colors shadow-lg shadow-red-500/20">
                          AI OPTİMİZASYONU: KAPALI
                      </div>
                      <button id="btn-start-sim" class="bg-blue-600/50 hover:bg-blue-600 text-white text-sm font-bold py-2 px-5 rounded-lg flex items-center gap-2 transition-all opacity-40 cursor-not-allowed">
                          ▶ SEVKİYATI BAŞLAT
                      </button>
                  </div>
               </div>
               
               <!-- Canvas -->
               <div class="w-full h-full pt-16">
                   <canvas id="route-canvas" class="w-full h-full"></canvas>
               </div>
                   
               <!-- Legend Overlays -->
               <div class="absolute bottom-6 left-6 bg-[#0f172a]/90 border border-slate-700/50 rounded-xl p-4 backdrop-blur-md">
                   <ul class="space-y-3 text-[10px] sm:text-xs font-bold text-slate-300">
                       <li class="flex items-center gap-3"><span class="w-3 h-3 rounded-full bg-[#64748b] border-2 border-slate-500"></span> OPERASYON MERKEZİ</li>
                       <li class="flex items-center gap-3"><span class="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"></span> YARDIM KONVOYU</li>
                       <li class="flex items-center gap-3"><span class="w-6 h-1 bg-red-500"></span> KRİTİK KİLİTLENME</li>
                       <li class="flex items-center gap-3"><span class="w-6 h-1 bg-emerald-500"></span> AI ALTERNATİF ROTA</li>
                   </ul>
               </div>
            </div>
            
            <!-- Bottom Grid (Görsel 3 & 4) -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
                <!-- Left: AI Sevkiyat -->
                <div class="lg:col-span-4 glass-card bg-[#111827] p-6 rounded-2xl border border-slate-700/40">
                    <h3 class="text-xs font-bold tracking-widest text-slate-200 mb-6 flex items-center gap-2 uppercase">
                       <span class="text-base text-emerald-400">🚛</span> AI SEVKİYAT ÖNERİSİ
                    </h3>
                    <div class="bg-[#1f2937]/50 border border-slate-700/50 rounded-xl p-6 text-center mt-4">
                        <p class="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-3">GÖNDERİLMESİ GEREKEN TIR SAYISI</p>
                        <p id="suggested-truck-count" class="text-7xl font-black text-white mb-6 tabular-nums">0</p>
                        <div class="flex gap-3">
                            <button id="btn-approve-trucks" class="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold py-3 rounded-lg transition-transform active:scale-95 shadow-lg shadow-emerald-500/20">
                                ONAYLA
                            </button>
                            <button id="btn-custom-trucks" class="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-bold py-3 rounded-lg transition-transform active:scale-95">
                                SAYI GİR
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Middle: Aktif Rota Listesi -->
                <div class="lg:col-span-4 glass-card bg-[#111827] p-6 rounded-2xl border border-slate-700/40 flex flex-col">
                    <h3 class="text-xs font-bold tracking-widest text-slate-200 mb-6 flex items-center gap-2 uppercase">
                       <span class="text-base text-red-500">📍</span> AKTİF ROTA LİSTESİ
                    </h3>
                    <div class="bg-[#1f2937]/50 border border-slate-700/50 rounded-xl p-4 flex-1 overflow-hidden flex flex-col">
                        <ul id="route-panel-list" class="space-y-3 text-sm flex-1 overflow-y-auto pr-2">
                            <div class="h-full flex items-center justify-center text-slate-500 italic text-sm">Sevkiyat bekleniyor...</div>
                        </ul>
                    </div>
                </div>
                
                <!-- Right: Vaka Analitiği -->
                <div class="lg:col-span-4 glass-card bg-[#111827] p-6 rounded-2xl border border-slate-700/40 flex flex-col">
                    <h3 class="text-xs font-bold tracking-widest text-slate-200 mb-6 uppercase">VAKA ANALİTİĞİ</h3>
                    
                    <div class="bg-[#1f2937]/50 border border-slate-700/50 rounded-xl py-4 px-4 text-center mb-4">
                        <p class="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-2">ZAMAN KAZANCI</p>
                        <p id="time-saved-text" class="text-2xl sm:text-3xl font-black text-emerald-500 font-mono tracking-wider tabular-nums">0s 0dk 0sn</p>
                    </div>
                    
                    <div class="bg-[#1f2937]/50 border border-slate-700/50 rounded-xl py-3 px-4 flex-1 relative min-h-[150px]">
                        <p class="text-[10px] font-bold text-slate-500 tracking-widest uppercase text-center mb-1">HATTIN KAPASİTE YÜKÜ</p>
                        <div class="absolute inset-0 top-8 left-2 right-2 bottom-2">
                            <canvas id="capacity-chart" class="w-full h-full"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Footer Status -->
            <div class="fixed bottom-0 left-0 w-full min-h-[48px] bg-[#0b1121] border-t border-slate-700/50 p-3 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] flex items-center gap-3 z-[60]">
                <span id="status-dot" class="w-3 h-3 rounded-full bg-slate-500 ml-6"></span>
                <p class="text-[11px] sm:text-xs font-bold text-emerald-400 tracking-wide uppercase">SİSTEM DURUMU: <span id="system-status-text" class="text-slate-400 italic normal-case tracking-normal">Motor emir bekliyor...</span></p>
            </div>
        </div>
`;
html = html.replace(htmlRegex, `$1\n${newHtmlContent}\n$2`);
fs.writeFileSync(idxPath, html, 'utf8');
console.log('HTML Layout updated!');

// 2. JS Update
const jsPath = path.join('c:/Users/tuana/Desktop/afet lojstik/frontend/js', 'app.js');
let js = fs.readFileSync(jsPath, 'utf8');

const jsDeleteRegex = /\/\/ --- YENİ FONKSİYON: LOJİSTİĞE GÖNDERME MANTIĞI ---[\s\S]*$/;
const newJsContent = `// --- SİMÜLASYON MOTORU (SEKME 2) ---
window.isAIOptimized = false;
window.selectedCaseObj = null;

let simState = 'idle'; // idle | approved | running
let simTruckTotal = 0;
let simTrucksSpawned = 0;
let trucks = [];
let chartInstance = null;
let savedTimeSecs = 0;
let dynamicStreets = [];
let routeInterval = null;

// Özel Şehir/Sokak Jeneratörü
function getDynamicStreets(city) {
    const c = (city || '').trim().toLowerCase();
    if(c === 'istanbul' || c === 'i̇stanbul') return ['D100 Çevre Yolu', 'Cumhuriyet Bulvarı', 'Merkez Bağlantı', 'Sakin Sokak', 'Güney Servis Hattı', 'Atatürk Caddesi', 'Tali Sokak'];
    if (c === 'hatay') return ['Antakya Çevre Yolu', 'Kurtuluş Caddesi', 'Harbiye Bağlantısı', 'Defne Sokak', 'Güney Servis Hattı', 'Atatürk Caddesi', 'Alternatif Yol'];
    if (c === 'ankara') return ['Eskişehir Yolu', 'Mevlana Bulvarı', 'Konya Yolu', 'Tunalı Sokak', 'Güney Servis Hattı', 'Atatürk Bulvarı', 'Tali Sokak'];
    if (c === 'izmir' || c === 'i̇zmir') return ['Anadolu Caddesi', 'Altınyol', 'Yeşildere', 'Kıbrıs Şehitleri', 'Güney Servis Hattı', 'Atatürk Caddesi', 'Tali Sokak'];
    // Fallback
    const cTitle = city ? city.charAt(0).toUpperCase() + city.slice(1) : 'Bölge';
    return [\`\${cTitle} Çevre Yolu\`, \`\${cTitle} Merkez Bulvarı\`, 'Bağlantı Yolu', 'Sakin Sokak', 'Güney Servis Hattı', 'Atatürk Caddesi', 'Alternatif Tali Yol'];
}

// Sekme 1 üzerinden operasyona başlama
window.handleSendToLogistics = function(id) {
    const vaka = requests.find(r => r.id === id);
    if (!vaka) return;
    
    vaka.status = 'completed';
    window.selectedCaseObj = vaka; 
    selectedId = null; 
    
    // Reset SimState
    simState = 'idle';
    window.isAIOptimized = false;
    trucks = [];
    simTrucksSpawned = 0;
    savedTimeSecs = 0;
    clearInterval(routeInterval);
    
    updateSimUI();
    
    showToast("Vaka Operasyon Hattına Aktarıldı!");
    switchTab('flow');
    renderList();
};

function updateSimUI() {
    if(!window.selectedCaseObj) return;
    
    const uiCity = (window.selectedCaseObj.city || 'Bölge').toUpperCase();
    document.getElementById('tab2-city-title').textContent = \`\${uiCity} ACİL OPERASYONU\`;
    document.getElementById('tab2-case-subtitle').textContent = \`HEDEF VAKA: \${window.selectedCaseObj.explanation || 'Acil yardıma ihtiyaç var.'}\`;
    document.getElementById('tab2-canvas-title').innerHTML = \`\${uiCity} <span class="text-slate-500">/ KRİZ SİMÜLASYONU</span>\`;
    
    dynamicStreets = getDynamicStreets(uiCity);
    
    // Rastgele tır sayısı (örneğin 15-35 arası)
    simTruckTotal = Math.floor(Math.random() * 20) + 15; 
    document.getElementById('suggested-truck-count').textContent = simTruckTotal;
    
    document.getElementById('time-saved-text').textContent = '0s 0dk 0sn';
    document.getElementById('route-panel-list').innerHTML = \`<div class="h-full flex items-center justify-center text-slate-500 italic text-sm mt-8">Sevkiyat bekleniyor...</div>\`;
    
    const btnApprove = document.getElementById('btn-approve-trucks');
    if(btnApprove) {
       btnApprove.textContent = 'ONAYLA';
       btnApprove.classList.remove('bg-emerald-600', 'cursor-not-allowed');
       btnApprove.classList.add('bg-emerald-500');
       btnApprove.disabled = false;
    }
    
    const btnStart = document.getElementById('btn-start-sim');
    if(btnStart) {
       btnStart.classList.add('opacity-40', 'cursor-not-allowed', 'bg-blue-600/50');
       btnStart.classList.remove('opacity-100', 'hover:bg-blue-500', 'bg-blue-600');
       btnStart.disabled = true;
    }
    
    document.getElementById('system-status-text').textContent = 'Onay Bekleniyor...';
    document.getElementById('status-dot').className = 'w-3 h-3 rounded-full bg-slate-500 ml-6';
    
    const aiBadge = document.getElementById('ai-opt-badge');
    if(aiBadge) {
        aiBadge.className = 'bg-red-500 text-white text-[11px] font-bold px-4 py-2 rounded-lg tracking-wider cursor-pointer hover:bg-red-400 transition-colors shadow-lg shadow-red-500/20';
        aiBadge.textContent = 'AI OPTİMİZASYONU: KAPALI';
    }
}

function bindSimControls() {
    const btnApprove = document.getElementById('btn-approve-trucks');
    const btnStart = document.getElementById('btn-start-sim');
    const aiBadge = document.getElementById('ai-opt-badge');
    const btnCustom = document.getElementById('btn-custom-trucks');
    
    btnApprove?.addEventListener('click', () => {
        if(simState !== 'idle') return;
        simState = 'approved';
        
        btnStart.classList.remove('opacity-40', 'cursor-not-allowed', 'bg-blue-600/50');
        btnStart.classList.add('opacity-100', 'bg-blue-600', 'hover:bg-blue-500');
        btnStart.disabled = false;
        
        btnApprove.textContent = 'ONAYLANDI ✓';
        btnApprove.classList.replace('bg-emerald-500', 'bg-emerald-600');
        btnApprove.disabled = true;
        
        document.getElementById('system-status-text').textContent = 'Motor emir bekliyor...';
        document.getElementById('status-dot').className = 'w-3 h-3 rounded-full bg-amber-500 animate-pulse ml-6';
    });
    
    btnCustom?.addEventListener('click', () => {
        if(simState !== 'idle') return;
        const result = prompt("Gönderilecek Tır Sayısını Girin:", simTruckTotal);
        if(result && !isNaN(result) && result > 0) {
            simTruckTotal = parseInt(result);
            document.getElementById('suggested-truck-count').textContent = simTruckTotal;
        }
    });
    
    btnStart?.addEventListener('click', () => {
        if(simState !== 'approved') return;
        simState = 'running';
        
        btnStart.classList.add('opacity-40', 'cursor-not-allowed', 'bg-blue-600/50');
        btnStart.disabled = true;
        
        document.getElementById('system-status-text').innerHTML = \`Konvoy sahada, <span class="text-white font-bold ml-1">canlı takip aktif</span>...\`;
        document.getElementById('status-dot').className = 'w-3 h-3 rounded-full bg-blue-500 animate-pulse ml-6 shadow-[0_0_8px_#3b82f6]';
        
        // Araç spawnla
        let spawned = 0;
        routeInterval = setInterval(() => {
           if(spawned >= simTruckTotal) { clearInterval(routeInterval); return; }
           spawnTruck();
           spawned++;
        }, 800);
        
        renderActiveRoutes();
    });
    
    aiBadge?.addEventListener('click', () => {
        window.isAIOptimized = !window.isAIOptimized;
        if(window.isAIOptimized) {
            aiBadge.className = 'bg-emerald-500 text-white text-[11px] font-bold px-4 py-2 rounded-lg tracking-wider cursor-pointer hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20';
            aiBadge.textContent = 'AI OPTİMİZASYONU: AÇIK';
        } else {
            aiBadge.className = 'bg-red-500 text-white text-[11px] font-bold px-4 py-2 rounded-lg tracking-wider cursor-pointer hover:bg-red-400 transition-colors shadow-lg shadow-red-500/20';
            aiBadge.textContent = 'AI OPTİMİZASYONU: KAPALI';
        }
        renderActiveRoutes();
        
        // Rota düzeltme
        trucks.forEach(t => {
          if(!t.reached && t.pathIndex === 0) { 
              if(window.isAIOptimized) {
                  const altPaths = [ ['n1', 'n3', 'n4'], ['n1', 'n5', 'n6'], ['n1', 'n2', 'n3', 'n4'] ];
                  t.path = altPaths[Math.floor(Math.random() * altPaths.length)];
              } else {
                  t.path = ['n1', 'n2', 'n6'];
              }
          }
       });
    });
}

function renderActiveRoutes() {
    const pList = document.getElementById('route-panel-list');
    if(!pList) return;
    
    if(simState !== 'running') return;
    
    if(window.isAIOptimized) {
         pList.innerHTML = \`
            <li class="flex justify-between border-b border-slate-700/40 pb-3">
              <span class="text-slate-400 font-bold">\${dynamicStreets[1]} (Ana Arter)</span>
              <span class="text-amber-400 font-bold text-[10px] bg-amber-400/10 px-2 py-1 rounded border border-amber-400/20">Rahatlıyor</span>
            </li>
            <li class="flex justify-between border-b border-slate-700/40 pb-3">
              <span class="text-emerald-400 font-bold">\${dynamicStreets[0]}</span>
              <span class="text-emerald-400 font-bold text-[10px] bg-emerald-400/10 px-2 py-1 rounded border border-emerald-400/20">Aktif & Akışkan</span>
            </li>
            <li class="flex justify-between pb-3">
              <span class="text-emerald-400 font-bold">\${dynamicStreets[4]}</span>
              <span class="text-emerald-400 font-bold text-[10px] bg-emerald-400/10 px-2 py-1 rounded border border-emerald-400/20">Aktif & Akışkan</span>
            </li>
        \`;
    } else {
         pList.innerHTML = \`
            <li class="flex justify-between border-b border-red-900/40 pb-3">
              <span class="text-red-400 font-bold">\${dynamicStreets[1]} (Ana Arter)</span>
              <span class="text-red-500 font-bold text-[10px] bg-red-500/10 px-2 py-1 rounded border border-red-500/20 animate-pulse">DARBOĞAZ (Kayıp)</span>
            </li>
            <li class="flex justify-between border-b border-slate-700/40 pb-3">
              <span class="text-slate-500">\${dynamicStreets[0]}</span>
              <span class="text-slate-600 text-[10px]">Kullanılmıyor</span>
            </li>
            <li class="flex justify-between pb-3">
              <span class="text-slate-500">\${dynamicStreets[4]}</span>
              <span class="text-slate-600 text-[10px]">Kullanılmıyor</span>
            </li>
        \`;
    }
}

// Map Data
const C_NODES = {
  n1: {x: 100, y: 150},
  n2: {x: 350, y: 250},
  n3: {x: 550, y: 100},
  n4: {x: 650, y: 200},
  n5: {x: 150, y: 350},
  n6: {x: 650, y: 350}
};

const C_EDGES = [
  { from:'n1', to:'n3', streetIdx: 0, type: 'tali' }, 
  { from:'n1', to:'n2', streetIdx: 1, type: 'ana' }, 
  { from:'n2', to:'n3', streetIdx: 2, type: 'ana' }, 
  { from:'n3', to:'n4', streetIdx: 3, type: 'tali' },
  { from:'n2', to:'n6', streetIdx: 4, type: 'ana' },
  { from:'n5', to:'n2', streetIdx: 5, type: 'tali' }, 
  { from:'n5', to:'n6', streetIdx: 6, type: 'tali' }
];

function spawnTruck() {
    let chosenPath = [];
    if (!window.isAIOptimized) {
        chosenPath = ['n1', 'n2', 'n6']; 
    } else {
        const altPaths = [ ['n1', 'n3', 'n4'], ['n1', 'n5', 'n6'], ['n1', 'n2', 'n3', 'n4'] ];
        chosenPath = altPaths[Math.floor(Math.random() * altPaths.length)];
    }
    
    trucks.push({
        x: C_NODES.n1.x,
        y: C_NODES.n1.y,
        path: chosenPath,
        pathIndex: 0,
        reached: false,
        offsetY: (Math.random() - 0.5) * 12,
        offsetX: (Math.random() - 0.5) * 12
    });
}

function drawRouteCanvas() {
  const c = document.getElementById('route-canvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  
  function resize() {
      c.width = c.parentElement.clientWidth;
      c.height = c.parentElement.clientHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  function render() {
    const w = c.width;
    const h = c.height;
    ctx.clearRect(0, 0, w, h);
    
    const scaleX = w / 800; // Native koordinatlar 800x450 bazlı
    const scaleY = h / 450;

    // Yollar
    C_EDGES.forEach(e => {
        const p1 = C_NODES[e.from];
        const p2 = C_NODES[e.to];
        
        let color = '#334155';
        let width = 5;
        
        if (e.type === 'ana') {
            color = window.isAIOptimized ? '#64748b' : '#ef4444'; 
            width = 7;
        } else {
            color = window.isAIOptimized ? '#10b981' : '#334155';
            width = 4;
        }
        
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(p1.x * scaleX, p1.y * scaleY);
        ctx.lineTo(p2.x * scaleX, p2.y * scaleY);
        ctx.stroke();
        
        // Yol ismi etiketi
        const mx = (p1.x + p2.x)/2 * scaleX;
        const my = (p1.y + p2.y)/2 * scaleY - 10;
        ctx.fillStyle = '#64748b';
        ctx.font = '10px "DM Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(dynamicStreets[e.streetIdx] || '', mx, my);
    });

    // Düğümler
    Object.values(C_NODES).forEach(n => {
        ctx.strokeStyle = '#475569'; 
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(n.x * scaleX, n.y * scaleY, 8, 0, Math.PI*2);
        ctx.stroke();
        ctx.fillStyle = '#0f172a';
        ctx.fill();
    });

    // Tırlar
    trucks.forEach(t => {
        if (t.reached) return;
        
        ctx.fillStyle = window.isAIOptimized ? '#34d399' : '#3b82f6';
        ctx.shadowBlur = 12;
        ctx.shadowColor = ctx.fillStyle;
        ctx.beginPath();
        ctx.arc(t.x * scaleX + t.offsetX, t.y * scaleY + t.offsetY, 5, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        const pn = C_NODES[t.path[t.pathIndex + 1]];
        if (pn) {
            const dx = pn.x - t.x;
            const dy = pn.y - t.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            const isMainBottleneck = t.path[t.pathIndex] === 'n1' || t.path[t.pathIndex] === 'n2';
            let speed = 1.0;
            if (!window.isAIOptimized) {
                speed = isMainBottleneck ? 0.3 : 0.8; 
            } else {
                speed = 2.0; 
            }
            
            if (dist > speed) {
                t.x += (dx / dist) * speed;
                t.y += (dy / dist) * speed;
            } else {
                t.x = pn.x;
                t.y = pn.y;
                t.pathIndex++;
                if (t.pathIndex >= t.path.length - 1) t.reached = true;
            }
        } else {
            t.reached = true;
        }
    });

    requestAnimationFrame(render);
  }
  render();
}

function initChart() {
    const ctxCanvas = document.getElementById('capacity-chart');
    if(!ctxCanvas) return;
    
    chartInstance = new Chart(ctxCanvas, {
        type: 'bar',
        data: {
            labels: ['Ana Yol (Bulvar)', 'Çevre Yolu', 'Tali Sokaklar'],
            datasets: [{
                label: 'Kapasite Yükü (%)',
                data: [0, 0, 0],
                backgroundColor: ['#ef4444', '#10b981', '#10b981'],
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { min: 0, max: 150, grid: { color: 'rgba(51, 65, 85, 0.2)'}, ticks: { color: '#64748b' } },
                x: { grid: { display: false }, ticks: { color: '#64748b', font: {size: 10} } }
            },
            plugins: { legend: { display: false } }
        }
    });
    
    setInterval(() => {
        if(simState === 'running') {
            let ana=0, cevre=0, tali=0;
            if(window.isAIOptimized) {
                ana = 20 + Math.random()*10; 
                cevre = 70 + Math.random()*20; 
                tali = 40 + Math.random()*15;
            } else {
                ana = 110 + Math.random()*35; // kırmızı çizgi ihlali
                cevre = 5 + Math.random()*5;
                tali = 2 + Math.random()*5;
            }
            chartInstance.data.datasets[0].data = [ana, cevre, tali];
            // Renkleri güncelle
            chartInstance.data.datasets[0].backgroundColor = [
                ana > 100 ? '#ef4444' : '#3b82f6',
                cevre > 100 ? '#ef4444' : '#10b981',
                tali > 100 ? '#ef4444' : '#10b981'
            ];
            chartInstance.update();
            
            // Zaman kazancı
            if(window.isAIOptimized) {
                 savedTimeSecs += 17;
                 let hrs = Math.floor(savedTimeSecs / 3600);
                 let mins = Math.floor((savedTimeSecs % 3600) / 60);
                 let secs = savedTimeSecs % 60;
                 document.getElementById('time-saved-text').textContent = \`\${hrs}s \${mins}dk \${secs}sn\`;
            }
        }
    }, 1000);
}

function init() {
  populateCities();
  updateCityHint();
  bindTabs();
  bindCity();
  bindManualForm();
  bindSync();
  renderList();
  
  // Sekme 2 inits
  bindSimControls();
  drawRouteCanvas();
  setTimeout(initChart, 500); 
}

init();
`;

js = js.replace(jsDeleteRegex, newJsContent);
fs.writeFileSync(jsPath, js, 'utf8');
console.log('JS fully updated natively!');
