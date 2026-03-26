import { getGeminiApiKey } from '../config.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL = 'gemini-pro';

const ALLOWED_TYPES = new Set([
  'genel',
  'enkaz_alti_ses',
  'saglik',
  'yangin',
  'lojistik',
  'su_gida',
  'hastane_doluluk',
  'sokak_yangini',
]);

export function tierFromScore(score) {
  const n = Number(score);
  if (Number.isNaN(n)) return 'medium';
  if (n >= 75) return 'critical';
  if (n >= 40) return 'medium';
  return 'low';
}

function normalizeType(t) {
  const s = String(t || 'genel').toLowerCase().replace(/\s+/g, '_');
  return ALLOWED_TYPES.has(s) ? s : 'genel';
}

/**
 * API yok veya hata: basit anahtar kelime triyajı (Türkçe).
 */
export function heuristicTriage(summary, _city) {
  console.log("API bağlantı sorunu, yerel triyaj devrede");
  const s = (summary || '').toLowerCase();
  let type = 'genel';
  let score = 52;
  if (/enkaz|göçük|gocuk|ses|altında|altinda|mahsur|deprem\s*anı/.test(s)) {
    type = 'enkaz_alti_ses';
    score = 90;
  } else if (/yoğun\s*bakım|yogun\s*bakim|hastane|oksijen|ambulans|yaralı|yarali/.test(s)) {
    type = 'hastane_doluluk';
    score = 78;
  } else if (/yangın|yangin|alev|duman/.test(s)) {
    type = 'yangin';
    score = 72;
  } else if (/yol\s*kapalı|kopru|köprü|ulasim|ulaşım|tır|tir\s*konvoy/.test(s)) {
    type = 'lojistik';
    score = 58;
  } else if (/su|gıda|gida|çadır|cadir|battaniye/.test(s)) {
    type = 'su_gida';
    score = 48;
  }
  return {
    type,
    priorityScore: Math.min(100, Math.max(0, score)),
    priorityTier: tierFromScore(score),
    aiNote: '⚠️ Yerel kural tabanlı triyaj (API bağlantı sorunu).',
  };
}

function parseModelJson(text) {
  let t = text.trim();
  const fenced = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) t = fenced[1].trim();
  const m = t.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('Model yanıtında JSON bulunamadı.');
  const raw = JSON.parse(m[0]);
  const score = Math.min(100, Math.max(0, Number(raw.priorityScore) || 0));
  const type = normalizeType(raw.type);
  let tier = raw.priorityTier;
  if (tier !== 'critical' && tier !== 'medium' && tier !== 'low') {
    tier = tierFromScore(score);
  }
  return {
    type,
    priorityScore: score,
    priorityTier: tier,
    aiNote: typeof raw.rationale === 'string' ? raw.rationale.slice(0, 500) : '',
  };
}

/**
 * Gemini ile ihtiyaç türü + 0–100 öncelik + tier.
 */
export async function analyzeIncomingRequest(summary, city) {
  const key = getGeminiApiKey();
  if (!key) {
    return heuristicTriage(summary, city);
  }
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: MODEL });
  const prompt = `Sen afet lojistik triyaj asistanısın. Kullanıcı Türkiye'deki bir il için kısa bir talep metni yazdı.

İl: ${city}
Talep metni:
"""
${summary.replace(/"""/g, '"')}
"""

Yalnızca geçerli bir JSON nesnesi döndür (başka metin yok). Alanlar:
- "type": şu dizelerden biri: genel, enkaz_alti_ses, saglik, yangin, lojistik, su_gida, hastane_doluluk, sokak_yangini
- "priorityScore": 0 ile 100 arası tam sayı (can kaybı riski ve aciliyet; yüksek = daha kritik)
- "priorityTier": "critical" | "medium" | "low" (score ile tutarlı olsun: 75+ kritik, 40-74 orta, 0-39 düşük)
- "rationale": Türkçe en fazla 2 cümle gerekçe

JSON:`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = parseModelJson(text);
    return { ...parsed, aiNote: parsed.aiNote || 'Gemini analizi.' };
  } catch (e) {
    console.warn('Gemini triyaj hatası, heuristik kullanılıyor:', e);
    const h = heuristicTriage(summary, city);
    // Hata mesajını sadeleştirerek teknik detayları kullanıcıdan gizle
    return { ...h, aiNote: `${h.aiNote}` };
  }
}

export function scorePlaceholder(request) {
  const s = request?.priorityScore;
  if (typeof s === 'number') return { score: s, tier: request.priorityTier ?? 'medium' };
  return { score: 50, tier: 'medium' };
}
