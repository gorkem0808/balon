# Donanım Bağlantıları

## Pico pin planı

| Pico | Bağlantı | Tip |
|---|---|---|
| GP2 | Sol sensör çıkışı | Dijital giriş, aktif LOW |
| GP3 | Sağ sensör çıkışı | Dijital giriş, aktif LOW |
| GP4 | Koin pulse çıkışı | Dijital giriş, aktif LOW |
| GP6 | Sol motor röle IN | Dijital çıkış |
| GP7 | Sağ motor röle IN | Dijital çıkış |
| GP8 | LED röle IN | Dijital çıkış |
| GP0 | DFPlayer RX'e | UART TX |
| GP1 | DFPlayer TX'ten | UART RX |

## Önerilen bağlantı

```text
                      USB
PC  <================================>  RASPBERRY PI PICO
                                           |
             +-----------------------------+----------------------------+
             |              |              |             |              |
            GP2            GP3            GP4           GP6            GP7
             |              |              |             |              |
        SOL SENSÖR     SAĞ SENSÖR       KOIN IN     SOL MOTOR       SAĞ MOTOR
        3.3V SAFE      3.3V SAFE       OPTO İLE      RÖLE IN         RÖLE IN
                                                          |              |
                                                     röle kontağı    röle kontağı
                                                          |              |
                                                     MOTOR PSU        MOTOR PSU

            GP8 -----------------------> LED RÖLE IN ---> LED güç hattı

            GP0 (TX) ------------------> DFPlayer RX
            GP1 (RX) <------------------ DFPlayer TX
            GND      ------------------- DFPlayer GND
```

## Röle mantığı

Firmware varsayılan olarak **active LOW röle modülü** kabul eder. Röleniz active HIGH ise `pins.h` içindeki:

```cpp
#define RELAY_ACTIVE_LOW true
```

değerini `false` yapın.

## Koin ve sensör gerilimi

Pico GPIO **3.3V lojiktir**. 5V veya 12V pulse üreten koin/sensör çıkışını GP pinine doğrudan bağlamayın. Optokuplör, transistor veya uygun level shifter kullanın.

## Motor güç hattı

Motor akımı Pico üzerinden geçmez. Rölenin COM/NO kontakları motorun kendi güç kaynağını anahtarlar. Motor beslemesine uygun sigorta koyun. DC fırçalı motorda motor uçlarına uygun flyback diyodu veya kontak/snubber koruması kullanın.
