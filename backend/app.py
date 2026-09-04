import hashlib
import json
import math
import os
import secrets
import sqlite3
import uuid
from contextlib import asynccontextmanager, contextmanager
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Annotated

import joblib
import pandas as pd
from fastapi import Depends, FastAPI, Header, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field, model_validator

from backend.train import ARTIFACTS, FEATURES, ROOT


def now():
    return datetime.now(timezone.utc)


def distance_km(lat1, lon1, lat2, lon2):
    delta_lat, delta_lon = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
    term = math.sin(delta_lat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(delta_lon / 2) ** 2
    return 6371 * 2 * math.asin(math.sqrt(min(1, term)))


class StrictModel(BaseModel):
    model_config = ConfigDict(extra='forbid', allow_inf_nan=False)


class Preferences(StrictModel):
    interests: str = Field(default='nature beach', min_length=1, max_length=160)
    daily_budget: float = Field(default=3000, ge=100, le=100000)
    latitude: float = Field(default=23.8103, ge=-90, le=90)
    longitude: float = Field(default=90.4125, ge=-180, le=180)
    limit: int = Field(default=5, ge=1, le=12)


class CostInput(StrictModel):
    slug: str = Field(min_length=1, max_length=80)
    days: int = Field(default=3, ge=1, le=14)
    travellers: int = Field(default=1, ge=1, le=6)
    distance_km: float = Field(default=200, ge=0, le=600)


class CrowdInput(StrictModel):
    date: date
    rain_mm: float = Field(default=0, ge=0, le=100)


class ClusterInput(StrictModel):
    days: int = Field(ge=1, le=30)
    travellers: int = Field(ge=1, le=10)
    daily_budget: float = Field(ge=100, le=50000)
    distance_km: float = Field(ge=0, le=2000)


class DemandInput(StrictModel):
    slug: str = Field(min_length=1, max_length=80)
    month: int = Field(ge=1, le=12)
    avg_daily_cost: float = Field(ge=100, le=50000)
    visitors_count_lag1: float = Field(ge=0, le=10_000_000)
    visitors_count_lag12: float = Field(ge=0, le=10_000_000)


class HotelPriceInput(StrictModel):
    slug: str = Field(min_length=1, max_length=80)
    stars: int = Field(ge=1, le=5)
    distance_center_km: float = Field(ge=0, le=100)
    baseline_daily_cost: float = Field(ge=100, le=20000)
    season: str = Field(pattern='^(winter|summer|monsoon|autumn)$')
    room_type: str = Field(pattern='^(standard|deluxe|suite)$')


class SentimentInput(StrictModel):
    text: str = Field(min_length=1, max_length=1000)


class AnomalyInput(StrictModel):
    temperature: float | None = Field(default=None, ge=-40, le=85)
    humidity: float | None = Field(default=None, ge=0, le=100)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)


class SeasonInput(StrictModel):
    slug: str = Field(min_length=1, max_length=80)
    avg_daily_cost: float = Field(ge=100, le=50000)
    category: str = Field(min_length=1, max_length=40)


class DeviceInput(StrictModel):
    name: str = Field(min_length=1, max_length=60)
    simulated: bool = True
    consent: bool


class TelemetryInput(StrictModel):
    event_id: str = Field(min_length=1, max_length=80, pattern=r'^[A-Za-z0-9_-]+$')
    recorded_at: datetime
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    temperature: float | None = Field(default=None, ge=-40, le=85)
    humidity: float | None = Field(default=None, ge=0, le=100)
    sos: bool = False

    @model_validator(mode='after')
    def validate_fix(self):
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError('Both GPS coordinates or neither must be provided')
        if self.recorded_at.tzinfo is None:
            raise ValueError('recorded_at requires a timezone')
        if self.recorded_at > now() + timedelta(minutes=5):
            raise ValueError('Device clock is in the future')
        if self.recorded_at < now() - timedelta(days=7):
            raise ValueError('Telemetry older than seven days is outside retention window')
        return self


