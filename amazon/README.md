# Amazon 商品画像

同じ ASIN（商品番号）で全世界に出品するため、画像は **全世界共通の1組**（`global/`）。日本でも海外でもこの画像を使う。
見た目は LP に合わせる（淡いグレーの光、本体の後ろに青みのグレーの光、紺と金のアクセント）。

## 画像（2000×2000・JPEG・4枚）

細かい説明は動画に任せ、画像は「見て欲しくなる」ことを優先する。大きな 3D の製品、短い英単語の見出し（日本の方にも読める簡単な語）、記号・数字で特長を伝える。

| ファイル | 見出し | 伝えること |
|---|---|---|
| `01-hero.jpg` | Turn. Open. Stays put. | 製品の全体と3つの特長（最大70mm・無段階・手を離しても止まる） |
| `02-open.jpg` | Opens up to 70 mm. | ハンドルを回すと2本のアームが平行に開く（1回転2mm）。無段階で、手を離すとその幅で止まる |
| `03-arms.jpg` | Wide tips. Stays in place. | 先端が太い「逆テーパー」のアームと、幅6mm・角R2の平らな面 |
| `04-privacy.jpg` | Discreet by design. | 化粧箱は「Luca Bloom」の文字だけ・外箱に入れて発送・日本で検品と組立。寸法・素材・製造国（中国）・18歳以上 |

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
