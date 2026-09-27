<p align="center">
  <img src="docs/kapak.png" alt="Mimlesek: kişisel mim istihbaratı" width="100%">
</p>

<p align="center">
  <b>GİZLİLİK DERECESİ:</b> Kişiye özel &nbsp;·&nbsp;
  <b>DAĞITIM:</b> Sadece sen &nbsp;·&nbsp;
  <b>İMHA TALİMATI:</b> Okuduktan sonra yıldız ver
</p>

<p align="center">
  <a href="https://gorkemguler.github.io/mimlesek/"><b>Uygulamayı aç</b></a> ·
  <a href="https://gorkemguler.github.io/mimlesek/?demo">Demo defterini gez</a> ·
  <a href="#sahaya-iniş">Kurulum</a> ·
  <a href="#sıkça-sorulan-sorgulamalar">SSS</a>
</p>

<p align="center">
  <img alt="Lisans: MIT" src="https://img.shields.io/badge/lisans-MIT-5B3FB2">
  <img alt="Sunucu: yok" src="https://img.shields.io/badge/sunucu-yok-2C7A4C">
  <img alt="Takip çerezi: 0" src="https://img.shields.io/badge/takip%20%C3%A7erezi-0-2C7A4C">
  <img alt="Bağımlılık: 0" src="https://img.shields.io/badge/ba%C4%9F%C4%B1ml%C4%B1l%C4%B1k-0-1A2330">
  <img alt="PWA" src="https://img.shields.io/badge/PWA-%C3%A7evrimd%C4%B1%C5%9F%C4%B1%20%C3%A7al%C4%B1%C5%9F%C4%B1r-1A2330">
</p>

---

## Brifing

> **Konu:** Kimin ne yaptığını unutmamak.
> **Durum:** Aktif.
> **Tehdit seviyesi:** Ev arkadaşının son yumurtayı yiyip yemediğine bağlı.

Herkesin hayatında biri vardır. Ödünç aldığı kitabı getirmeyen, "beş dakikaya oradayım" deyip kırk dakika sonra gelen, dizinin finalini asansörde anlatan biri. Normal insanlar bunları unutur. Sen unutmuyorsun. Tebrikler, doğru teşkilattasın.

**Mimlesek**, zihninin arka odalarında dağınık duran bu bilgileri düzenli bir dosyaya koyan kişisel mim istihbaratı uygulamasıdır. Kimi mimlediğini, neden mimlediğini ve olayın ne kadar ciddi olduğunu kaydedersin. Sonra önünde iki yol vardır: **affetmek** ya da **hesaplaşmak**. Üçüncü yol, yani sonsuza kadar kin tutmak, teknik olarak mümkündür ama teşkilatımızca önerilmez.

<p align="center">
  <img src="docs/ekran-defter.png" alt="Mim defteri: solda yeni mim formu, sağda mimlenen kişilerin listesi" width="100%">
</p>

## Operasyonel yetenekler

| Birim | Görevi |
|---|---|
| **Mim defteri** | Her kişi için tek dosya. Aynı kişiyi tekrar mimlersen kayıt onun hanesine yazılır; lakabıyla yazsan bile tanınır. |
| **Mim derecesi** | Üç kademe: *Not ettim* (م), *Unutmam* (م م), *Asla unutmam* (م م م). |
| **Alarm seviyesi** | Taze mimler ağır, eskiler hafif basar. Sakin → Dikkat → Tetikte → Kırmızı alarm. |
| **Kişi dosyası** | Dosya no, lakap, grup, dosya notu ve eksiksiz olay kaydı. Her kayıt sonradan düzenlenebilir. |
| **Durum brifingi** | Aylık mim akışı, türlere göre dağılım, "en çok arananlar" ve kendiliğinden yazılan bir durum değerlendirmesi. |
| **Affet / Hesaplaş** | Dosya arşive kalkar. Gerekirse "Yeniden mimle" ile tekrar açılır. İnsanlar değişmez, dosyalar değişir. |
| **Geri al** | Yanlışlıkla imha ettiğin dosya ya da sildiğin kayıt birkaç saniye içinde geri gelir. Sonrası tarih. |
| **Yedek** | JSON olarak dışa aktar, başka cihazda içe aktar. Birleştirir, hiçbir şeyi ezmez. |
| **Çevrimdışı çalışma** | Ana ekrana ekle; internet gitse de defter açık kalır. |
| **Gece operasyonu** | Açık ve koyu tema, sistem ayarını da izler. |

