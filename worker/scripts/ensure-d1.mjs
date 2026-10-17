// 公開（.github/workflows/worker.yml）の前処理：D1 のデータベースが無ければ作り、その ID を wrangler.toml に書き込む
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const NAME = 'luca-bloom-waitlist';
const wrangler = (...args) => execFileSync('npx', ['wrangler', ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
const find = () => JSON.parse(wrangler('d1', 'list', '--json')).find((d) => d.name === NAME);

let db = find();
if (!db) {
  wrangler('d1', 'create', NAME);
  db = find();
}
if (!db?.uuid) throw new Error('D1 のデータベースを用意できませんでした');
const toml = fs.readFileSync('wrangler.toml', 'utf8').replace('__D1_ID__', db.uuid);
fs.writeFileSync('wrangler.toml', toml);
console.log(`D1：${NAME}（${db.uuid}）`);
