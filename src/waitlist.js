// 発売前の国の事前登録フォーム（tools/i18n/page.mjs の .wl-form）と、登録数の表示（.wl）
// 送信先：/api/waitlist（Cloudflare Workers。worker/）。文言はページの data-* から読む（言語ごとにページ側で用意）
const KEY = 'lb:wl'; // 登録済みの紹介コード（同じ端末で再訪したときに、共有リンクをすぐ出す）
const store = {
  get: (m) => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{}')[m] || '';
    } catch {
      return '';
    }
  },
  set: (m, code) => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...JSON.parse(localStorage.getItem(KEY) || '{}'), [m]: code }));
    } catch {
      /* 保存できない環境（プライベートモードなど）は、毎回フォームを出すだけ */
    }
  },
};
const refFromUrl = () => {
  const r = new URLSearchParams(location.search).get('ref') || '';
  return /^[a-z2-7]{8}$/.test(r) ? r : '';
};

// 登録数（.wl）を最新の値にする
function showCount(count, target) {
  if (!Number.isFinite(count) || !Number.isFinite(target)) return;
  document.querySelectorAll('.wl').forEach((box) => {
    const left = Math.max(target - count, 0);
    box.querySelector('.wl-count b').textContent = String(count);
    const bar = box.querySelector('.wl-bar');
    bar.max = target;
    bar.value = Math.min(count, target);
    const label = box.dataset.progress.replace('{c}', count).replace('{t}', target);
    bar.setAttribute('aria-label', label);
    bar.textContent = label;
    const [l, u] = box.querySelectorAll('.wl-n span');
    l.textContent = left > 0 ? box.dataset.left.replace('{n}', left) : box.dataset.done;
    u.textContent = box.dataset.live;
  });
}

// 登録後：その人専用の共有リンク（?ref=コード）を出し、シェアのボタンもそのリンクに差し替える
function showRef(form, code) {
  const url = `${form.dataset.url}?ref=${code}`;
  document.querySelectorAll('.wl-ref').forEach((ref) => {
    ref.hidden = false;
    ref.querySelector('.wl-ref-url').value = url;
  });
  const plain = encodeURIComponent(form.dataset.url);
  document.querySelectorAll('.wl-share a').forEach((a) => {
    if (!a.dataset.base) a.dataset.base = a.href;
    a.href = a.dataset.base.split(plain).join(encodeURIComponent(url));
  });
}

function initForm(form) {
  const msg = form.querySelector('.wl-msg');
  const button = form.querySelector('button[type="submit"]');
  const input = form.querySelector('input[type="email"]');
  const say = (key, bad = false) => {
    msg.textContent = form.dataset[key];
    msg.classList.toggle('bad', bad);
  };
  const saved = store.get(form.dataset.market);
  if (saved) showRef(form, saved);

  form.querySelector('.wl-copy').addEventListener('click', async (e) => {
    const field = form.querySelector('.wl-ref-url');
    try {
      await navigator.clipboard.writeText(field.value);
    } catch {
      field.select(); // クリップボードが使えない環境は、選択した状態にして手でコピーしてもらう
      return;
    }
    e.currentTarget.textContent = form.dataset.copied;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!input.checkValidity()) {
      say('invalid', true);
      input.focus();
      return;
    }
    button.disabled = true;
    say('sending');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: input.value, market: form.dataset.market, ref: refFromUrl(), website: form.elements.website.value }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        say(data.status === 'dup' ? 'dup' : 'ok');
        store.set(form.dataset.market, data.code);
        showRef(form, data.code);
        showCount(data.count, data.target);
        input.value = '';
        window.gtag?.('event', 'sign_up', { method: 'waitlist', market: form.dataset.market });
      } else {
        say(res.status === 429 ? 'rate' : res.status === 422 ? 'invalid' : 'fail', true);
      }
    } catch {
      say('fail', true);
    } finally {
      button.disabled = false;
    }
  });
}

export function initWaitlist() {
  document.querySelectorAll('.wl-form').forEach(initForm);
  fetch('/api/waitlist/count')
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => d && showCount(d.count, d.target))
    .catch(() => {}); // 読めないときは、ページに書いてある件数のまま
}
