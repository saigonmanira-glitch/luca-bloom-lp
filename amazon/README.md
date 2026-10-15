# Amazon 商品画像

同じ ASIN（商品番号）で全世界に出品するため、画像は **全世界共通の1組**（`global/`）。日本でも海外でもこの画像を使う。
説明は動画で行うので、画像は **文字をできる限り使わず**、3Dモデル・図・記号・数字（mm など）だけで機能を伝える。
見た目は LP に合わせる（淡いグレーの光、本体の後ろに青みのグレーの光、紺と金のアクセント）。

## 画像（2000×2000・JPEG）

| ファイル | 伝えること | 文字 |
|---|---|---|
| `01-main.jpg` | **メイン画像**。白い背景（RGB 255）に製品だけ（Amazon のメイン画像の決まり） | なし |
| `02-overview.jpg` | 全体と4つの特長の記号（最大70mm・無段階・手を離しても止まる・先端が太いアーム） | 70 mm |
| `03-open.jpg` | ハンドルを回すと、2本のアームが平行に開く（全閉を薄く重ねて動きを見せる） | 70 mm |
| `04-lock.jpg` | 無段階に調整でき、手を離してもその幅で止まる（内部の送りねじを透かして見せる） | 0・70 mm |
| `05-taper.jpg` | 先端が太い「逆テーパー」のアーム。くびれに皮膚（ピンク）がおさまり、太い先端で止まる | なし |
| `06-flat.jpg` | アームの外側は幅6mmの平らな面（角R2）。線ではなく面で当たり、力が分散する | 6 mm・R2 |
| `07-size.jpg` | 寸法・素材・製造国 | 寸法（mm）、POM・製造国（中国）・検品と組立（日本） |
| `08-package.jpg` | 化粧箱は背面に「Luca Bloom」だけ。さらに外箱に入れて届く（中身がわからない） | なし |
| `09-safety.jpg` | 使用の上限（1回30分・24時間で合計1時間）、就寝中は使わない、18歳以上 | 30 min・1 h / 24 h・18+ |

`ja/` は以前の日本語版（参考として残している）。

## 作り直し方

`npm run amazon:images`（一部だけなら `node tools/amazon/build-images.mjs 03 05`）で `amazon/global/` を書き出す。
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
