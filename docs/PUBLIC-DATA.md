# Public tourism datasets

Run `python backend/public_data.py` to rebuild the public datasets in `data/public/`.

The pipeline combines named Bangladesh points of interest from OpenStreetMap,
tourism metadata from Wikidata, and 2022–2025 daily weather for 12 representative
destinations from Open-Meteo. `manifest.json` records retrieval time, row counts,
checksums, source URLs, and licences. Raw API responses are retained for auditing.

This is broad public-API coverage, not a claim that every online record is present.
Prices, opening hours, phone numbers, and emergency details can become stale and
must be independently verified before being shown as authoritative or safety-critical.

Attribution is required: © OpenStreetMap contributors (ODbL); weather data by
Open-Meteo (CC BY 4.0). Wikidata structured data is CC0.
