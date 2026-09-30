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
  - **スクロール連動カメラ**（`src/scene/tour.js`）：3D表示ブロックを画面の縦中央に固定し、その下の空き領域（1.5画面分）のスクロールで「01 全景 → 02 内部構造（外箱を透過・送りねじとリリースプレートに引き出し線）→ 03 開き幅（アームに引き出し線）」と切り替えます。カメラを動かすだけで描画パスは増えません。「動きを減らす」設定・`overflow: clip` 非対応ブラウザ（Safari 15 以前など）・3D を表示できない場合は使わず、空き領域も出しません。
  - 3D が描画されるまで、また WebGL が使えない・three.js を読み込めない場合は `hero-fallback.webp` を表示します。
  - タブが非表示の間と、3D が画面外にある間は描画を止めます。
- **フォント**：Zen Kaku Gothic New（400/700/900）・Quicksand・Montserrat（化粧箱ロゴ用）を自サイトから配信します（外部サービスへの接続なし）。各太さには、実際にその太さで表示される文字だけを収録しています（合計約240KB）。`font-display: swap` のため、フォントの読み込み中も文字は先に表示されます。
- **構造化データ**：Product（価格 5,800円・税込）、FAQPage、WebPage。FAQ の文言を変えるときは、画面の FAQ と JSON-LD の両方を直してください。

## JavaScript のビルド

- 編集は `src/` で行い、`npm install`（初回のみ）→ `npm run build` を実行して、`assets/js/` もコミットします。
- `npm run build` は JavaScript とフォントの両方を作ります（個別には `npm run build:js` / `npm run build:fonts`）。**ページの文章を変えたら、必ず `npm run build:fonts` を実行して `assets/fonts/` と各ページをコミットしてください**（新しい文字がフォントに入らず、その文字だけ別の書体で表示されるのを防ぐため）。
- `build:fonts` は Playwright があると、ページを実際に表示して太さごとに必要な文字だけを収録します（無い場合は全ての文字を全ての太さに収録）。
- Google アナリティクス 4 は `src/app.js` の `GA_ID` に測定ID（G- から始まる文字列）を入れてビルドすると有効になります。有効にする際は `privacy.html` の「5. アクセス解析ツール・外部サービス」も書き換えてください。

## 自動テスト

- `npm run verify` で、次のすべてを実行します（GitHub では push のたびに自動実行。結果はリポジトリの「Actions」タブで確認できます）。
  - `npm run lint`：ESLint（JavaScript）と html-validate（HTML）の文法チェック
  - `npm run check`：サイト内リンク・画像等の参照先・title/description/canonical・sitemap.xml の確認
  - `npm test`：ブラウザ（Chromium）での動作テスト 24項目（全ページの表示とエラー、404、3Dの描画、スライダー、スクロール連動カメラ、WebGL強制終了・非対応時の静止画、化粧箱の遅延読み込み、購入ボタンのリンク、購入バー）
- GitHub Actions では、`src/` からビルドした結果が `assets/js/` と一致するかも確認します（ビルド忘れの防止）。
- 初回のみ `npx playwright install chromium` が必要です。

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
