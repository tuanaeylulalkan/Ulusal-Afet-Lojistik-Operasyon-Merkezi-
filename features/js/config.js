/**
 * Tarayıcıda Gemini anahtarı: index.html içinde
 * window.__GEMINI_API_KEY__ = '...' atanabilir (repoya commit etmeyin).
 */
export function getGeminiApiKey() {
  if (typeof window === 'undefined') return '';
  const k = window.__GEMINI_API_KEY__;
  return typeof k === 'string' ? k.trim() : '';
}
