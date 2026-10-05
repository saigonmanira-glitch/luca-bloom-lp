# Per-post prompt (user message)

Send this as the **user message**, with `system.md` as the system prompt. Replace the `{{…}}` values from one entry in `../posts.json` (or write new ones).

---

Write one social post for Luca Bloom.

- Post ID: {{id}}
- Theme: {{theme}}
- Text on the image: eyebrow “{{image.eyebrow}}”, headline “{{image.headline}}”
- Key point to get across: {{point}}
- Platforms: Instagram, X, Threads

Reply with **JSON only**, in exactly this shape:

```json
{
  "id": "{{id}}",
  "instagram": "60–150 words, short paragraphs separated by blank lines, ending with “Link in bio.” and then 3–5 allowed hashtags",
  "x": "≤ 280 characters including https://luca-bloom.com/en/ (counts as 23)",
  "threads": "≤ 500 characters including https://luca-bloom.com/en/",
  "alt": "Image description for screen readers, ≤ 200 characters",
  "ja": {
    "instagram": "Japanese translation of the Instagram caption",
    "x": "Japanese translation of the X post",
    "threads": "Japanese translation of the Threads post"
  },
  "check": "One line confirming that no banned words, medical claims, prices or comparisons are used"
}
```

Do not add anything outside the JSON.

---

## 日本語訳

投稿ごとにAIへ送る**依頼文（ユーザーメッセージ）**です。システムプロンプトには `system.md` を使います。`{{…}}` の部分は `../posts.json` の1件分の値に置き換えます（新しい内容を書いても構いません）。

> Luca Bloom の投稿を1件書いてください。
> - 投稿ID：{{id}}
> - テーマ：{{theme}}
> - 画像の文字：見出し上の小さな文字「{{image.eyebrow}}」、見出し「{{image.headline}}」
> - 伝えたい要点：{{point}}
> - 媒体：Instagram、X、Threads
>
> 返答は**JSONだけ**で、上の形にしてください。
> - instagram：60〜150語。短い段落を空行で区切り、最後に「Link in bio.」と、使ってよいハッシュタグを3〜5個
> - x：リンク https://luca-bloom.com/en/（23文字として数える）を含めて280文字以内
> - threads：リンクを含めて500文字以内
> - alt：画面読み上げ用の画像の説明（代替テキスト）、200文字以内
> - ja：各投稿文の日本語訳（内容確認用）
> - check：禁止語・医療的な効果・価格・比較を使っていないことの確認を1行で
>
> JSON以外は書かないでください。

**AIの出力を投稿する前に**：`node tools/sns-check.mjs <出力したJSONファイル>` で、文字数と禁止語を自動で確認できます（README 参照）。
