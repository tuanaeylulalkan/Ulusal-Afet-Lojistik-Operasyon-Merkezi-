import { PROVINCES } from './data/provinces.js';
import { fetchInternetSnapshot, fetchMeshSnapshot } from './layers/dataCollector.js';
import { analyzeIncomingRequest } from './layers/aiAnalyzer.js';

const els = {
    citySelect: document.getElementById('city-select'),
    cityHint: document.getElementById('city-hint'),
    manualForm: document.getElementById('manual-request-form'),
    manualSummary: document.getElementById('manual-summary'),
    manualSubmit: document.getElementById('manual-submit'),
    tabButtons: () => [...document.querySelectorAll('[data-tab]')],
    tabPanels: () => [...document.querySelectorAll('[data-tab-panel]')],
    requestList: document.getElementById('request-list'),
    requestDetail: document.getElementById('request-detail'),
    requestActions: document.getElementById('request-actions'),
    syncInternet: document.getElementById('sync-internet'),
    syncMesh: document.getElementById('sync-mesh'),
    toast: document.getElementById('toast'),
    kpiOpen: document.getElementById('kpi-open'),
    kpiCritical: document.getElementById('kpi-critical'),
};

const TYPE_LABELS = {
    genel: 'Genel ihtiyaç',
    enkaz_alti_ses: 'Enkaz / ses',
    saglik: 'Sağlık',
    yangin: 'Yangın',
    lojistik: 'Lojistik / yol',
    su_gida: 'Su / gıda',
    hastane_doluluk: 'Hastane / yoğun bakım',
    sokak_yangini: 'Sokak yangını',
};

let requests = [];
let selectedId = null;
let selectedCity = 'Adana';

// --- SİMÜLASYON MOTORU (SEKME 2) ---
window.isAIOptimized = false;
window.selectedCaseObj = null;
window.badWeather = false;

let simState = 'idle'; // idle | approved | running
let simTruckTotal = 0;
let simTrucksSpawned = 0;
let trucks = [];
let chartInstance = null;
let savedTimeSecs = 0;
let dynamicStreets = [];
let routeInterval = null;
let weatherParticles = [];
let _vehicleSpawnIdx = 0;
let _canvasListenerAdded = false;

// Kapalı yollar ve düğümler
const closedEdges = new Set(); // "n1-n2" formatında
const closedNodes = new Set();

// BFS en kısa yol bulucu (kapalı yolları atlar)
function bfsPath(start, end, vtype) {
    const adj = {};
    C_EDGES.forEach(e => {
        const ek1 = `${e.from}-${e.to}`, ek2 = `${e.to}-${e.from}`;
        if (vtype !== 'crane') {
            if (closedEdges.has(ek1) || closedEdges.has(ek2)) return;
            if (closedNodes.has(e.from) || closedNodes.has(e.to)) return;
        }
        (adj[e.from] = adj[e.from] || []).push(e.to);
        (adj[e.to] = adj[e.to] || []).push(e.from);
    });
    const queue = [[start]], visited = new Set([start]);
    while (queue.length) {
        const path = queue.shift();
        const node = path[path.length - 1];
        if (node === end) return path;
        (adj[node] || []).forEach(next => {
            if (!visited.has(next)) { visited.add(next); queue.push([...path, next]); }
        });
    }
    return null;
}

// Kapatma sonrası tüm tırları yeniden yönlendir
function rerouteTrucks() {
    trucks.forEach(t => {
        if (t.reached || t.vtype === 'crane') return;
        t.waitingForRoad = false;

        const curNode = t.path[t.pathIndex];
        const nextNode = t.path[t.pathIndex + 1];
        if (!nextNode || !curNode || t.path[t.pathIndex] === "!temp") return;

        if (!window.isAIOptimized) return; // AI OFF means no reroute! They just stop and wait.

        let pathBlockedIndex = -1;
        for (let i = t.pathIndex; i < t.path.length - 1; i++) {
            const nA = t.path[i];
            const nB = t.path[i + 1];
            const ek1 = `${nA}-${nB}`, ek2 = `${nB}-${nA}`;
            if (closedEdges.has(ek1) || closedEdges.has(ek2) || closedNodes.has(nB)) {
                pathBlockedIndex = i;
                break;
            }
        }

        if (pathBlockedIndex !== -1) {
            const dest = t.path[t.path.length - 1];
            if (pathBlockedIndex === t.pathIndex) {
                const newPath = bfsPath(curNode, dest, t.vtype);
                if (newPath) {
                    t.path = [nextNode, curNode, ...newPath.slice(1)];
                    t.pathIndex = 0;
                } else {
                    t.path = [nextNode, curNode];
                    t.pathIndex = 0;
                }
            } else {
                const newPath = bfsPath(nextNode, dest, t.vtype);
                if (newPath) {
                    t.path = [...t.path.slice(0, t.pathIndex + 1), ...newPath];
                } else {
                    t.path = [...t.path.slice(0, t.pathIndex + 1), nextNode];
                }
            }
        }
    });
}

// Noktadan doğru segmentine mesafe (tıklama tespiti için)
function distPointToSegment(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - ax, py - ay);
    let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}


// Özel Şehir/Sokak Jeneratörü
function getDynamicStreets(city) {
    const c = (city || '').trim().toLowerCase();
    if (c === 'istanbul' || c === 'i̇stanbul') return ['D100 Çevre Yolu', 'Cumhuriyet Bulvarı', 'Merkez Bağlantı', 'Sakin Sokak', 'Güney Servis Hattı', 'Atatürk Caddesi', 'Tali Sokak'];
    if (c === 'hatay') return ['Antakya Çevre Yolu', 'Kurtuluş Caddesi', 'Harbiye Bağlantısı', 'Defne Sokak', 'Güney Servis Hattı', 'Atatürk Caddesi', 'Alternatif Yol'];
    if (c === 'ankara') return ['Eskişehir Yolu', 'Mevlana Bulvarı', 'Konya Yolu', 'Tunalı Sokak', 'Güney Servis Hattı', 'Atatürk Bulvarı', 'Tali Sokak'];
    if (c === 'izmir' || c === 'i̇zmir') return ['Anadolu Caddesi', 'Altınyol', 'Yeşildere', 'Kıbrıs Şehitleri', 'Güney Servis Hattı', 'Atatürk Caddesi', 'Tali Sokak'];
    const cTitle = city ? city.charAt(0).toUpperCase() + city.slice(1) : 'Bölge';
    return [`${cTitle} Çevre Yolu`, `${cTitle} Merkez Bulvarı`, 'Bağlantı Yolu', 'Sakin Sokak', 'Güney Servis Hattı', 'Atatürk Caddesi', 'Alternatif Tali Yol', 'Kuzey Ba\u011flant\u0131 Hatt\u0131'];
}