<table>
  <tr>
    <td width="50%"><img src="docs/ekran-dosya.png" alt="Kişi dosyası: dosya numarası, alarm seviyesi, dosya notu ve olay kaydı"></td>
    <td width="50%"><img src="docs/ekran-brifing.png" alt="Durum brifingi: değerlendirme, göstergeler ve aylık mim grafiği"></td>
  </tr>
  <tr>
    <td align="center"><sub>Kişi dosyası. Kırmızı damga dekoratiftir; hukuki bağlayıcılığı yoktur.</sub></td>
    <td align="center"><sub>Durum brifingi. Saha ısınıyorsa sana söyler.</sub></td>
  </tr>
</table>

## Mim derecelendirme cetveli

| Derece | İşaret | Kod adı | Örnek vaka |
|:-:|:-:|---|---|
| 1 | م | Not ettim | "Beş dakikalık toplantı" elli dakika sürdü. |
| 2 | م م | Unutmam | Son yumurtayı yedi, boş kutuyu buzdolabına geri koydu. |
| 3 | م م م | Asla unutmam | Dizinin finalini asansörde, herkesin önünde anlattı. |

## Alarm seviyeleri

Her mim, konulduğu günden bu yana geçen süreye göre ağırlıklandırılır. Zaman her şeyin ilacıdır; biz sadece dozunu hesaplıyoruz.

| Mimin yaşı | Ağırlık |
|---|:-:|
| 0–30 gün | ×1 |
| 31–90 gün | ×0,6 |
| 91–365 gün | ×0,3 |
| 1 yıldan eski | ×0,1 |

| Isı | Seviye | Saha yorumu |
|:-:|---|---|
| 0–1,9 | Sakin | Radarda ama sessiz. |
| 2–3,9 | Dikkat | Bir gözün açık uyusun. |
| 4–6,9 | Tetikte | Grup sohbetinde mesajlarını iki kez oku. |
| 7+ | Kırmızı alarm | Bayram ziyaretini yeniden değerlendir. |

## Sahaya iniş

### A planı: Hiçbir şey kurma

