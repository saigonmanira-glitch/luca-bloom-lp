// Worker の動作確認（Cloudflare に接続せず、Node.js 内蔵の SQLite で D1 の代わりをする）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import worker from '../src/index.js';

// D1 と同じ呼び方（prepare → bind → first / run）ができる最小の代役
function fakeD1() {
  const db = new DatabaseSync(':memory:');
  db.exec(fs.readFileSync(new URL('../migrations/0001_signups.sql', import.meta.url), 'utf8'));
  const stmt = (sql, args = []) => ({
    bind: (...a) => stmt(sql, a),
    first: async () => db.prepare(sql).get(...args) ?? null,
    run: async () => db.prepare(sql).run(...args),
  });
  return { prepare: (sql) => stmt(sql), raw: db };
}
const env = () => ({ DB: fakeD1(), BASE_COUNT: '2', TARGET: '30' });
const post = (e, body, headers = {}) =>
  worker.fetch(
    new Request('https://luca-bloom.com/api/waitlist', {
      method: 'POST',
      headers: { origin: 'https://luca-bloom.com', 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.7', ...headers },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
    e,
  );

test('登録すると件数が増え、紹介コードが返る（件数は BASE_COUNT を含む）', async () => {
  const e = env();
  const r = await post(e, { email: ' Foo@Example.com ', market: 'us' });
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(j.status, 'new');
  assert.match(j.code, /^[a-z2-7]{8}$/);
  assert.equal(j.count, 3);
  assert.equal(j.target, 30);
  assert.equal(e.DB.raw.prepare('SELECT email FROM signups').get().email, 'foo@example.com');
});

test('同じアドレスの2回目は数えず、同じ紹介コードを返す', async () => {
  const e = env();
  const a = await (await post(e, { email: 'a@example.com', market: 'ca' })).json();
  const b = await (await post(e, { email: 'A@example.com', market: 'ca' })).json();
  assert.equal(b.status, 'dup');
  assert.equal(b.code, a.code);
  assert.equal(b.count, 3);
});

test('紹介コードつきの登録は、紹介した人を記録する', async () => {
  const e = env();
  const a = await (await post(e, { email: 'a@example.com', market: 'mx' })).json();
  await post(e, { email: 'b@example.com', market: 'mx', ref: a.code }, { 'cf-connecting-ip': '198.51.100.1' });
  assert.equal(e.DB.raw.prepare("SELECT ref FROM signups WHERE email = 'b@example.com'").get().ref, a.code);
});

test('不正な入力・他サイトからの送信・機械による送信を受け付けない', async () => {
  const e = env();
  assert.equal((await post(e, { email: 'not-an-email', market: 'us' })).status, 422);
  assert.equal((await post(e, { email: 'a@example.com', market: 'jp' })).status, 422);
  assert.equal((await post(e, '{broken')).status, 400);
  assert.equal((await post(e, { email: 'a@example.com', market: 'us' }, { origin: 'https://evil.example' })).status, 403);
  assert.equal((await post(e, { email: 'a@example.com', market: 'us' }, { 'content-type': 'text/plain' })).status, 415);
  assert.equal((await post(e, JSON.stringify({ email: 'a@example.com', market: 'us', pad: 'x'.repeat(3000) }))).status, 413);
  const bot = await post(e, { email: 'bot@example.com', market: 'us', website: 'http://spam' });
  assert.equal(bot.status, 200); // 成功したふりをする
  assert.equal(e.DB.raw.prepare('SELECT COUNT(*) AS n FROM signups').get().n, 0); // 保存はしない
});

test('同じ回線からは1時間に5件まで', async () => {
  const e = env();
  for (let i = 0; i < 5; i++) assert.equal((await post(e, { email: `u${i}@example.com`, market: 'us' })).status, 200);
  assert.equal((await post(e, { email: 'u5@example.com', market: 'us' })).status, 429);
  assert.equal((await post(e, { email: 'u5@example.com', market: 'us' }, { 'cf-connecting-ip': '198.51.100.9' })).status, 200);
});

test('件数の取得と、未知の URL', async () => {
  const e = env();
  const r = await worker.fetch(new Request('https://luca-bloom.com/api/waitlist/count'), e);
  assert.deepEqual(await r.json(), { count: 2, target: 30 });
  assert.match(r.headers.get('cache-control'), /max-age=60/);
  assert.equal((await worker.fetch(new Request('https://luca-bloom.com/api/other'), e)).status, 404);
});

// ---------- サイトの配信（ファイルに当たらない URL だけ Worker が受ける） ----------
const FILES = { '/index.html': 'top', '/en/index.html': 'en', '/404.html': 'not found', '/privacy.html': 'privacy' };
const assets = {
  fetch: async (req) => {
    const p = new URL(req.url).pathname;
    return p in FILES ? new Response(FILES[p], { headers: { 'content-type': 'text/html' } }) : new Response('', { status: 404 });
  },
};
const get = (url) => worker.fetch(new Request(url), { ...env(), ASSETS: assets });

test('フォルダの URL はその中の index.html を返し、安全設定のヘッダーを付ける', async () => {
  const r = await get('https://luca-bloom.com/en/');
  assert.equal(r.status, 200);
  assert.equal(await r.text(), 'en');
  assert.match(r.headers.get('content-security-policy'), /frame-ancestors 'self'/);
  assert.equal(r.headers.get('x-frame-options'), 'SAMEORIGIN');
  assert.equal(await (await get('https://luca-bloom.com/')).text(), 'top');
});

test('/en は /en/ へ、www は www なしへ転送する', async () => {
  const a = await get('https://luca-bloom.com/en?x=1');
  assert.equal(a.status, 301);
  assert.equal(a.headers.get('location'), 'https://luca-bloom.com/en/?x=1');
  const b = await get('https://www.luca-bloom.com/privacy.html');
  assert.equal(b.status, 301);
  assert.equal(b.headers.get('location'), 'https://luca-bloom.com/privacy.html');
});

test('存在しない URL は 404.html を状態 404 で返す。/api/ の未知の URL は JSON の 404', async () => {
  const r = await get('https://luca-bloom.com/no-such-page');
  assert.equal(r.status, 404);
  assert.equal(await r.text(), 'not found');
  const api = await get('https://luca-bloom.com/api/nothing');
  assert.equal(api.status, 404);
  assert.match(api.headers.get('content-type'), /json/);
});
