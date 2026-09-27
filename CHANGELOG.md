# Değişiklik günlüğü

## 2.2.0 — 27 Eylül 2026

Vitrin ile karargâh ayrıldı.

- **İlk açılış karşılaması:** masaüstü, Android ve tek dosya sürümleri ilk açılışta parola koymayı önerir; "Parolasız başla" ile geçilebilir. Parola koyulduysa sonraki her açılışta kilit ekranı gelir.
- **Demo yalnızca web sitesinde:** kurulu uygulamalarda demo defteri, örnek kayıtlar ve "Demo defterini gez" bağlantısı yok; demo kodu pakete hiç girmez.
- Kurulu uygulamalar boş defterle "Henüz kimseyi mimlemedin" diye başlar.
- Masaüstü ve Android paketinden web sitesine özgü dosyalar (PWA, paylaşım etiketleri) çıkarıldı; kaynak kod adresi tıklanmayan düz metin olarak gösterilir.
- Paket içeriğini ve sürüm numaralarının tutarlılığını denetleyen testler.

## 2.1.1 — 27 Eylül 2026

Her sürüm artık kesin olarak internetsiz.

- Yazı tipleri repoya alındı (`fonts/`, OFL lisanslarıyla). Ne derleme ne uygulama Google Fonts'a bağlanır.
- Web sürümü ilk açılışta yazı tipleri dahil her şeyi önbelleğe alır ve "internetsiz de açılır" diye haber verir. Ayarlarda internetsiz çalışma durumu görünür.
- Tek dosya sürümü yazı tiplerini içine gömer (389 KB); herhangi bir bilgisayarda çift tıklayıp bağlantısız açılır.
- Masaüstü ve Android güvenlik politikası artık yalnızca uygulamanın kendi dosyalarına izin veriyor.
- Windows için internetsiz kurucu: WebView2 çalışma zamanını içinde taşır, kurulum sırasında bile bağlantı istemez.
- İnternetsizliği denetleyen testler: dış kaynak yok, ağ isteği yok, önbellek listesi eksiksiz.

## 2.1.0 — 27 Eylül 2026

Mimlesek tarayıcıdan çıktı ve bir kasa edindi.

- **Masaüstü uygulamaları:** Windows (`.exe`, `.msi`), macOS (Intel ve Apple Silicon için tek `.dmg`), Linux (`.AppImage`, `.deb`, `.rpm`)
- **Android uygulaması:** `.apk` (arm64 ve armv7)
- **İsteğe bağlı parola:** defter PBKDF2-SHA256 (600.000 tur) ile türetilen anahtarla AES-256-GCM kullanılarak şifrelenir; parola hiçbir yere yazılmaz
- **Kilit ekranı:** açılışta parola sorar; "Parolamı unuttum" ile kilitli defter sıfırlanabilir
- **Otomatik kilit:** 1, 5, 15 ya da 60 dakika hareketsizlikte; <kbd>L</kbd> ile anında kilit
- **Yapıştırarak yedek yükleme:** dosya seçmenin zor olduğu cihazlar için
- Masaüstü ve Android'de yedek, sistemin "Farklı kaydet" penceresiyle kaydedilir
- Masaüstü ve Android paketleri yazı tiplerini içinde taşır; hiçbir ağ isteği yapmaz
- GitHub Pages sürümü de yazı tiplerini kendi sunucusundan verir
- `v*` etiketiyle dört platformun paketlerini derleyip yayınlayan GitHub Actions iş akışı

## 2.0.0 — 27 Eylül 2026

Mimlesek tek sayfalık bir defterden tam bir uygulamaya dönüştü.

- **Kişi dosyası:** dosya no, lakap, grup, dosya notu ve düzenlenebilir olay kaydı
- **Alarm seviyesi:** mimlerin yaşına göre ağırlıklandırılan ısı; Sakin, Dikkat, Tetikte, Kırmızı alarm
- **Durum brifingi:** aylık mim akışı, türlere göre dağılım, en çok arananlar, otomatik değerlendirme
- **Geri al:** silinen kayıt ve imha edilen dosya birkaç saniye içinde geri gelir
- **Yedek:** JSON olarak dışa ve içe aktarma, birleştirerek yükleme
- **Ayarlar:** tema seçimi, uygulama olarak yükleme, defteri imha etme
- **Yeni mim türü:** Görüldü
- **PWA:** ana ekrana eklenebilir, çevrimdışı çalışır
- **Demo defteri:** `?demo` ile kurgusal verilerle gezinti
- **Tek dosya sürümü:** `npm run build`
- Klavye kısayolları, mobil alt menü, testler ve GitHub Pages yayını

1.0.0 sürümündeki kayıtlar otomatik olarak taşınır; eksik dosya numaraları sırayla verilir.

## 1.0.0

- İlk sürüm: mim koyma, derece, tür, affet ve hesaplaş, arama ve sıralama
