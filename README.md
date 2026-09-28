# Luca Bloom LP

スマホ優先の販売用ランディングページ（単一HTML）。`index.html` を静的ホスティングに置けば動作します。

- ヒーローの3Dモデル（three.js r128）は製品写真の形状に合わせて作成。スライダーで開き幅10〜70mmを操作できます。
- イラストはすべてインラインSVG。写真素材は使用していません。

## SEO

- 公開URLは `https://luca-bloom.com/` を前提にしています（同梱カードのQRコード `https://luca-bloom.com/jp` と同じドメイン）。変更する場合は、`index.html` の canonical / og:url / og:image / JSON-LD、`robots.txt`、`sitemap.xml` のURLを置き換えてください。
- `og.png`（1200×630）、`favicon.svg`、`apple-touch-icon.png` を同梱。

## サポートページ（同梱カードのQRコードの飛び先）

- `jp/index.html` … QRコード `https://luca-bloom.com/jp` の着地ページ。「ご使用マニュアル」「取扱説明書 兼 免責事項」の選択画面
- `jp/manual.html` … 図解のご使用マニュアル（画像は `jp/img/`、同梱ガイドPDFから切り出し）
- `jp/disclaimer.html` … 取扱説明書 兼 免責事項（PDFの全文）
- `https://luca-bloom.com/jp` へのアクセスは、静的ホスティング（GitHub Pages 等）で `jp/index.html` が表示されます。
