/**
 * Sevkiyat katmanı — rota, simülasyon, onay akışı (Sekme 4+).
 */
export function createShipmentStub(requestId) {
  return { requestId, trucks: 0, status: 'pending' };
}
