// Alan mantığı testleri: `npm test`
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { norm, ago, isoOf, DAY } from '../src/util.js';
import {
  score, heat, alarmOf, isStale, fileLabel, findByName, matches,
  cleanPerson, assignFileNos, createPerson, createMark,
  parseBackup, makeBackup, mergePeople, briefing, SORTS,
} from '../src/model.js';
import { demoPeople } from '../src/demo.js';

const TODAY = '2026-09-27';
const mark = (date, level = 1, type = 'diger', reason = 'Bir şey yaptı.') => ({ id: `m-${date}-${level}-${type}`, reason, type, level, date, at: Date.parse(date) });
const person = (over = {}) => ({
  id: 'p1', fileNo: 1, name: 'Ofisten Cem', alias: '', group: '', note: '',
  status: 'aktif', statusAt: 0, createdAt: 0, updatedAt: 0, marks: [mark('2026-09-20', 2)], ...over,
});

test('Türkçe büyük/küçük harf eşleşmesi', () => {
  assert.equal(norm('  İPEK   Işık '), 'ipek ışık');
  const list = [person({ name: 'İpek', alias: 'Kuzen' })];
  assert.equal(findByName(list, 'ipek')?.id, 'p1');
  assert.equal(findByName(list, 'KUZEN')?.id, 'p1');
  assert.equal(findByName(list, 'ipek', 'p1'), null, 'kendisi hariç tutulabilmeli');
});

test('göreli zaman Türkçe yazılır', () => {
  assert.equal(ago(TODAY, TODAY), 'bugün');
  assert.equal(ago('2026-09-26', TODAY), 'dün');
  assert.equal(ago('2026-09-24', TODAY), '3 gün önce');
  assert.equal(ago('2025-09-01', TODAY), 'geçen yıl');
});

test('mim puanı derecelerin toplamıdır', () => {
  assert.equal(score(person({ marks: [mark('2026-09-01', 1), mark('2026-09-02', 3)] })), 4);
});

test('ısı eski mimleri hafifletir, alarm seviyesi eşiklere uyar', () => {
  const fresh = person({ marks: [mark('2026-09-25', 3), mark('2026-09-20', 3), mark('2026-09-10', 1)] });
  assert.equal(heat(fresh, TODAY), 7);
  assert.equal(alarmOf(fresh, TODAY).id, 'alarm');

  const old = person({ marks: [mark('2025-01-01', 3)] });
  assert.ok(Math.abs(heat(old, TODAY) - 0.3) < 1e-9);
  assert.equal(alarmOf(old, TODAY).id, 'sakin');
  assert.equal(isStale(old, TODAY), true);

  assert.equal(alarmOf(person({ marks: [mark('2026-09-20', 2)] }), TODAY).id, 'dikkat');
  assert.equal(alarmOf(person({ marks: [mark('2026-09-20', 2), mark('2026-09-19', 2)] }), TODAY).id, 'tetikte');
  assert.equal(alarmOf(person({ status: 'affedildi' }), TODAY).id, 'arsiv');
});

test('bozuk kayıtlar temizlenir, eksik alanlar doldurulur', () => {
  assert.equal(cleanPerson(null), null);
  assert.equal(cleanPerson({ name: '', marks: [mark(TODAY)] }), null);
  assert.equal(cleanPerson({ name: 'Ali', marks: [{ reason: 'x', date: 'dün' }] }), null);
  const p = cleanPerson({ name: '  Ali   Veli ', marks: [{ reason: ' Geç kaldı ', date: TODAY, level: 9, type: 'uzayli' }] }, 'x1');
  assert.equal(p.id, 'x1');
  assert.equal(p.name, 'Ali Veli');
  assert.equal(p.status, 'aktif');
  assert.deepEqual([p.marks[0].reason, p.marks[0].level, p.marks[0].type], ['Geç kaldı', 1, 'diger']);
});

test('dosya numaraları mevcutları korur, eksikleri sırayla verir, çakışmayı çözer', () => {
  const list = [
    person({ id: 'a', fileNo: 3, createdAt: 30 }),
    person({ id: 'b', fileNo: 0, createdAt: 20 }),
    person({ id: 'c', fileNo: 0, createdAt: 10 }),
    person({ id: 'd', fileNo: 3, createdAt: 40 }),
  ];
  assignFileNos(list);
  assert.deepEqual(list.map((p) => p.fileNo), [3, 5, 4, 6]);
  assert.equal(fileLabel(7), 'MİM-0007');
});

test('yeni dosya bir sonraki numarayı alır', () => {
  const p = createPerson('  Deniz ', [person({ fileNo: 4 })]);
  assert.equal(p.fileNo, 5);
  assert.equal(p.name, 'Deniz');
  const m = createMark({ reason: 'Son yumurtayı yedi.', type: 'yok', level: 5, date: 'bozuk' }, Date.parse('2026-09-27T12:00:00'));
  assert.equal(m.type, 'diger');
  assert.equal(m.level, 1);
  assert.equal(m.date, '2026-09-27');
});