window.handleSendToLogistics = function (id) {
    const vaka = requests.find(r => r.id === id);
    if (!vaka) return;

    vaka.status = 'completed';
    window.selectedCaseObj = vaka;
    selectedId = null;

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

// --- YENİ FONKSİYON: VAKA SEÇİM MANTIĞI ---
window.handleSelect = function (id) {
    const vaka = requests.find(r => r.id === id);
    if (vaka && vaka.status !== 'completed') {
        selectedId = id;
        renderList();
    }
};

// --- YENİ FONKSİYON: PROGRAMMATİK SEKME GEÇİŞİ ---
function switchTab(tabId) {
    const buttons = els.tabButtons();
    const panels = els.tabPanels();

    buttons.forEach(btn => {
        const isActive = btn.getAttribute('data-tab') === tabId;
        btn.setAttribute('aria-selected', isActive);
        // Eğer index.html'de "btn-glass--primary" sınıfını aktiflik için kullanıyorsan:
        if (isActive) btn.classList.add('btn-glass--primary');
        else btn.classList.remove('btn-glass--primary');
    });

    panels.forEach(panel => {
        panel.hidden = panel.getAttribute('data-tab-panel') !== tabId;
    });

    const kpis = document.getElementById('main-kpis');
    if (kpis) {
        kpis.style.display = tabId === 'requests' ? 'flex' : 'none';
    }

    // Sekme 1'e dönüldüğünde butonları tekrar aktif et
    if (tabId === 'requests') {
        [els.syncInternet, els.syncMesh].forEach(btn => {
            if (btn) {
                btn.disabled = false;
                btn.classList.remove('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
            }
        });
    }

    // Sekme 2'ye geçilince canvas boyutunu güncelle
    if (tabId === 'flow') {
        requestAnimationFrame(() => {
            const c = document.getElementById('route-canvas');
            if (c && c.parentElement) {
                c.width = c.parentElement.clientWidth;
                c.height = c.parentElement.clientHeight;
            }
        });
    }
}

function typeLabel(type) {
    return TYPE_LABELS[type] || type || '—';
}

function tierClass(tier) {
    if (tier === 'critical') return 'badge--critical';
    if (tier === 'low') return 'badge--low';
    return 'badge--medium';
}

function tierLabel(tier) {
    if (tier === 'critical') return 'Kritik';
    if (tier === 'low') return 'Düşük';
    return 'Orta';
}

function sortByPriority(list) {
    return [...list].sort((a, b) => {
        // Önce durumu 'open' olanları yukarı al, sonra skora göre diz
        if (a.status === b.status) return (b.priorityScore ?? 0) - (a.priorityScore ?? 0);
        return a.status === 'completed' ? 1 : -1;
    });
}

function getListExplanation(req) {
    if (req.explanation && String(req.explanation).trim()) return String(req.explanation).trim();
    const fromNote = firstSentenceFromText(req.aiNote);
    if (fromNote) return fromNote;
    return firstSentenceFromText(req.summary);
}

function firstSentenceFromText(text) {
    const t = String(text || '').trim().replace(/\s+/g, ' ');
    if (!t) return '';
    const idx = t.search(/[.!?](\s|$)/);
    if (idx === -1) return t.length <= 180 ? t : `${t.slice(0, 177)}…`;
    return t.slice(0, idx + 1).trim();
}

function newManualRequestId() {
    return `req-manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function updateCityHint() {
    const el = els.cityHint;
    if (!el) return;
    el.textContent = `Talepler seçtiğiniz il için kaydedilir: ${selectedCity}.`;
}

function showToast(message) {
    const t = els.toast;
    if (!t) return;
    t.textContent = message;
    t.hidden = false;
    t.style.display = 'block'; // Hidden attribute bazen CSS ile çakışabiliyor
    clearTimeout(showToast._id);
    showToast._id = setTimeout(() => {
        t.hidden = true;
        t.style.display = 'none';
    }, 3200);
}

function populateCities() {
    const el = document.getElementById('city-list');
    const input = els.citySelect;
    if (!el || !input) return;
    el.innerHTML = '';

    PROVINCES.forEach((item) => {
        const o = document.createElement('option');
        o.value = item;
        el.appendChild(o);
        if (item.includes(selectedCity)) {
            input.value = item;
        }
    });
}

function mergeRequests(incoming) {
    const ids = new Set(requests.map((r) => r.id));
    for (const r of incoming) {
        if (!ids.has(r.id)) {
            r.status = 'open'; // Gelen her yeni vaka açık başlar
            requests.push(r);
            ids.add(r.id);
        }
    }
}

function updateKpis() {
    const currentCityReqs = requests.filter((r) => r.city === selectedCity);
    const openCount = currentCityReqs.filter(r => r.status !== 'completed').length;
    const critical = currentCityReqs.filter((r) => r.priorityTier === 'critical' && r.status !== 'completed').length;

    if (els.kpiOpen) els.kpiOpen.textContent = String(openCount);
    if (els.kpiCritical) els.kpiCritical.textContent = String(critical);
}

function renderDetail(req) {
    const box = els.requestDetail;
    const actions = els.requestActions;
    if (!box) return;

    if (!req || req.status === 'completed') {
        box.innerHTML = '<p class="text-slate-400 text-sm">Listeden açık bir talep seçin.</p>';
        if (actions) actions.innerHTML = '';
        return;
    }

    const noteText = req.aiNote || req.explanation;
    const note = noteText ? `<p class="text-slate-400 text-xs mt-2 leading-relaxed border-t border-slate-700/50 pt-2">${escapeHtml(noteText)}</p>` : '';

    box.innerHTML = `
    <div class="space-y-4 text-sm flex flex-col">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="badge ${tierClass(req.priorityTier)}">${tierLabel(req.priorityTier)}</span>
      </div>
      
      <div>
          <p class="text-slate-100 font-semibold leading-relaxed text-base">${escapeHtml(req.summary)}</p>
          <p class="text-slate-400 text-xs mt-2 italic">${escapeHtml(getListExplanation(req))}</p>
          
          <div class="grid grid-cols-2 gap-3 mt-4 bg-slate-800/30 p-3 rounded-lg border border-white/5">
            <div>
                <p class="text-[10px] text-slate-500 uppercase font-bold">İhtiyaç Türü</p>
                <p class="text-slate-200 font-medium">${escapeHtml(typeLabel(req.type))}</p>
            </div>
            <div>
                <p class="text-[10px] text-slate-500 uppercase font-bold">Öncelik Skoru</p>
                <p class="text-cyan-400 font-bold text-lg">${req.priorityScore ?? '—'}</p>
            </div>
          </div>
          ${note}
      </div>
    </div>
  `;

    if (actions) {
        actions.innerHTML = `
          <button onclick="handleSendToLogistics('${req.id}')" 
                  class="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-[15px] sm:text-lg py-5 rounded-xl transition-all transform active:scale-95 shadow-xl shadow-cyan-900/50 flex items-center justify-center gap-3">
            <span class="text-2xl">🚛</span> Seçili Vakayı Operasyon Hattına Aktar
          </button>
      `;
    }
}

function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s ?? '';
    return d.innerHTML;
}

function renderList() {
    const list = els.requestList;
    if (!list) return;
    const filtered = sortByPriority(requests.filter((r) => r.city === selectedCity));

    list.innerHTML = '';
    if (filtered.length === 0) {
        list.innerHTML = '<li class="px-4 py-8 text-center text-slate-500 text-sm">Bu şehir için henüz kayıt yok.</li>';
        selectedId = null;
        renderDetail(null);
        updateKpis();
        return;
    }

    const openRequests = filtered.filter(r => r.status !== 'completed');
    if (!selectedId || !openRequests.some((r) => r.id === selectedId)) {
        selectedId = openRequests.length > 0 ? openRequests[0].id : null;
    }
    const active = filtered.find((r) => r.id === selectedId) ?? null;

    filtered.forEach((req) => {
        const isSelected = req.id === active?.id;
        const isCompleted = req.status === 'completed';

        const li = document.createElement('li');
        li.className = `request-row px-4 py-3 border-b border-slate-700/40 transition-all ${isSelected ? 'bg-cyan-500/10 border-l-4 border-l-cyan-500' : ''} ${isCompleted ? 'opacity-50' : 'hover:bg-slate-800/40'}`;

        li.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <p class="text-slate-100 text-sm font-medium">${escapeHtml(req.summary.slice(0, 80))}${req.summary.length > 80 ? '...' : ''}</p>
          <div class="flex items-center gap-2 mt-2">
             <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">${escapeHtml(typeLabel(req.type))}</span>
          </div>
        </div>
        <div class="shrink-0 flex flex-col items-end gap-2">
          ${isCompleted
                ? `<span class="text-[10px] text-emerald-400 font-bold px-2 py-1 bg-emerald-500/10 rounded border border-emerald-500/20">Tamamlandı ✅</span>`
                : `<div class="flex items-center gap-3">
                   <div class="text-right">
                     <span class="block text-[8px] text-slate-500 uppercase font-bold mb-0.5">Skor</span>
                     <span class="badge ${tierClass(req.priorityTier)}">${req.priorityScore ?? '—'}</span>
                   </div>
                   <button class="${isSelected ? 'bg-slate-700/80 text-cyan-400 cursor-default ring-1 ring-cyan-500/40' : 'bg-cyan-600/90 hover:bg-cyan-400 text-white shadow-sm'} text-[11px] font-bold py-1.5 px-3 rounded transition-colors" ${isSelected ? 'disabled' : ''} onclick="handleSelect('${req.id}')">${isSelected ? 'Seçildi' : 'Seç'}</button>
                 </div>`
            }
        </div>
      </div>
    `;
        list.appendChild(li);
    });

    renderDetail(active);
    updateKpis();
}

