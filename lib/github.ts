
const GH_API = 'https://api.github.com';

export type GhSettings = {
  owner: string;
  repo: string;
  branch: string;
  baseUrl: string;
  otaDir: string;
  token: string;
};

type GhContentItem = {
  name: string;
  path: string;
  sha: string;
  download_url: string | null;
  type: 'file' | 'dir';
};

async function ghFetch(input: string, init: RequestInit, token: string) {
  // Add cache-busting headers to prevent browser caching
  const res = await fetch(input, {
    ...init,
    headers: {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...(init.headers || {}),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`GitHub API ${res.status} ${res.statusText} - ${txt}`);
  }
  return res.json();
}

export async function listFirmwares(s: GhSettings): Promise<GhContentItem[]> {
  const timestamp = Date.now();
  const url = `${GH_API}/repos/${s.owner}/${s.repo}/contents/${encodeURIComponent(s.otaDir)}?ref=${encodeURIComponent(s.branch)}&_t=${timestamp}`;
  const data = await ghFetch(url, { method: 'GET' }, s.token);
  if (!Array.isArray(data)) return [];
  return data.filter((x: GhContentItem) => x.type === 'file' && x.name.endsWith('.bin'));
}

export async function getFileSha(s: GhSettings, path: string): Promise<string | null> {
  try {
    const url = `${GH_API}/repos/${s.owner}/${s.repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(s.branch)}`;
    const data = await ghFetch(url, { method: 'GET' }, s.token);
    return data.sha || null;
  } catch (e: any) {
    if (String(e?.message || '').includes('404')) return null;
    throw e;
  }
}

export async function createOrUpdateFile(s: GhSettings, path: string, contentBase64: string, message: string, sha?: string) {
  const url = `${GH_API}/repos/${s.owner}/${s.repo}/contents/${encodeURIComponent(path)}`;
  return ghFetch(url, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      branch: s.branch,
      content: contentBase64,
      ...(sha ? { sha } : {})
    })
  }, s.token);
}

export async function deleteFile(s: GhSettings, path: string, sha: string, message: string) {
  const url = `${GH_API}/repos/${s.owner}/${s.repo}/contents/${encodeURIComponent(path)}`;
  return ghFetch(url, {
    method: 'DELETE',
    body: JSON.stringify({
      message,
      branch: s.branch,
      sha
    })
  }, s.token);
}

export function makeFirmwareUrl(s: GhSettings, fileName: string) {
  const slash = s.baseUrl.endsWith('/') ? '' : '/';
  return `${s.baseUrl}${slash}${s.otaDir}/${fileName}`;
}

export async function fileToBase64(file: File): Promise<string> {
  if (file.size > 100 * 1024 * 1024) {
    throw new Error('File too large (>100MB).');
  }
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(file);
  });
  const [, base64] = dataUrl.split(',', 2);
  return base64 || '';
}
