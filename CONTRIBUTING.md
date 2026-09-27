# Teşkilata katılım kılavuzu

Mimlesek'e katkı yapmayı düşündüğün için teşekkürler. Aşağıdaki talimatname kısa; okuması bir mimden az sürer.

## Üssü kur

```bash
git clone https://github.com/gorkemguler/mimlesek.git
cd mimlesek
npm start        # http://localhost:4173
npm test         # alan mantığı testleri
npm run build    # dist/mimlesek.html tek dosya sürümü
```

Bağımlılık yok, `npm install` gerekmiyor. Node 20 ve üstü yeterli.

Denemeler için `http://localhost:4173/?demo` adresini kullan. Demo defteri hiçbir şey kaydetmez; kendi defterine dokunmadan istediğin kadar mimleyebilir, affedebilir, imha edebilirsin.

## Operasyon kuralları

1. **Bağımlılık eklemiyoruz.** Mimlesek saf HTML, CSS ve JavaScript. Bir kütüphane şart görünüyorsa önce bir ihbar açıp tartışalım.
2. **Veri cihazdan çıkmaz.** Sunucu çağrısı, analitik, takip pikseli ya da üçüncü taraf betiği eklenmez. Bu kuralın istisnası yok.
3. **Kişisel veri alanı eklemiyoruz.** Adres, telefon, konum, fotoğraf gibi alanlar Mimlesek'i bir takip aracına çevirir. Bunlar kapsam dışı.
4. **Hesaplar `src/model.js` içinde kalır.** DOM'a dokunmayan her şey orada ve testli olsun. Yeni bir hesap eklediysen `tests/model.test.mjs` içine testini de ekle.
5. **Türkçe, sade, kullanıcının gözünden.** Arayüz metinleri kısa ve doğrudan olsun. Düğme ne yapıyorsa onu söylesin: "Affet", ardından "Deniz affedildi."
6. **İki tema, üç genişlik.** Değişikliğine açık ve koyu temada, telefon (~390 px), tablet ve masaüstü genişliğinde bak. Klavyeyle de dene.
7. **Birleşik dosya kuralı.** `npm run build` modülleri tek dosyada birleştirir. Bu yüzden modüllerin üst düzey adları proje genelinde benzersiz olmalı ve `import` satırları tek bir noktalı virgülle bitmeli.

## Gönderim

- Dalını `main` üzerinden aç, küçük ve odaklı tut.
- Commit mesajı ne yaptığını söylesin: `Brifinge haftalık görünüm ekle`.
- Çekme isteği şablonundaki kontrol listesini doldur. CI testleri geçmeden birleştirme yapılmaz.

## İhbar ve talepler

Hata için [hata ihbarı](https://github.com/gorkemguler/mimlesek/issues/new?template=hata-ihbari.yml), yeni fikir için [operasyon talebi](https://github.com/gorkemguler/mimlesek/issues/new?template=operasyon-talebi.yml) aç. Ekran görüntüsü paylaşacaksan demo defterini kullan; gerçek kişilerin adları issue sayfasına yakışmaz.
