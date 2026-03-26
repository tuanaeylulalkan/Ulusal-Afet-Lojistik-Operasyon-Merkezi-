const INTERNET_MOCK_URL = 'mock-data/internet-requests.json';
const MESH_MOCK_URL = 'mock-data/mesh-requests.json';

/**
 * İnternet kanalı — kurumsal / makro veri (mock JSON).
 */
export async function fetchInternetSnapshot(_opts = {}) {
  const res = await fetch(INTERNET_MOCK_URL);
  if (!res.ok) throw new Error(`internet mock: ${res.status}`);
  const data = await res.json();
  return {
    ok: true,
    channel: 'internet',
    at: new Date().toISOString(),
    requests: data.requests ?? [],
    meta: data.meta ?? {},
  };
}

/**
 * Mesh kanalı — çevrimdışı düğümler (mock JSON).
 */
export async function fetchMeshSnapshot(_opts = {}) {
  const res = await fetch(MESH_MOCK_URL);
  if (!res.ok) throw new Error(`mesh mock: ${res.status}`);
  const data = await res.json();
  return {
    ok: true,
    channel: 'mesh',
    at: new Date().toISOString(),
    requests: data.requests ?? [],
    meta: data.meta ?? {},
  };
}

/** @deprecated isim uyumu */
export async function ingestMeshPacket(_packet) {
  return fetchMeshSnapshot(_packet);
}
