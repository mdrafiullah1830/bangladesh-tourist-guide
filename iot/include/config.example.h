#pragma once

const char* WIFI_SSID = "YOUR_WIFI";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* API_URL = "https://your-local-tls-server/api/telemetry";
const char* DEVICE_TOKEN = "REGISTER_A_REAL_DEVICE_IN_THE_DASHBOARD";
const bool ALLOW_INSECURE_LAN_HTTP = false;
const char* ROOT_CA = R"CERT(
PASTE_YOUR_SERVER_CA_CERTIFICATE_HERE
)CERT";
