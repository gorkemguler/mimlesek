## Mimlesek artık cebinde ve masaüstünde

Bu sürümle Mimlesek tarayıcıdan çıktı: Windows, macOS, Linux ve Android için ayrı uygulama olarak kurulabiliyor. Bir de **isteğe bağlı parola** geldi. Parola koyarsan defter cihazında AES-256 ile şifrelenir ve her açılışta parola sorulur. Parola hiçbir yere yazılmaz; unutursan teşkilat da açamaz.

### Hangi dosyayı indireyim?

| Sistem | Dosya | Kurulum |
|---|---|---|
| Windows | `Mimlesek_…_x64-setup.exe` ya da `.msi` | Çift tıkla. SmartScreen uyarırsa **Ek bilgi → Yine de çalıştır**. |
| Windows, bağlantısız makine | `Mimlesek_…_x64_internetsiz-setup.exe` | Kurulum da internet istemez; WebView2 içinde gelir (~200 MB). |
| macOS (Intel ve Apple Silicon) | `Mimlesek_…_universal.dmg` | Uygulamayı Applications klasörüne sürükle. İlk açılışta **sağ tık → Aç**. |
| Linux | `.AppImage`, `.deb` ya da `.rpm` | AppImage için `chmod +x Mimlesek*.AppImage` ve çalıştır. |
| Android | `Mimlesek_…_android.apk` | Telefonda aç, "bilinmeyen kaynaklara" izin ver, kur. |

### Bilmen gerekenler

- Paketler imzasız; yani Windows ve macOS seni "tanımadığı geliştirici" konusunda uyarır. Kod açık, istersen kendin derle.
- Android paketi tek kullanımlık bir anahtarla imzalanır. Yeni sürüm eskisinin üzerine kurulamaz: **önce Ayarlar → Yedek ile yedek al**, eski uygulamayı kaldır, yenisini kur, yedeği yükle.
- Uygulamalar internetsiz çalışır: hiçbir ağ isteği yapmaz, yazı tipleri dahil her şey paketin içindedir.
- İlk açılışta parola koymak isteyip istemediğin sorulur. Demo defteri yalnızca web sitesinde var; uygulama boş defterle başlar.
- Veriler yalnızca o cihazda durur. Cihazlar arasında taşımak için yedeği kullan.

Değişikliklerin tamamı: [CHANGELOG.md](https://github.com/gorkemguler/mimlesek/blob/main/CHANGELOG.md)
