"""Generate clearly labeled synthetic datasets for the new ML extensions.

All outputs are marked ``*-synthetic.csv``. They are NOT real tourist data;
they exist only to demonstrate the ML pipeline end-to-end and to keep the
training script reproducible (fixed random seeds).

Datasets produced:
  * itineraries-synthetic.csv  Traveler clustering inputs (days, budget, group,
                               season, interests, distance, chosen category).
  * demand-synthetic.csv       Monthly visitor counts per destination.
  * hotels-synthetic.csv       Hotel price estimator features and target.
  * reviews-synthetic.csv      Labeled review text with 1-5 sentiment score.
  * telemetry-baseline-synthetic.csv  Device baseline used to fit the anomaly
                                      detector (synthetic, not user data).
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'
SEED = 42

CATEGORIES = ['beach', 'mountain', 'nature', 'heritage', 'city']
SEASONS = ['winter', 'summer', 'monsoon', 'autumn']
INTEREST_WORDS = ['beach', 'hills', 'tea', 'wildlife', 'heritage', 'food', 'shopping', 'adventure', 'sunset', 'lake']


def _load_places() -> pd.DataFrame:
    places = pd.read_json(DATA / 'places.json').drop_duplicates('slug')
    return places.sort_values('slug').reset_index(drop=True)


def itineraries(places: pd.DataFrame, n: int = 2400) -> pd.DataFrame:
    rng = np.random.default_rng(SEED)
    df = pd.DataFrame({
        'days': rng.integers(1, 15, n),
        'travellers': rng.integers(1, 7, n),
        'daily_budget': rng.integers(800, 8000, n),
        'distance_km': rng.uniform(20, 600, n).round(1),
        'month': rng.integers(1, 13, n),
        'interests': [' '.join(rng.choice(INTEREST_WORDS, size=rng.integers(1, 4), replace=False)) for _ in range(n)],
        'category': rng.choice(CATEGORIES, n),
    })
    df['season'] = pd.cut(df['month'], bins=[0, 2, 4, 9, 12], labels=['winter', 'summer', 'monsoon', 'autumn']).astype(str)
    df['total_spend'] = (df['days'] * df['daily_budget'] + df['distance_km'] * 4) * df['travellers']
    df['category'] = df['category'].astype(str)
    return df


def demand(places: pd.DataFrame) -> pd.DataFrame:
    rng = np.random.default_rng(SEED + 1)
    rows = []
    months = pd.date_range('2022-01-01', '2025-12-31', freq='MS')
    for _, place in places.iterrows():
        base = 1500 + (place['daily_cost'] % 5) * 800
        seasonal = np.array([0.4, 0.35, 0.5, 0.9, 1.1, 0.8, 0.7, 0.6, 0.7, 1.1, 1.4, 1.6])  # winter peak
        cat_boost = {'beach': 1.5, 'mountain': 0.8, 'nature': 1.0, 'heritage': 1.1, 'city': 1.2}[place['category']]
        for date in months:
            visitors = int(base * cat_boost * seasonal[date.month - 1] * rng.lognormal(0, 0.12))
            rows.append({'date': date.strftime('%Y-%m-%d'), 'month': date.month, 'year': date.year,
                         'slug': place['slug'], 'category': place['category'],
                         'avg_daily_cost': place['daily_cost'], 'visitors': visitors})
    return pd.DataFrame(rows)


def hotels(places: pd.DataFrame, n: int = 1500) -> pd.DataFrame:
    rng = np.random.default_rng(SEED + 2)
    rows = []
    room_types = ['standard', 'deluxe', 'suite']
    for _, place in places.iterrows():
        for _ in range(n // len(places)):
            stars = int(rng.integers(2, 6))
            distance_center_km = round(float(rng.uniform(0.5, 12.0)), 1)
            season = rng.choice(SEASONS)
            month = rng.integers(1, 13)
            room = rng.choice(room_types)
            base = place['daily_cost'] * 1.8 + stars * 600
            season_mult = {'winter': 1.25, 'summer': 1.05, 'monsoon': 0.85, 'autumn': 1.15}[season]
            dist_mult = 1 + distance_center_km / 40
            room_mult = {'standard': 1.0, 'deluxe': 1.35, 'suite': 1.85}[room]
            price = int(base * season_mult * dist_mult * room_mult * rng.lognormal(0, 0.08))
            rows.append({'slug': place['slug'], 'stars': stars, 'distance_center_km': distance_center_km,
                         'month': month, 'season': season, 'room_type': room,
                         'baseline_daily_cost': place['daily_cost'], 'price_bdt': price})
    return pd.DataFrame(rows)


_REVIEW_TEMPLATES = {
    1: ['terrible service and dirty room', 'rude staff and noisy place', 'worst experience ever',
        'horrible smell and broken air conditioning', 'staff ignored our complaints'],
    2: ['not worth the price', 'below average food and slow wifi', 'mediocre rooms with bad lighting',
        'small room and unhelpful staff', 'expected better from the pictures'],
    3: ['average stay nothing special', 'okay place for one night', 'decent location but small rooms',
        'reasonable value for a short trip', 'fine but nothing to remember'],
    4: ['good service and clean room', 'nice food and helpful staff', 'comfortable stay would return',
        'great breakfast and friendly staff', 'pleasant view and good wifi'],
    5: ['amazing experience wonderful staff', 'spotless room with great view', 'best trip ever highly recommend',
        'outstanding service and perfect location', 'memorable stay with excellent food'],
}


def reviews(places: pd.DataFrame, n: int = 1200) -> pd.DataFrame:
    rng = np.random.default_rng(SEED + 3)
    rows = []
    for _, place in places.iterrows():
        for _ in range(n // len(places)):
            score = int(np.clip(rng.normal(loc=rng.integers(2, 6), scale=1.4), 1, 5))
            template = rng.choice(_REVIEW_TEMPLATES[score])
            extra_keys = list(range(max(1, score - 1), min(5, score + 1) + 1))
            extras_pool = [t for k in extra_keys for t in _REVIEW_TEMPLATES[k]]
            extras_size = int(rng.integers(0, min(2, len(extras_pool)) + 1))
            extras = rng.choice(extras_pool, size=extras_size, replace=False) if extras_size else []
            fragments = [template, *extras]
            rng.shuffle(fragments)
            text = f"{place['name']} " + ' '.join(fragments)
            rows.append({'slug': place['slug'], 'category': place['category'], 'text': text, 'score': score})
    return pd.DataFrame(rows)


def telemetry_baseline(n: int = 1200) -> pd.DataFrame:
    rng = np.random.default_rng(SEED + 4)
    return pd.DataFrame({
        'temperature': rng.normal(30, 4, n).round(1),
        'humidity': np.clip(rng.normal(70, 10, n), 0, 100).round(1),
        'latitude': rng.normal(23.5, 0.7, n).round(5),
        'longitude': rng.normal(90.5, 0.7, n).round(5),
        'sos': rng.integers(0, 2, n),
    })


def main():
    DATA.mkdir(parents=True, exist_ok=True)
    places = _load_places()
    out = {
        'itineraries': itineraries(places),
        'demand': demand(places),
        'hotels': hotels(places),
        'reviews': reviews(places),
        'telemetry-baseline': telemetry_baseline(),
    }
    for name, frame in out.items():
        path = DATA / f'{name}-synthetic.csv'
        frame.to_csv(path, index=False)
    summary = {name: {'rows': int(len(frame)), 'columns': list(frame.columns)} for name, frame in out.items()}
    print(json.dumps(summary, indent=2))


if __name__ == '__main__':
    main()