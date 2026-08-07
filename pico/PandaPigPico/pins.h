#pragma once

// Raspberry Pi Pico / RP2040 pin plan
// Inputs MUST be 3.3V-safe. 5V/12V sensor outputs require optocoupler or level shifting.
#define PIN_SENSOR_LEFT      2
#define PIN_SENSOR_RIGHT     3
#define PIN_COIN             4

#define PIN_RELAY_MOTOR_L    6
#define PIN_RELAY_MOTOR_R    7
#define PIN_RELAY_LED        8

// DFPlayer Mini UART
#define PIN_MP3_TX           0   // Pico TX -> DFPlayer RX (series resistor recommended)
#define PIN_MP3_RX           1   // Pico RX <- DFPlayer TX

#define RELAY_ACTIVE_LOW     true
#define INPUT_ACTIVE_LOW     true
