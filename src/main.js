// Uygulamanın merkezi: durum, olaylar, görünümler arası geçiş ve kayıt.

import { esc, tidy, todayISO, isoOf, ago } from './util.js';
import {
  TYPES, GROUP_SUGGESTIONS, SORTS, MAX_REASON, MAX_NAME,
  score, matches, findByName, createPerson, createMark, assignFileNos,
  briefing, makeBackup, parseBackup, mergePeople,
} from './model.js';
import {
  readPrefs, writePrefs, readLocalPeople, clearLocalPeople,
  createLocalStore, createMemoryStore, connectCloud, inArtifact, offerFile,
} from './store.js';
import { demoPeople } from './demo.js';
import { wireTips } from './charts.js';
import { rowHTML, emptyRowsHTML, dosyaHTML, brifingHTML } from './views.js';

const APP_VERSION = '2.0.0';
const VIEW_TITLES = { defter: 'Defter', brifing: 'Brifing', ayarlar: 'Ayarlar' };
const STATUS_TABS = [
  { id: 'aktif', label: 'Mimliler' },
  { id: 'affedildi', label: 'Affedilenler' },
  { id: 'kapandi', label: 'Hesaplaşılanlar' },
  { id: 'hepsi', label: 'Hepsi' },
];
const STATUS_ACTIONS = {
  forgive: { status: 'affedildi', msg: (p) => `${p.name} affedildi. Büyüklük sende.` },
  settle: { status: 'kapandi', msg: (p) => `${p.name} ile hesap kapandı.` },
  reopen: { status: 'aktif', msg: (p) => `${p.name} yeniden mimliler arasında.` },
};

const $ = (sel, root = document) => root.querySelector(sel);
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const S = {
  people: [],
  store: null,
  storeState: 'local', // 'local' | 'cloud' | 'demo' | 'connecting'
  demo: false,
  view: 'defter',
  tab: 'aktif',
  q: '',
  sort: 'score',
  stamped: null,
  dosya: { id: null, editIdentity: false, editMark: null, confirmDestroy: false, error: '' },
  cloudUnsub: null,
  cloudSettled: false,
  localSeed: [],
  pendingLocal: [],
  prefs: readPrefs(),
  undo: null,
  installEvent: null,
};
const SAMPLES = demoPeople().slice(0, 4);

const el = {
  banner: $('#banner'),
  form: $('#form'),
  name: $('#f-name'),
  reason: $('#f-reason'),
  date: $('#f-date'),
  hint: $('#name-hint'),
  formError: $('#form-error'),
  count: $('#reason-count'),
  composer: $('#composer'),
  composerToggle: $('#composer-toggle'),
  rows: $('#rows'),
  tabs: $('#tabs'),
  q: $('#q'),
  sort: $('#sort'),
  ledgerNotice: $('#ledger-notice'),
  brifing: $('#brifing-root'),
  dosya: $('#dosya'),
  dosyaRoot: $('#dosya-root'),
  toast: $('#toast'),
  toastText: $('#toast-text'),
  toastAction: $('#toast-action'),
};

// ---------- Bildirim ----------

let toastTimer;
function hideToast() {
  el.toast.classList.remove('show');
  el.toastAction.onclick = null;
}
function toast(msg, opts = {}) {
  el.toastText.textContent = msg;
  const withAction = Boolean(opts.action);
  el.toastAction.hidden = !withAction;
  el.toast.classList.toggle('has-action', withAction);
  el.toastAction.textContent = opts.action || '';
  el.toastAction.onclick = withAction ? () => { hideToast(); opts.onAction(); } : null;
  el.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, withAction ? 6500 : 2800);
}
function offerUndo(msg, restore) {
  S.undo = restore;
  toast(msg, {
    action: 'Geri al',
    onAction: () => {
      const r = S.undo;
      S.undo = null;
      if (r) r();
    },
  });
}

// ---------- Kayıt ----------

