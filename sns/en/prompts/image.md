# Image spec: English Instagram images (`sns/en/ig/001.jpg`–`030.jpg`)

Use this when making the English versions of the 30 Japanese images in `sns/ig/`. Each English image keeps **the same layout, background and product view as the Japanese image with the same number**; only the text changes. The text for each image is in `../posts.json` → `image`.

---

Create a 1080 × 1350 px JPEG (4:5, Instagram feed) for Luca Bloom, matching `sns/ig/{{id}}.jpg` exactly except for the text.

**Layout (top to bottom, 72 px side margins)**
1. Top bar: “Luca Bloom” (Quicksand 500, 34 px) on the left; on the right a pill badge “Utility model filed (JP)” (12 px, 1 px border).
2. Eyebrow: `{{image.eyebrow}}` in gold, uppercase, letter-spacing 0.2 em, 20 px.
3. Headline: `{{image.headline}}`. Bold, 64–72 px, line height 1.3, up to 3 lines, line breaks exactly as given (`\n`).
4. Product: the Luca Bloom 3D render (the same model as the website, `src/scene/`), same angle, size and position as the Japanese image. If the Japanese image shows a checklist, use `{{image.checklist}}`.
5. Chips row: `{{image.chips}}` as three pill labels.
6. Footer line (small, muted): “Foreskin care tool | General personal care product, not a medical device | 18+”.

**Colours and fonts**
- Navy background #161A29 (gradient to #262C47 behind the product) or ivory #F5F3EE, the same as the Japanese image.
- Gold #E3B34E for the eyebrow on navy; #8A6010 on ivory. Text #EEF0F6 on navy, #1A1E2C on ivory.
- Fonts: Zen Kaku Gothic New (headline, body), Quicksand (logo, numbers, eyebrow).

**Do not**
- add prices, “limited”, ratings, people, body parts, medical symbols, or any words outside the given text;
- change the product’s shape, colour or proportions.

Check before publishing: text is not cut off, nothing overlaps the product, contrast is readable on a phone, and the file is under 8 MB.

---

## 日本語訳

`sns/ig/` の日本語画像30枚の英語版を作るときの指示書です。英語版の各画像は、**同じ番号の日本語画像とレイアウト・背景・製品の見え方を同じにし、文字だけを英語に替えます**。各画像の文字は `../posts.json` の `image` に入っています。

**指示文の内容**：Luca Bloom の 1080×1350 px（縦横比4:5、インスタのフィード用）のJPEGを作る。`sns/ig/{{id}}.jpg` と文字以外は同じにする。

**レイアウト（上から順に。左右の余白72px）**
1. 上部：左に「Luca Bloom」（Quicksand 500・34px）、右に「Utility model filed (JP)」（日本で実用新案出願済み）の枠付きラベル
2. 見出し上の小さな文字：`{{image.eyebrow}}`。金色・大文字・字間0.2em・20px
3. 見出し：`{{image.headline}}`。太字64〜72px・行間1.3・最大3行。改行は指定どおり
4. 製品：サイトと同じ3Dモデル（`src/scene/`）の画像。角度・大きさ・位置は日本語画像と同じ。日本語画像にチェックリストがある場合は `{{image.checklist}}` を使う
5. 特長のラベル3つ：`{{image.chips}}`
6. 最下部の注記（小さく控えめな色）：「包皮ケアツール｜一般的なパーソナルケア用品で、医療機器ではありません｜18歳以上」

**色とフォント**：背景は日本語画像と同じ紺（#161A29、製品の後ろは#262C47へのグラデーション）か、アイボリー（#F5F3EE）。見出し上の文字は、紺の背景では金（#E3B34E）、アイボリーでは濃い金（#8A6010）。本文の文字は、紺では#EEF0F6、アイボリーでは#1A1E2C。フォントは Zen Kaku Gothic New（見出し・本文）と Quicksand（ロゴ・数字・見出し上の文字）。

**入れないもの**：価格、「限定」、評価の星、人物、体の部位、医療を連想させる記号、指定以外の文字。製品の形・色・比率も変えない。

**公開前の確認**：文字が切れていないか、製品に文字が重なっていないか、スマホで読める濃さか、ファイルが8MB未満か。
