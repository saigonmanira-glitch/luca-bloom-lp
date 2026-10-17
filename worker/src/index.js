// luca-bloom.com の配信（Cloudflare Workers）
// ・サイトのファイル（tools/build-site.mjs が集めた _site/）は Cloudflare が直接返す（Worker は動かない・無料・回数無制限）。
//   URL は今までと同じ（.html を付けたまま。拡張子を外す転送はしない：wrangler.toml の html_handling = "none"）
// ・ファイルに当たらない URL だけ、この Worker が受ける：
//   POST /api/waitlist        北米の事前登録 { email, market, ref?, website? } → { ok, status: 'new'|'dup', code, count, target }
//   GET  /api/waitlist/count  登録数 → { count, target }
//   /〜/（フォルダ）          その中の index.html を返す。/en のように / が無ければ /en/ へ転送
//   www.luca-bloom.com        luca-bloom.com へ転送
//   それ以外                  404.html（状態 404）
// 保存先は Cloudflare D1（SQLite）。登録の一覧は Cloudflare の管理画面 → D1 → luca-bloom-waitlist → コンソールで
//   SELECT email, market, created_at FROM signups ORDER BY id;
import { SECURITY } from './headers.js';

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

const secure = (res, status = res.status) => {
  const out = new Response(res.body, { status, headers: res.headers });
  for (const [k, v] of Object.entries(SECURITY)) out.headers.set(k, v);
  return out;
};

async function site(request, env) {
  const url = new URL(request.url);
  if (url.hostname.startsWith('www.')) {
    url.hostname = url.hostname.slice(4);
    return Response.redirect(url.href, 301);
  }
  const asset = (path) => env.ASSETS.fetch(new Request(new URL(path, url), request));
  if (request.method === 'GET' || request.method === 'HEAD') {
    if (url.pathname.endsWith('/')) {
      const res = await asset(`${url.pathname}index.html`);
      if (res.status !== 404) return secure(res);
    } else if (!/\.[a-z0-9]+$/i.test(url.pathname)) {
      const res = await asset(`${url.pathname}/index.html`);
      if (res.status !== 404) return Response.redirect(`${url.origin}${url.pathname}/${url.search}`, 301);
    }
  }
  const nf = await env.ASSETS.fetch(new Request(new URL('/404.html', url)));
  return secure(nf, 404);
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    try {
      if (pathname === '/api/waitlist' && request.method === 'POST') return await signup(request, env);
      if (pathname === '/api/waitlist/count' && request.method === 'GET') return json({ count: await count(env), target: +env.TARGET }, 200, 'public, max-age=60');
      if (pathname.startsWith('/api/')) return json({ ok: false, error: 'not_found' }, 404);
      return await site(request, env);
    } catch (e) {
      console.error(e);
      return json({ ok: false, error: 'server' }, 500);
    }
  },
};