function save(p) {
  p.updatedAt = Date.now();
  S.store.put(p, S.people).catch(onStoreError);
}
function drop(id) {
  S.store.remove(id, S.people).catch(onStoreError);
}
function onStoreError(e) {
  const code = e && e.code;
  if (code === 'local_unavailable') { toast('Bu tarayıcı kayıt tutmaya izin vermiyor. Sayfayı kapatınca mimler kaybolur; yedek al.'); return; }
  if (code === 'quota_exceeded') { toast('Defter doldu. Birkaç eski dosyayı silince yeniden mim koyabilirsin.'); return; }
  if (code === 'resource_exhausted') { toast('Çok hızlı kayıt yapıldı. Birkaç saniye sonra tekrar dene.'); return; }
  if (S.store && S.store.kind === 'cloud') fallBackToLocal(true);
  else toast('Kaydedilemedi. Sayfayı yenileyip tekrar dene.');
}

function fallBackToLocal(afterFailedWrite) {
  if (S.cloudUnsub) { try { S.cloudUnsub(); } catch { /* zaten kapalı */ } S.cloudUnsub = null; }
  S.store = createLocalStore();
  S.storeState = 'local';
  S.pendingLocal = [];
  if (afterFailedWrite) {
    const byId = new Map(readLocalPeople().map((p) => [p.id, p]));
    S.people.forEach((p) => byId.set(p.id, p));
    S.people = assignFileNos([...byId.values()]);
    S.store.sync(S.people, [], S.people).catch(onStoreError);
    toast('Hesabına kaydedilemedi. Mimler bundan sonra bu tarayıcıda tutulacak.');
  } else {
    S.people = assignFileNos(readLocalPeople());
  }
  renderAll();
}

async function startCloud() {
  S.storeState = 'connecting';
  const cloud = await connectCloud();
  if (!cloud) { S.storeState = 'local'; render(); return; }
  S.localSeed = S.people.slice();
  S.cloudUnsub = cloud.subscribe((list, definitive) => {
    S.store = cloud;
    S.storeState = 'cloud';
    S.people = assignFileNos(list);
    if (!S.cloudSettled) {
      S.pendingLocal = S.localSeed.filter((lp) => !list.some((p) => p.id === lp.id));
      if (definitive) S.cloudSettled = true;
    }
    renderAll();
  }, () => fallBackToLocal(false));
}

async function migrateLocal() {
  const list = S.pendingLocal;
  S.pendingLocal = [];
  S.localSeed = [];
  render();
  const changed = [];
  for (const lp of list) {
    const same = findByName(S.people, lp.name);
    if (same) {
      const known = new Set(same.marks.map((m) => m.id));
      same.marks.push(...lp.marks.filter((m) => !known.has(m.id)));
      changed.push(same);
    } else {
      S.people.push(lp);
      changed.push(lp);
    }
  }
  assignFileNos(S.people);
  try {
    await S.store.sync(changed, [], S.people);
  } catch (e) {
    onStoreError(e);
    return;
  }
  clearLocalPeople();
  toast(`${list.length} dosya hesabına taşındı.`);
  renderAll();
}

// ---------- Görünüm geçişi ----------

