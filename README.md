# KORGEM Panda & Pig Balloon Pop — Final Cabinet Project

Bu depo, **PC + Raspberry Pi Pico** tabanlı iki sepetli balon patlatma arcade oyununun tam kaynak paketidir.

## Final oyun senaryosu

1. Koin girişi Pico tarafından algılanır ve PC'ye gönderilir.
2. Kredi oluşur; `autoStartOnCoin` açıksa geri sayım otomatik başlar.
3. Oyun süresi F8 servis menüsündeki değere göre başlar.
4. Oyun sol veya sağ sepeti seçer.
5. Seçilen sepetin **motor rölesi**, F8'de tanımlanan süre kadar aktif edilir ve fiziksel balon sepetten çıkar.
6. Ekranda aynı tarafta balon yükselir.
7. Oyuncu fiziksel balonu patlattığında ilgili **sol/sağ sensör** Pico tarafından algılanır.
8. Doğru sensör aktif balonla eşleşirse puan verilir, ekrandaki balon patlar, karakter reaksiyonu oynar, MP3 efekti çalar ve LED rölesi kısa tepki verir.
9. Süre dolana kadar tur tekrarlanır.
10. Oyun sonunda motorlar kapalı tutulur, LED rölesi kapanır ve sonuç ekranda gösterilir.

## Donanım

- 1 × Raspberry Pi Pico / RP2040
- 2 × Balon patlama sensörü
- 2 × Sepet motoru
- 2 × Motor rölesi
- 1 × LED rölesi
- 1 × Koin girişi
- 1 × DFPlayer Mini / uyumlu MP3 modülü
- PC / Windows arcade bilgisayarı

> **Motorlar Pico pininden sürülmez.** Pico yalnızca röle girişlerini kontrol eder. Motor beslemesi röle kontaklarından ayrı güç kaynağı ile geçirilmelidir.

## Varsayılan Pico pinleri

| İşlev | Pico GPIO |
|---|---:|
| Sol sensör | GP2 |
| Sağ sensör | GP3 |
| Koin | GP4 |
| Sol motor rölesi | GP6 |
| Sağ motor rölesi | GP7 |
| LED rölesi | GP8 |
| MP3 UART TX | GP0 |
| MP3 UART RX | GP1 |

Detay: `docs/HARDWARE_TR.md` ve `pico/PandaPigPico/pins.h`.

## F8 servis menüsü

PC klavyesinde **F8**:

- oyun süresi
- puan
- balon çıkış aralığı
- balon patlatma zaman penceresi
- sol/sağ motor röle çalışma süresi
- sensör debounce
- MP3 ses seviyesi ve parça numaraları
- LED tepki süresi
- Pico COM portu
- sol/sağ motor testi
- sol/sağ sensör simülasyonu
- koin testi
- LED testi
- MP3 testi

Ayarlar PC'de kalıcı olarak saklanır.

## PC kurulumu

```bash
npm install
npm start
```

Windows paket oluşturma:

```bash
npm run dist
```

Oluşan Windows paketleri `dist/` klasörüne gelir.

## Pico kurulumu

Arduino IDE içinde `pico/PandaPigPico/PandaPigPico.ino` dosyasını açın.

Gerekli kütüphane:

- `DFRobotDFPlayerMini`

Pico kartını seçip firmware'i yükleyin. PC tarafında F8 servis menüsünden Pico'nun COM portunu seçip **Bağlan** düğmesine basın.

## PC test tuşları

Pico bağlı olmadan yazılım testi için:

- `C` → koin
- `A` → sol sensör
- `L` → sağ sensör
- `SPACE` → kredili oyunu başlat
- `F8` → servis menüsü
- `F11` → tam ekran

## Görsel sistem

`assets/scene/approved_scene.png` onaylanan ana oyun ekranını kullanır. Dönme dolap için sahnenin gerçek karelerinden alınmış yumuşak geçişli kare animasyonu kullanılır; ayrıca sahnenin önüne yapay bir çark çizilmez. Panda ve domuz reaksiyonları da sahne karelerinden bölgesel geçişlerle oynatılır.

## Klasör yapısı

```text
app/                  Oyun arayüzü ve oyun mantığı
assets/               Onaylı sahne ve animasyon kareleri
config/               Varsayılan ayarlar
electron/             Windows masaüstü / seri port köprüsü
pico/                  Raspberry Pi Pico firmware
docs/                  Kablolama, protokol ve servis belgeleri
tools/                 Windows yardımcı komutları
.github/workflows/     GitHub Windows build workflow
```

## Elektrik güvenliği

- Pico girişlerine doğrudan 5V/12V vermeyin.
- 12V koin mekanizması veya endüstriyel sensör çıkışı için optokuplör / uygun seviye dönüştürme kullanın.
- Röle modülünün 3.3V lojik ile tetiklenebildiğini doğrulayın; gerekirse transistor/optokuplör sürücü kullanın.
- DC motorlarda kontak arkını ve geri EMF'yi azaltmak için uygun diyot/snubber ve sigorta kullanın.
- Motor güç hattını Pico USB beslemesinden ayırın; ortak toprak yalnızca gereken lojik arabirimde kontrollü kullanılmalıdır.
