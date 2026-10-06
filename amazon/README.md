# Amazon 商品画像

| フォルダ | 内容 |
|---|---|
| `ja/` | 日本語版（Amazon.co.jp 用の元画像） |
| `en/` | 英国・オーストラリア向けの英語版（Amazon.co.uk・Amazon.com.au 用。英国式のつづり） |
| `base/` | 日本語版から日本語の文字だけを消した下地（英語版を作るための中間ファイル） |

## 画像（2000×2000）

| ファイル | 内容 | 英語版で変えた点 |
|---|---|---|
| `01-main.jpg` | 製品の特長4つ | 「業界最大の開き幅※」（他社との比較）を削除し「Two arms that open in parallel（平行に開く2本のアーム）」に。注記の「当社調べ」も削除。右上は「Japanese utility model application filed（日本で実用新案を出願済み）」 |
| `02-size-spec.jpg` | サイズ・仕様 | 文字のみ英語化（数値は同じ） |
| `03-arm-design.jpg` | アームの形と断面 | 文字のみ英語化 |
| `04-stepless.jpg` | 無段階調整 | 文字のみ英語化 |

Amazon の**メイン画像（1枚目）は白背景・文字なしの製品写真が必要**です。これらの画像は紺背景で文字を含むため、**2枚目以降のサブ画像**として使ってください。

## 作り直し方

1. 日本語版を差し替えたら `python3 tools/amazon/clean_bases.py` で下地を作り直す（文字の位置が変わった場合は、同じファイルの消す範囲も直す）
2. `npm run amazon:images` で英語版を書き出す（英語の文言は `tools/amazon/build-images.mjs`。海外で使わない語が入っていると止まる）

## 動画

英語版の動画は `npm run video -- --lang en` のあと `python3 tools/video/audio.py out/luca-bloom-amazon-en.mp4`（日本語版と同じBGMを入れる）で `out/luca-bloom-amazon-en.mp4` に書き出します。
