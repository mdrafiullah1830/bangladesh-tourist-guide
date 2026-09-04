#!/usr/bin/env python3
"""Build reproducible Bangladesh public tourism datasets from open APIs."""

from __future__ import annotations

import csv
import hashlib
import json
import time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "public"
RAW = OUT / "raw"
USER_AGENT = "BangladeshTouristGuide/1.0 (public-data pipeline)"
OVERPASS = "https://overpass-api.de/api/interpreter"
WIKIDATA = "https://query.wikidata.org/sparql"
OPEN_METEO = "https://archive-api.open-meteo.com/v1/archive"
BBOX = "20.5,88.0,26.7,92.8"

OSM_FILTERS = {
    "tourism": ['["tourism"~"attraction|museum|viewpoint|hotel|guest_house|hostel|motel|resort|camp_site|information|picnic_site"]'],
    "heritage_nature": ['["historic"]', '["natural"~"beach|peak|waterfall|cave_entrance|spring|wetland"]'],
    "food": ['["amenity"~"restaurant|cafe|fast_food|food_court"]'],
    "emergency": ['["amenity"~"hospital|clinic|police|fire_station"]', '["emergency"="ambulance_station"]'],
    "transport": ['["amenity"~"bus_station|ferry_terminal"]', '["railway"~"station|halt"]', '["aeroway"~"aerodrome|terminal"]'],
}

WEATHER_PLACES = [
    ("dhaka", 23.8103, 90.4125), ("chattogram", 22.3569, 91.7832),
    ("coxs-bazar", 21.4272, 92.0058), ("sylhet", 24.8949, 91.8687),
    ("sundarbans", 21.9497, 89.1833), ("bandarban", 22.1953, 92.2180),
    ("rangamati", 22.7324, 92.2985), ("khulna", 22.8456, 89.5403),
    ("rajshahi", 24.3745, 88.6042), ("barishal", 22.7010, 90.3535),
    ("mymensingh", 24.7471, 90.4203), ("kuakata", 21.8167, 90.1167),
]