function bindTabs() {
    els.tabButtons().forEach((btn) => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-tab');
            switchTab(id);
        });
    });
}

function bindCity() {
    const input = els.citySelect;
    if (!input) return;
    input.addEventListener('change', () => {
        const val = input.value;
        const match = val.match(/-\s*(.+)/);
        const newCity = match ? match[1].trim() : val.trim();
        if (newCity && newCity !== selectedCity) {
            selectedCity = newCity;
            selectedId = null;
            updateCityHint();
            renderList();
            showToast(`Bölge: ${selectedCity}`);
        }
    });
}

function bindManualForm() {
    const form = els.manualForm;
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const summary = els.manualSummary?.value.trim() ?? '';
        if (summary.length < 8) {
            showToast('Talep özeti en az 8 karakter olmalı.');
            return;
        }
        const btn = els.manualSubmit;
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'AI analiz ediyor…';
        }
        try {
            const ai = await analyzeIncomingRequest(summary, selectedCity);
            const req = {
                id: newManualRequestId(),
                city: selectedCity,
                type: ai.type,
                summary,
                status: 'open',
                priorityScore: ai.priorityScore,
                priorityTier: ai.priorityTier,
                aiNote: ai.aiNote || '',
                explanation: ai.aiNote || summary,
            };
            requests.push(req);
            selectedId = req.id;
            form.reset();
            renderList();
            showToast(`AI Analiz Tamamlandı: ${ai.priorityTier.toUpperCase()}`);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Talebi AI ile analiz et ve ekle';
            }
        }
    });
}