function route() {
  const h = location.hash.slice(1);
  S.view = VIEW_TITLES[h] ? h : 'defter';
  for (const v of Object.keys(VIEW_TITLES)) $(`#view-${v}`).hidden = v !== S.view;
  document.querySelectorAll('.nav a').forEach((a) => {
    if (a.dataset.view === S.view) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  document.title = S.view === 'defter' ? 'Mimlesek' : `${VIEW_TITLES[S.view]} · Mimlesek`;
}
function go(view) {
  if (location.hash.slice(1) === view) return;
  location.hash = view;
}
window.addEventListener('hashchange', () => {
  route();
  render();
  window.scrollTo({ top: 0, behavior: 'auto' });
});

// ---------- Çizim ----------

function render() {
  const real = S.people.length > 0;
  const src = real ? S.people : SAMPLES;
  const today = todayISO();
  renderBanner();
  if (S.view === 'defter') renderDefter(src, !real, today);
  if (S.view === 'brifing') el.brifing.innerHTML = brifingHTML(briefing(src, today), { sample: !real, today });
  if (S.view === 'ayarlar') renderSettings();
  renderLists();
  renderFooter();
}

/** Veri dışarıdan değiştiğinde (bulut, içe aktarma, geri alma): açık dosya düzenlenmiyorsa onu da tazele. */
function renderAll() {
  render();
  if (S.dosya.id && !S.dosya.editIdentity && !S.dosya.editMark) renderDosya();
}

function renderBanner() {
  const parts = [];
  if (S.demo) {
    parts.push(`<div class="banner"><span><b>Demo defteri.</b> Kişiler kurgusal; yaptığın değişiklikler kaydedilmez.</span><a class="btn" href="./">Kendi defterime geç</a></div>`);
  }
  if (S.storeState === 'cloud' && S.pendingLocal.length) {
    parts.push(`<div class="banner"><span>Bu tarayıcıda ${S.pendingLocal.length} dosyalık eski bir defter var.</span><button type="button" class="btn" data-act="migrate">Hesabıma taşı</button></div>`);
  }
  el.banner.innerHTML = parts.join('');
}

function renderDefter(src, sample, today) {
  const b = briefing(src, today);
  $('#t-active').textContent = b.active;
  $('#t-marks').textContent = b.activeMim;
  $('#t-month').textContent = b.last30Mim;
  $('#t-forgiven').textContent = b.forgiven;
  const top = src.filter((p) => p.status === 'aktif').sort(SORTS.score.fn)[0];
  $('#leader').innerHTML = top
    ? `Listenin başında <b>${esc(top.name)}</b>, ${score(top)} mimle.`
    : 'Şu an kimse mimli değil.';

  el.tabs.innerHTML = STATUS_TABS.map((t) => {
    const n = t.id === 'hepsi' ? src.length : src.filter((p) => p.status === t.id).length;
    return `<button type="button" class="tab" data-tab="${t.id}" aria-pressed="${S.tab === t.id}">${t.label}<span class="n">${n}</span></button>`;
  }).join('');

  el.ledgerNotice.innerHTML = sample
    ? `<div class="notice"><span><b>Defterin boş.</b> Aşağıdakiler örnek; ilk mimini koyduğunda kaybolurlar.</span>${
      inArtifact() ? '' : '<a class="btn" href="?demo">Demo defterini gez</a>'}</div>`
    : '';

  renderRows(src, sample, today);
}

// Satırlar yalnızca değiştiklerinde yeniden çizilir; böylece mühür animasyonu yarıda kesilmez.
const rowCache = new Map();
function renderRows(src, sample, today) {
  const items = src
    .filter((p) => (S.tab === 'hepsi' || p.status === S.tab) && matches(p, S.q))
    .sort(SORTS[S.sort].fn);

  if (!items.length) {
    rowCache.clear();
    el.rows.innerHTML = emptyRowsHTML({ q: S.q, tab: S.tab });
    return;
  }
  const nodes = items.map((p) => {
    const html = rowHTML(p, { sample, today });
    const cached = rowCache.get(p.id);
    if (cached && cached.html === html) return cached.node;
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    const node = t.content.firstElementChild;
    rowCache.set(p.id, { html, node });
    return node;
  });
  const keep = new Set(items.map((p) => p.id));
  for (const k of rowCache.keys()) if (!keep.has(k)) rowCache.delete(k);

  let ref = el.rows.firstChild;
  for (const n of nodes) {
    if (n === ref) { ref = ref.nextSibling; continue; }
    el.rows.insertBefore(n, ref);
  }
  while (ref) { const next = ref.nextSibling; ref.remove(); ref = next; }

  if (S.stamped) {
    const stamp = rowCache.get(S.stamped)?.node.querySelector('.stamp');
    if (stamp) {
      stamp.classList.add('thunk');
      stamp.addEventListener('animationend', () => stamp.classList.remove('thunk'), { once: true });
    }
    S.stamped = null;
  }
}

function renderLists() {
  $('#names').innerHTML = S.people.map((p) => `<option value="${esc(p.name)}"></option>`).join('');
  const groups = [...new Set([...GROUP_SUGGESTIONS, ...S.people.map((p) => p.group).filter(Boolean)])];
  $('#group-list').innerHTML = groups.map((g) => `<option value="${esc(g)}"></option>`).join('');
}

const STORE_TEXT = {
  local: 'Defterin bu tarayıcının yerel deposunda duruyor. Sunucuya hiçbir şey gönderilmez. Tarayıcı verilerini silersen defter de gider; ara sıra yedek al.',
  cloud: 'Defterin sana özel bir alana kaydediliyor. Bu sayfayı açan başka biri senin mimlerini göremez.',
  demo: 'Demo defterindesin. Hiçbir değişiklik kaydedilmez; sayfayı yenileyince her şey başa döner.',
  connecting: 'Defter açılıyor…',
};
const STORE_SHORT = {
  local: 'Kayıt yeri: bu tarayıcı. Sunucu yok, iz yok.',
  cloud: 'Kayıt yeri: sana özel alan. Başkaları göremez.',
  demo: 'Demo modu: hiçbir şey kaydedilmez.',
  connecting: 'Defter açılıyor…',
};

function renderFooter() {
  const note = $('#store-note');
  note.dataset.mode = S.storeState;
  note.textContent = STORE_SHORT[S.storeState];
}

function renderSettings() {
  $('#set-store').textContent = STORE_TEXT[S.storeState];

  const last = S.prefs.sonYedek;
  const status = $('#set-backup-status');
  const stale = !last || Date.now() - last > 30 * 86400000;
  status.textContent = last ? `Son yedek ${ago(isoOf(last))} alındı.` : 'Henüz yedek almadın.';
  status.classList.toggle('warn', stale && S.people.length > 0 && S.storeState === 'local');

  const artifact = inArtifact();
  $('#panel-theme').hidden = artifact;
  $('#panel-install').hidden = artifact;
  const tema = $(`input[name="tema"][value="${S.prefs.tema}"]`);
  if (tema) tema.checked = true;

  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const installBtn = $('#btn-install');
  installBtn.hidden = !S.installEvent;
  $('#install-text').textContent = standalone
    ? 'Mimlesek şu an uygulama olarak çalışıyor. İnternet olmasa da açılır.'
    : S.installEvent
      ? 'Mimlesek’i ana ekrana ekle; ayrı bir uygulama gibi açılır ve internet olmasa da çalışır.'
      : ios
        ? 'Safari’de Paylaş menüsünü aç ve “Ana Ekrana Ekle”yi seç.'
        : 'Tarayıcının menüsünde “Uygulamayı yükle” ya da “Ana ekrana ekle” seçeneğini ara.';

  $('#app-version').textContent = `v${APP_VERSION}`;
}

// ---------- Kişi dosyası ----------

function focusSelector(node, root) {
  if (!node || node === root || !root.contains(node)) return null;
  if (node.id) return `#${CSS.escape(node.id)}`;
  const act = node.dataset && node.dataset.act;
  if (!act) return null;
  const mark = node.closest('[data-mark]');
  return mark ? `[data-mark="${CSS.escape(mark.dataset.mark)}"] [data-act="${act}"]` : `[data-act="${act}"]`;
}

function renderDosya() {
  const p = S.people.find((x) => x.id === S.dosya.id);
  if (!p) { if (el.dosya.open) el.dosya.close(); return; }
  const sel = focusSelector(document.activeElement, el.dosyaRoot);
  el.dosyaRoot.innerHTML = dosyaHTML(p, S.dosya, todayISO());
  if (sel) $(sel, el.dosyaRoot)?.focus();
}

function openDosya(id) {
  S.dosya = { id, editIdentity: false, editMark: null, confirmDestroy: false, error: '' };
  renderDosya();
  if (!el.dosya.open) el.dosya.showModal();
  el.dosya.scrollTop = 0;
}

el.dosya.addEventListener('close', () => { S.dosya.id = null; });
el.dosya.addEventListener('click', (e) => { if (e.target === el.dosya) el.dosya.close(); });

function setStatus(p, act) {
  const { status, msg } = STATUS_ACTIONS[act];
  p.status = status;
  p.statusAt = Date.now();
  save(p);
  toast(msg(p));
}

function deleteMark(p, markId) {
  if (p.marks.length < 2) return;
  const i = p.marks.findIndex((m) => m.id === markId);
  if (i < 0) return;
  const [mark] = p.marks.splice(i, 1);
  save(p);
  offerUndo('Kayıt silindi.', () => {
    const q = S.people.find((x) => x.id === p.id);
    if (!q || q.marks.some((m) => m.id === mark.id)) return;
    q.marks.push(mark);
    save(q);
    renderAll();
    toast('Kayıt geri geldi.');
  });
}

function destroyPerson(p) {
  el.dosya.close();
  S.people = S.people.filter((x) => x.id !== p.id);
  drop(p.id);
  render();
  offerUndo(`${p.name} dosyası imha edildi.`, () => {
    if (S.people.some((x) => x.id === p.id)) return;
    S.people.push(p);
    save(p);
    renderAll();
    toast('Dosya geri geldi.');
  });
}

el.dosyaRoot.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const p = S.people.find((x) => x.id === S.dosya.id);
  if (!p) return;
  const du = S.dosya;
  const markId = b.closest('[data-mark]')?.dataset.mark;

  switch (b.dataset.act) {
    case 'close':
      el.dosya.close();
      return;
    case 'more':
      el.dosya.close();
      prefillComposer(p);
      return;
    case 'forgive':
    case 'settle':
    case 'reopen':
      setStatus(p, b.dataset.act);
      break;
    case 'edit-id':
      du.editIdentity = true;
      du.error = '';
      renderDosya();
      $('#d-name')?.focus();
      return;
    case 'cancel-id':
      du.editIdentity = false;
      du.error = '';
      renderDosya();
      $('[data-act="edit-id"]', el.dosyaRoot)?.focus();
      return;
    case 'edit-mark':
      du.editMark = markId;
      renderDosya();
      $('#em-reason')?.focus();
      return;
    case 'cancel-mark':
      du.editMark = null;
      renderDosya();
      $(`[data-mark="${CSS.escape(markId)}"] [data-act="edit-mark"]`, el.dosyaRoot)?.focus();
      return;
    case 'del-mark':
      deleteMark(p, markId);
      break;
    case 'destroy-ask':
      du.confirmDestroy = true;
      renderDosya();
      $('[data-act="destroy-no"]', el.dosyaRoot)?.focus();
      return;
    case 'destroy-no':
      du.confirmDestroy = false;
      renderDosya();
      $('[data-act="destroy-ask"]', el.dosyaRoot)?.focus();
      return;
    case 'destroy-yes':
      destroyPerson(p);
      return;
    default:
      return;
  }
  render();
  renderDosya();
});

