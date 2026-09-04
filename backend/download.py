import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[1]
URL = 'https://archive-api.open-meteo.com/v1/archive'
PARAMS = {
    'latitude': 21.4272, 'longitude': 92.0058,
    'start_date': '2022-01-01', 'end_date': '2025-12-31',
    'daily': 'temperature_2m_max,precipitation_sum', 'timezone': 'Asia/Dhaka',
}


def download():
    response = httpx.get(URL, params=PARAMS, timeout=90, follow_redirects=True)
    response.raise_for_status()
    payload = response.json()
    if not payload.get('daily', {}).get('time'):
        raise ValueError('Source returned no daily data; existing files preserved')
    folder = ROOT / 'data' / 'raw'
    folder.mkdir(parents=True, exist_ok=True)
    (folder / 'weather.json').write_bytes(response.content)
    manifest = {
        'url': str(response.url), 'retrieved_at': datetime.now(timezone.utc).isoformat(),
        'sha256': hashlib.sha256(response.content).hexdigest(),
        'rows': len(payload['daily']['time']), 'license': 'CC-BY-4.0',
        'attribution': 'Weather data by Open-Meteo, based on reanalysis models; not ground-station observations',
        'terms': 'https://open-meteo.com/en/terms',
        'documentation': 'https://open-meteo.com/en/docs/historical-weather-api',
    }
    (folder / 'weather-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(f"Downloaded {manifest['rows']} daily weather records")


if __name__ == '__main__':
    download()
