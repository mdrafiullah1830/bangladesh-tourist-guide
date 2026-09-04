# Verification record

Tested on 2026-08-31 (Asia/Dhaka), macOS ARM64, Node.js 24.16.0, Python 3.14.6. Firmware tooling uses Python 3.12 and PlatformIO 6.1.19.

## Completed checks

- Exported 12 destinations from the existing repository; did not replace its catalog.
- Downloaded 1,461 daily Cox's Bazar reanalysis records (2022–2025), with original response, attribution and SHA-256 manifest.
- Trained and saved the TF-IDF index and both Random Forest regressors on CPU. Retraining with seed 42 reproduced the reported metrics.
- `python -m pytest backend/tests -q`: **15 passed**, no warnings after pinning compatible NumPy/Starlette versions.
- `npx tsc --noEmit --incremental false`: passed.
- `npm run build`: passed; all 14 static pages generated, including `/smart`. The original Google font required network access at build time.
- Python compilation and shell script syntax checks: passed.
- Real HTTP integration smoke test: passed through the production Next.js proxy, including authorization, recommendation, device telemetry, SOS, acknowledgement and deletion. Uses an isolated temporary database.
- ESP32 firmware: `pio run -d iot` **passed** using `config.example.h` placeholders and the pinned libraries. RAM: 48,180 / 327,680 bytes (14.7%); flash: 937,209 / 1,310,720 bytes (71.5%). Compile success does not validate physical operation or server certificate configuration.
- Re-ran the 15 backend tests from the user's original repository after applying the extension: all passed. Existing `.env`, Prisma database and Git history were preserved; no commit or push was performed.

## Measured model results

| Target | Train / test rows | Random Forest MAE | Mean baseline MAE | R² |
|---|---|---|---|---|
| Synthetic trip cost (BDT) | 1,920 / 480 | 7,768.684 | 44,076.677 | 0.951 |
| Synthetic crowd index (0–100) | 1,096 / 365 | 7.072 | 15.727 | 0.777 |

These are synthetic-target benchmarks, not demonstrated real tourist accuracy. Recommendation category precision@3 is 0.667 on a catalog sanity check, not an independent relevance study. See `data/models/metrics.json` for the exact split and caveats.

## Reproduce

```bash
bash scripts/setup.sh
bash scripts/test.sh
npm run build
.venv/bin/python scripts/smoke.py
```

The smoke test starts localhost ports 8000/3100 with a temporary database and ephemeral operator token, exercises the production frontend proxy, and tears everything down. Those ports must be free; build with the default TOURIST_API_URL first. It does not modify your existing tourist database or contact emergency services.

## Not verified

- Physical GPS satellite fix, sensor calibration, SOS switch wiring, power-loss behavior, Wi-Fi range and outdoor reliability.
- Browser click/visual accessibility audit, mobile-device testing and public deployment.
- Real tourist prediction accuracy, actual ticket/hotel prices or emergency response.
- Existing demo pages beyond successful type checking/build; their advertised integrations have not been converted into live services.

Hardware behavior requires the bench checklist in `ML-IOT.md`. Do not represent software tests as physical validation.