el.dosyaRoot.addEventListener('submit', (e) => {
  e.preventDefault();
  const p = S.people.find((x) => x.id === S.dosya.id);
  if (!p) return;

  if (e.target.id === 'identity-form') {
    const name = tidy($('#d-name').value).slice(0, MAX_NAME);
    const alias = tidy($('#d-alias').value).slice(0, 40);
    const fail = (msg, focusId) => { S.dosya.error = msg; renderDosya(); $(focusId)?.focus(); };
    if (!name) return fail('Adı boş bırakamazsın.', '#d-name');
    if (findByName(S.people, name, p.id)) return fail('Bu adla ya da lakapla başka bir dosya var.', '#d-name');
    if (alias && findByName(S.people, alias, p.id)) return fail('Bu lakap başka bir dosyada kullanılıyor.', '#d-alias');
    p.name = name;
    p.alias = alias;
    p.group = tidy($('#d-group').value).slice(0, 30);
    p.note = $('#d-note').value.trim().slice(0, 1000);
    S.dosya.editIdentity = false;
    S.dosya.error = '';
    save(p);
    render();
    renderDosya();
    $('[data-act="edit-id"]', el.dosyaRoot)?.focus();
    toast('Dosya güncellendi.');
    return;
  }

  if (e.target.id === 'mark-form') {
    const m = p.marks.find((x) => x.id === S.dosya.editMark);
    if (!m) return;
    const reason = $('#em-reason').value.trim();
    if (!reason) { $('#em-reason').focus(); toast('Olayı boş bırakamazsın.'); return; }
    const type = $('#em-type').value;
    const date = $('#em-date').value;
    m.reason = reason.slice(0, MAX_REASON);
    m.type = TYPES[type] ? type : m.type;
    m.level = Number($('#em-level').value) || m.level;
    if (date && date <= todayISO()) m.date = date;
    m.editedAt = Date.now();
    S.dosya.editMark = null;
    save(p);
    render();
    renderDosya();
    $(`[data-mark="${CSS.escape(m.id)}"] [data-act="edit-mark"]`, el.dosyaRoot)?.focus();
    toast('Kayıt güncellendi.');
  }
});

