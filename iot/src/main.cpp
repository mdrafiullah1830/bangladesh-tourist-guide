#include <Arduino.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <HTTPClient.h>
#include <Preferences.h>
#include <TinyGPSPlus.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <time.h>
#include "config.h"

constexpr int SOS_PIN = 27;
constexpr int DHT_PIN = 4;
constexpr int LED_PIN = 2;
constexpr int GPS_RX = 16;
constexpr int GPS_TX = 17;
TinyGPSPlus gps;
DHT dht(DHT_PIN, DHT22);
Preferences storage;
HardwareSerial gpsSerial(2);
volatile bool buttonPressed = false;
String pendingSos;
bool sosRequested = false;
unsigned long lastAttempt = 0;
unsigned long lastReading = 0;
unsigned long lastWifi = 0;
unsigned long lastButton = 0;
uint32_t sequenceNumber = 0;
uint32_t bootId = 0;

void IRAM_ATTR onButton() {
  buttonPressed = true;
}

String eventPayload(bool sos) {
  time_t timestamp = time(nullptr);
  if (timestamp < 1700000000) return "";
  struct tm utc;
  gmtime_r(&timestamp, &utc);
  char dateText[32];
  strftime(dateText, sizeof(dateText), "%Y-%m-%dT%H:%M:%SZ", &utc);
  JsonDocument document;
  document["event_id"] = String(bootId, HEX) + "-" + String(sequenceNumber++);
  document["recorded_at"] = dateText;
  document["sos"] = sos;
  if (gps.location.isValid() && gps.location.age() < 15000) {
    document["latitude"] = gps.location.lat();
    document["longitude"] = gps.location.lng();
  } else {
    document["latitude"] = nullptr;
    document["longitude"] = nullptr;
  }
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  if (!isnan(temperature)) document["temperature"] = temperature;
  if (!isnan(humidity)) document["humidity"] = humidity;
  String payload;
  serializeJson(document, payload);
  return payload;
}

bool transmit(const String& payload) {
  if (WiFi.status() != WL_CONNECTED || payload.length() == 0) return false;
  HTTPClient http;
  WiFiClient plain;
  WiFiClientSecure secure;
  bool started = false;
  if (String(API_URL).startsWith("https://")) {
    secure.setCACert(ROOT_CA);
    started = http.begin(secure, API_URL);
  } else if (ALLOW_INSECURE_LAN_HTTP && String(API_URL).startsWith("http://")) {
    started = http.begin(plain, API_URL);
  }
  if (!started) return false;
  http.setConnectTimeout(2000);
  http.setTimeout(3000);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + DEVICE_TOKEN);
  int status = http.POST(payload);
  http.end();
  Serial.printf("Delivery HTTP status: %d\n", status);
  return status >= 200 && status < 300;
}

void setup() {
  Serial.begin(115200);
  pinMode(SOS_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  attachInterrupt(digitalPinToInterrupt(SOS_PIN), onButton, FALLING);
  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);
  dht.begin();
  bootId = esp_random();
  storage.begin("tourist", false);
  pendingSos = storage.getString("sos", "");
  sosRequested = storage.getBool("requested", false);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
}

void loop() {
  while (gpsSerial.available()) gps.encode(gpsSerial.read());
  unsigned long tick = millis();
  if (buttonPressed) {
    buttonPressed = false;
    if (lastButton == 0 || tick - lastButton > 250) {
      sosRequested = true;
      storage.putBool("requested", true);
      lastButton = tick;
    }
  }
  if (sosRequested && pendingSos.length() == 0) {
    pendingSos = eventPayload(true);
    if (pendingSos.length()) {
      storage.putString("sos", pendingSos);
      sosRequested = false;
      storage.putBool("requested", false);
    }
  }
  digitalWrite(LED_PIN, (sosRequested || pendingSos.length()) ? HIGH : LOW);
  if (WiFi.status() != WL_CONNECTED && tick - lastWifi >= 15000) {
    WiFi.reconnect();
    lastWifi = tick;
  }
  if (pendingSos.length() && tick - lastAttempt >= 5000) {
    lastAttempt = tick;
    if (transmit(pendingSos)) {
      pendingSos = "";
      storage.remove("sos");
    }
  } else if (pendingSos.length() == 0 && tick - lastReading >= 15000) {
    lastReading = tick;
    transmit(eventPayload(false));
  }
  delay(5);
}
