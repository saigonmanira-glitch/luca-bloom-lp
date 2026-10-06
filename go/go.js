// 中継ページ：計測スクリプトの読み込みを待ってから、リンク先(Amazon)へ移動する
/* global document, setTimeout, location */
const a = document.getElementById('go');
if (a) setTimeout(() => location.replace(a.href), 800);
