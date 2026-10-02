# Luca Bloom 公式サイト

https://luca-bloom.com/ のソース一式です。静的サイトで、GitHub Pages からそのまま配信しています（ビルドが必要なのはトップページの JavaScript のみ）。

## ファイル構成

| パス | 内容 |
|---|---|
| `index.html` | 販売用ランディングページ（スマホ優先）。CSS はこのファイル内 |
| `src/` | トップページの JavaScript のソース（`app.js`：スライダー・購入バー・アクセス解析、`scene.js`：3Dの入口。3Dの部品は `src/scene/`：`common.js` 共通処理・`device.js` 本体の形状と素材・`sleeve.js` 膜・`hero.js` ヒーロー・`box.js` 化粧箱・`box-foam.js` 梱包材の図面座標） |
| `tests/` / `tools/check-site.mjs` / `tools/serve.mjs` | 自動テスト（ブラウザ動作テスト・リンク等の静的チェック・テスト用サーバー） |
| `.github/workflows/ci.yml` | push のたびに自動テストを実行する設定（GitHub Actions） |
| `assets/js/` | `src/` をビルドした公開用ファイル（three.js r186 を含み、自サイトから配信） |
| `assets/fonts/` | サイトで使う文字だけを収録した Web フォント（`tools/build-fonts.mjs` が生成） |
| `tools/` | ビルド用スクリプト |
| `package.json` | ビルド設定（esbuild） |
| `hero-fallback.webp` | 3D が表示されるまで／表示できない端末で出す静止画（29KB） |
| `og.png` | SNS 共有用画像（1200×630） |
| `favicon.svg` / `apple-touch-icon.png` | アイコン |
| `privacy.html` | プライバシーポリシー |
| `404.html` | 存在しない URL を開いたときのページ（GitHub Pages が自動で使用） |
| `jp/` | 同梱カードの QR コード（`https://luca-bloom.com/jp`）の飛び先。`index.html`＝選択画面、`manual.html`＝ご使用マニュアル（画像は `jp/img/`）、`disclaimer.pdf`＝取扱説明書 兼 免責事項、`support.css`＝共通スタイル |
| `column/` | コラム。`index.html`＝一覧、各記事は `*.html`、`column.css`＝全記事共通のスタイル |
| `robots.txt` / `sitemap.xml` | 検索エンジン向け |
| `CNAME` / `.nojekyll` | GitHub Pages のカスタムドメイン設定と、Jekyll 処理の無効化 |

- ヒーローの3Dモデルは、時間で自動的に外箱が透けて（10秒周期：不透明4秒→1秒で透過→透過4秒→1秒で戻る。回転の向きとは無関係）、送りねじ・ナットの動きが見えます。「動きを減らす」設定では不透明のまま。POM樹脂の質感は、薄いクリアコート・環境光の映り込み・ACESトーンマッピングで原案に近い磁器のような白を表現し、本体の角はR1の丸みにしています（transmission＝光の透過計算は描画が重くなるため不使用）。描画解像度は端末の1.5倍までに制限。リリースプレートは図面どおりの鍵穴形（スロット幅4mm・穴φ6.5・面取りC0.5）です。
## トップページの仕組み

- **3D（three.js r186）**：製品の DXF 図面から作った形状。スライダーで開き幅（全閉〜70mm、1mm刻み）を操作できます。
  - three.js はページの読み込み完了（load）後に読み込みます。化粧箱の3Dは、表示領域が画面の400px手前に来てから作ります。
  - シェーダーは並行コンパイル（`compileAsync`）してから描画を始め、読み込み時に画面が固まらないようにしています。
  - 本体の回転は340°の向きから始まります。
  - 3D が描画されるまで、また WebGL が使えない・three.js を読み込めない場合は `hero-fallback.webp` を表示します。
  - タブが非表示の間と、3D が画面外にある間は描画を止めます。