[Uygulamayı aç](https://gorkemguler.github.io/mimlesek/). Beğenirsen tarayıcı menüsünden **Ana ekrana ekle**. Uygulama mağazası yok, hesap yok, iz yok.

### B planı: Kendi üssünü kur

```bash
git clone https://github.com/gorkemguler/mimlesek.git
cd mimlesek
npm start
```

Sonra `http://localhost:4173` adresini aç. `npm install` bile gerekmiyor; bu projenin bağımlılığı yok. Node 20 ve üstü yeter.

### C planı: Çanta boyu tek dosya

```bash
npm run build
```

`dist/mimlesek.html` oluşur: bütün uygulama tek bir HTML dosyasında. USB belleğe koy, çift tıkla aç. Hazır derlenmiş hâli sitede de duruyor: [mimlesek-tek-dosya.html](https://gorkemguler.github.io/mimlesek/mimlesek-tek-dosya.html).

## Kullanım talimatnamesi

1. **Tespit.** Formda kişinin adını ya da lakabını yaz. Daha önce mimlediysen Mimlesek onu tanır.
2. **Kayıt.** Ne yaptığını yaz, türünü ve derecesini seç, **Mimle** de. Mühür basılır. Sesi yok ama biz yine de *küt* diye duyuyoruz.
3. **Takip.** **Brifing** sekmesinden genel duruma bak. Kırmızı alarmdakiler için gerekli önlemleri al. Derin nefes önerilir.
4. **Kapanış.** Affet ya da hesaplaş. Dosya arşive kalkar ama silinmez. Teşkilat hiçbir şeyi unutmaz; sen istemedikçe.

| Kısayol | İşlev |
|:-:|---|
| <kbd>N</kbd> | Yeni mim |
| <kbd>/</kbd> | Defterde ara |
| <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> | Defter, Brifing, Ayarlar |
| <kbd>Esc</kbd> | Açık dosyayı kapat |

## Sızıntı yok

- Tüm veriler **tarayıcının yerel deposunda** durur. Sunucu yok, hesap yok, çerez yok, analitik yok.
- Mimlediğin kişiye bildirim gitmez. Mimlesek ispiyoncu değildir.
- Uygulama hiçbir veriyi dışarı göndermez; dışarıdan yüklenen tek şey Google Fonts'taki yazı tipleridir. İnanmıyorsan kaynak kodu oku. Teşkilatımız şeffaflığa inanır; bu işi şeffaf yapan tek teşkilat olabiliriz.
- Tarayıcı verilerini silersen defter de gider. **Ayarlar → Yedek** ile ara sıra yedek al. İyi ajan sahaya yedeksiz çıkmaz.

## Sıkça sorulan sorgulamalar

**Bu bir fişleme uygulaması mı?**
Hayır. Fişleme başkalarının yaptığı bir şeydir; biz buna *kişisel arşivcilik* diyoruz. Şaka bir yana: Mimlesek içini dökmek için var. Kimseyi teşhir etmek, takip etmek ya da rahatsız etmek için değil.

**Mimlediğim kişi bunu görebilir mi?**
Telefonunu eline vermediğin sürece hayır. Veriler cihazından çıkmaz.

**"Mim" ne demek?**
Arap alfabesinin م harfi. Rivayete göre eski kayıt defterlerinde bir ismin yanına mim konması "bu kişi not edildi" anlamına gelirmiş. Bugün "mimlemek" dediğimizde hâlâ aynı şeyi kastediyoruz. Tek fark, defterin artık cebimizde olması.

**Birden fazla cihazda kullanabilir miyim?**
Bir cihazda yedeği indir, diğerinde yükle. Eşitleme sunucusu yok, çünkü sunucu olursa biri ona bakar.

**Kaç kişiyi mimleyebilirim?**
Tarayıcı deposu dolana kadar, yani birkaç bin dosya. O sayıya ulaşırsan sorun Mimlesek'te olmayabilir.

**Affettiğim birini tekrar mimleyebilir miyim?**
Evet. Dosya yeniden açılır, eski kayıtlar da yerinde durur.

**Hesaplaşmak ne demek, kavga mı edeceğiz?**
Hayır. Konuştunuz, anlaştınız, dosya kapandı. Hesaplaşmanın en medeni hâli.

**Uygulama neden bu kadar mor?**
Resmî mühürler mor mürekkeple basılır. Biz de ciddi görünmek istedik.

## Teknik şartname

- Saf HTML, CSS ve JavaScript (ES modülleri). Framework yok, derleme adımı yok, `node_modules` yok.
- PWA: `manifest.webmanifest` ve `sw.js` sayesinde kurulabilir, çevrimdışı çalışır.
- Testler Node'un yerleşik test koşucusuyla yazıldı: `npm test`.
- `main` dalına her gönderimde GitHub Actions testleri koşar, geçerse siteyi GitHub Pages'e yayınlar.
- claude.ai Artifact olarak da çalışır; orada defter, her izleyiciye özel bir veritabanı alanında tutulur.

```
mimlesek/
├── index.html              Uygulama iskeleti
├── styles/app.css          Defter kâğıdı, mühür mürekkebi, iki tema
├── src/
│   ├── main.js             Durum, olaylar, görünüm geçişleri
│   ├── model.js            Mim, alarm, dosya no, yedek ve brifing hesapları
│   ├── views.js            Defter satırı, kişi dosyası ve brifing şablonları
│   ├── charts.js           Kütüphanesiz grafikler
│   ├── store.js            Yerel depo, bulut deposu, dosya indirme
│   ├── demo.js             Kurgusal demo defteri
│   └── util.js             Tarih ve Türkçe biçimlendirme yardımcıları
├── sw.js                   Çevrimdışı çalışma
├── manifest.webmanifest    Ana ekrana ekleme bilgileri
├── scripts/
│   ├── serve.mjs           Bağımlılıksız yerel sunucu
│   └── tek-dosya.mjs       Tek dosya derleyicisi
└── tests/model.test.mjs    Alan mantığı testleri
```

## Teşkilata katılım

Katkı yapmak istersen önce [CONTRIBUTING.md](CONTRIBUTING.md) dosyasını oku. Hata bulduysan [ihbar formunu](https://github.com/gorkemguler/mimlesek/issues/new/choose) doldur. Lütfen ihbarlara gerçek kişilerin adlarını ve mimlerini yapıştırma; issue sayfası Mimlesek kadar ketum değil.

## Etik kurallar

- Mimlesek bir **mizah ve öz farkındalık** aracıdır. Gerçek bir istihbarat servisiyle, herhangi bir kamu kurumuyla ya da resmî kayıt sistemiyle hiçbir ilgisi yoktur.
- İnsanları takip etmek, taciz etmek, kişisel bilgilerini toplamak ya da yaymak için kullanma. Uygulamada bu yüzden adres, telefon, konum ya da fotoğraf alanı yok; olmayacak da.
- En iyi dosya, kapanmış dosyadır. Arada bir **Affet** düğmesine bas. Sağlığına iyi gelir.

## Lisans

[MIT](LICENSE). Kopyala, değiştir, dağıt. Tek şartımız lisans metnini de yanında götürmen. Ajanlar evraksız seyahat etmez.

---

<p align="center"><sub>Bu belge kendini imha etmeyecek. Ama <code>git rm README.md</code> yazarsan biz bir şey görmedik.</sub></p>
