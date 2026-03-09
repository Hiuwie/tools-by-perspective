const LOCAL_KEY = 'pdf_exports_count';

const COUNTAPI_NAMESPACE =
  import.meta.env.VITE_COUNTAPI_NAMESPACE || 'perspectivepov-tools';
const COUNTAPI_KEY =
  import.meta.env.VITE_COUNTAPI_KEY || 'pdf-exports';

function getLocalCount() {
  const raw = localStorage.getItem(LOCAL_KEY);
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function setLocalCount(value) {
  localStorage.setItem(LOCAL_KEY, String(Math.max(0, Math.floor(value))));
}

async function getRemoteCount() {
  const response = await fetch(
    `https://api.countapi.xyz/get/${encodeURIComponent(COUNTAPI_NAMESPACE)}/${encodeURIComponent(COUNTAPI_KEY)}`
  );
  if (!response.ok) throw new Error('Failed to fetch export count');
  const data = await response.json();
  if (typeof data?.value !== 'number') throw new Error('Invalid export count response');
  return data.value;
}

async function hitRemoteCount() {
  const response = await fetch(
    `https://api.countapi.xyz/hit/${encodeURIComponent(COUNTAPI_NAMESPACE)}/${encodeURIComponent(COUNTAPI_KEY)}`
  );
  if (!response.ok) throw new Error('Failed to increment export count');
  const data = await response.json();
  if (typeof data?.value !== 'number') throw new Error('Invalid increment response');
  return data.value;
}

export async function getExportCount() {
  try {
    const value = await getRemoteCount();
    setLocalCount(value);
    return value;
  } catch {
    return getLocalCount();
  }
}

export async function incrementExportCount() {
  try {
    const value = await hitRemoteCount();
    setLocalCount(value);
    return value;
  } catch {
    const local = getLocalCount() + 1;
    setLocalCount(local);
    return local;
  }
}