- **フォント**：Zen Kaku Gothic New（400/700/900）・Quicksand・Montserrat（化粧箱ロゴ用）を自サイトから配信します（外部サービスへの接続なし）。各太さには、実際にその太さで表示される文字だけを収録しています（合計約240KB）。`font-display: swap` のため、フォントの読み込み中も文字は先に表示されます。
- **構造化データ**：Product（価格 5,800円・税込）、FAQPage、WebPage。FAQ の文言を変えるときは、画面の FAQ と JSON-LD の両方を直してください。

## JavaScript のビルド

- 編集は `src/` で行い、`npm install`（初回のみ）→ `npm run build` を実行して、`assets/js/` もコミットします。
- `npm run build` は JavaScript とフォントの両方を作ります（個別には `npm run build:js` / `npm run build:fonts`）。**ページの文章を変えたら、必ず `npm run build:fonts` を実行して `assets/fonts/` と各ページをコミットしてください**（新しい文字がフォントに入らず、その文字だけ別の書体で表示されるのを防ぐため）。
- `build:fonts` は Playwright があると、ページを実際に表示して太さごとに必要な文字だけを収録します（無い場合は全ての文字を全ての太さに収録）。
- Google アナリティクス 4 は `src/app.js` の `GA_ID` に測定ID（G- から始まる文字列）を入れてビルドすると有効になります。有効にする際は `privacy.html` の「5. アクセス解析ツール・外部サービス」と、`tools/build-csp.mjs` の CSP（下記）も書き換えてください。

## 自動テスト

- `npm run verify` で、次のすべてを実行します（GitHub では push のたびに自動実行。結果はリポジトリの「Actions」タブで確認できます）。
  - `npm run lint`：ESLint（JavaScript）と html-validate（HTML）の文法チェック
  - `npm run check`：サイト内リンク・画像等の参照先・title/description/canonical・sitemap.xml・CSP が最新かの確認
  - `npm test`：ブラウザ（Chromium）でのテスト 59項目
    - 動作（`tests/site.spec.mjs`）：全ページの表示とエラー、404、3Dの描画、スライダー、WebGL強制終了・非対応時の静止画、化粧箱の遅延読み込み、購入ボタンのリンク、購入バー
    - 品質（`tests/quality.spec.mjs`）：
      - アクセシビリティ：axe-core で WCAG 2.1 A/AA と推奨事項（best-practice）の違反が全ページで0件
      - フォントの抜け字：表示される文字が、その太さのフォントに全て入っているか（`npm run build:fonts` 忘れの検出）
      - 表示の軽さ：トップページは3D表示まで含めて圧縮後500KB以内、外部サーバーに接続しない、レイアウトのずれ（CLS）0.05未満
      - 構造化データ：全ページの JSON-LD が正しく読めること、価格・FAQ が画面の表示と一致すること
      - セキュリティ：CSP（Content-Security-Policy）に違反する読み込み・実行が全ページで0件、CSP に危険な許可（unsafe-inline・外部ドメインなど）がない、security.txt が有効期限内
  - `npm audit`：依存パッケージの既知の脆弱性チェック（`npm run verify` と CI で実行）
- GitHub Actions では、`src/` からビルドした結果が `assets/js/` と一致するかも確認します（ビルド忘れの防止）。
- 初回のみ `npx playwright install chromium` が必要です。インストール済みの Chromium を使う場合は、環境変数 `CHROMIUM_PATH` にその場所を指定します（`npm test`・`npm run build:fonts` 共通）。

## セキュリティ設定

