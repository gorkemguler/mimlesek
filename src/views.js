// Görünüm şablonları: defter satırı, kişi dosyası ve brifing. Hepsi saf fonksiyon, HTML metni döner.
// Kullanıcıdan gelen her metin esc() ile kaçırılır.

import { esc, ago, fmtDate, fmtDateLong, isoOf, pct } from './util.js';
import {
  TYPES, LEVELS, STATUS_LABELS, MAX_NAME, MAX_REASON,
  score, marksDesc, lastMark, alarmOf, isStale, fileLabel,
} from './model.js';
import { columnChart, barList } from './charts.js';

const VERDICTS = { affedildi: 'AFFEDİLDİ', kapandi: 'HESAPLAŞILDI' };

export const mimGlyphs = (n) => `<span class="mims" aria-hidden="true">${'<i>م</i>'.repeat(n)}</span>`;
export const alarmChip = (a) => `<span class="alarm alarm-${a.id}"><i aria-hidden="true"></i>${a.label}</span>`;
const stampHTML = (n, extra = '') =>
  `<div class="stamp${extra}" role="img" aria-label="${n} mim"><span class="stamp-n">${n}</span><span class="stamp-l">mim</span></div>`;

// ---------- Defter ----------

export function rowHTML(p, { sample, today }) {
  const marks = marksDesc(p);
  const last = marks[0];
  const maxLevel = Math.max(...marks.map((m) => m.level));
  const types = [...new Set(marks.map((m) => m.type))];
  const name = sample ? esc(p.name) : `<button type="button" class="name-link" data-act="open">${esc(p.name)}</button>`;

  let actions = '';
  if (!sample) {
    const main = p.status === 'aktif'
      ? `<button type="button" class="btn" data-act="more">Bir mim daha</button>
         <button type="button" class="btn good" data-act="forgive">Affet</button>
         <button type="button" class="btn" data-act="settle">Hesaplaştık</button>`
      : '<button type="button" class="btn" data-act="reopen">Yeniden mimle</button>';
    actions = `<div class="actions">${main}<span class="spacer"></span><button type="button" class="btn quiet" data-act="open">Dosyayı aç</button></div>`;
  }

  return `<li class="row is-${p.status}" data-id="${esc(p.id)}">
    ${stampHTML(score(p))}
    <div class="row-main">
      <div class="row-head">
        <h3 class="row-name">${name}</h3>
        <span class="row-meta">${fileLabel(p.fileNo)} · ${marks.length} kayıt · son mim ${ago(last.date, today)}</span>
        ${VERDICTS[p.status] ? `<span class="verdict">${VERDICTS[p.status]}</span>` : ''}
      </div>
      <p class="row-last">${esc(last.reason)}</p>
      <div class="tags">
        ${sample ? '<span class="tag sample">Örnek</span>' : ''}
        ${p.status === 'aktif' ? alarmChip(alarmOf(p, today)) : ''}
        <span class="tag lvl">${LEVELS[maxLevel]}</span>
        ${types.map((t) => `<span class="tag">${TYPES[t]}</span>`).join('')}
        ${p.group ? `<span class="tag grp">${esc(p.group)}</span>` : ''}
        ${isStale(p, today) ? '<span class="tag old">Üstünden bir yıl geçti</span>' : ''}
      </div>
      ${actions}
    </div>
  </li>`;
}

export function emptyRowsHTML({ q, tab }) {
  let text;
  if (q.trim()) text = `“${esc(q.trim())}” ile eşleşen kayıt yok.`;
  else if (tab === 'aktif') text = 'Şu an mimli kimse yok. Ya herkes çok iyi davranıyor ya da sen çok affedicisin.';
  else if (tab === 'affedildi') text = 'Henüz kimseyi affetmedin.';
  else if (tab === 'kapandi') text = 'Hesaplaştığın kimse yok.';
  else text = 'Defter boş.';
  return `<li class="empty">${mimGlyphs(1)}<span>${text}</span></li>`;
}

// ---------- Kişi dosyası ----------

