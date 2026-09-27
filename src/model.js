// Alan mantığı: mim türleri, dereceler, alarm seviyeleri, dosya numaraları, yedek ve brifing hesapları.
// Bu modül DOM'a ve tarayıcı deposuna dokunmaz; testler doğrudan bunu çalıştırır.

import { norm, tidy, newId, isoOf, todayISO, isIsoDate, dateMs, daysBetween, weekdayName } from './util.js';

export const TYPES = {
  borc: 'Borç',
  soz: 'Söz',
  gecikme: 'Gecikme',
  laf: 'Laf',
  spoiler: 'Spoiler',
  goruldu: 'Görüldü',
  diger: 'Diğer',
};
export const LEVELS = { 1: 'Not ettim', 2: 'Unutmam', 3: 'Asla unutmam' };
export const STATUS_LABELS = { aktif: 'Mimli', affedildi: 'Affedildi', kapandi: 'Hesaplaşıldı' };
export const GROUP_SUGGESTIONS = ['Aile', 'Arkadaş', 'İş', 'Okul', 'Komşu', 'Eski sevgili', 'Diğer'];

// Isı eşikleri: taze mimler tam, eskiler giderek hafif sayılır (bkz. heat).
export const ALARM_LEVELS = [
  { id: 'sakin', label: 'Sakin', min: 0 },
  { id: 'dikkat', label: 'Dikkat', min: 2 },
  { id: 'tetikte', label: 'Tetikte', min: 4 },
  { id: 'alarm', label: 'Kırmızı alarm', min: 7 },
];
export const ARCHIVED_ALARM = { id: 'arsiv', label: 'Arşivde', min: 0 };
export const HEAT_WEIGHTS = [
  { maxDays: 30, weight: 1 },
  { maxDays: 90, weight: 0.6 },
  { maxDays: 365, weight: 0.3 },
  { maxDays: Infinity, weight: 0.1 },
];

export const MAX_NAME = 60;
export const MAX_REASON = 280;

// ---------- Temel hesaplar ----------

export const score = (p) => p.marks.reduce((s, m) => s + m.level, 0);
export const byMarkDesc = (a, b) => b.date.localeCompare(a.date) || (b.at || 0) - (a.at || 0);
export const marksDesc = (p) => p.marks.slice().sort(byMarkDesc);
export const lastMark = (p) => marksDesc(p)[0] || null;
export const firstMark = (p) => marksDesc(p).at(-1) || null;

export function heat(p, today = todayISO()) {
  return p.marks.reduce((sum, m) => {
    const age = Math.max(0, daysBetween(m.date, today));
    const { weight } = HEAT_WEIGHTS.find((w) => age <= w.maxDays);
    return sum + m.level * weight;
  }, 0);
}

export function alarmOf(p, today = todayISO()) {
  if (p.status !== 'aktif') return ARCHIVED_ALARM;
  const h = heat(p, today);
  return ALARM_LEVELS.reduce((found, a) => (h >= a.min ? a : found), ALARM_LEVELS[0]);
}

export const isStale = (p, today = todayISO()) =>
  p.status === 'aktif' && daysBetween(lastMark(p).date, today) > 365;

export const fileLabel = (n) => 'MİM-' + String(n || 0).padStart(4, '0');

const EMPTY_MARK = { date: '', at: 0 };
const byRecent = (a, b) => byMarkDesc(lastMark(a) || EMPTY_MARK, lastMark(b) || EMPTY_MARK);

export const SORTS = {
  score: { label: 'En çok mimlenen', fn: (a, b) => score(b) - score(a) || byRecent(a, b) },
  alarm: { label: 'Alarm seviyesi', fn: (a, b) => heat(b) - heat(a) || score(b) - score(a) },
  recent: { label: 'En son mimlenen', fn: byRecent },
  name: { label: 'Ada göre (A–Z)', fn: (a, b) => a.name.localeCompare(b.name, 'tr') },
  file: { label: 'Dosya no', fn: (a, b) => (a.fileNo || 0) - (b.fileNo || 0) },
};

export function matches(p, q) {
  const n = norm(q);
  if (!n) return true;
  return [p.name, p.alias, p.group, p.note].some((v) => norm(v).includes(n))
    || p.marks.some((m) => norm(m.reason).includes(n));
}