- 全ページの `<head>` に Content-Security-Policy（CSP：ページが読み込み・実行してよいものの許可リスト）を設定し、スクリプト・フォント・画像などの読み込みを自サイトのファイルに限定しています（外部サイトのスクリプトを埋め込まれる被害を防ぐ）。CSP は `tools/build-csp.mjs` が全ページに書き込みます（`npm run build` に含まれます）。
- ページ内の `<style>` は、中身の SHA-256 ハッシュ（指紋）で1つずつ許可しています（`'unsafe-inline'` は使いません）。**CSS を1文字でも変えたら `npm run build` を実行**してください。忘れると `npm run check` と CI が失敗します。
- Trusted Types：`innerHTML` などへの文字列の直接代入を禁止し、DOM 経由の攻撃（XSS）を防ぎます。
- そのため、ページ内に直接 `<script>…</script>` を書くと動きません。スクリプトは別ファイル（`src/` または `jp/support.js`）に書いてください。構造化データ（`application/ld+json`）は対象外です。
- Google アナリティクスなど外部サービスを追加する場合は、CSP にそのドメインを追加してください（追加しないと `npm test` のセキュリティテストで検出されます）。
- `.well-known/security.txt`：脆弱性の連絡先（RFC 9116）。有効期限（Expires）の30日前になるとテストが失敗するので、日付を1年先に更新してください。
- CI（GitHub Actions）：権限は読み取りのみ、外部の部品（actions）はコミットIDで固定。`.github/dependabot.yml` により、依存パッケージの更新が毎週自動で提案されます。
- GitHub Pages では HTTP ヘッダー（HSTS・`frame-ancestors` など）を設定できません。設定する場合は Cloudflare のプロキシ（オレンジの雲）とレスポンスヘッダーの変換ルールを使います。

## Amazon 商品動画

- `npm run video` で `out/luca-bloom-amazon.mp4`（1920×1080・30fps・H.264・52秒・無音）とサムネイル `out/luca-bloom-thumbnail.jpg` を作ります。3Dモデルはトップページと同じ `src/scene/` の部品を使うため、形状を直すと動画にも反映されます。
- 構成と動きは `tools/video/timeline.mjs`、文字は `tools/video/render.mjs` の HTML、カメラ・描画は `tools/video/scene.js`。`npm run video -- --stills 8,23` で指定した秒の静止画だけ書き出して確認できます。
- 必要なもの：ffmpeg（場所は環境変数 `FFMPEG` で指定可）、Playwright の Chromium、フォントの元ファイル（`npm run build:fonts` で `.cache/fonts` に自動ダウンロード）。
- Amazon の動画規約に合わせ、価格・限定表示・URL・連絡先・「業界最大」などの比較表現は入れていません。

## コラムの追加手順

1. 既存の記事（例：`column/hohi-kitsui.html`）を複製し、タイトル・description・canonical・og:url・JSON-LD（Article / BreadcrumbList）・本文を書き換えます。
2. `column/index.html` の一覧と、JSON-LD（CollectionPage）の記事リストに追加します。
3. `sitemap.xml` に URL を追加します。
4. 図・表は `column.css` の部品を使えます：`.points`（この記事のポイント）、`.fig`（図）、`ul.check` / `ul.ng`（チェック・NG リスト）、`ol.steps`（手順）、`.alert`（注意）、`.cards`（カード）、`.tbl`（表）。

### 表現の決まり（薬機法・景品表示法）

- 「治る・治療・改善・効果・予防・矯正・手術」など、医療的な効果を示す語は使いません。
- 製品紹介では状態名（真性包茎など）を対象として書かず、「包皮が狭い方や匂いが気になる方のためのセルフケアツール」と表記します。
- 状態を解説する記事（真性と仮性の違い・カントン包茎・何科・受診の流れ・包茎リング）には、購入ボタンと価格を置きません。
- 価格は「初期ロット100個限定価格 5,800円（税込）」のみを表示し、元値と比べる表示（二重価格表示）はしません。

## 公開（GitHub Pages）

1. GitHub のリポジトリ → Settings → Pages → Build and deployment を「Deploy from a branch」、Branch を `claude/keen-pascal-bs4hhf` / `(root)` にして Save。
2. 同画面の Custom domain に `luca-bloom.com` が入っていることを確認（リポジトリ直下の `CNAME` で自動設定）。
3. DNS（Cloudflare）に以下を登録。プロキシは「DNS のみ」（グレーの雲）にします。
   - A レコード（名前 `luca-bloom.com`）：185.199.108.153 / 185.199.109.153 / 185.199.110.153 / 185.199.111.153
   - CNAME レコード（名前 `www`）：saigonmanira-glitch.github.io
4. Pages 画面で「Enforce HTTPS」にチェック。
5. ブランチに push すると、1〜2分でサイトに反映されます。
