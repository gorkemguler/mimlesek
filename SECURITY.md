# Güvenlik ve gizlilik

## Veriler nerede?

Mimlesek'in sunucusu yoktur. Defter, tarayıcının ya da uygulamanın yerel deposunda (`localStorage`; parola yoksa `mimlesek.v1`, varsa şifreli olarak `mimlesek.kasa` anahtarı) tutulur ve hiçbir yere gönderilmez. Uygulama hiçbir ağ isteği yapmaz; yazı tipleri dahil tüm dosyalar paketin ya da sitenin kendisindedir.

## Parola ve şifreleme

Ayarlardan parola koyulduğunda defter şöyle saklanır:

| Adım | Ayrıntı |
|---|---|
| Anahtar türetme | PBKDF2-HMAC-SHA256, 600.000 tur, 16 baytlık rastgele tuz |
| Şifreleme | AES-256-GCM, her kayıtta yeni 12 baytlık rastgele IV |
| Saklanan | `mimlesek.kasa` anahtarında yalnızca tuz, IV, tur sayısı ve şifreli metin |
| Saklanmayan | Parola ve anahtar. Anahtar yalnızca defter açıkken bellekte durur. |

Bilinmesi gereken sınırlar:

- Parola unutulursa veri kurtarılamaz. Arka kapı yoktur.
- Parola ilk koyulduğunda şifresiz kopya silinir; ancak tarayıcı ya da işletim sistemi eski verinin kalıntılarını diskte bir süre tutabilir. En sağlam sonuç için parolayı defteri kullanmaya başlamadan koy.
- Şifreleme, cihazı ele geçiren birinin defteri okumasını zorlaştırır. Defter açıkken ekranı gören birine karşı koruma sağlamaz; otomatik kilidi açık tut.
- Yedek dosyaları (`.json`) şifresizdir. Onları güvenli bir yerde sakla.

## Masaüstü ve Android

Masaüstü ve Android sürümleri [Tauri 2](https://tauri.app) kabuğuyla çalışır. Kabuk yalnızca şu izinleri verir: yedek için sistemin kaydet/aç pencereleri ve seçilen dosyaya metin yazma/okuma. Sıkı bir içerik güvenlik politikası (CSP) uygulanır: yalnızca uygulamanın kendi dosyaları yüklenebilir, dış adreslere istek yapılamaz.

Paketler kod imzasız dağıtılır. Kaynak koddan kendin derleyebilirsin; adımlar README'de.

claude.ai Artifact olarak açıldığında defter, platformun izleyiciye özel veritabanı alanında (`data/users/<kimlik>/`) tutulur. Bu alanı sayfanın sahibi dahil başka hiç kimse okuyamaz.

## Bir açık mı buldun?

Güvenlik açıklarını herkese açık issue olarak değil, GitHub'ın gizli bildirim kanalından ilet:
[Güvenlik açığı bildir](https://github.com/gorkemguler/mimlesek/security/advisories/new)

Özellikle şunlarla ilgileniyoruz:

- Kullanıcı girdisinin sayfada kod olarak çalışabildiği durumlar (XSS)
- Yedek dosyası içe aktarılırken bozuk ya da kötü niyetli verinin uygulamayı bozması
- Verinin cihaz dışına sızdığı herhangi bir yol

Bildirimini inceler, düzeltir ve istersen seni teşekkür listesine ekleriz. Madalya veremiyoruz ama mimlemeyeceğimize söz veriyoruz.