function markFormHTML(m, today) {
  const typeOptions = Object.entries(TYPES)
    .map(([k, v]) => `<option value="${k}"${k === m.type ? ' selected' : ''}>${v}</option>`).join('');
  const levelOptions = [1, 2, 3]
    .map((l) => `<option value="${l}"${l === m.level ? ' selected' : ''}>${l} · ${LEVELS[l]}</option>`).join('');
  return `<form class="mark-form" id="mark-form" novalidate>
    <div class="field">
      <label class="lbl" for="em-reason">Ne yaptı?</label>
      <textarea id="em-reason" maxlength="${MAX_REASON}" rows="3">${esc(m.reason)}</textarea>
    </div>
    <div class="field-row three">
      <div class="field"><label class="lbl" for="em-type">Tür</label><select id="em-type">${typeOptions}</select></div>
      <div class="field"><label class="lbl" for="em-level">Derece</label><select id="em-level">${levelOptions}</select></div>
      <div class="field"><label class="lbl" for="em-date">Tarih</label><input id="em-date" type="date" max="${today}" value="${m.date}"></div>
    </div>
    <div class="actions">
      <button type="submit" class="btn primary">Kaydet</button>
      <button type="button" class="btn" data-act="cancel-mark">Vazgeç</button>
    </div>
  </form>`;
}

export function dosyaHTML(p, du, today) {
  const marks = marksDesc(p);
  const first = marks.at(-1);
  const last = marks[0];
  const total = score(p);
  const openedIso = p.createdAt ? isoOf(p.createdAt) : first.date;

  const cover = `<header class="dosya-cover">
    <div class="dosya-tabline">
      <span>DOSYA NO <b>${fileLabel(p.fileNo)}</b></span>
      <span>AÇILIŞ <b>${fmtDate(openedIso)}</b></span>
      ${p.group ? `<span>GRUP <b>${esc(p.group.toLocaleUpperCase('tr'))}</b></span>` : ''}
    </div>
    <button type="button" class="dosya-close" data-act="close" aria-label="Dosyayı kapat"><span aria-hidden="true">×</span></button>
    <div class="dosya-id">
      ${stampHTML(total, ' stamp-lg')}
      <div class="dosya-idtext">
        <h2 id="dosya-title">${esc(p.name)}</h2>
        ${p.alias ? `<p class="dosya-alias">Lakap: <b>${esc(p.alias)}</b></p>` : ''}
        <div class="tags">${alarmChip(alarmOf(p, today))}<span class="tag">${STATUS_LABELS[p.status]}</span></div>
      </div>
    </div>
    <span class="classified" aria-hidden="true">KİŞİYE ÖZEL</span>
  </header>`;

  const facts = `<dl class="facts">
    <div><dt>Toplam mim</dt><dd>${total}</dd></div>
    <div><dt>Kayıt</dt><dd>${marks.length}</dd></div>
    <div><dt>İlk mim</dt><dd>${fmtDate(first.date)}</dd></div>
    <div><dt>Son mim</dt><dd>${ago(last.date, today)}</dd></div>
  </dl>`;

  const statusButtons = p.status === 'aktif'
    ? `<button type="button" class="btn" data-act="more">Bir mim daha</button>
       <button type="button" class="btn good" data-act="forgive">Affet</button>
       <button type="button" class="btn" data-act="settle">Hesaplaştık</button>`
    : '<button type="button" class="btn" data-act="reopen">Yeniden mimle</button>';
  const actions = `<div class="actions">${statusButtons}<span class="spacer"></span>${
    du.editIdentity ? '' : '<button type="button" class="btn quiet" data-act="edit-id">Kimliği düzenle</button>'}</div>`;

  const identity = du.editIdentity
    ? `<form class="identity" id="identity-form" novalidate>
        <div class="field"><label class="lbl" for="d-name">Ad</label><input id="d-name" type="text" maxlength="${MAX_NAME}" value="${esc(p.name)}"></div>
        <div class="field-row">
          <div class="field"><label class="lbl" for="d-alias">Lakap</label><input id="d-alias" type="text" maxlength="40" value="${esc(p.alias)}" placeholder="İsteğe bağlı"></div>
          <div class="field"><label class="lbl" for="d-group">Grup</label><input id="d-group" type="text" maxlength="30" list="group-list" value="${esc(p.group)}" placeholder="Aile, İş, Komşu…"></div>
        </div>
        <div class="field"><label class="lbl" for="d-note">Dosya notu</label><textarea id="d-note" maxlength="1000" rows="3" placeholder="Bu kişiyle ilgili hatırlaman gerekenler">${esc(p.note)}</textarea></div>
        ${du.error ? `<p class="form-error" role="alert">${esc(du.error)}</p>` : ''}
        <div class="actions">
          <button type="submit" class="btn primary">Kaydet</button>
          <button type="button" class="btn" data-act="cancel-id">Vazgeç</button>
        </div>
      </form>`
    : p.note ? `<section class="note"><h3>Dosya notu</h3><p>${esc(p.note)}</p></section>` : '';

  const canDelete = marks.length > 1;
  const events = marks.map((m) => {
    if (du.editMark === m.id) return `<li class="event editing" data-mark="${esc(m.id)}">${markFormHTML(m, today)}</li>`;
    return `<li class="event" data-mark="${esc(m.id)}">
      <div class="ev-date"><b>${fmtDate(m.date)}</b><span>${ago(m.date, today)}</span></div>
      <div class="ev-body">
        <p class="ev-reason">${esc(m.reason)}</p>
        <div class="ev-sub">${mimGlyphs(m.level)}<span>${LEVELS[m.level]}</span><span aria-hidden="true">·</span><span>${TYPES[m.type]}</span>${
          m.editedAt ? '<span aria-hidden="true">·</span><span>düzenlendi</span>' : ''}</div>
      </div>
      <div class="ev-actions">
        <button type="button" class="btn quiet xs" data-act="edit-mark">Düzenle</button>
        ${canDelete ? '<button type="button" class="btn quiet xs" data-act="del-mark">Sil</button>' : ''}
      </div>
    </li>`;
  }).join('');

  const destroy = du.confirmDestroy
    ? `<div class="destroy confirm">
        <p><b>${esc(p.name)}</b> dosyası ve ${marks.length} kaydı silinecek. Birkaç saniye içinde geri alabilirsin; sonrası tarih.</p>
        <div class="actions">
          <button type="button" class="btn danger" data-act="destroy-yes">Evet, imha et</button>
          <button type="button" class="btn" data-act="destroy-no">Vazgeç</button>
        </div>
      </div>`
    : '<div class="destroy"><button type="button" class="btn quiet danger-text" data-act="destroy-ask">Dosyayı imha et</button></div>';

  return `${cover}
    <div class="dosya-body">
      ${facts}
      ${actions}
      ${identity}
      <section class="timeline-sec"><h3>Olay kaydı</h3><ol class="timeline">${events}</ol></section>
      ${destroy}
    </div>`;
}