/** Ada ya da lakaba göre dosya bulur (Türkçe büyük/küçük harf duyarsız). */
export function findByName(list, name, exceptId = null) {
  const n = norm(name);
  if (!n) return null;
  return list.find((p) => p.id !== exceptId && (norm(p.name) === n || (p.alias && norm(p.alias) === n))) || null;
}

// ---------- Oluşturma ve temizleme ----------

export const nextFileNo = (list) => list.reduce((mx, p) => Math.max(mx, p.fileNo || 0), 0) + 1;

export function createPerson(name, list, now = Date.now()) {
  return {
    id: newId('p'),
    fileNo: nextFileNo(list),
    name: tidy(name).slice(0, MAX_NAME),
    alias: '',
    group: '',
    note: '',
    status: 'aktif',
    statusAt: now,
    createdAt: now,
    updatedAt: now,
    marks: [],
  };
}

export function createMark({ reason, type, level, date }, now = Date.now()) {
  return {
    id: newId('m'),
    reason: String(reason || '').trim().slice(0, MAX_REASON),
    type: TYPES[type] ? type : 'diger',
    level: [1, 2, 3].includes(level) ? level : 1,
    date: isIsoDate(date) ? date : isoOf(now),
    at: now,
  };
}

export function cleanMark(m) {
  if (!m || typeof m.reason !== 'string' || !m.reason.trim() || !isIsoDate(m.date)) return null;
  const mark = {
    id: typeof m.id === 'string' && m.id ? m.id : newId('m'),
    reason: m.reason.trim().slice(0, 500),
    type: TYPES[m.type] ? m.type : 'diger',
    level: [1, 2, 3].includes(m.level) ? m.level : 1,
    date: m.date,
    at: Number(m.at) || dateMs(m.date),
  };
  if (Number(m.editedAt)) mark.editedAt = Number(m.editedAt);
  return mark;
}

/** Depodan ya da yedekten gelen ham kaydı güvenli bir dosyaya çevirir; bozuksa null. */
export function cleanPerson(raw, id) {
  if (!raw || typeof raw !== 'object' || typeof raw.name !== 'string' || !raw.name.trim() || !Array.isArray(raw.marks)) return null;
  const marks = raw.marks.map(cleanMark).filter(Boolean);
  if (!marks.length) return null;
  const text = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  return {
    id: id || (typeof raw.id === 'string' && raw.id) || newId('p'),
    fileNo: Number.isInteger(raw.fileNo) && raw.fileNo > 0 ? raw.fileNo : 0,
    name: tidy(raw.name).slice(0, MAX_NAME),
    alias: text(raw.alias, 40),
    group: text(raw.group, 30),
    note: text(raw.note, 1000),
    status: STATUS_LABELS[raw.status] ? raw.status : 'aktif',
    statusAt: Number(raw.statusAt) || 0,
    createdAt: Number(raw.createdAt) || 0,
    updatedAt: Number(raw.updatedAt) || 0,
    marks,
  };
}

/**
 * Dosya numarası olmayanlara (eski sürümden gelen kayıtlar) sırayla numara verir.
 * Mevcut numaralara dokunmaz, çakışan numarayı yeniden dağıtır.
 */
export function assignFileNos(list) {
  const seen = new Set();
  for (const p of list) {
    if (p.fileNo && seen.has(p.fileNo)) p.fileNo = 0;
    if (p.fileNo) seen.add(p.fileNo);
  }
  let max = list.reduce((mx, p) => Math.max(mx, p.fileNo || 0), 0);
  list
    .filter((p) => !p.fileNo)
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0) || a.id.localeCompare(b.id))
    .forEach((p) => { p.fileNo = ++max; });
  return list;
}

// ---------- Yedek ----------

export const BACKUP_KIND = 'mimlesek-yedek';

export function makeBackup(list, now = Date.now()) {
  return { tur: BACKUP_KIND, surum: 2, alinma: new Date(now).toISOString(), kisiler: list };
}

