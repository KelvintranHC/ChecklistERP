const OWNER = 'KelvintranHC';
const REPO = 'ChecklistERP';
const PATH = 'data/state.json';
const BRANCH = 'checklist-data';
const ALLOWED = new Set([
  'k1','k2','k3','k4','k5',
  's1','s2','s3','s4',
  'm1','m2','m3','m4',
  'b1','b2','b3','b4',
  'w1','w2','w3','w4','w5',
  'i1','i2','i3','i4',
  'g1','g2','g3'
]);

const EMPTY = { v: 1, checked: [], updatedAt: null };

function json(res, status, body) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.status(status).json(body);
}

function normalize(data) {
  const ids = Array.isArray(data && data.checked) ? data.checked : [];
  return {
    v: 1,
    updatedAt: data && data.updatedAt ? data.updatedAt : null,
    checked: [...new Set(ids.filter((id) => ALLOWED.has(String(id))))]
  };
}

function ghHeaders(token) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'hoaan-erp-checklist'
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function readGithub(token) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}?ref=${BRANCH}`;
  const res = await fetch(url, { headers: ghHeaders(token) });
  if (res.status === 404) return { state: EMPTY, sha: null };
  if (!res.ok) throw new Error('github_read_' + res.status);
  const file = await res.json();
  const decoded = Buffer.from(file.content.replace(/\n/g, ''), 'base64').toString('utf8');
  return { state: normalize(JSON.parse(decoded)), sha: file.sha };
}

async function writeGithub(token, state, sha) {
  if (!token) throw new Error('missing_token');
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { ...ghHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'chore: cập nhật tiến độ checklist dùng chung',
      content: Buffer.from(JSON.stringify(state, null, 2) + '\n', 'utf8').toString('base64'),
      sha: sha || undefined,
      branch: BRANCH
    })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error('github_write_' + res.status + '_' + text.slice(0, 180));
  }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  const token = process.env.CHECKLIST_GITHUB_TOKEN || process.env.GITHUB_TOKEN || '';

  try {
    if (req.method === 'GET') {
      const { state } = await readGithub(token);
      return json(res, 200, state);
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const next = normalize({
        checked: body.checked,
        updatedAt: new Date().toISOString()
      });
      const current = await readGithub(token);
      await writeGithub(token, next, current.sha);
      return json(res, 200, next);
    }

    return json(res, 405, { error: 'method_not_allowed' });
  } catch (err) {
    return json(res, 500, { error: 'save_failed', detail: String(err && err.message ? err.message : err) });
  }
}