// ---------- Brifing ----------

function assessment(b, today) {
  if (!b.records) return ['Defter boş. Ortalık sakin ya da henüz kimse yakalanmadı.'];
  const out = [];
  if (b.last30Records) {
    let s = `Son 30 günde ${b.last30Records} olay kaydedildi, toplam ${b.last30Mim} mim.`;
    if (b.prev30Mim) {
      const change = (b.last30Mim - b.prev30Mim) / b.prev30Mim;
      if (Math.abs(change) < 0.05) s += ' Önceki 30 günle aynı tempo.';
      else if (change > 0) s += ` Önceki 30 güne göre ${pct(change)} artış var; saha ısınıyor.`;
      else s += ` Önceki 30 güne göre ${pct(-change)} düşüş var; ortalık yatışıyor.`;
    } else {
      s += ' Önceki 30 gün tamamen sessizdi.';
    }
    out.push(s);
  } else {
    out.push('Son 30 günde yeni mim yok. Ya herkes uslu duruyor ya da sen tatildesin.');
  }
  if (b.wanted[0]) out.push(`Listenin başında ${b.wanted[0].name} var, alarm seviyesi ${alarmOf(b.wanted[0], today).label}.`);
  if (b.topType) out.push(`En sık rastlanan vaka türü ${b.topType.label}; ${b.topType.kayit} kayıtta ${b.topType.mim} mim.`);
  if (b.busiestWeekday) out.push(`Mimlerin çoğu ${b.busiestWeekday} günleri konuyor.`);
  if (b.forgiven) {
    out.push(`Şimdiye kadar ${b.forgiven} kişiyi affettin${b.avgForgiveDays !== null ? `; ortalama affetme süren ${b.avgForgiveDays} gün` : ''}.`);
  } else {
    out.push('Henüz kimseyi affetmedin. Teşkilatın önerisi: küçük bir vakayla başla.');
  }
  return out;
}

