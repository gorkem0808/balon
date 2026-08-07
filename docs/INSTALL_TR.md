# Kurulum Sırası

1. Pico firmware'i yükleyin.
2. Röle/sensör/koin/MP3 bağlantılarını HARDWARE_TR.md'ye göre yapın.
3. PC'de proje klasöründe `npm install` çalıştırın.
4. `npm start` ile oyunu açın.
5. F8'e basın.
6. Pico COM portunu seçip `Bağlan` deyin.
7. Sol motor, sağ motor, sensörler, koin, LED ve MP3 testlerini tek tek yapın.
8. Motor röle pulse sürelerini mekanik sisteme göre ayarlayın.
9. Oyun süresi ve balon çıkış aralıklarını ayarlayın.
10. Tam ekrana geçip kabin testini yapın.

## İlk güç verme kontrolü

Motorların enerjisi kapalıyken Pico/PC haberleşmesini doğrulayın. Sonra röle girişlerini test edin. En son motor güç kaynağını devreye alın.
