-- 事前登録。同じアドレスは国ごとに1件だけ。発売のお知らせを1回送ったら、行ごと削除する（プライバシーポリシーの約束）
CREATE TABLE signups (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL,
  market TEXT NOT NULL,          -- us・ca・ca-fr・mx（どのページから登録したか）
  code TEXT NOT NULL UNIQUE,     -- 紹介用の短いコード（共有リンクの ?ref=）
  ref TEXT,                      -- 紹介してくれた人のコード
  ip_hash TEXT,                  -- 連続登録の制限用。IP アドレスと日付をまぜた指紋（元の IP には戻せない）
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE (email, market)
);
CREATE INDEX signups_rate ON signups (ip_hash, created_at);
