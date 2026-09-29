# Luca Bloom LP

スマホ優先の販売用ランディングページ（単一HTML）。`index.html` を静的ホスティングに置けば動作します。

- ヒーローの3Dモデル（three.js r128）は製品写真の形状に合わせて作成。スライダーで開き幅（最大70mm）を操作できます。アームの先端側を包皮に見立てた半透明の膜が包み、開き幅に合わせて口が伸びます。
- イラストはすべてインラインSVG。写真素材は使用していません。

## SEO

- 公開URLは `https://luca-bloom.com/` を前提にしています（同梱カードのQRコード `https://luca-bloom.com/jp` と同じドメイン）。変更する場合は、`index.html` の canonical / og:url / og:image / JSON-LD、`robots.txt`、`sitemap.xml` のURLを置き換えてください。
- `og.png`（1200×630）、`favicon.svg`、`apple-touch-icon.png` を同梱。

## サポートページ（同梱カードのQRコードの飛び先）

- `jp/index.html` … QRコード `https://luca-bloom.com/jp` の着地ページ。「ご使用マニュアル」「取扱説明書 兼 免責事項」の選択画面
- `jp/manual.html` … 図解のご使用マニュアル（画像は `jp/img/`、同梱ガイドPDFから切り出し）
- `jp/disclaimer.pdf` … 取扱説明書 兼 免責事項（PDF、制定日2026年9月1日版）
- `https://luca-bloom.com/jp` へのアクセスは、静的ホスティング（GitHub Pages 等）で `jp/index.html` が表示されます。

## 公開（QRコード `https://luca-bloom.com/jp` を機能させる手順）

1. GitHub のリポジトリ → Settings → Pages → Build and deployment を「Deploy from a branch」、Branch を `claude/keen-pascal-bs4hhf` / `(root)` にして Save。
2. 同画面の Custom domain に `luca-bloom.com` が入っていることを確認（リポジトリ直下の `CNAME` で自動設定）。
3. ドメイン管理画面（お名前.com 等）の DNS に以下を登録。
   - A レコード（@）：185.199.108.153 / 185.199.109.153 / 185.199.110.153 / 185.199.111.153
   - CNAME レコード（www）：saigonmanira-glitch.github.io
4. 反映後（数分〜最大24時間）、Pages 画面で「Enforce HTTPS」にチェック。
5. `https://luca-bloom.com/jp` を開き、選択画面が表示されれば完了。