// ---------- Mim koyma formu ----------

function setComposerOpen(open) {
  el.composer.classList.toggle('open', open);
  el.composerToggle.setAttribute('aria-expanded', String(open));
  el.composerToggle.textContent = open ? 'Kapat' : 'Mim koy';
}

function updateHint() {
  const p = findByName(S.people, el.name.value);
  if (!p) { el.hint.hidden = true; el.hint.textContent = ''; return; }
  el.hint.hidden = false;
  el.hint.textContent = p.status === 'aktif'
    ? `${p.name} defterde zaten var (${score(p)} mim). Yeni mim onun hanesine yazılır.`
    : p.status === 'affedildi'
      ? `${p.name} daha önce affedilmişti. Yeni mim onu yeniden mimliler arasına alır.`
      : `${p.name} ile hesaplaşmıştın. Yeni mim hesabı yeniden açar.`;
}

function prefillComposer(p) {
  go('defter');
  setComposerOpen(true);
  el.name.value = p.name;
  updateHint();
  el.composer.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
  el.reason.focus({ preventScroll: true });
}

function resetComposer() {
  el.name.value = '';
  el.reason.value = '';
  el.date.value = todayISO();
  el.count.textContent = `0/${MAX_REASON}`;
  $('#ty-diger').checked = true;
  $('#lv-1').checked = true;
  el.formError.hidden = true;
  updateHint();
}