export function brifingHTML(b, { sample, today }) {
  const delta = b.last30Mim - b.prev30Mim;
  const deltaText = !b.last30Mim && !b.prev30Mim ? 'iki dönem de sessiz'
    : delta === 0 ? 'önceki 30 günle aynı'
      : `önceki 30 güne göre ${delta > 0 ? '+' : '−'}${Math.abs(delta)}`;
  const tiles = [
    { label: 'Aktif dosya', value: b.active, sub: `toplam ${b.people} dosya` },
    { label: 'Son 30 günde mim', value: b.last30Mim, sub: deltaText, cls: delta > 0 ? 'up' : delta < 0 ? 'down' : '' },
    { label: 'Affetme oranı', value: b.people ? pct(b.forgiveRate) : '—', sub: `${b.forgiven} kişi affedildi` },
    { label: 'Ortalama affetme süresi', value: b.avgForgiveDays === null ? '—' : `${b.avgForgiveDays} gün`, sub: 'ilk mimden affa kadar' },
  ];

  const wanted = b.wanted.length
    ? `<ol class="wanted-list">${b.wanted.map((p, i) => `<li data-id="${esc(p.id)}">
        <span class="rank">${i + 1}</span>
        <div class="w-main">
          ${sample ? `<span class="w-name">${esc(p.name)}</span>` : `<button type="button" class="name-link w-name" data-act="open">${esc(p.name)}</button>`}
          <span class="w-meta">${fileLabel(p.fileNo)} · ${score(p)} mim · son mim ${ago(lastMark(p).date, today)}</span>
        </div>
        ${alarmChip(alarmOf(p, today))}
      </li>`).join('')}</ol>`
    : '<p class="chart-empty">Aranan kimse yok. Huzur içindesin.</p>';

  return `<div class="brief">
    <header class="view-head brief-head">
      <div>
        <p class="eyebrow">Durum brifingi · ${fmtDateLong(today)}</p>
        <h2>Sahada neler oluyor?</h2>
      </div>
      <span class="classified inline" aria-hidden="true">KİŞİYE ÖZEL</span>
    </header>
    ${sample ? '<div class="notice"><span><b>Örnek verilerle gösteriliyor.</b> İlk mimini koyduğunda brifing senin defterinden hazırlanır.</span></div>' : ''}
    <section class="assessment" aria-labelledby="assess-title">
      <h3 id="assess-title">Değerlendirme</h3>
      <ul>${assessment(b, today).map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
    </section>
    <section class="figures" aria-label="Özet göstergeler">
      ${tiles.map((t) => `<div class="figure">
        <span class="f-label">${t.label}</span>
        <span class="f-value">${t.value}</span>
        <span class="f-sub${t.cls ? ' ' + t.cls : ''}">${esc(t.sub)}</span>
      </div>`).join('')}
    </section>
    <div class="cards">
      <section class="card">
        <h3>Aylık mim akışı</h3>
        <p class="card-sub">Son 12 ay, konulan mim toplamı</p>
        ${columnChart(b.months)}
      </section>
      <section class="card">
        <h3>Türlere göre</h3>
        <p class="card-sub">Tüm zamanlar, mim toplamı</p>
        ${barList(b.types)}
      </section>
    </div>
    <section class="card">
      <h3>En çok arananlar</h3>
      <p class="card-sub">Alarm seviyesine göre ilk 5 aktif dosya</p>
      ${wanted}
      <details class="howto">
        <summary>Alarm seviyesi nasıl hesaplanıyor?</summary>
        <p>Her mim, derecesi kadar puan getirir ve yaşına göre ağırlıklandırılır: son 30 gün ×1, 90 güne kadar ×0,6, bir yıla kadar ×0,3, daha eskisi ×0,1. Toplam 2 ve üstü <b>Dikkat</b>, 4 ve üstü <b>Tetikte</b>, 7 ve üstü <b>Kırmızı alarm</b> sayılır. Affedilen ve kapanan dosyalar arşive kalkar.</p>
      </details>
    </section>
  </div>`;
}
