# Public tourism datasets

Run `python backend/public_data.py` to rebuild the public datasets in `data/public/`.
Then run `npm run db:push` and `npm run data:import` to load validated POIs into
the application database. The import is transactional, idempotent, and rejects an
unexpectedly small or geographically invalid dataset.

The pipeline combines named points inside OpenStreetMap's Bangladesh administrative boundary,
tourism metadata from Wikidata, and 2022–2025 daily weather for 12 representative
destinations from Open-Meteo. `manifest.json` records retrieval time, row counts,
checksums, source URLs, and licences. Raw API responses are retained for auditing.

This is broad public-API coverage, not a claim that every online record is present.
Prices, opening hours, phone numbers, and emergency details can become stale and
must be independently verified before being shown as authoritative or safety-critical.

Attribution is required: © OpenStreetMap contributors (ODbL); weather data by
Open-Meteo (CC BY 4.0). Wikidata structured data is CC0.

The public `/api/places` endpoint supports `type`, `q`, `limit` (maximum 500), and
`offset` parameters. The map uses this endpoint and falls back to its small bundled
dataset if the database is temporarily unavailable.