el.form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = tidy(el.name.value);
  const reason = el.reason.value.trim();
  const fail = (msg, input) => { el.formError.textContent = msg; el.formError.hidden = false; input.focus(); };
  el.formError.hidden = true;
  if (!name) return fail('Kimi mimlediğini yaz.', el.name);
  if (!reason) return fail('Ne yaptığını kısaca yaz; ileride hatırlaman gerekecek.', el.reason);

  const today = todayISO();
  const mark = createMark({
    reason,
    type: el.form.querySelector('input[name="type"]:checked')?.value,
    level: Number(el.form.querySelector('input[name="level"]:checked')?.value),
    date: el.date.value && el.date.value <= today ? el.date.value : today,
  });

  let p = findByName(S.people, name);
  let msg;
  if (p) {
    p.marks.push(mark);
    if (p.status !== 'aktif') {
      p.status = 'aktif';
      p.statusAt = Date.now();
      msg = `${p.name} yeniden mimlendi.`;
    } else {
      msg = `${p.name} bir mim daha aldı. Toplam ${score(p)} mim.`;
    }
  } else {
    p = createPerson(name, S.people);
    p.marks.push(mark);
    S.people.push(p);
    msg = `Mimlendi: ${p.name}`;
  }
  save(p);

  S.stamped = p.id;
  if (S.tab !== 'hepsi') S.tab = 'aktif';
  if (S.q) { S.q = ''; el.q.value = ''; }
  resetComposer();
  render();
  toast(msg);
});

