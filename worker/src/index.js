// 北米の事前登録フォームの受け口（Cloudflare Workers）
//   POST /api/waitlist        { email, market, ref?, website? } → { ok, status: 'new'|'dup', code, count, target }
//   GET  /api/waitlist/count  → { count, target }
// 保存先は Cloudflare D1（SQLite）。登録の一覧は Cloudflare の管理画面 → D1 → luca-bloom-waitlist → コンソールで
//   SELECT email, market, created_at FROM signups ORDER BY id;
const ORIGINS = new Set(['https://luca-bloom.com', 'https://www.luca-bloom.com']);
const MARKETS = new Set(['us', 'ca', 'ca-fr', 'mx']);
const EMAIL = /^[^\s@<>()[\]\\,;:"]{1,64}@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;
const CODE = /^[a-z2-7]{8}$/;
const PER_HOUR = 5; // 同じ回線からの登録は1時間に5件まで（いたずら・自動登録の対策）

const json = (body, status = 200, cache = 'no-store') =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache, 'x-content-type-options': 'nosniff' },
  });

const sha256 = async (s) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map((b) => b.toString(16).padStart(2, '0')).join('');
const newCode = () => [...crypto.getRandomValues(new Uint8Array(8))].map((b) => 'abcdefghijklmnopqrstuvwxyz234567'[b & 31]).join('');

async function count(env) {
  const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM signups').first();
  return (row?.n ?? 0) + (parseInt(env.BASE_COUNT, 10) || 0);
}

async function signup(request, env) {
  if (!ORIGINS.has(request.headers.get('origin'))) return json({ ok: false, error: 'origin' }, 403);
  if (!(request.headers.get('content-type') || '').startsWith('application/json')) return json({ ok: false, error: 'type' }, 415);
  const raw = await request.text();
  if (raw.length > 2000) return json({ ok: false, error: 'size' }, 413);
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: 'json' }, 400);
  }
  // 人には見えない欄（website）に入力があれば機械による登録とみなし、成功したふりをして保存しない
  if (body.website) return json({ ok: true, status: 'new', code: newCode(), count: await count(env), target: +env.TARGET });
  const email = String(body.email || '').trim().toLowerCase();
  const market = String(body.market || '');
  const ref = CODE.test(body.ref) ? body.ref : null;
  if (email.length > 254 || !EMAIL.test(email)) return json({ ok: false, error: 'email' }, 422);
  if (!MARKETS.has(market)) return json({ ok: false, error: 'market' }, 422);

  const found = await env.DB.prepare('SELECT code FROM signups WHERE email = ? AND market = ?').bind(email, market).first();
  if (found) return json({ ok: true, status: 'dup', code: found.code, count: await count(env), target: +env.TARGET });

  const ip = request.headers.get('cf-connecting-ip') || '';
  const ipHash = (await sha256(`${ip}|${new Date().toISOString().slice(0, 10)}|luca-bloom`)).slice(0, 32);
  const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM signups WHERE ip_hash = ? AND created_at > strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-1 hour')").bind(ipHash).first();
  if ((recent?.n ?? 0) >= PER_HOUR) return json({ ok: false, error: 'rate' }, 429);

  const code = newCode();
  await env.DB.prepare('INSERT INTO signups (email, market, code, ref, ip_hash) VALUES (?, ?, ?, ?, ?)').bind(email, market, code, ref, ipHash).run();
  return json({ ok: true, status: 'new', code, count: await count(env), target: +env.TARGET });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    try {
      if (pathname === '/api/waitlist' && request.method === 'POST') return await signup(request, env);
      if (pathname === '/api/waitlist/count' && request.method === 'GET') return json({ count: await count(env), target: +env.TARGET }, 200, 'public, max-age=60');
      return json({ ok: false, error: 'not_found' }, 404);
    } catch (e) {
      console.error(e);
      return json({ ok: false, error: 'server' }, 500);
    }
  },
};