function bindSync() {
    function getRandomItems(arr) {
        const count = Math.floor(Math.random() * 3) + 1; // 1, 2 veya 3
        return [...arr].sort(() => 0.5 - Math.random()).slice(0, count);
    }

    els.syncInternet?.addEventListener('click', async () => {
        const btn = els.syncInternet;
        if (!btn || btn.disabled) return;

        const originalText = btn.innerHTML;
        btn.innerHTML = `<span aria-hidden="true" class="animate-spin inline-block">🔄</span> İnternet uydu ağına bağlanılıyor...`;
        btn.disabled = true;

        await new Promise(r => setTimeout(r, 1200));

        try {
            const snap = await fetchInternetSnapshot({ city: selectedCity });
            const items = getRandomItems(snap.requests);
            const clonedItems = items.map(r => ({ ...r }));
            clonedItems.forEach(r => {
                const randStr = Math.random().toString(36).substr(2, 4);
                r.city = selectedCity;
                // Mock verideki Hatay/Antakya/İstanbul gibi isimleri seçili şehre uyarla
                const cityRegex = /Hatay|Antakya|İskenderun|İstanbul/gi;
                r.summary = r.summary.replace(cityRegex, selectedCity);
                r.explanation = r.explanation.replace(cityRegex, selectedCity);
                r.id = `req-${Date.now().toString(36)}-${randStr}-${selectedCity.substring(0, 3).toLowerCase()}`;
                r.status = 'open';
            });
            mergeRequests(clonedItems);
            renderList();
            showToast(`${selectedCity} için internet verileri çekildi (+${clonedItems.length} talep)`);

            // Tek kullanımlık hale getir (diğer sekmeye gidene kadar)
            btn.classList.add('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
        } catch (e) {
            btn.disabled = false;
            showToast('Hata oluştu.');
        } finally {
            btn.innerHTML = originalText;
        }
    });

    els.syncMesh?.addEventListener('click', async () => {
        const btn = els.syncMesh;
        if (!btn || btn.disabled) return;

        const originalText = btn.innerHTML;
        btn.innerHTML = `<span aria-hidden="true" class="animate-pulse inline-block">📡</span> Saha Mesh düğümleri taranıyor...`;
        btn.disabled = true;

        await new Promise(r => setTimeout(r, 1500));

        try {
            const snap = await fetchMeshSnapshot({ city: selectedCity });
            const items = getRandomItems(snap.requests);
            const clonedItems = items.map(r => ({ ...r }));
            clonedItems.forEach(r => {
                const randStr = Math.random().toString(36).substr(2, 4);
                r.city = selectedCity;
                // Mock verideki Hatay/Antakya/İstanbul gibi isimleri seçili şehre uyarla
                const cityRegex = /Hatay|Antakya|İskenderun|İstanbul/gi;
                r.summary = r.summary.replace(cityRegex, selectedCity);
                r.explanation = r.explanation.replace(cityRegex, selectedCity);
                r.id = `mesh-${Date.now().toString(36)}-${randStr}-${selectedCity.substring(0, 3).toLowerCase()}`;
                r.status = 'open';
            });
            mergeRequests(clonedItems);
            renderList();
            showToast(`${selectedCity} için mesh verileri senkronize edildi (+${clonedItems.length} talep)`);

            btn.classList.add('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
        } catch (e) {
            btn.disabled = false;
            showToast('Hata oluştu.');
        } finally {
            btn.innerHTML = originalText;
        }
    });
}


/**
 * Mantıklı tır sayısı hesaplar.
 * Faktörler: açık yol sayısı, BFS mesafesi, vakanın aciliyeti.
 * Sonuç 3-15 arasında kısıtlanır.
 */
function calculateRequiredTrucks() {
    // Faktör 1: Açık kenar (yol) sayısı → daha fazla açık yol = daha fazla tır gerekli
    const openEdgeCount = C_EDGES.filter(e => {
        const ek1 = `${e.from}-${e.to}`, ek2 = `${e.to}-${e.from}`;
        return !closedEdges.has(ek1) && !closedEdges.has(ek2)
            && !closedNodes.has(e.from) && !closedNodes.has(e.to);
    }).length;
    const routeBonus = Math.round(openEdgeCount * 1.2); // max ~10 for 8 open edges

    // Faktör 2: BFS ile ana rotanın uzunluğu (hops)
    const mainPath = bfsPath('n1', 'n6', 'supply');
    const hopCount = mainPath ? mainPath.length - 1 : 3;
    const distanceBonus = Math.min(hopCount * 2, 6); // max 6

    // Faktör 3: Vakanın öncelik derecesi (aciliyeti)
    const tier = (window.selectedCaseObj || {}).priorityTier || 'medium';
    const urgencyBonus = tier === 'critical' ? 6 : tier === 'low' ? 0 : 3;

    const total = routeBonus + distanceBonus + urgencyBonus;
    return Math.max(3, Math.min(15, total));
}

function updateSimUI() {
    if (!window.selectedCaseObj) return;
    const uiCity = (window.selectedCaseObj.city || 'Bölge').toUpperCase();

    const cityTitle = document.getElementById('tab2-city-title');
    if (cityTitle) cityTitle.textContent = `${uiCity} ACİL OPERASYONU`;

    const canvasTitle = document.getElementById('tab2-canvas-title');
    if (canvasTitle) canvasTitle.innerHTML = `${uiCity} <span class="text-slate-500">/ KRİZ SİMÜLASYONU</span>`;

    const caseSubtitle = document.getElementById('tab2-case-subtitle');
    if (caseSubtitle) caseSubtitle.textContent = `HEDEF VAKA: ${window.selectedCaseObj.explanation || 'Acil alan yardımı'}`;

    dynamicStreets = getDynamicStreets(uiCity);

    simTruckTotal = calculateRequiredTrucks();
    const countEl = document.getElementById('suggested-truck-count');
    if (countEl) countEl.textContent = simTruckTotal;

    const timeEl = document.getElementById('time-saved-text');
    if (timeEl) timeEl.textContent = '0s 0dk 0sn';

    const listEl = document.getElementById('route-panel-list');
    if (listEl) listEl.innerHTML = `<div class="h-full flex items-center justify-center text-slate-500 italic text-sm mt-8">Sevkiyat bekleniyor...</div>`;

    const btnApprove = document.getElementById('btn-approve-trucks');
    if (btnApprove) {
        btnApprove.textContent = 'ONAYLA';
        btnApprove.classList.remove('bg-emerald-600', 'cursor-not-allowed', 'opacity-50');
        btnApprove.classList.add('bg-emerald-500');
        btnApprove.disabled = false;
    }

    const btnCustom = document.getElementById('btn-custom-trucks');
    if (btnCustom) {
        btnCustom.innerHTML = 'SAYI GİR';
    }

    const btnStart = document.getElementById('btn-start-sim');
    if (btnStart) {
        btnStart.className = 'bg-blue-600/50 hover:bg-blue-600 text-white text-sm font-bold py-2 px-5 rounded-lg flex items-center justify-center gap-2 transition-all opacity-40 cursor-not-allowed';
        btnStart.innerHTML = '▶ SEVKİYATI BAŞLAT';
        btnStart.disabled = true;
    }

    const statText = document.getElementById('system-status-text');
    if (statText) statText.textContent = 'Onay Bekleniyor...';

    const statDot = document.getElementById('status-dot');
    if (statDot) statDot.className = 'w-3 h-3 rounded-full bg-slate-500 ml-6';

    const aiBadge = document.getElementById('ai-opt-badge');
    if (aiBadge) {
        aiBadge.style.display = 'none';
    }

    const rev = document.getElementById('btn-revert-approve');
    if (rev) rev.remove();
    const modal = document.getElementById('ai-report-modal');
    if (modal) modal.classList.add('hidden');
}

function bindSimControls() {
    const btnApprove = document.getElementById('btn-approve-trucks');
    const btnStart = document.getElementById('btn-start-sim');
    const btnCustom = document.getElementById('btn-custom-trucks');
    const btnReport = document.getElementById('btn-strategic-report');

    function openReportModal() {
        let modal = document.getElementById('ai-report-modal');
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.id = 'ai-report-modal';
        modal.className = 'fixed inset-0 z-[100] flex items-start justify-center bg-black/90 overflow-y-auto py-10 custom-scrollbar';

        const isAI = window.isAIOptimized;
        const aiColor = isAI ? 'emerald' : 'red';
        const aiStatusText = isAI ? '✅ OPTİMİZASYON AKTİF' : '⚠️ KRİTİK DARBOĞAZ';

        const trafficHtml = isAI
            ? `<p class="text-white text-xl font-bold">%35 Akıcı <span class="text-emerald-500 text-sm ml-2 font-normal">▼ Gecikme yok</span></p>
               <p class="text-slate-400 mt-2 text-xs">Konvoy tamamen yeşil yollara yönlendirildi.</p>`
            : `<p class="text-white text-xl font-bold">%120 Darboğaz <span class="text-red-500 text-sm ml-2 font-normal">▲ 45 dk gecikme</span></p>
               <p class="text-slate-400 mt-2 text-xs">Tüm yük ana artere binmiş durumda.</p>`;

        const adviceHtml = isAI
            ? `<li>Saha ekiplerinin alternatif güzergahlarda aldığı önlemler sonuç verdi.</li>
               <li>Tahmini varış süresi (ETA) başlangıç planına göre <strong>Kısaldı</strong>.</li>
               <li class="text-emerald-400 font-bold mt-2 inline-block text-lg">Toplam süre kazancı: 2 Saat 15 Dakika.</li>`
            : `<li>Ana yollardaki kilitlenmeyi aşmak için sevkiyatın tali yollara kaydırılması ŞİDDETLE tavsiye edilmektedir.</li>
               <li>Bekleme süresi her geçen dakika katlanarak artmaktadır.</li>
               <li class="text-red-400 font-bold mt-2 inline-block text-lg">AI Optimizasyonu KAPALI. Manuel müdahale gerekiyor!</li>`;

        modal.innerHTML = `
            <div class="bg-slate-900 border border-slate-700/50 rounded-3xl w-[95%] sm:w-full max-w-4xl flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)] relative border-t-8 border-t-${aiColor}-600 transform transition-all mb-10">
                <div class="flex flex-col flex-shrink-0">
                    <div class="px-6 py-5 flex justify-between items-center border-b border-slate-700/50 bg-slate-800">
                        <h2 class="text-xl font-black text-white flex items-center gap-3 tracking-widest uppercase"><span class="text-blue-400 text-2xl">✨</span> STRATEJİK ANALİZ RAPORU</h2>
                        <button id="close-report-modal" class="text-slate-400 hover:text-white text-3xl leading-none transition-colors border-none bg-transparent cursor-pointer">&times;</button>
                    </div>
                    <div class="px-6 py-6 bg-slate-900 border-b border-slate-800">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="bg-slate-800 p-5 border border-slate-700 rounded-2xl">
                               <p class="font-bold text-slate-500 mb-3 text-[11px] uppercase tracking-wider">🚥 Trafik Analizi</p>
                               ${trafficHtml}
                            </div>
                            <div class="bg-slate-800 p-5 border border-slate-700 rounded-2xl">
                               <p class="font-bold text-slate-500 mb-3 text-[11px] uppercase tracking-wider">🚛 Kurtarma Kapasitesi</p>
                               <p class="text-white text-2xl font-black" id="report-truck-text">-- Tır Yolda</p>
                               <p class="text-slate-500 mt-2 text-xs">Aktif operasyonel güç.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="p-8 text-slate-300 text-sm space-y-8 bg-slate-900">
                    <div class="bg-blue-900/20 border border-blue-500/30 p-6 rounded-2xl">
                       <p class="font-bold text-blue-400 uppercase tracking-wide text-xs mb-4">Durum Özeti</p>
                       <p id="report-summary-text" class="text-lg text-slate-200 leading-relaxed font-semibold">Gemini AI tarafından hesaplanan güncel kriz senaryosu verileri.</p>
                    </div>
                    
                    <div class="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                       <p class="font-bold text-cyan-400 text-base mb-4 flex items-center gap-2">🧠 AI Optimizasyon Tavsiyeleri</p>
                       <ul class="list-disc pl-5 space-y-4 text-slate-300 text-base leading-relaxed">
                           ${adviceHtml}
                       </ul>
                    </div>
                </div>
                <div class="p-5 bg-slate-800/80 flex justify-end items-center border-t border-slate-700/50">
                   <p class="text-[10px] text-slate-500 mr-auto flex items-center gap-2 hidden sm:flex"><span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> Veriler anlık işlenmiştir.</p>
                   <button id="close-report-btn" class="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-lg transition-transform active:scale-95 shadow-lg border border-slate-600">KAPAT</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('close-report-modal').addEventListener('click', () => modal.classList.add('hidden'));
        document.getElementById('close-report-btn').addEventListener('click', () => modal.classList.add('hidden'));

        const summary = document.getElementById('report-summary-text');
        if (summary && window.selectedCaseObj) {
            summary.innerHTML = `<strong>${window.selectedCaseObj.city}</strong> bölgesinde belirtilen <em>"${window.selectedCaseObj.explanation}"</em> sebebiyle acil müdahale kapsamında <strong>${simTruckTotal} TIR</strong> sahaya indirilmiştir.`;
        }
        const rtt = document.getElementById('report-truck-text');
        if (rtt) rtt.innerHTML = `${simTruckTotal} Tır <span class="text-blue-400 text-sm ml-2 font-normal">Aktif Görevde</span>`;

        modal.classList.remove('hidden');
    }

    btnReport?.addEventListener('click', () => {
        showToast("📄 Stratejik Analiz Raporu oluşturuluyor... (Gemini)", 2000);
        setTimeout(() => {
            showToast("✅ Rapor Hazır! Kilitlenme rotaları analiz edildi.");
            openReportModal();
        }, 1500);
    });

    btnApprove?.addEventListener('click', () => {
        if (simState !== 'idle') return;
        simState = 'approved';

        btnStart.className = 'bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-3 px-5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20';
        btnStart.innerHTML = '▶ SEVKİYATI BAŞLAT';
        btnStart.disabled = false;

        btnApprove.textContent = 'ONAYLANDI ✓';
        btnApprove.classList.replace('bg-emerald-500', 'bg-emerald-600');
        btnApprove.disabled = true;

        // "Sayı Gir" butonunu DEĞİŞTİR butonuna çevir
        btnCustom.innerHTML = 'DEĞİŞTİR 🔄';

        document.getElementById('system-status-text').textContent = 'Motor emir bekliyor...';
        document.getElementById('status-dot').className = 'w-3 h-3 rounded-full bg-amber-500 animate-pulse ml-6';
    });

    btnCustom?.addEventListener('click', () => {
        if (simState === 'running') {
            showToast("Devam eden bir operasyon için tır sayısı değiştirilemez!");
            return;
        }

        if (simState === 'approved') {
            simState = 'idle';
            btnApprove.textContent = 'ONAYLA';
            btnApprove.classList.replace('bg-emerald-600', 'bg-emerald-500');
            btnApprove.disabled = false;

            btnStart.className = 'bg-blue-600/50 hover:bg-blue-600 text-white text-sm font-bold py-2 px-5 rounded-lg flex items-center justify-center gap-2 transition-all opacity-40 cursor-not-allowed';
            btnStart.innerHTML = '▶ SEVKİYATI BAŞLAT';
            btnStart.disabled = true;

            btnCustom.innerHTML = 'SAYI GİR';

            document.getElementById('system-status-text').textContent = 'Onay Bekleniyor...';
            document.getElementById('status-dot').className = 'w-3 h-3 rounded-full bg-slate-500 ml-6';
            return;
        }

        // Idle Durumunda "Sayı Gir" Inline Input'u
        const countEl = document.getElementById('suggested-truck-count');
        if (countEl.innerHTML.includes('<input')) return;

        countEl.innerHTML = `<input type="number" id="inline-truck-input" value="${simTruckTotal}" class="w-full max-w-[150px] mx-auto bg-slate-800 text-center text-white border-2 border-emerald-500 rounded-xl focus:outline-none focus:ring focus:ring-emerald-500 text-6xl py-2 shadow-[0_0_15px_#10b981]" min="1" max="999">`;
        const inputEl = document.getElementById('inline-truck-input');
        inputEl.focus();
        inputEl.select();

        const saveVal = () => {
            const val = parseInt(inputEl.value);
            if (!isNaN(val) && val > 0) {
                simTruckTotal = val;
            }
            countEl.innerHTML = simTruckTotal;
            showToast(`Gönderilecek tır sayısı ${simTruckTotal} olarak ayarlandı.`);
        };

        inputEl.addEventListener('blur', saveVal);
        inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') inputEl.blur();
        });
    });

    btnStart?.addEventListener('click', () => {
        if (simState === 'approved') {
            simState = 'running';
            window.isAIOptimized = false;

            btnStart.className = 'bg-red-500 hover:bg-red-400 text-white text-lg font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-500/20 active:scale-95';
            btnStart.innerHTML = '<span class="text-xl">⚠️</span> AI OPTİMİZASYONU: KAPALI';
            btnStart.disabled = false;

            // Değiştir butonunu da kitle
            btnCustom.classList.add('opacity-50', 'cursor-not-allowed');

            let spawned = 0;
            routeInterval = setInterval(() => {
                if (spawned >= simTruckTotal) { clearInterval(routeInterval); return; }
                spawnTruck();
                spawned++;
            }, 2300);

            // 2 ambulans: 1 hemen, 1 biraz sonra
            _ambulanceSpawned = 0;
            spawnAmbulance();
            setTimeout(() => { if (simState === 'running') spawnAmbulance(); }, 5000);
            renderActiveRoutes();

        } else if (simState === 'running') {
            window.isAIOptimized = !window.isAIOptimized;
            if (window.isAIOptimized) {
                btnStart.className = 'bg-emerald-500 hover:bg-emerald-400 text-white text-lg font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95';
                btnStart.innerHTML = '<span class="text-xl">✅</span> AI OPTİMİZASYONU: AÇIK';
            } else {
                btnStart.className = 'bg-red-500 hover:bg-red-400 text-white text-lg font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-500/20 active:scale-95';
                btnStart.innerHTML = '<span class="text-xl">⚠️</span> AI OPTİMİZASYONU: KAPALI';
            }
            renderActiveRoutes();

            // AI toggle: Supply tırlarını komple temizle, tam simTruckTotal adet yenisini kademeli üret
            trucks = trucks.filter(t => t.vtype !== 'supply');
            if (routeInterval) clearInterval(routeInterval);
            let aiSpawned = 0;
            routeInterval = setInterval(() => {
                if (aiSpawned >= simTruckTotal) { clearInterval(routeInterval); return; }
                const route = window.isAIOptimized
                    ? AI_ROUTES[aiSpawned % AI_ROUTES.length]
                    : { start: 'n1', end: 'n6', fallback: ['n1', 'n2', 'n6'] };
                const chosenPath = bfsPath(route.start, route.end, 'supply') || route.fallback;
                trucks.push({
                    x: C_NODES[route.start].x, y: C_NODES[route.start].y,
                    path: chosenPath, pathIndex: 0, reached: false,
                    vtype: 'supply', _ox: 0, _oy: 0, clearing: false, clearTimer: 0, waitingForRoad: false
                });
                aiSpawned++;
            }, window.isAIOptimized ? 800 : 2300);
        }
    });
}

function renderActiveRoutes() {
    const pList = document.getElementById('route-panel-list');
    if (!pList) return;
    if (simState !== 'running') {
        pList.innerHTML = `<div class="h-full flex items-center justify-center text-slate-500 italic text-sm mt-8">Sevkiyat bekleniyor...</div>`;
        return;
    }

    if (window.isAIOptimized) {
        pList.innerHTML = `
            <li class="flex justify-between border-b border-slate-700/40 pb-3">
              <span class="text-slate-400 font-bold">${dynamicStreets[1] || 'Ana Yol'}</span>
              <span class="text-amber-400 font-bold text-[10px] bg-amber-400/10 px-2 py-1 rounded border border-amber-400/20">Rahatlıyor</span>
            </li>
            <li class="flex justify-between border-b border-slate-700/40 pb-3">
              <span class="text-emerald-400 font-bold">${dynamicStreets[0] || 'Otoyol'}</span>
              <span class="text-emerald-400 font-bold text-[10px] bg-emerald-400/10 px-2 py-1 rounded border border-emerald-400/20">Açık</span>
            </li>
            <li class="flex justify-between pb-3">
              <span class="text-emerald-400 font-bold">${dynamicStreets[4] || 'Tali Yol'}</span>
              <span class="text-emerald-400 font-bold text-[10px] bg-emerald-400/10 px-2 py-1 rounded border border-emerald-400/20">Açık</span>
            </li>
        `;
    } else {
        pList.innerHTML = `
            <li class="flex justify-between border-b border-red-900/40 pb-3">
              <span class="text-red-400 font-bold">${dynamicStreets[1] || 'Ana Yol'}</span>
              <span class="text-red-500 font-bold text-[10px] bg-red-500/10 px-2 py-1 rounded border border-red-500/20 animate-pulse">DARBOĞAZ</span>
            </li>
            <li class="flex justify-between border-b border-slate-700/40 pb-3">
              <span class="text-slate-500">${dynamicStreets[0] || 'Otoyol'}</span>
              <span class="text-slate-600 text-[10px]">Pasif</span>
            </li>
            <li class="flex justify-between pb-3">
              <span class="text-slate-500">${dynamicStreets[4] || 'Tali Yol'}</span>
              <span class="text-slate-600 text-[10px]">Pasif</span>
            </li>
        `;
    }
}

const C_NODES = {
    n1: { x: 100, y: 150 }, n2: { x: 350, y: 250 }, n3: { x: 550, y: 100 }, n4: { x: 650, y: 200 }, n5: { x: 150, y: 350 }, n6: { x: 650, y: 350 }
};
const C_EDGES = [
    { from: 'n1', to: 'n3', streetIdx: 0, type: 'tali' }, { from: 'n1', to: 'n2', streetIdx: 1, type: 'ana' }, { from: 'n2', to: 'n3', streetIdx: 2, type: 'ana' },
    { from: 'n3', to: 'n4', streetIdx: 3, type: 'tali' }, { from: 'n2', to: 'n6', streetIdx: 4, type: 'ana' }, { from: 'n5', to: 'n2', streetIdx: 5, type: 'tali' },
    { from: 'n5', to: 'n6', streetIdx: 6, type: 'tali' }, { from: 'n1', to: 'n5', streetIdx: 7, type: 'tali' }
];

let _spawnToggle = 0;
const AI_ROUTES = [
    { start: 'n1', end: 'n4', fallback: ['n1', 'n3', 'n4'] },
    { start: 'n5', end: 'n6', fallback: ['n5', 'n6'] },
    { start: 'n1', end: 'n6', fallback: ['n1', 'n2', 'n6'] },
];
function spawnTruck() {
    // Sadece mavi (supply) tır spawn eder — ambulanslar ayrı spawnlanır
    let chosenPath, startNode;
    if (!window.isAIOptimized) {
        chosenPath = bfsPath('n1', 'n6', 'supply') || ['n1', 'n2', 'n6'];
        startNode = 'n1';
    } else {
        const route = AI_ROUTES[_spawnToggle % AI_ROUTES.length];
        _spawnToggle++;
        chosenPath = bfsPath(route.start, route.end, 'supply') || route.fallback;
        startNode = route.start;
    }
    trucks.push({
        x: C_NODES[startNode].x, y: C_NODES[startNode].y,
        path: chosenPath, pathIndex: 0, reached: false,
        vtype: 'supply', _ox: 0, _oy: 0, clearing: false, clearTimer: 0, waitingForRoad: false
    });
}

let _ambulanceSpawned = 0;
function spawnAmbulance() {
    // Ambulanslar tır sayısından bağımsız — max 2 tane
    if (_ambulanceSpawned >= 2) return;
    _ambulanceSpawned++;
    const path = bfsPath('n1', 'n6', 'ambulance') || ['n1', 'n2', 'n6'];
    trucks.push({
        x: C_NODES['n1'].x, y: C_NODES['n1'].y,
        path, pathIndex: 0, reached: false,
        vtype: 'ambulance', _ox: 0, _oy: 0, clearing: false, clearTimer: 0, waitingForRoad: false
    });
}

window.spawnCraneToTarget = function(hitX, hitY, targetNode, targetEdgeObj) {
    let cranePath = bfsPath('n1', targetNode, 'crane'); 
    if (!cranePath) cranePath = ['n1', targetNode]; 
    
    const tempNodeId = '!craneTemp_' + Math.random().toString(36).substr(2, 6);
    C_NODES[tempNodeId] = { x: hitX, y: hitY };
    cranePath.push(tempNodeId);
    
    trucks.push({
        x: C_NODES['n1'].x, 
        y: C_NODES['n1'].y,
        path: cranePath, 
        pathIndex: 0, 
        reached: false,
        vtype: 'crane', 
        _ox: 0, _oy: 0, 
        clearing: false, 
        clearTimer: 0, 
        waitingForRoad: false,
        targetNodeToClear: targetNode,
        targetEdgeToClear: targetEdgeObj,
        tempNodeId: tempNodeId
    });
}

function drawRouteCanvas() {
    const c = document.getElementById('route-canvas');
    if (!c) return;
    const ctx = c.getContext('2d');

    function resize() {
        if (c.parentElement && c.parentElement.clientWidth > 0) {
            c.width = c.parentElement.clientWidth;
            c.height = c.parentElement.clientHeight || 400;
        }
    }
    window.addEventListener('resize', resize);
    resize();

    function render() {
        if (c.width < 10 || c.height < 10) { resize(); requestAnimationFrame(render); return; }
        const w = c.width;
        const h = c.height;
        ctx.clearRect(0, 0, w, h);

        const scaleX = w / 800;
        const scaleY = h / 450;

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

            const mx = (p1.x + p2.x) / 2 * scaleX;
            const my = (p1.y + p2.y) / 2 * scaleY - 10;
            ctx.fillStyle = '#64748b';
            ctx.font = '10px "DM Sans", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(dynamicStreets[e.streetIdx] || '', mx, my);
        });

        Object.entries(C_NODES).forEach(([nid, n]) => {
            if (nid.startsWith('!')) return;
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(n.x * scaleX, n.y * scaleY, 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = '#0f172a';
            ctx.fill();
        });

        // -- KAPATILMIŞ KENARLARI ÇİZ --
        closedEdges.forEach(ek => {
            const parts = ek.split('-'); const p1 = C_NODES[parts[0]], p2 = C_NODES[parts[1]];
            if (!p1 || !p2) return;
            const mx = (p1.x + p2.x) / 2 * scaleX, my = (p1.y + p2.y) / 2 * scaleY;
            ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(mx - 12, my - 12); ctx.lineTo(mx + 12, my + 12); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(mx + 12, my - 12); ctx.lineTo(mx - 12, my + 12); ctx.stroke();
        });
        // -- KAPATILMIŞ DÜĞÜMLERİ ÇİZ --
        closedNodes.forEach(nid => {
            const n = C_NODES[nid]; if (!n) return;
            const nx = n.x * scaleX, ny = n.y * scaleY;
            ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(nx - 14, ny - 14); ctx.lineTo(nx + 14, ny + 14); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(nx + 14, ny - 14); ctx.lineTo(nx - 14, ny + 14); ctx.stroke();
        });

        // -- HAVA DURUMU PARÇACIKLARı --
        if (window.badWeather) {
            if (weatherParticles.length < 90) {
                weatherParticles.push({ x: Math.random() * 800, y: 0, vy: 1.2 + Math.random() * 1.5, vx: (Math.random() - 0.5) * 0.4 });
            }
            weatherParticles.forEach(p => {
                ctx.fillStyle = 'rgba(147,210,255,0.55)';
                ctx.fillRect(p.x * scaleX, p.y * scaleY, 1.5, 5);
                p.x += p.vx; p.y += p.vy;
            });
            weatherParticles = weatherParticles.filter(p => p.y < 450);
        }

        // -- ARAÇ RENDER + HAREKET --
        const VTYPE_COLOR = { supply: '#3b82f6', ambulance: '#ef4444', crane: '#fbbf24' };
        const weatherMult = window.badWeather ? 0.7 : 1.0;

        trucks.forEach(t => {
            // Hedefe ulaşınca doğru rotayla başa dön
            if (t.reached) {
                // Vinç: kapalı düğümü temizle
                if (t.vtype === 'crane') {
                    if (!t.clearing) {
                        t.clearing = true;
                        t.clearTimer = Date.now() + 3000;
                    } else if (Date.now() >= t.clearTimer) {
                        if (t.targetNodeToClear && closedNodes.has(t.targetNodeToClear)) {
                            closedNodes.delete(t.targetNodeToClear);
                        }
                        if (t.targetEdgeToClear) {
                            closedEdges.delete(t.targetEdgeToClear);
                            const parts = t.targetEdgeToClear.split('-');
                            closedEdges.delete(parts[1] + '-' + parts[0]);
                        }
                        if (t.tempNodeId) delete C_NODES[t.tempNodeId];
                        t.toBeRemoved = true;
                        trucks.forEach(tr => tr.waitingForRoad = false);
                    }
                    
                    const color = '#fbbf24';
                    ctx.save();
                    ctx.shadowBlur = 12; ctx.shadowColor = color; ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(t.x * scaleX, t.y * scaleY, 6, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                    return; // Vincin çalışırken ekranda kalması için çizip çıkıyoruz
                }

                if (t.vtype !== 'crane') {
                    // Hedefe varan tır/ambulans silinir, yeniden çıkmaz
                    t.toBeRemoved = true;
                    return;
                }
            }

            // -- HAREKET --
            const drawTruck = () => {
                const color = VTYPE_COLOR[t.vtype] || '#3b82f6';
                ctx.save();
                ctx.shadowBlur = 12; ctx.shadowColor = color; ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(t.x * scaleX, t.y * scaleY, t.vtype === 'crane' ? 6 : (t.vtype === 'ambulance' ? 5 : 4), 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            };

            if (t.waitingForRoad) {
                drawTruck();
                const currNode = t.path[t.pathIndex];
                const nextNode = t.path[t.pathIndex + 1];
                if (currNode && nextNode && currNode !== "!temp") {
                    const ek1 = `${currNode}-${nextNode}`, ek2 = `${nextNode}-${currNode}`;
                    if (!closedEdges.has(ek1) && !closedEdges.has(ek2) && !closedNodes.has(nextNode)) {
                        t.waitingForRoad = false; // Road opened!
                    }
                }
                if (t.waitingForRoad) return; // Skip moving
            }

            const pn = C_NODES[t.path[t.pathIndex + 1]];
            if (pn) {
                let targetX = pn.x;
                let targetY = pn.y;
                let isBlockedEdge = false;

                if (t.vtype !== 'crane') {
                    const currNode = t.path[t.pathIndex];
                    if (currNode && currNode !== "!temp") {
                        const nextNodeId = t.path[t.pathIndex + 1];
                        const ek1 = `${currNode}-${nextNodeId}`, ek2 = `${nextNodeId}-${currNode}`;
                        const nStart = C_NODES[currNode];

                        // Aracın GECİKTİĞİ segmentlerde enkaz var mı diye bak (sadece İLERLEDİĞİ kısımlar)
                        // pathIndex öncesindeki kapanmalar aracı durdurmamalı
                        if (closedNodes.has(nextNodeId)) {
                            isBlockedEdge = true;
                            targetX = nStart.x + (pn.x - nStart.x) * 0.85;
                            targetY = nStart.y + (pn.y - nStart.y) * 0.85;
                        } else if (closedEdges.has(ek1) || closedEdges.has(ek2)) {
                            isBlockedEdge = true;
                            targetX = nStart.x + (pn.x - nStart.x) * 0.45;
                            targetY = nStart.y + (pn.y - nStart.y) * 0.45;
                        }
                    }
                }

                const dx = targetX - t.x; const dy = targetY - t.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Reached our target precisely or overshot
                if (dist < 1 && isBlockedEdge) {
                    t.waitingForRoad = true;
                    drawTruck();
                    return;
                }

                let baseSpeed = window.isAIOptimized ? 0.40 : 0.06;
                if (t.vtype === 'ambulance') baseSpeed *= 2.0;
                if (t.vtype === 'crane') baseSpeed *= 1.5;
                const speed = baseSpeed * weatherMult;

                if (dist > speed) {
                    t.x += (dx / dist) * speed; t.y += (dy / dist) * speed;
                } else {
                    t.x = targetX; t.y = targetY;
                    if (isBlockedEdge) {
                        t.waitingForRoad = true;
                        drawTruck();
                        return;
                    }

                    t.pathIndex++;
                    if (t.pathIndex >= t.path.length - 1) t.reached = true;
                }
            } else { t.reached = true; }

            drawTruck();
        });
        trucks = trucks.filter(t => !t.toBeRemoved);
        requestAnimationFrame(render);
    }

    // Canvas tiklama: yol/dugum kapatma
    if (!_canvasListenerAdded) {
        _canvasListenerAdded = true;
        c.addEventListener('click', function (e) {
            if (simState !== 'running') return;
            const rect = c.getBoundingClientRect();
            const lx = (e.clientX - rect.left) / (c.width / 800);
            const ly = (e.clientY - rect.top) / (c.height / 450);
            let hit = false;
            // Dugum kontrolu
            for (const [nid, n] of Object.entries(C_NODES)) {
                if (Math.hypot(n.x - lx, n.y - ly) < 15) {
                    if (closedNodes.has(nid)) {
                        closedNodes.delete(nid); 
                        trucks.forEach(tr => tr.waitingForRoad = false);
                    } else {
                        closedNodes.add(nid); 
                        spawnCraneToTarget(n.x, n.y, nid, null);
                    }
                    hit = true; break;
                }
            }
            if (!hit) {
                for (const edge of C_EDGES) {
                    const p1 = C_NODES[edge.from], p2 = C_NODES[edge.to];
                    if (distPointToSegment(lx, ly, p1.x, p1.y, p2.x, p2.y) < 20) {
                        const ek = edge.from + '-' + edge.to;
                        const ekRev = edge.to + '-' + edge.from;
                        if (closedEdges.has(ek)) {
                            closedEdges.delete(ek); 
                            trucks.forEach(tr => tr.waitingForRoad = false);
                        } else if (closedEdges.has(ekRev)) {
                            closedEdges.delete(ekRev); 
                            trucks.forEach(tr => tr.waitingForRoad = false);
                        } else {
                            closedEdges.add(ek); 
                            const midX = (p1.x + p2.x) / 2;
                            const midY = (p1.y + p2.y) / 2;
                            spawnCraneToTarget(midX, midY, edge.from, ek);
                        }
                        break;
                    }
                }
            }
        });
    }
    render();
}

let statusCounter = 0;
function initChart() {
    const ctxCanvas = document.getElementById('capacity-chart');
    if (!ctxCanvas) return;

    chartInstance = new Chart(ctxCanvas, {
        type: 'bar',
        data: {
            labels: ['Ana Yol', 'Çevre Yolu', 'Tali Yol'],
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
                y: { min: 0, max: 150, grid: { color: 'rgba(51, 65, 85, 0.2)' }, ticks: { color: '#64748b' } },
                x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } }
            },
            plugins: { legend: { display: false } }
        }
    });

    setInterval(() => {
        if (simState === 'running') {
            let ana = 0, cevre = 0, tali = 0;
            if (window.isAIOptimized) {
                ana = 20 + Math.random() * 10; cevre = 70 + Math.random() * 20; tali = 40 + Math.random() * 15;
            } else {
                ana = 110 + Math.random() * 35; cevre = 5 + Math.random() * 5; tali = 2 + Math.random() * 5;
            }
            chartInstance.data.datasets[0].data = [ana, cevre, tali];
            chartInstance.data.datasets[0].backgroundColor = [
                ana > 100 ? '#ef4444' : '#3b82f6', cevre > 100 ? '#ef4444' : '#10b981', tali > 100 ? '#ef4444' : '#10b981'
            ];
            chartInstance.update();

            const hasActiveTrucks = trucks.some(t => t.vtype === 'supply' && !t.reached && !t.toBeRemoved);
            if (window.isAIOptimized && hasActiveTrucks) {
                savedTimeSecs += 55; // V14: Hızlandırıldı (25 -> 55)
                let hrs = Math.floor(savedTimeSecs / 3600);
                let mins = Math.floor((savedTimeSecs % 3600) / 60);
                let secs = savedTimeSecs % 60;
                document.getElementById('time-saved-text').textContent = `${hrs}s ${mins}dk ${secs}sn`;
            }

            statusCounter++;
            const statText = document.getElementById('system-status-text');
            if (statusCounter % 4 === 0 && statText) {
                if (window.isAIOptimized) {
                    const msgs = [
                        `Konvoy sahada, <span class="text-emerald-400 font-bold ml-1">optimum akış sağlandı</span>...`,
                        `Tali yollar aktif, <span class="text-emerald-400 font-bold ml-1">akışkanlık %100</span>...`,
                        `Güvenli koridor kullanılıyor, <span class="text-emerald-400 font-bold ml-1">gecikme yok</span>...`,
                        `Sahadan veri alınıyor, <span class="text-emerald-400 font-bold ml-1">koordinatlar temiz</span>...`
                    ];
                    statText.innerHTML = msgs[Math.floor(Math.random() * msgs.length)];
                } else {
                    const msgs = [
                        `Konvoy sahada, <span class="text-white font-bold ml-1">darboğaz yaşanıyor</span>...`,
                        `Ana arterde yoğunlaşma, <span class="text-red-400 font-bold ml-1">hız %40 düştü</span>...`,
                        `Kavşak kilitlenmesi, <span class="text-red-400 font-bold ml-1">bekleme süresi artıyor</span>...`,
                        `Alternatif rota aranıyor, <span class="text-red-400 font-bold ml-1">risk seviyesi yüksek</span>...`
                    ];
                    statText.innerHTML = msgs[Math.floor(Math.random() * msgs.length)];
                }
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

    bindSimControls();
    drawRouteCanvas();
    setTimeout(initChart, 500);
}

init();