el.name.addEventListener('input', updateHint);
el.reason.addEventListener('input', () => { el.count.textContent = `${el.reason.value.length}/${MAX_REASON}`; });
el.composerToggle.addEventListener('click', () => {
  const open = !el.composer.classList.contains('open');
  setComposerOpen(open);
  if (open) el.name.focus();
});

// ---------- Defter olayları ----------

el.tabs.addEventListener('click', (e) => {
  const b = e.target.closest('[data-tab]');
  if (!b) return;
  S.tab = b.dataset.tab;
  render();
  $(`[data-tab="${S.tab}"]`, el.tabs)?.focus();
});
el.q.addEventListener('input', () => { S.q = el.q.value; render(); });
el.sort.addEventListener('change', () => { S.sort = SORTS[el.sort.value] ? el.sort.value : 'score'; render(); });

el.rows.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const id = b.closest('[data-id]')?.dataset.id;
  const p = S.people.find((x) => x.id === id);
  if (!p) return;
  const act = b.dataset.act;
  if (act === 'open') { openDosya(id); return; }
  if (act === 'more') { prefillComposer(p); return; }
  if (!STATUS_ACTIONS[act]) return;
  setStatus(p, act);
  render();
  if (e.detail === 0) {
    const row = el.rows.querySelector(`[data-id="${CSS.escape(id)}"]`);
    (row ? $('[data-act]', row) : $('[data-tab][aria-pressed="true"]', el.tabs))?.focus();
  }
});

el.banner.addEventListener('click', (e) => {
  if (e.target.closest('[data-act="migrate"]')) migrateLocal();
});

el.brifing.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act="open"]');
  const id = b && b.closest('[data-id]')?.dataset.id;
  if (id && S.people.some((p) => p.id === id)) openDosya(id);
});
wireTips(el.brifing);

// ---------- Ayarlar ----------

function backupText() {
  return JSON.stringify(makeBackup(S.people), null, 2);
}
function markBackedUp() {
  S.prefs.sonYedek = Date.now();
  writePrefs(S.prefs);
  renderSettings();
}

$('#btn-export').addEventListener('click', async () => {
  if (!S.people.length) { toast('Defter boş; yedeklenecek bir şey yok.'); return; }
  const name = `mimlesek-yedek-${todayISO()}.json`;
  try {
    await offerFile(name, backupText(), 'application/json');
    markBackedUp();
    toast(`Yedek hazır: ${name}`);
  } catch (err) {
    if (err && err.code === 'declined') return;
    toast('İndirme burada çalışmıyor. “Panoya kopyala” ile yedeği alabilirsin.');
  }
});

$('#btn-copy').addEventListener('click', () => {
  if (!S.people.length) { toast('Defter boş; yedeklenecek bir şey yok.'); return; }
  navigator.clipboard.writeText(backupText())
    .then(() => { markBackedUp(); toast('Yedek panoya kopyalandı. Güvenli bir yere yapıştır.'); })
    .catch(() => toast('Panoya erişilemedi. “Yedeği indir”i dene.'));
});

