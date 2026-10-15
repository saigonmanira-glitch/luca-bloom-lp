# Amazon 商品画像

同じ ASIN（商品番号）で全世界に出品するため、画像は **全世界共通の1組**（`global/`）。日本でも海外でもこの画像を使う。
見た目は LP に合わせる（淡いグレーの光、本体の後ろに青みのグレーの光、紺と金のアクセント）。

## 画像（2000×2000・JPEG・3枚）

細かい説明は動画に任せ、画像は「見て欲しくなる」ことを優先する。文字は見出しと数字だけ（簡単な英語）。
本体・化粧箱・金色の立体の矢印は 3Dモデルで描く。寸法線は 3Dモデルの点から求めるので、製品の位置と一致する。

| ファイル | 見出し | 見せること |
|---|---|---|
| `01-hero.jpg` | Turn. Open. Stays put. | ハンドルの回転（立体の矢印）とアームが開く動き（残像）、横に「Luca Bloom」の文字だけの化粧箱。70 mm・Stepless・Self-lock・Discreet。製造国（中国）・日本で検品と組立・18歳以上 |
| `02-size.jpg` | 10 → 70 mm | 閉じた時（先端の外側10mm・くぼみ部5mm）と、開いた時（70mm）。ハンドルの拡大（立体の回転の矢印）と、1回転で2mm |
| `03-hold.jpg` | Wide tips. Stays in place. | 2本のアームが膜（ピンク）を内側から押し広げ、膜の口はくびれ部に収まる。全体のどこを拡大したか、アームの断面（図面どおり：幅6mm×厚さ5mm、肌側の角R2・内側R1） |

Amazon の**メイン画像（1枚目）は白い背景・文字なしの製品写真**の決まりがあるため、この4枚は2枚目以降に使う。

`ja/` は以前の日本語版（参考として残している）。

## 作り直し方

`npm run amazon:images`（一部だけなら `node tools/amazon/build-images.mjs 02 04`）で `amazon/global/` を書き出す。
組み立ては `tools/amazon/build-images.mjs`、本体と化粧箱の 3D の描画は `tools/amazon/shots.js`（LP と同じ `src/scene/` の 3Dモデルを使う）。

## 動画（65秒）

| 市場 | 作り方 | 出力 |
|---|---|---|
| 日本 | `npm run video` | `out/luca-bloom-amazon.mp4` |
| 英国・オーストラリア・カナダ英語 | `npm run video -- --lang en` | `out/luca-bloom-amazon-en.mp4` |
| 米国 | `npm run video -- --lang us` | `out/luca-bloom-amazon-us.mp4` |
| カナダ・フランス語 | `npm run video -- --lang fr` | `out/luca-bloom-amazon-fr.mp4` |
| メキシコ | `npm run video -- --lang es` | `out/luca-bloom-amazon-es.mp4` |

書き出したあと `python3 tools/video/audio.py out/luca-bloom-amazon-<言語>.mp4` で BGM を入れます。`out/` は Git に含めません。
