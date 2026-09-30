// サポートページ共通：前のページのスクロール位置を引き継がず、常にページ先頭から表示する
// （# 付きのリンクで開いたときだけ、その位置へ移動する）
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
function toTop() {
  if (!location.hash) window.scrollTo(0, 0);
}
toTop();
window.addEventListener('pageshow', toTop);
window.addEventListener('load', toTop);