$('#btn-import').addEventListener('change', async (e) => {
  const file = e.target.files && e.target.files[0];
  e.target.value = '';
  if (!file) return;
  let incoming;
  try {
    incoming = parseBackup(await file.text());
  } catch (err) {
    toast(err.message || 'Yedek okunamadı.');
    return;
  }
  const before = new Map(S.people.map((p) => [p.id, JSON.stringify(p)]));
  const { list, added, updated } = mergePeople(S.people, incoming);
  const changed = list.filter((p) => before.get(p.id) !== JSON.stringify(p));
  S.people = list;
  S.store.sync(changed, [], S.people).catch(onStoreError);
  renderAll();
  toast(added || updated ? `Yedek yüklendi: ${added} yeni dosya, ${updated} güncelleme.` : 'Yedekteki her şey zaten defterde.');
});

document.querySelectorAll('input[name="tema"]').forEach((input) => {
  input.addEventListener('change', () => {
    S.prefs.tema = input.value;
    writePrefs(S.prefs);
    applyTheme();
  });
});

$('#btn-install').addEventListener('click', async () => {
  const ev = S.installEvent;
  if (!ev) return;
  S.installEvent = null;
  ev.prompt();
  await ev.userChoice.catch(() => null);
  renderSettings();
});
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  S.installEvent = e;
  if (S.view === 'ayarlar') renderSettings();
});
window.addEventListener('appinstalled', () => {
  S.installEvent = null;
  toast('Mimlesek ana ekrana eklendi.');
  if (S.view === 'ayarlar') renderSettings();
});

$('#wipe-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('#wipe-input');
  const error = $('#wipe-error');
  if (input.value.trim().toLocaleUpperCase('tr') !== 'İMHA') {
    error.hidden = false;
    input.focus();
    return;
  }
  error.hidden = true;
  const ids = S.people.map((p) => p.id);
  if (!ids.length) { toast('Defter zaten boş.'); return; }
  S.people = [];
  S.store.sync([], ids, S.people).catch(onStoreError);
  input.value = '';
  renderAll();
  toast('Defter imha edildi. Temiz bir sayfa.');
});

function applyTheme() {
  if (inArtifact()) return;
  const root = document.documentElement;
  if (S.prefs.tema === 'acik') root.dataset.theme = 'light';
  else if (S.prefs.tema === 'koyu') root.dataset.theme = 'dark';
  else delete root.dataset.theme;
}

// ---------- Kısayollar ----------

document.addEventListener('keydown', (e) => {
  if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || el.dosya.open) return;
  const key = e.key.toLocaleLowerCase('tr');
  if (key === 'n') {
    e.preventDefault();
    go('defter');
    setComposerOpen(true);
    el.name.focus();
  } else if (key === '/') {
    e.preventDefault();
    go('defter');
    el.q.focus();
  } else if (key === '1' || key === '2' || key === '3') {
    go(['defter', 'brifing', 'ayarlar'][Number(key) - 1]);
  }
});

// ---------- Açılış ----------

function registerServiceWorker() {
  if (inArtifact() || !('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  navigator.serviceWorker.register('./sw.js').catch(() => { /* çevrimdışı özellik isteğe bağlı */ });
}

function boot() {
  const params = new URLSearchParams(location.search);
  S.demo = params.has('demo') && !inArtifact();
  if (S.demo) {
    S.store = createMemoryStore();
    S.storeState = 'demo';
    S.people = demoPeople();
  } else {
    S.store = createLocalStore();
    S.people = assignFileNos(readLocalPeople());
    if (inArtifact()) S.storeState = 'connecting';
  }

  el.sort.innerHTML = Object.entries(SORTS).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('');
  el.date.value = todayISO();
  el.date.max = todayISO();
  setComposerOpen(false);
  applyTheme();
  route();
  render();

  const fileNo = Number(params.get('dosya'));
  const target = fileNo && S.people.find((p) => p.fileNo === fileNo);
  if (target) openDosya(target.id);

  if (!S.demo && inArtifact()) startCloud();
  registerServiceWorker();
}

boot();
