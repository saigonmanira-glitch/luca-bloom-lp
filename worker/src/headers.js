// サイトの安全設定（ファイルを直接返すときは _site/_headers の同じ内容が付く。Worker が返すページにはここで付ける）
export const SECURITY = {
  'strict-transport-security': 'max-age=15552000',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'SAMEORIGIN',
  'referrer-policy': 'same-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=()',
  'cross-origin-opener-policy': 'same-origin',
  'content-security-policy': "frame-ancestors 'self'; base-uri 'none'; object-src 'none'; upgrade-insecure-requests",
};
export const HEADERS_FILE = `/*\n${Object.entries(SECURITY).map(([k, v]) => `  ${k}: ${v}`).join('\n')}\n`;
