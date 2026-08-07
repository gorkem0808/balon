# KORGEM Panda & Pig Balloon Pop — Final Revize Klavye Sürümü

Bu paket GitHub Pages üzerinde doğrudan çalışan, PC klavyesiyle oynanan final revize sürümdür.

## Kontroller

- `C` : kredi ekle
- `SPACE` : oyunu başlat
- `A` : sol sepet / sol balon
- `L` : sağ sepet / sağ balon
- `P` : duraklat / devam
- `F8` : servis ve oyun ayarları
- `F11` : tam ekran aç / kapat

## Bu revizyonda yapılanlar

- Dönme dolap sabitlendi; artık dönmüyor.
- Panda ve domuz sürekli hızlı dans etmiyor. Boşta çok hafif hareket ediyor, arada göz kırpıyor.
- Doğru puan alındığında ilgili karakter kısa ve yumuşak bir kutlama hareketi yapıyor.
- Sepetten çıkan oyun balonu büyütüldü ve sepetten yükseliyormuş gibi animasyon verildi.
- Konfeti patlaması büyütüldü ve daha yoğun hale getirildi.
- Arka plandaki dekor balonları çok hafif salınıyor.
- Lunapark lambaları yanıp sönüyor.
- Üst HUD yeniden hizalandı: PUAN / SÜRE / REKOR birbirine binmez.
- Tam ekran modu eklendi. İlk kredi veya başlatma tuşunda tarayıcı izin verirse otomatik tam ekrana geçer.
- Pico ve harici donanım kodu bu sürümden tamamen çıkarıldı.
- Yerel ses sistemi eklendi: müzik, kredi, başlangıç, puan, yanlış sepet, son saniye uyarısı, oyun sonu ve balon çıkış sesi.
- F8 menüsüne ana ses, müzik, efektler ve her olayın ayrı ses seviyesi eklendi.

## GitHub Pages

Repo kökünde `index.html` bulunur. GitHub Pages için:

1. `Settings > Pages`
2. `Deploy from a branch`
3. Branch: `main`
4. Folder: `/(root)`
5. Save

Site açıldığında kök `index.html` otomatik olarak `app/index.html` oyun ekranına yönlendirir.

## Not

Tarayıcılar ses ve tam ekranı kullanıcı etkileşimi olmadan engelleyebilir. Bu nedenle ilk `C` veya `SPACE` tuşu ses sistemini ve tam ekran isteğini etkinleştirir.
