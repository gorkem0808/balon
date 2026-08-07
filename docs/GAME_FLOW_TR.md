# Oyun Akışı

## 1. Attract / bekleme
- Ekranda `KOIN ATIN` görünür.
- Pico koin pulse gönderir: `EVENT COIN`.
- Kredi artar ve MP3 koin sesi çalar.

## 2. Başlangıç
- Otomatik başlat açıksa 3-2-1 geri sayımı başlar.
- LED rölesi oyun boyunca aktif olacak şekilde ayarlanabilir.
- Süre F8'deki `Oyun süresi` değerinden sayar.

## 3. Balon çıkışı
- Oyun L/R tarafı seçer.
- PC Pico'ya örnek olarak `MOTOR L 420` gönderir.
- Pico sol röleyi 420 ms aktif eder.
- Aynı anda ekranda sol sepetten aktif balon yükselir.

## 4. Patlatma
- Fiziksel balon patlatılır.
- İlgili sensör Pico'da aktif olur.
- Pico: `EVENT SENSOR L` veya `EVENT SENSOR R` yollar.
- Aktif taraf ile sensör eşleşirse puan, efekt, MP3 ve karakter reaksiyonu tetiklenir.

## 5. Kaçan balon
- `Patlatma süresi` içinde sensör gelmezse balon kaçmış sayılır.
- Kaçan parça sesi çalınır ve yeni tur hazırlanır.

## 6. Oyun sonu
- Süre 0 olduğunda yeni motor tetiklemesi yapılmaz.
- Aktif balon temizlenir.
- LED rölesi kapanır.
- Bitiş MP3 parçası çalınır.
- Final puanı gösterilir.