def create_app(db_path=None, admin_token=None, model_dir=None):
    database_path = Path(db_path or os.getenv('SAFETY_DATABASE', str(ROOT / 'data' / 'safety.sqlite3')))
    token = admin_token or os.getenv('TOURIST_ADMIN_TOKEN', '')
    model_path = Path(model_dir or ARTIFACTS)

    @contextmanager
    def database():
        connection = sqlite3.connect(database_path, timeout=10)
        connection.row_factory = sqlite3.Row
        connection.execute('PRAGMA foreign_keys=ON')
        try:
            with connection:
                yield connection
        finally:
            connection.close()

    @asynccontextmanager
    async def lifespan(app):
        if len(token) < 32:
            raise RuntimeError('Set TOURIST_ADMIN_TOKEN to at least 32 random characters; run scripts/setup.sh')
        database_path.parent.mkdir(parents=True, exist_ok=True)
        with database() as connection:
            connection.executescript((ROOT / 'backend' / 'schema.sql').read_text())
        if not (model_path / 'bundle.joblib').exists():
            raise RuntimeError('Models missing. Run python -m backend.train first.')
        app.state.bundle = joblib.load(model_path / 'bundle.joblib')
        app.state.report = json.loads((model_path / 'metrics.json').read_text())
        yield

    app = FastAPI(title='Bangladesh Tourist ML & Safety', version='1.0.0', lifespan=lifespan)

    # CORS middleware for frontend access
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware('http')
    async def private_responses(request, call_next):
        response = await call_next(request)
        response.headers['Cache-Control'] = 'no-store'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        return response

    def operator(authorization: Annotated[str | None, Header()] = None):
        if not secrets.compare_digest((authorization or '').encode(), f'Bearer {token}'.encode()):
            raise HTTPException(401, 'Operator token required')

    def device_identity(authorization: Annotated[str | None, Header()] = None):
        supplied = (authorization or '').removeprefix('Bearer ')
        digest = hashlib.sha256(supplied.encode()).hexdigest()
        with database() as connection:
            device = connection.execute('SELECT * FROM devices WHERE token_hash=?', (digest,)).fetchone()
        if device is None:
            raise HTTPException(401, 'Valid device token required')
        return dict(device)

    def rank(request):
        bundle = app.state.bundle
        similarities = (bundle['matrix'] @ bundle['vectorizer'].transform([request.interests]).T).toarray().ravel()
        results = []
        for place, similarity in zip(bundle['places'], similarities):
            if place['daily_cost'] > request.daily_budget:
                continue
            distance = distance_km(request.latitude, request.longitude, place['latitude'], place['longitude'])
            score = .85 * float(similarity) + .15 / (1 + distance / 100)
            results.append({**place, 'distance_km': round(distance, 1), 'score': round(score, 4),
                            'reason': 'Text-interest similarity and straight-line proximity; catalog costs are unverified estimates'})
        return sorted(results, key=lambda item: (-item['score'], item['slug']))[:request.limit]

    @app.get('/health')
    def health():
        return {'status': 'ok', 'prototype': True}

    @app.get('/api/models', dependencies=[Depends(operator)])
    def models():
        return app.state.report

    @app.get('/api/places', dependencies=[Depends(operator)])
    def places():
        return app.state.bundle['places']

    @app.post('/api/recommend', dependencies=[Depends(operator)])
    def recommend(request: Preferences):
        return {'items': rank(request), 'method': 'TF-IDF + budget filter + distance heuristic', 'data_status': 'CATALOG_ESTIMATES'}

    @app.post('/api/predict/cost', dependencies=[Depends(operator)])
    def cost(request: CostInput):
        place = next((place for place in app.state.bundle['places'] if place['slug'] == request.slug), None)
        if place is None:
            raise HTTPException(404, 'Unknown destination')
        features = {**request.model_dump(exclude={'slug'}), 'daily_cost': place['daily_cost']}
        prediction = app.state.bundle['models']['cost'].predict(pd.DataFrame([features])[FEATURES['cost']])[0]
        return {'estimated_bdt': round(float(prediction)), 'data_status': 'SYNTHETIC_MODEL',
                'scope': 'Per-person daily catalog estimate × days × travellers plus illustrative transport; not a quote',
                'test_mae_bdt': app.state.report['models']['cost']['random_forest']['mae']}

    @app.post('/api/predict/crowd', dependencies=[Depends(operator)])
    def crowd(request: CrowdInput):
        values = {'month': request.date.month, 'weekend': int(request.date.weekday() in [4, 5]), 'rain_mm': request.rain_mm}
        predicted = app.state.bundle['models']['crowd'].predict(pd.DataFrame([values])[FEATURES['crowd']])[0]
        return {'index': round(float(predicted), 1), 'data_status': 'SYNTHETIC_MODEL',
                'scope': "Illustrative Cox's Bazar 0–100 crowd index; rain is an input scenario, not live weather or actual visitor counts"}

    @app.post('/api/devices', dependencies=[Depends(operator)], status_code=201)
    def register_device(request: DeviceInput):
        if not request.consent:
            raise HTTPException(422, 'Explicit tracking consent is required')
        device_id, device_token = uuid.uuid4().hex, secrets.token_urlsafe(32)
        with database() as connection:
            connection.execute('INSERT INTO devices VALUES (?,?,?,?,?)',
                               (device_id, request.name, hashlib.sha256(device_token.encode()).hexdigest(), int(request.simulated), now().isoformat()))
        return {'id': device_id, 'token': device_token, 'simulated': request.simulated,
                'notice': 'Save token now; it cannot be retrieved. No police or external notification is sent.'}

    @app.post('/api/telemetry')
    def telemetry(request: TelemetryInput, device=Depends(device_identity)):
        received_at = now().isoformat()
        recorded_at = request.recorded_at.astimezone(timezone.utc).isoformat()
        with database() as connection:
            connection.execute('DELETE FROM telemetry WHERE received_at < ?', ((now() - timedelta(days=7)).isoformat(),))
            cursor = connection.execute(
                'INSERT OR IGNORE INTO telemetry (device_id,event_id,recorded_at,received_at,latitude,longitude,temperature,humidity,sos) VALUES (?,?,?,?,?,?,?,?,?)',
                (device['id'], request.event_id, recorded_at, received_at, request.latitude, request.longitude, request.temperature, request.humidity, int(request.sos)))
            if cursor.rowcount == 0:
                return {'accepted': True, 'duplicate': True}
            kinds = []
            if request.sos:
                kinds.append('SOS')
            if request.temperature is not None and request.temperature >= 38:
                kinds.append('HIGH_TEMPERATURE')
            for kind in kinds:
                connection.execute('INSERT INTO alerts (telemetry_id,kind) VALUES (?,?)', (cursor.lastrowid, kind))
        return {'accepted': True, 'duplicate': False, 'alerts': kinds, 'simulated': bool(device['simulated'])}

    @app.get('/api/safety', dependencies=[Depends(operator)])
    def safety():
        with database() as connection:
            connection.execute('DELETE FROM telemetry WHERE received_at < ?', ((now() - timedelta(days=7)).isoformat(),))
            devices = [dict(row) for row in connection.execute(
                'SELECT devices.id,devices.name,devices.simulated,telemetry.recorded_at,telemetry.received_at,telemetry.latitude,telemetry.longitude,telemetry.temperature,telemetry.humidity FROM devices LEFT JOIN telemetry ON telemetry.id=(SELECT latest.id FROM telemetry latest WHERE latest.device_id=devices.id ORDER BY latest.recorded_at DESC,latest.id DESC LIMIT 1) ORDER BY devices.created_at DESC')]
            alerts = [dict(row) for row in connection.execute(
                'SELECT alerts.*,telemetry.device_id,telemetry.recorded_at,telemetry.latitude,telemetry.longitude,devices.name,devices.simulated FROM alerts JOIN telemetry ON telemetry.id=alerts.telemetry_id JOIN devices ON devices.id=telemetry.device_id ORDER BY alerts.id DESC LIMIT 100')]
        for device in devices:
            device['simulated'] = bool(device['simulated'])
            device['stale'] = device['recorded_at'] is None or now() - datetime.fromisoformat(device['recorded_at']) > timedelta(minutes=2)
        for alert in alerts:
            alert['simulated'] = bool(alert['simulated'])
        return {'devices': devices, 'alerts': alerts, 'retention_days': 7, 'external_dispatch': False}

    @app.post('/api/alerts/{alert_id}/ack', dependencies=[Depends(operator)])
    def acknowledge(alert_id: int):
        with database() as connection:
            cursor = connection.execute("UPDATE alerts SET status='acknowledged',acknowledged_at=COALESCE(acknowledged_at,?) WHERE id=?", (now().isoformat(), alert_id))
            if not cursor.rowcount:
                raise HTTPException(404, 'Alert not found')
        return {'status': 'acknowledged', 'external_dispatch': False}

    @app.delete('/api/devices/{device_id}', dependencies=[Depends(operator)], status_code=204)
    def delete_device(device_id: str):
        with database() as connection:
            cursor = connection.execute('DELETE FROM devices WHERE id=?', (device_id,))
            if not cursor.rowcount:
                raise HTTPException(404, 'Device not found')
        return Response(status_code=204)

    def _place(slug: str) -> dict:
        place = next((place for place in app.state.bundle['places'] if place['slug'] == slug), None)
        if place is None:
            raise HTTPException(404, 'Unknown destination')
        return place

    def _anomaly_features(payload: AnomalyInput) -> tuple[list[float], list[str]]:
        missing = [name for name in ('temperature', 'humidity', 'latitude', 'longitude') if getattr(payload, name) is None]
        if missing:
            raise HTTPException(422, f'Anomaly detection requires all four fields; missing: {", ".join(missing)}')
        return [payload.temperature, payload.humidity, payload.latitude, payload.longitude], missing

    @app.post('/api/predict/cluster', dependencies=[Depends(operator)])
    def cluster(request: ClusterInput):
        bundle = app.state.bundle
        cluster_model = bundle['extension_models']['clustering']
        names = bundle['extension_models']['clustering_meta']['names']
        rows = pd.DataFrame([request.model_dump()])[['days', 'travellers', 'daily_budget', 'distance_km']]
        cluster_id = int(cluster_model.predict(rows)[0])
        return {
            'cluster_id': cluster_id,
            'cluster_name': names[cluster_id],
            'method': 'KMeans (k=4) on scaled synthetic itinerary features',
            'data_status': 'SYNTHETIC_MODEL',
            'scope': 'Synthetic-only traveler segmentation; cluster boundaries are not learned from real travelers.',
        }

    @app.post('/api/predict/demand', dependencies=[Depends(operator)])
    def demand(request: DemandInput):
        place = _place(request.slug)
        rows = pd.DataFrame([{'month': request.month,
                              'avg_daily_cost': request.avg_daily_cost,
                              'visitors_count_lag1': request.visitors_count_lag1,
                              'visitors_count_lag12': request.visitors_count_lag12}])[FEATURES['demand']]
        predicted = max(0.0, float(app.state.bundle['extension_models']['demand'].predict(rows)[0]))
        return {
            'estimated_visitors': int(round(predicted)),
            'slug': request.slug,
            'data_status': 'SYNTHETIC_MODEL',
            'scope': 'Ridge forecast on synthetic monthly demand with lag features; not actual visitor counts.',
        }

    @app.post('/api/predict/hotel', dependencies=[Depends(operator)])
    def hotel_price(request: HotelPriceInput):
        _place(request.slug)
        seasonal = {'season_winter': int(request.season == 'winter'),
                    'season_monsoon': int(request.season == 'monsoon')}
        rooms = {'room_type_deluxe': int(request.room_type == 'deluxe'),
                 'room_type_suite': int(request.room_type == 'suite')}
        rows = pd.DataFrame([{'stars': request.stars,
                              'distance_center_km': request.distance_center_km,
                              'baseline_daily_cost': request.baseline_daily_cost,
                              **seasonal, **rooms}])[FEATURES['hotel_price']]
        predicted = float(app.state.bundle['extension_models']['hotel_price'].predict(rows)[0])
        return {
            'estimated_bdt': int(round(predicted)),
            'data_status': 'SYNTHETIC_MODEL',
            'scope': 'RandomForest on synthetic hotel quotes; seasonal and room multipliers are illustrative.',
        }

    @app.post('/api/predict/sentiment', dependencies=[Depends(operator)])
    def sentiment(request: SentimentInput):
        cleaned = __import__('re').sub(r'[^a-zA-Z\s]', ' ', request.text).lower().strip()
        model = app.state.bundle['extension_models']['sentiment']
        scores = model.predict_proba([cleaned])[0]
        classes = model.classes_
        predicted = int(model.predict([cleaned])[0])
        return {
            'predicted_score': predicted,
            'class_probabilities': {int(cls): round(float(prob), 3) for cls, prob in zip(classes, scores)},
            'data_status': 'SYNTHETIC_MODEL',
            'scope': 'Logistic regression on synthetic labeled review templates; not trained on real tourist reviews.',
        }

    @app.post('/api/predict/season', dependencies=[Depends(operator)])
    def best_season(request: SeasonInput):
        place = _place(request.slug)
        rows = pd.DataFrame([{'avg_daily_cost': request.avg_daily_cost or place['daily_cost'],
                              'category': request.category}])
        labels = app.state.bundle['extension_models']['season_labels']
        predicted_month = int(app.state.bundle['extension_models']['season'].predict(rows)[0])
        return {
            'peak_month': predicted_month,
            'peak_label': labels.get(predicted_month, f'Month {predicted_month}'),
            'data_status': 'SYNTHETIC_MODEL',
            'scope': 'DecisionTree over per-destination synthetic demand peaks; not a substitute for actual seasonality research.',
        }

    @app.post('/api/predict/anomaly', dependencies=[Depends(operator)])
    def detect_anomaly(payload: AnomalyInput):
        values, missing = _anomaly_features(payload)
        model = app.state.bundle['extension_models']['anomaly']
        features = app.state.report['extensions']['anomaly']['features']
        rows = pd.DataFrame([dict(zip(features, values))])[features]
        score = float(model.decision_function(rows)[0])
        is_anomaly = bool(model.predict(rows)[0] == -1)
        return {
            'anomaly': is_anomaly,
            'decision_score': round(score, 4),
            'missing_fields': missing,
            'data_status': 'SYNTHETIC_MODEL',
            'scope': 'IsolationForest trained on synthetic telemetry baseline; only a heuristic, not medical or safety advice.',
        }

    @app.get('/api/extensions', dependencies=[Depends(operator)])
    def extensions():
        return app.state.report.get('extensions', {})

    return app


app = create_app()
