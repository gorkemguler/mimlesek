// Brifing grafikleri: kütüphanesiz, HTML/CSS ile çizilir. Tek seri, tek renk (mühür moru).
// Her değere üzerine gelerek ya da klavyeyle ulaşılır; sütun grafiğinin bir de tablo görünümü var.

import { esc, fmtMonthShort, fmtMonthLong } from './util.js';

/** 0'dan başlayan, tam sayı adımlı, en çok ~4 aralıklı eksen. */
export function niceScale(max, maxTicks = 4) {
  if (max <= 0) return { top: 1, step: 1 };
  const raw = max / maxTicks;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = Math.max(1, Math.round([1, 2, 5, 10].map((f) => f * mag).find((s) => s >= raw)));
  return { top: Math.ceil(max / step) * step, step };
}

export function columnChart(months) {
  const max = Math.max(0, ...months.map((m) => m.mim));
  if (!max) return '<p class="chart-empty">Son 12 ayda hiç mim konmamış. Ya herkes melek ya da defter yeni.</p>';

  const { top, step } = niceScale(max);
  const ticks = [];
  for (let v = 0; v <= top; v += step) ticks.push(v);
  const peak = months.findIndex((m) => m.mim === max);
  const last = months.length - 1;

  const grid = ticks
    .map((v) => `<div class="tick${v === 0 ? ' base' : ''}" style="bottom:${((v / top) * 100).toFixed(2)}%"><span>${v}</span></div>`)
    .join('');
  const cols = months.map((m, i) => {
    const label = fmtMonthLong(m.y, m.m);
    const cap = m.mim > 0 && (i === peak || i === last) ? `<span class="col-cap">${m.mim}</span>` : '';
    return `<button type="button" class="col" style="--h:${((m.mim / top) * 100).toFixed(2)}%"
      data-tip-value="${m.mim} mim" data-tip-label="${esc(label)} · ${m.kayit} kayıt"
      aria-label="${esc(label)}: ${m.mim} mim, ${m.kayit} kayıt"><span class="col-bar"></span>${cap}</button>`;
  }).join('');
  const xlabels = months.map((m) => `<span>${esc(fmtMonthShort(m.y, m.m))}</span>`).join('');
  const rows = months
    .map((m) => `<tr><th scope="row">${esc(fmtMonthLong(m.y, m.m))}</th><td>${m.mim}</td><td>${m.kayit}</td></tr>`)
    .join('');

  return `<figure class="chart colchart">
    <div class="plot">
      <div class="grid" aria-hidden="true">${grid}</div>
      <div class="cols">${cols}</div>
      <div class="tip" hidden></div>
    </div>
    <div class="xlabels" aria-hidden="true">${xlabels}</div>
    <details class="table-view">
      <summary>Tablo olarak göster</summary>
      <div class="table-wrap"><table>
        <thead><tr><th scope="col">Ay</th><th scope="col">Mim</th><th scope="col">Kayıt</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </details>
  </figure>`;
}

export function barList(types) {
  const total = types.reduce((s, t) => s + t.mim, 0);
  if (!total) return '<p class="chart-empty">Henüz tür verisi yok.</p>';
  const max = Math.max(...types.map((t) => t.mim));
  const rows = types.map((t) => {
    const share = Math.round((t.mim / total) * 100);
    return `<div class="brow${t.mim ? '' : ' zero'}" tabindex="0"
      data-tip-value="${t.mim} mim" data-tip-label="${esc(t.label)} · ${t.kayit} kayıt · %${share}"
      aria-label="${esc(t.label)}: ${t.mim} mim, ${t.kayit} kayıt, yüzde ${share}">
      <span class="blabel">${esc(t.label)}</span>
      <span class="btrack"><span class="bfill" style="width:${((t.mim / max) * 100).toFixed(2)}%"></span></span>
      <span class="bval">${t.mim}</span>
    </div>`;
  }).join('');
  return `<figure class="chart barchart"><div class="plot">${rows}<div class="tip" hidden></div></div></figure>`;
}

/** Tek bir kök üzerinde, içindeki tüm grafiklerin ipuçlarını yönetir (yeniden çizimde de çalışır). */
export function wireTips(root) {
  const tipFor = (node) => node.closest('.plot')?.querySelector('.tip');
  const show = (node) => {
    const plot = node.closest('.plot');
    const tip = tipFor(node);
    if (!plot || !tip) return;
    const value = document.createElement('strong');
    value.textContent = node.dataset.tipValue;
    const label = document.createElement('span');
    label.textContent = node.dataset.tipLabel;
    tip.replaceChildren(value, label);
    tip.hidden = false;
    const anchor = node.querySelector('.col-bar, .bfill') || node;
    const a = anchor.getBoundingClientRect();
    const p = plot.getBoundingClientRect();
    const horizontal = anchor.classList.contains('bfill');
    const half = tip.offsetWidth / 2;
    const x = Math.min(Math.max((horizontal ? a.right : a.left + a.width / 2) - p.left, half), p.width - half);
    tip.style.left = `${x}px`;
    tip.style.top = `${a.top - p.top}px`;
  };
  const hide = (node) => { const tip = tipFor(node); if (tip) tip.hidden = true; };
  const target = (e) => e.target.closest && e.target.closest('[data-tip-value]');

  root.addEventListener('pointerover', (e) => { const n = target(e); if (n) show(n); });
  root.addEventListener('pointerout', (e) => { const n = target(e); if (n && !n.contains(e.relatedTarget)) hide(n); });
  root.addEventListener('focusin', (e) => { const n = target(e); if (n) show(n); });
  root.addEventListener('focusout', (e) => { const n = target(e); if (n) hide(n); });
}
