# Amazon 商品画像

| フォルダ | 市場（Amazon） | 言語 |
|---|---|---|
| `ja/` | 日本（Amazon.co.jp）。元画像 | 日本語 |
| `en/` | 英国（Amazon.co.uk）・オーストラリア（Amazon.com.au）・カナダ英語（Amazon.ca） | 英語（英国式のつづり。カナダも英国式のつづりのため共用） |
| `us/` | 米国（Amazon.com） | 英語（米国式のつづり。仕様にインチを併記） |
| `ca-fr/` | カナダ・フランス語（Amazon.ca） | フランス語（小数点はコンマ、「:」の前に改行しない空白） |
| `mx/` | メキシコ（Amazon.com.mx） | スペイン語（LP と同じ「tú」） |
| `base/` | 日本語版から日本語の文字だけを消した下地（各国版を作るための中間ファイル） | ― |

## 画像（2000×2000）

| ファイル | 内容 | 海外版で変えた点 |
|---|---|---|
| `01-main.jpg` | 製品の特長4つ | 「業界最大の開き幅※」（他社との比較）を削除し「平行に開く2本のアーム」に。注記の「当社調べ」も削除。右上は「日本で実用新案を出願済み」 |
| `02-size-spec.jpg` | サイズ・仕様 | 文字のみ翻訳（数値は同じ。米国版はインチを併記） |
| `03-arm-design.jpg` | アームの形と断面 | 文字のみ翻訳 |
| `04-stepless.jpg` | 無段階調整 | 文字のみ翻訳 |

Amazon の**メイン画像（1枚目）は白背景・文字なしの製品写真が必要**です。これらの画像は紺背景で文字を含むため、**2枚目以降のサブ画像**として使ってください。

## 作り直し方

1. 日本語版を差し替えたら `python3 tools/amazon/clean_bases.py` で下地を作り直す（文字の位置が変わった場合は、同じファイルの消す範囲も直す）
2. `npm run amazon:images` で全版を書き出す（`npm run amazon:images -- us` で米国版だけ）。文言は `tools/amazon/text.mjs`。海外で使わない語（病名・効果・比較・最上級・価格・「限定」）が入っていると止まる

## 動画（52秒）

| 市場 | 作り方 | 出力 |
|---|---|---|
| 英国・オーストラリア・カナダ英語 | `npm run video -- --lang en` | `out/luca-bloom-amazon-en.mp4` |
| 米国 | `npm run video -- --lang us` | `out/luca-bloom-amazon-us.mp4` |
| カナダ・フランス語 | `npm run video -- --lang fr` | `out/luca-bloom-amazon-fr.mp4` |
| メキシコ | `npm run video -- --lang es` | `out/luca-bloom-amazon-es.mp4` |

書き出したあと `python3 tools/video/audio.py out/luca-bloom-amazon-<言語>.mp4` で日本語版と同じBGMを入れます。`out/` は Git に含めません。
