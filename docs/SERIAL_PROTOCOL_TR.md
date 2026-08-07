# PC ↔ Pico USB Seri Protokolü

Baud: `115200`

## Pico -> PC

```text
READY PICO_V1
EVENT COIN
EVENT SENSOR L
EVENT SENSOR R
STATUS MP3=1 SENSOR_DEBOUNCE=80 MOTOR_L=0 MOTOR_R=0 LED=1
```

## PC -> Pico

```text
PING
STATUS
MOTOR L 420
MOTOR R 420
LED ON
LED OFF
LED PULSE 180
MP3 VOLUME 24
MP3 PLAY 4
SET DEBOUNCE 80
```

Motor komutu bloklamaz; Pico röleyi `millis()` zamanlamasıyla kapatır.
