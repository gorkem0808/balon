#include <Arduino.h>
#include <DFRobotDFPlayerMini.h>
#include "pins.h"

DFRobotDFPlayerMini dfPlayer;
bool mp3Ready = false;

uint32_t sensorDebounceMs = 80;
uint32_t coinDebounceMs = 120;

struct DebouncedInput {
  uint8_t pin;
  bool stable;
  bool lastRaw;
  uint32_t lastChange;
};

DebouncedInput sensorLeft  { PIN_SENSOR_LEFT,  true, true, 0 };
DebouncedInput sensorRight { PIN_SENSOR_RIGHT, true, true, 0 };
DebouncedInput coinInput   { PIN_COIN,         true, true, 0 };

struct RelayPulse {
  uint8_t pin;
  bool active;
  uint32_t offAt;
};

RelayPulse motorLeft  { PIN_RELAY_MOTOR_L, false, 0 };
RelayPulse motorRight { PIN_RELAY_MOTOR_R, false, 0 };
RelayPulse ledPulse   { PIN_RELAY_LED, false, 0 };

bool ledLatched = false;

bool activeLevel() {
  return INPUT_ACTIVE_LOW ? LOW : HIGH;
}

void setRelay(uint8_t pin, bool on) {
  if (RELAY_ACTIVE_LOW) digitalWrite(pin, on ? LOW : HIGH);
  else digitalWrite(pin, on ? HIGH : LOW);
}

void startPulse(RelayPulse &relay, uint32_t durationMs) {
  durationMs = constrain(durationMs, 20UL, 15000UL);
  relay.active = true;
  relay.offAt = millis() + durationMs;
  setRelay(relay.pin, true);
}

void updatePulse(RelayPulse &relay) {
  if (relay.active && (int32_t)(millis() - relay.offAt) >= 0) {
    relay.active = false;
    if (relay.pin == PIN_RELAY_LED) {
      setRelay(relay.pin, ledLatched);
    } else {
      setRelay(relay.pin, false);
    }
  }
}

bool updateInput(DebouncedInput &input, uint32_t debounceMs) {
  bool raw = digitalRead(input.pin);
  if (raw != input.lastRaw) {
    input.lastRaw = raw;
    input.lastChange = millis();
  }

  if (raw != input.stable && (millis() - input.lastChange) >= debounceMs) {
    input.stable = raw;
    if (input.stable == activeLevel()) return true;
  }
  return false;
}

void sendReady() {
  Serial.println("READY PICO_V1");
}

void sendStatus() {
  Serial.print("STATUS MP3=");
  Serial.print(mp3Ready ? "1" : "0");
  Serial.print(" SENSOR_DEBOUNCE=");
  Serial.print(sensorDebounceMs);
  Serial.print(" MOTOR_L=");
  Serial.print(motorLeft.active ? "1" : "0");
  Serial.print(" MOTOR_R=");
  Serial.print(motorRight.active ? "1" : "0");
  Serial.print(" LED=");
  Serial.println((ledLatched || ledPulse.active) ? "1" : "0");
}

void handleCommand(String line) {
  line.trim();
  if (!line.length()) return;

  String upper = line;
  upper.toUpperCase();

  if (upper == "PING") {
    Serial.println("PONG");
    sendReady();
    return;
  }

  if (upper == "STATUS") {
    sendStatus();
    return;
  }

  if (upper.startsWith("MOTOR ")) {
    char side = upper.charAt(6);
    int secondSpace = upper.indexOf(' ', 8);
    long duration = 400;
    if (secondSpace > 0) duration = upper.substring(secondSpace + 1).toInt();
    else duration = upper.substring(8).toInt();

    if (side == 'L') {
      startPulse(motorLeft, duration);
      Serial.println("ACK MOTOR L");
    } else if (side == 'R') {
      startPulse(motorRight, duration);
      Serial.println("ACK MOTOR R");
    }
    return;
  }

  if (upper == "LED ON") {
    ledLatched = true;
    setRelay(PIN_RELAY_LED, true);
    Serial.println("ACK LED ON");
    return;
  }

  if (upper == "LED OFF") {
    ledLatched = false;
    ledPulse.active = false;
    setRelay(PIN_RELAY_LED, false);
    Serial.println("ACK LED OFF");
    return;
  }

  if (upper.startsWith("LED PULSE ")) {
    long duration = upper.substring(10).toInt();
    startPulse(ledPulse, duration);
    Serial.println("ACK LED PULSE");
    return;
  }

  if (upper.startsWith("MP3 VOLUME ")) {
    int volume = constrain(upper.substring(11).toInt(), 0, 30);
    if (mp3Ready) dfPlayer.volume(volume);
    Serial.print("ACK MP3 VOLUME ");
    Serial.println(volume);
    return;
  }

  if (upper.startsWith("MP3 PLAY ")) {
    int track = max(1, upper.substring(9).toInt());
    if (mp3Ready) dfPlayer.play(track);
    Serial.print("ACK MP3 PLAY ");
    Serial.println(track);
    return;
  }

  if (upper.startsWith("SET DEBOUNCE ")) {
    sensorDebounceMs = constrain(upper.substring(13).toInt(), 10UL, 2000UL);
    Serial.print("ACK DEBOUNCE ");
    Serial.println(sensorDebounceMs);
    return;
  }

  Serial.print("ERR UNKNOWN ");
  Serial.println(line);
}

void setup() {
  pinMode(PIN_SENSOR_LEFT, INPUT_PULLUP);
  pinMode(PIN_SENSOR_RIGHT, INPUT_PULLUP);
  pinMode(PIN_COIN, INPUT_PULLUP);

  pinMode(PIN_RELAY_MOTOR_L, OUTPUT);
  pinMode(PIN_RELAY_MOTOR_R, OUTPUT);
  pinMode(PIN_RELAY_LED, OUTPUT);
  setRelay(PIN_RELAY_MOTOR_L, false);
  setRelay(PIN_RELAY_MOTOR_R, false);
  setRelay(PIN_RELAY_LED, false);

  Serial.begin(115200);
  delay(600);

#if defined(ARDUINO_ARCH_RP2040)
  Serial1.setTX(PIN_MP3_TX);
  Serial1.setRX(PIN_MP3_RX);
#endif
  Serial1.begin(9600);
  delay(300);
  mp3Ready = dfPlayer.begin(Serial1);
  if (mp3Ready) {
    dfPlayer.volume(24);
    Serial.println("INFO MP3 READY");
  } else {
    Serial.println("INFO MP3 NOT_FOUND");
  }

  sensorLeft.stable = sensorLeft.lastRaw = digitalRead(PIN_SENSOR_LEFT);
  sensorRight.stable = sensorRight.lastRaw = digitalRead(PIN_SENSOR_RIGHT);
  coinInput.stable = coinInput.lastRaw = digitalRead(PIN_COIN);

  sendReady();
}

void loop() {
  if (updateInput(sensorLeft, sensorDebounceMs)) Serial.println("EVENT SENSOR L");
  if (updateInput(sensorRight, sensorDebounceMs)) Serial.println("EVENT SENSOR R");
  if (updateInput(coinInput, coinDebounceMs)) Serial.println("EVENT COIN");

  updatePulse(motorLeft);
  updatePulse(motorRight);
  updatePulse(ledPulse);

  while (Serial.available()) {
    String line = Serial.readStringUntil('\n');
    handleCommand(line);
  }

  delay(1);
}
