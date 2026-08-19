const { put, get } = require('@vercel/blob');

const BLOB_PATH = 'checklist-state.json';
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

async function readState() {
  const blob = await get(BLOB_PATH, { access: 'private', useCache: false });
  if (!blob) return EMPTY;
  const text = await new Response(blob.stream).text();
  if (!text) return EMPTY;
  return normalize(JSON.parse(text));
}

async function writeState(state) {
  await put(BLOB_PATH, JSON.stringify(state), {
    access: 'private',
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: 'application/json',
    cacheControlMaxAge: 0
  });
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  try {
    if (req.method === 'GET') {
      return json(res, 200, await readState());
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const next = normalize({
        checked: body.checked,
        updatedAt: new Date().toISOString()
      });
      await writeState(next);
      return json(res, 200, next);
    }

    return json(res, 405, { error: 'method_not_allowed' });
  } catch (err) {
    return json(res, 500, { error: 'save_failed', detail: String(err && err.message ? err.message : err) });
  }
};
