// テスト用の簡易サーバー（GitHub Pages と同じく、存在しないURLは 404.html を返す）
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const PORT = Number(process.env.PORT || 4173);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

http
  .createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    // GitHub Pages と同じく、フォルダ名で終わる URL（/intl など）は末尾に / を付けた URL へ転送する
    const dir = path.join(ROOT, path.normalize(p));
    if (!p.endsWith('/') && dir.startsWith(ROOT) && fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      res.writeHead(301, { Location: `${p}/` });
      res.end();
      return;
    }
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(ROOT, path.normalize(p));
    const ok = file.startsWith(ROOT) && fs.existsSync(file) && fs.statSync(file).isFile();
    const target = ok ? file : path.join(ROOT, '404.html');
    res.writeHead(ok ? 200 : 404, { 'Content-Type': TYPES[path.extname(target)] || 'application/octet-stream' });
    fs.createReadStream(target).pipe(res);
  })
  .listen(PORT, () => console.log(`http://localhost:${PORT}/`));