def fetch(url: str, data: bytes | None = None, timeout: int = 180) -> bytes:
    request = Request(url, data=data, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    for attempt in range(4):
        try:
            with urlopen(request, timeout=timeout) as response:
                return response.read()
        except Exception:
            if attempt == 3:
                raise
            time.sleep(3 * (attempt + 1))
    raise RuntimeError("unreachable")


def write_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def sha256(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def classify(tags: dict) -> str:
    if tags.get("tourism") in {"hotel", "guest_house", "hostel", "motel", "resort", "camp_site"}:
        return "accommodation"
    if tags.get("amenity") in {"restaurant", "cafe", "fast_food", "food_court"}:
        return "food"
    if tags.get("amenity") in {"hospital", "clinic", "police", "fire_station"} or tags.get("emergency"):
        return "emergency"
    if tags.get("amenity") in {"bus_station", "ferry_terminal"} or tags.get("railway") or tags.get("aeroway"):
        return "transport"
    return "attraction"


def osm() -> tuple[list[dict], list[dict]]:
    records, manifests = [], []
    for group, filters in OSM_FILTERS.items():
        unions = "".join(f"nwr{part}({BBOX});" for part in filters)
        query = f"[out:json][timeout:180];({unions});out center tags;"
        raw_path = RAW / f"osm-{group}-v2.json"
        raw_path.parent.mkdir(parents=True, exist_ok=True)
        payload = raw_path.read_bytes() if raw_path.exists() else fetch(OVERPASS, urlencode({"data": query}).encode())
        if not raw_path.exists():
            raw_path.write_bytes(payload)
        data = json.loads(payload)
        for item in data.get("elements", []):
            tags = item.get("tags", {})
            lat = item.get("lat", item.get("center", {}).get("lat"))
            lon = item.get("lon", item.get("center", {}).get("lon"))
            name = tags.get("name:en") or tags.get("name") or tags.get("name:bn")
            if lat is None or lon is None or not name:
                continue
            records.append({
                "id": f"osm:{item['type']}:{item['id']}", "name": name,
                "name_bn": tags.get("name:bn", ""), "name_en": tags.get("name:en", ""),
                "category": classify(tags), "subtype": tags.get("tourism") or tags.get("historic") or tags.get("natural") or tags.get("amenity") or tags.get("railway") or tags.get("aeroway") or "",
                "latitude": lat, "longitude": lon, "district": tags.get("addr:district", ""),
                "address": tags.get("addr:full") or tags.get("addr:street", ""),
                "phone": tags.get("contact:phone") or tags.get("phone", ""),
                "website": tags.get("contact:website") or tags.get("website", ""),
                "opening_hours": tags.get("opening_hours", ""), "wheelchair": tags.get("wheelchair", ""),
                "source": "OpenStreetMap", "source_url": f"https://www.openstreetmap.org/{item['type']}/{item['id']}",
            })
        manifests.append({"dataset": f"osm-{group}", "rows_raw": len(data.get("elements", [])), "sha256": sha256(payload)})
    unique = {row["id"]: row for row in records}
    return sorted(unique.values(), key=lambda x: (x["category"], x["name"])), manifests


def wikidata() -> tuple[list[dict], dict]:
    query = '''SELECT DISTINCT ?item ?itemLabel ?itemDescription ?coord ?image ?article WHERE {
      ?item wdt:P17 wd:Q902; wdt:P625 ?coord.
      { ?item wdt:P31/wdt:P279* wd:Q570116. } UNION
      { ?item wdt:P31/wdt:P279* wd:Q33506. } UNION
      { ?item wdt:P31/wdt:P279* wd:Q839954. }
      OPTIONAL { ?item wdt:P18 ?image. }
      OPTIONAL { ?article schema:about ?item; schema:isPartOf <https://en.wikipedia.org/>. }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "bn,en". }
    } LIMIT 5000'''
    url = WIKIDATA + "?" + urlencode({"query": query, "format": "json"})
    raw_path = RAW / "wikidata-tourism.json"
    try:
        payload = raw_path.read_bytes() if raw_path.exists() else fetch(url)
    except Exception as exc:
        return [], {"dataset": "wikidata-tourism", "rows": 0, "status": "source_unavailable", "error": str(exc)}
    raw_path.write_bytes(payload)
    rows = []
    for binding in json.loads(payload)["results"]["bindings"]:
        coord = binding["coord"]["value"].removeprefix("Point(").removesuffix(")").split()
        rows.append({
            "id": binding["item"]["value"].rsplit("/", 1)[-1],
            "name": binding.get("itemLabel", {}).get("value", ""),
            "description": binding.get("itemDescription", {}).get("value", ""),
            "longitude": float(coord[0]), "latitude": float(coord[1]),
            "image_url": binding.get("image", {}).get("value", ""),
            "article_url": binding.get("article", {}).get("value", ""),
            "source": "Wikidata", "source_url": binding["item"]["value"],
        })
    return rows, {"dataset": "wikidata-tourism", "rows": len(rows), "sha256": sha256(payload)}


def weather() -> tuple[list[dict], list[dict]]:
    rows, manifests = [], []
    for slug, lat, lon in WEATHER_PLACES:
        params = {
            "latitude": lat, "longitude": lon, "start_date": "2022-01-01", "end_date": "2025-12-31",
            "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum,wind_speed_10m_max",
            "timezone": "Asia/Dhaka",
        }
        raw_path = RAW / f"weather-{slug}.json"
        payload = raw_path.read_bytes() if raw_path.exists() else fetch(OPEN_METEO + "?" + urlencode(params))
        raw_path.write_bytes(payload)
        daily = json.loads(payload)["daily"]
        for i, date in enumerate(daily["time"]):
            rows.append({"place": slug, "latitude": lat, "longitude": lon, "date": date,
                         **{key: daily[key][i] for key in daily if key != "time"}, "source": "Open-Meteo"})
        manifests.append({"dataset": f"weather-{slug}", "rows": len(daily["time"]), "sha256": sha256(payload)})
    return rows, manifests


def write_csv(name: str, rows: list[dict]) -> None:
    path = OUT / name
    path.parent.mkdir(parents=True, exist_ok=True)
    if not rows:
        return
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader(); writer.writerows(rows)


def main() -> None:
    retrieved = datetime.now(timezone.utc).isoformat()
    pois, osm_manifest = osm()
    wiki, wiki_manifest = wikidata()
    climate, weather_manifest = weather()
    write_csv("bangladesh-pois.csv", pois)
    write_json(OUT / "bangladesh-pois.json", pois)
    write_csv("wikidata-tourism.csv", wiki)
    write_csv("historical-weather.csv", climate)
    manifest = {
        "retrieved_at": retrieved,
        "coverage_note": "Public records available through the selected APIs; not an exhaustive registry.",
        "datasets": osm_manifest + [wiki_manifest] + weather_manifest,
        "outputs": {
            "bangladesh-pois": {"rows": len(pois), "categories": dict(Counter(x["category"] for x in pois))},
            "wikidata-tourism": {"rows": len(wiki)}, "historical-weather": {"rows": len(climate)},
        },
        "sources": [
            {"name": "OpenStreetMap", "url": "https://www.openstreetmap.org/copyright", "license": "ODbL 1.0"},
            {"name": "Wikidata", "url": "https://www.wikidata.org/wiki/Wikidata:Licensing", "license": "CC0 1.0"},
            {"name": "Open-Meteo", "url": "https://open-meteo.com/en/terms", "license": "CC BY 4.0"},
        ],
    }
    write_json(OUT / "manifest.json", manifest)
    print(json.dumps(manifest["outputs"], indent=2))


if __name__ == "__main__":
    main()