export function parseBackup(text) {
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('Dosya okunamadı: geçerli bir JSON değil.'); }
  const raw = Array.isArray(data) ? data : data && data.kisiler;
  if (!Array.isArray(raw)) throw new Error('Bu bir Mimlesek yedeğine benzemiyor.');
  const people = raw.map((p) => cleanPerson(p)).filter(Boolean);
  if (raw.length && !people.length) throw new Error('Yedekte okunabilir dosya bulunamadı.');
  return people;
}

/**
 * Yedeği mevcut defterle birleştirir. Aynı kimlikli dosyada yenisi kazanır;
 * aynı adlı farklı dosyaların mimleri tek dosyada toplanır. Hiçbir şey silinmez.
 */
export function mergePeople(current, incoming) {
  const list = current.map((p) => structuredClone(p));
  let added = 0;
  let updated = 0;
  for (const inc of incoming) {
    const i = list.findIndex((p) => p.id === inc.id);
    if (i >= 0) {
      if ((inc.updatedAt || 0) > (list[i].updatedAt || 0)) { list[i] = structuredClone(inc); updated++; }
      continue;
    }
    const same = findByName(list, inc.name);
    if (same) {
      const known = new Set(same.marks.map((m) => m.id));
      const fresh = inc.marks.filter((m) => !known.has(m.id));
      if (fresh.length) { same.marks.push(...structuredClone(fresh)); same.updatedAt = Date.now(); updated++; }
      continue;
    }
    list.push(structuredClone(inc));
    added++;
  }
  assignFileNos(list);
  return { list, added, updated };
}

// ---------- Brifing ----------

export function briefing(list, today = todayISO()) {
  const active = list.filter((p) => p.status === 'aktif');
  const forgiven = list.filter((p) => p.status === 'affedildi');
  const settled = list.filter((p) => p.status === 'kapandi');
  const marks = list.flatMap((p) => p.marks);
  const age = (m) => daysBetween(m.date, today);
  const mimOf = (arr) => arr.reduce((s, m) => s + m.level, 0);
  const last30 = marks.filter((m) => age(m) >= 0 && age(m) < 30);
  const prev30 = marks.filter((m) => age(m) >= 30 && age(m) < 60);

  const forgiveDays = forgiven
    .filter((p) => p.statusAt)
    .map((p) => Math.max(0, daysBetween(firstMark(p).date, isoOf(p.statusAt))));

  const [ty, tm] = today.split('-').map(Number);
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(ty, tm - 1 - i, 1);
    months.push({ y: d.getFullYear(), m: d.getMonth(), key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, mim: 0, kayit: 0 });
  }
  const monthIndex = new Map(months.map((x, i) => [x.key, i]));
  for (const m of marks) {
    const i = monthIndex.get(m.date.slice(0, 7));
    if (i !== undefined) { months[i].mim += m.level; months[i].kayit++; }
  }

  const types = Object.keys(TYPES).map((type) => ({ type, label: TYPES[type], mim: 0, kayit: 0 }));
  for (const m of marks) {
    const row = types.find((t) => t.type === m.type);
    row.mim += m.level;
    row.kayit++;
  }
  types.sort((a, b) => b.mim - a.mim || b.kayit - a.kayit);

  const byWeekday = Array(7).fill(0);
  for (const m of marks) byWeekday[new Date(dateMs(m.date)).getDay()] += m.level;
  const peak = Math.max(...byWeekday);

  return {
    people: list.length,
    active: active.length,
    activeMim: active.reduce((s, p) => s + score(p), 0),
    totalMim: mimOf(marks),
    records: marks.length,
    last30Mim: mimOf(last30),
    last30Records: last30.length,
    prev30Mim: mimOf(prev30),
    forgiven: forgiven.length,
    settled: settled.length,
    forgiveRate: list.length ? forgiven.length / list.length : 0,
    avgForgiveDays: forgiveDays.length ? Math.round(forgiveDays.reduce((s, d) => s + d, 0) / forgiveDays.length) : null,
    months,
    types,
    topType: types[0] && types[0].mim ? types[0] : null,
    busiestWeekday: peak > 0 ? weekdayName(byWeekday.indexOf(peak)) : null,
    wanted: active.slice().sort(SORTS.alarm.fn).slice(0, 5),
  };
}
