# Güvenlik ve gizlilik

## Veriler nerede?

Mimlesek'in sunucusu yoktur. Defter, tarayıcının yerel deposunda (`localStorage`, `mimlesek.v1` anahtarı) tutulur ve hiçbir yere gönderilmez. Dışarıdan yüklenen tek kaynak Google Fonts'taki yazı tipleridir.

claude.ai Artifact olarak açıldığında defter, platformun izleyiciye özel veritabanı alanında (`data/users/<kimlik>/`) tutulur. Bu alanı sayfanın sahibi dahil başka hiç kimse okuyamaz.

## Bir açık mı buldun?

Güvenlik açıklarını herkese açık issue olarak değil, GitHub'ın gizli bildirim kanalından ilet:
[Güvenlik açığı bildir](https://github.com/gorkemguler/mimlesek/security/advisories/new)

Özellikle şunlarla ilgileniyoruz:

- Kullanıcı girdisinin sayfada kod olarak çalışabildiği durumlar (XSS)
- Yedek dosyası içe aktarılırken bozuk ya da kötü niyetli verinin uygulamayı bozması
- Verinin cihaz dışına sızdığı herhangi bir yol

Bildirimini inceler, düzeltir ve istersen seni teşekkür listesine ekleriz. Madalya veremiyoruz ama mimlemeyeceğimize söz veriyoruz.
