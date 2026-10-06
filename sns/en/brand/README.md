# 海外向け SNS ブランド素材

海外アカウント（X・Instagram・Threads・Facebook・YouTube）のプロフィール設定に使う画像と紹介文です。
画像は `npm run sns:brand`（`tools/sns/build-brand.mjs`）で作り直せます。文言は海外LPと同じで、各国の規制に合わせた表現だけを使っています（病名・効果・比較・価格・「限定」を入れない）。製品の絵は LP と同じ3Dモデルから描いています。

## 市場ごとの使い分け

| 末尾 | 市場 | 言語 | 画像の右上・下の案内 | リンク先 |
|---|---|---|---|---|
| `-en` | 英国・オーストラリア | 英語 | On Amazon UK & Amazon Australia（Amazon 英国・豪州で販売中） | luca-bloom.com/en |
| `-us` | 米国 | 英語 | Coming to the US, Canada & Mexico · Goal: 2026（米・加・墨で近日発売・目標2026年） | luca-bloom.com/us |
| `-ca` | カナダ | 英語 | 同上 | luca-bloom.com/ca |
| `-ca-fr` | カナダ | フランス語 | Bientôt aux États-Unis, au Canada et au Mexique · Objectif : 2026（同上） | luca-bloom.com/ca/fr |
| `-mx` | メキシコ | スペイン語 | Muy pronto en EE. UU., Canadá y México · Meta: 2026（同上） | luca-bloom.com/mx |

英語アカウントを1つで運用する場合は、英国・豪州で販売中のあいだは `-en`、北米の投票を呼びかける時期は `-us` を使ってください。

## ファイル

| ファイル | 用途 | サイズ | 隠れる・切れる範囲への配慮 |
|---|---|---|---|
| `icon.png` / `icon.svg` | プロフィールアイコン（紺背景。全SNS共通） | 1000×1000 | 円形に切り抜かれても欠けないよう、図柄は直径の70%以内 |
| `icon-white.png` / `icon-white.svg` | プロフィールアイコン（白背景版） | 1000×1000 | 同上 |
| `x-header-*.png` | X のヘッダー | 1500×500 | 左下（横0〜380・縦330〜500）はアイコンで隠れるため、文字を置いていない |
| `facebook-cover-*.png` | Facebook ページのカバー | 1640×624 | スマホでは左右が切れて中央の幅約1110pxだけが見えるため、文字と製品を中央に寄せている |
| `youtube-banner-*.png` | YouTube のチャンネルバナー | 2560×1440 | 全端末で見える中央の 1546×423 の範囲に、文字と製品を収めている |
| `vote-portrait-*.png` | 投票の呼びかけ投稿（Instagram・Threads、縦長） | 1080×1350 | ― |
| `vote-landscape-*.png` | 投票の呼びかけ投稿（X・Facebook、横長） | 1600×900 | ― |
| `product.png` | 製品だけの画像（背景が透明） | 1813×1177 | 投稿画像を作るときの素材 |

アイコンは日本語版（別ブランチの `sns/brand/`）と同じものです。文字が入っていないため、海外でもそのまま使えます。投票の呼びかけ画像（`vote-*`）は、米国・カナダ・メキシコの市場だけにあります。票数は変わるため画像には入れず、LP で確認してもらう形にしています。

## 紹介文（北米の投票期間用）

英国・豪州用の紹介文は `sns/en/README.md` にあります。

### X（上限160文字）

英語（155文字）

```
Foreskin care tool from Tokyo. Opens up to 70 mm, stepless, stays where you stop. Not a medical device. 18+. Coming to the US, Canada & Mexico: vote below.
```

日本語訳：東京発の包皮ケアツール。最大70mmまで無段階に開き、止めた位置で保たれます。医療機器ではありません。18歳以上。米国・カナダ・メキシコで近日発売：下のリンクから投票を。

フランス語（154文字）

```
Soin du prépuce, de Tokyo. Jusqu’à 70 mm, sans paliers, tient en place. Boîte discrète. Pas un instrument médical. 18+. Bientôt au Canada : votez au lien.
```

日本語訳：東京発の包皮ケア。最大70mm、無段階、止めた位置で保たれます。中身がわからない箱。医療機器ではありません。18歳以上。カナダで近日発売：リンクから投票を。

スペイン語（150文字）

```
Cuidado del prepucio, desde Tokio. Abre hasta 70 mm, ajuste continuo, no se mueve. No es un dispositivo médico. 18+. Muy pronto en México: vota abajo.
```

日本語訳：東京発の包皮ケア。最大70mmまで開き、無段階に調整でき、動きません。医療機器ではありません。18歳以上。メキシコで近日発売：下から投票を。

### Instagram・Threads（上限150文字）

英語（149文字）　名前欄：`Luca Bloom | Foreskin care tool`

```
Foreskin care tool
▷ Opens up to 70 mm, stepless
▷ Stays put when you let go
▷ Discreet box
Not a medical device · 18+
Vote for the US/CA/MX launch ↓
```

日本語訳：包皮ケアツール／▷ 最大70mmまで無段階に開く／▷ 手を離しても止まる／▷ 中身がわからない箱／医療機器ではありません・18歳以上／米国・カナダ・メキシコでの発売に投票を↓

フランス語（137文字）　名前欄：`Luca Bloom | Soin du prépuce`

```
Soin du prépuce
▷ Jusqu’à 70 mm, sans paliers
▷ Tient en place
▷ Boîte discrète
Pas un instrument médical · 18+
Votez pour le lancement ↓
```

日本語訳：包皮ケア／▷ 最大70mm・無段階／▷ 止めた位置で保たれる／▷ 中身がわからない箱／医療機器ではありません・18歳以上／発売に投票を↓

スペイン語（138文字）　名前欄：`Luca Bloom | Cuidado del prepucio`

```
Cuidado del prepucio
▷ Abre hasta 70 mm
▷ No se mueve al soltarla
▷ Caja discreta
No es dispositivo médico · 18+
Vota por el lanzamiento ↓
```

日本語訳：包皮ケア／▷ 最大70mmまで開く／▷ 手を離しても動かない／▷ 中身がわからない箱／医療機器ではありません・18歳以上／発売に投票を↓

プロフィールのリンク：米国 `https://luca-bloom.com/us/`、カナダ `https://luca-bloom.com/ca/`（フランス語 `https://luca-bloom.com/ca/fr/`）、メキシコ `https://luca-bloom.com/mx/`
