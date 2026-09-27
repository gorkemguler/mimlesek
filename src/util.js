// Küçük yardımcılar: metin kaçışı, tarih hesapları ve Türkçe biçimlendirme.

export const DAY = 86400000;

const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC_MAP[c]);

/** Boşlukları toparlar. Ad gibi alanlarda "  Ali   Veli " → "Ali Veli". */
export const tidy = (s) => String(s || '').trim().replace(/\s+/g, ' ');

/** Karşılaştırma anahtarı: Türkçe küçük harf, toparlanmış boşluk. "İPEK" ile "ipek" eşleşir. */
export const norm = (s) => tidy(s).toLocaleLowerCase('tr');

export const newId = (prefix) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/** Yerel saat dilimine göre YYYY-AA-GG. */
export function isoOf(ms) {
  const offset = new Date(ms).getTimezoneOffset() * 60000;
  return new Date(ms - offset).toISOString().slice(0, 10);
}
export const todayISO = () => isoOf(Date.now());
export const isIsoDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

export function dateMs(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}
export const daysBetween = (fromIso, toIso) => Math.round((dateMs(toIso) - dateMs(fromIso)) / DAY);

const rtf = new Intl.RelativeTimeFormat('tr', { numeric: 'auto' });
const dtfShort = new Intl.DateTimeFormat('tr', { day: 'numeric', month: 'short', year: 'numeric' });
const dtfLong = new Intl.DateTimeFormat('tr', { day: 'numeric', month: 'long', year: 'numeric' });
const monthShort = new Intl.DateTimeFormat('tr', { month: 'short' });
const monthLong = new Intl.DateTimeFormat('tr', { month: 'long', year: 'numeric' });
const weekday = new Intl.DateTimeFormat('tr', { weekday: 'long' });

/** "bugün", "dün", "3 gün önce", "geçen hafta", "2 ay önce", "geçen yıl"… */
export function ago(iso, today = todayISO()) {
  const days = daysBetween(iso, today);
  if (days <= 0) return 'bugün';
  if (days < 7) return rtf.format(-days, 'day');
  if (days < 30) return rtf.format(-Math.floor(days / 7), 'week');
  if (days < 365) return rtf.format(-Math.floor(days / 30), 'month');
  return rtf.format(-Math.floor(days / 365), 'year');
}

export const fmtDate = (iso) => dtfShort.format(new Date(dateMs(iso)));
export const fmtDateLong = (iso) => dtfLong.format(new Date(dateMs(iso)));
export const fmtMonthShort = (y, m) => monthShort.format(new Date(y, m, 1));
export const fmtMonthLong = (y, m) => monthLong.format(new Date(y, m, 1));
/** 0 = pazar … 6 = cumartesi */
export const weekdayName = (i) => weekday.format(new Date(2024, 0, 7 + i)).toLocaleLowerCase('tr');
export const pct = (x) => '%' + Math.round(x * 100);
export const fmtNum = (x) => new Intl.NumberFormat('tr').format(x);
