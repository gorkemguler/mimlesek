// Demo defteri: kurgusal kişiler ve olaylar. Tarihler bugüne göre hesaplanır, böylece
// grafikler her zaman dolu görünür. Hiçbir yere kaydedilmez.

import { DAY, isoOf } from './util.js';

const DEMO_CASES = [
  { name: 'Ofisten Cem', alias: 'Toplantı Cem', group: 'İş', status: 'aktif',
    note: 'Takvim davetlerinde "kısa bir sync" ifadesi görülürse öğle yemeği önceden yenmeli.',
    marks: [
      ['“Beş dakikalık toplantı” dedi, elli dakika sürdü.', 'gecikme', 1, 1],
      ['Dizinin finalini asansörde herkesin önünde anlattı.', 'spoiler', 3, 20],
      ['Sunumdaki fikrimi bir sonraki toplantıda kendi fikri gibi anlattı.', 'laf', 2, 45],
      ['“Hafta sonuna kadar dönerim” dedi. Hangi hafta sonu olduğu hâlâ belirsiz.', 'soz', 1, 130],
    ] },
  { name: 'Ev arkadaşı Deniz', alias: '', group: 'Arkadaş', status: 'aktif', note: '',
    marks: [
      ['Son yumurtayı yedi, boş kutuyu buzdolabına geri koydu.', 'diger', 2, 3],
      ['“Bulaşıkları sabah yıkarım” dedi. O sabah hiç gelmedi.', 'soz', 1, 12],
      ['Faturadaki payı için “ay sonu” dedi. Ay üç kez bitti.', 'borc', 2, 70],
    ] },
  { name: 'Kuzen Barış', alias: '', group: 'Aile', status: 'aktif', note: 'Kamp sandalyesi mavi, katlanır, bir ayağı hafif eğik.',
    marks: [
      ['Ödünç aldığı kamp sandalyesini iki yazdır getirmedi.', 'borc', 3, 40],
      ['Doğum günü mesajıma görüldü attı.', 'goruldu', 1, 200],
    ] },
  { name: 'Selin Teyze', alias: '', group: 'Aile', status: 'affedildi', statusDaysAgo: 60, note: '',
    marks: [
      ['Bayram sofrasında “Ne zaman evleniyorsun?” diye sordu.', 'laf', 2, 95],
      ['“Kilo mu aldın sen?” dedi. Merhaba demeden önce.', 'laf', 1, 300],
    ] },
  { name: 'Komşu Hakan Bey', alias: 'Matkap', group: 'Komşu', status: 'aktif', note: '',
    marks: [
      ['Pazar sabahı saat yedide matkapla duvara tablo astı.', 'diger', 2, 8],
      ['Arabasını iki park yerine birden park etti.', 'diger', 1, 150],
    ] },
  { name: 'Grup sohbetinden Ece', alias: '', group: 'Arkadaş', status: 'aktif', note: '',
    marks: [
      ['“Plan yapalım” dedi, mesajı görüp gruptan sessizce çıktı.', 'goruldu', 2, 5],
      ['Okuduğum kitabın sonunu story’de paylaştı.', 'spoiler', 2, 100],
    ] },
  { name: 'Apartman yöneticisi Nuri Bey', alias: '', group: 'Komşu', status: 'aktif', note: '',
    marks: [
      ['Asansörün pazartesi tamir edileceğini söyledi. Hangi pazartesi olduğunu söylemedi.', 'soz', 2, 25],
      ['Aidat toplantısını WhatsApp’tan yarım saat önce duyurdu.', 'gecikme', 1, 58],
    ] },
  { name: 'Halı sahadan Mert', alias: '', group: 'Arkadaş', status: 'kapandi', statusDaysAgo: 210, note: 'Parayı ödedi, üstüne çay ısmarladı. Dosya kapandı.',
    marks: [
      ['Halı saha parasını üç maçtır ödemedi.', 'borc', 2, 260],
    ] },
  { name: 'Yeğen Arda', alias: '', group: 'Aile', status: 'affedildi', statusDaysAgo: 320, note: 'Sekiz yaşında. Affedildi.',
    marks: [
      ['Kulaklığımı ödünç alıp kırdı.', 'diger', 1, 330],
    ] },
  { name: 'Ayşe Hoca', alias: '', group: 'Okul', status: 'aktif', note: '',
    marks: [
      ['Üç haftalık emeğimi “fena değil” diye özetledi.', 'laf', 1, 240],
    ] },
  { name: 'Lise arkadaşı Tolga', alias: '', group: 'Arkadaş', status: 'aktif', note: 'Faiz hesabı ayrı bir dosyada tutuluyor.',
    marks: [
      ['Lisede aldığı yirmi lirayı hâlâ vermedi.', 'borc', 3, 410],
    ] },
];

export function demoPeople(now = Date.now()) {
  return DEMO_CASES.map((c, i) => {
    const marks = c.marks.map(([reason, type, level, daysAgo], j) => {
      const at = now - daysAgo * DAY;
      return { id: `demo-m${i + 1}-${j + 1}`, reason, type, level, date: isoOf(at), at };
    });
    const oldest = Math.min(...marks.map((m) => m.at));
    const statusAt = c.statusDaysAgo ? now - c.statusDaysAgo * DAY : oldest;
    return {
      id: `demo-${i + 1}`,
      fileNo: i + 1,
      name: c.name,
      alias: c.alias,
      group: c.group,
      note: c.note,
      status: c.status,
      statusAt,
      createdAt: oldest,
      updatedAt: Math.max(statusAt, ...marks.map((m) => m.at)),
      marks,
    };
  });
}