test('arama ad, lakap, grup, not ve olaylarda çalışır', () => {
  const p = person({ alias: 'Toplantı', group: 'İş', note: 'Kahve sever', marks: [mark(TODAY, 1, 'diger', 'Finali anlattı')] });
  for (const q of ['cem', 'toplantı', 'iş', 'kahve', 'FİNALİ', '']) assert.equal(matches(p, q), true, q);
  assert.equal(matches(p, 'yumurta'), false);
});

test('yedek: tur alanlı ve düz dizi biçimleri okunur, bozuk dosya reddedilir', () => {
  const backup = JSON.stringify(makeBackup([person()]));
  assert.equal(parseBackup(backup).length, 1);
  assert.equal(parseBackup(JSON.stringify([person()])).length, 1);
  assert.throws(() => parseBackup('{bozuk'), /JSON/);
  assert.throws(() => parseBackup('{"merhaba":1}'), /Mimlesek/);
});

test('yedek birleştirme: yeni kazanır, aynı ad birleşir, hiçbir şey silinmez', () => {
  const current = [person({ id: 'a', updatedAt: 10 }), person({ id: 'b', fileNo: 2, name: 'Deniz', updatedAt: 10 })];
  const incoming = [
    person({ id: 'a', name: 'Cem (güncel)', updatedAt: 20 }),
    person({ id: 'x', fileNo: 9, name: 'deniz', marks: [mark('2026-08-01', 3, 'borc', 'Fatura')] }),
    person({ id: 'y', fileNo: 1, name: 'Yeni kişi' }),
  ];
  const { list, added, updated } = mergePeople(current, incoming);
  assert.equal(added, 1);
  assert.equal(updated, 2);
  assert.equal(list.length, 3);
  assert.equal(list.find((p) => p.id === 'a').name, 'Cem (güncel)');
  assert.equal(list.find((p) => p.id === 'b').marks.length, 2);
  assert.equal(new Set(list.map((p) => p.fileNo)).size, 3, 'dosya numaraları benzersiz kalmalı');
  assert.equal(current[0].name, 'Ofisten Cem', 'girdi değiştirilmemeli');
});

test('brifing: 12 ay, türler ve karşılaştırmalar doğru hesaplanır', () => {
  const list = [
    person({ id: 'a', marks: [mark('2026-09-20', 2, 'gecikme'), mark('2026-08-10', 1, 'gecikme'), mark('2026-03-01', 3, 'borc')] }),
    person({ id: 'b', status: 'affedildi', statusAt: Date.parse('2026-06-11'), marks: [mark('2026-06-01', 1, 'laf')] }),
  ];
  const b = briefing(list, TODAY);
  assert.equal(b.months.length, 12);
  assert.equal(b.months.at(-1).key, '2026-09');
  assert.equal(b.months[0].key, '2025-10');
  assert.equal(b.months.at(-1).mim, 2);
  assert.equal(b.last30Mim, 2);
  assert.equal(b.prev30Mim, 1);
  assert.equal(b.totalMim, 7);
  assert.equal(b.active, 1);
  assert.equal(b.forgiven, 1);
  assert.equal(b.forgiveRate, 0.5);
  assert.equal(b.avgForgiveDays, 10);
  assert.equal(b.types[0].type, 'gecikme', 'eşit mimde çok kayıtlı tür önde');
  assert.equal(b.wanted[0].id, 'a');
});

test('sıralamalar kararlı çalışır', () => {
  const list = [
    person({ id: 'a', name: 'Zeynep', fileNo: 2, marks: [mark('2026-01-01', 3)] }),
    person({ id: 'b', name: 'Çağla', fileNo: 1, marks: [mark('2026-09-26', 1)] }),
  ];
  assert.deepEqual(list.slice().sort(SORTS.score.fn).map((p) => p.id), ['a', 'b']);
  assert.deepEqual(list.slice().sort(SORTS.recent.fn).map((p) => p.id), ['b', 'a']);
  assert.deepEqual(list.slice().sort(SORTS.name.fn).map((p) => p.id), ['b', 'a']);
  assert.deepEqual(list.slice().sort(SORTS.file.fn).map((p) => p.id), ['b', 'a']);
});

test('demo defteri geçerli ve bugüne göre güncel', () => {
  const now = Date.now();
  const demo = demoPeople(now);
  assert.ok(demo.length >= 8);
  for (const p of demo) assert.ok(cleanPerson(p), p.name);
  assert.equal(new Set(demo.map((p) => p.fileNo)).size, demo.length);
  const newest = demo.flatMap((p) => p.marks).sort((a, b) => b.at - a.at)[0];
  assert.equal(newest.date, isoOf(now - DAY));
});
