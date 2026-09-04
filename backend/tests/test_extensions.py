"""Tests for the new ML extensions: clustering, demand, hotel price, sentiment, season and anomaly."""
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

from backend.app import create_app

TOKEN = 'test-operator-secret-at-least-32-characters'
AUTH = {'Authorization': f'Bearer {TOKEN}'}


@pytest.fixture
def client(tmp_path):
    with TestClient(create_app(tmp_path / 'test-ext.sqlite3', TOKEN)) as client:
        yield client


def test_extensions_listed(client):
    report = client.get('/api/extensions', headers=AUTH).json()
    for key in ('clustering', 'demand', 'hotel_price', 'sentiment', 'anomaly', 'season'):
        assert key in report, key
        assert 'model_type' in report[key]


def test_clustering_returns_named_segment(client):
    response = client.post('/api/predict/cluster', headers=AUTH,
                            json={'days': 3, 'travellers': 1, 'daily_budget': 1500, 'distance_km': 60})
    assert response.status_code == 200
    body = response.json()
    assert body['cluster_id'] >= 0
    assert body['cluster_name']


def test_demand_forecast_requires_known_destination(client):
    assert client.post('/api/predict/demand', headers=AUTH,
                       json={'slug': 'unknown', 'month': 1, 'avg_daily_cost': 2500,
                             'visitors_count_lag1': 1000, 'visitors_count_lag12': 1000}).status_code == 404
    response = client.post('/api/predict/demand', headers=AUTH,
                           json={'slug': 'coxs-bazar', 'month': 12, 'avg_daily_cost': 2000,
                                 'visitors_count_lag1': 1800, 'visitors_count_lag12': 1700})
    assert response.status_code == 200
    assert response.json()['estimated_visitors'] >= 0


def test_hotel_price_estimator(client):
    response = client.post('/api/predict/hotel', headers=AUTH,
                           json={'slug': 'sylhet', 'stars': 4, 'distance_center_km': 4.5,
                                 'baseline_daily_cost': 2500, 'season': 'winter', 'room_type': 'deluxe'})
    assert response.status_code == 200
    assert response.json()['estimated_bdt'] > 0


def test_hotel_price_rejects_unknown_destination(client):
    assert client.post('/api/predict/hotel', headers=AUTH,
                       json={'slug': 'unknown', 'stars': 3, 'distance_center_km': 1.0,
                             'baseline_daily_cost': 2500, 'season': 'summer', 'room_type': 'standard'}).status_code == 404


def test_hotel_price_rejects_bad_inputs(client):
    for body in (
        {'slug': 'coxs-bazar', 'stars': 6, 'distance_center_km': 1, 'baseline_daily_cost': 2500, 'season': 'summer', 'room_type': 'standard'},
        {'slug': 'coxs-bazar', 'stars': 3, 'distance_center_km': 1, 'baseline_daily_cost': 2500, 'season': 'spring', 'room_type': 'standard'},
        {'slug': 'coxs-bazar', 'stars': 3, 'distance_center_km': 1, 'baseline_daily_cost': 2500, 'season': 'summer', 'room_type': 'penthouse'},
    ):
        assert client.post('/api/predict/hotel', headers=AUTH, json=body).status_code == 422


def test_sentiment_predicts_score(client):
    response = client.post('/api/predict/sentiment', headers=AUTH,
                           json={'text': 'Cox\'s Bazar amazing experience wonderful staff spotless room'})
    assert response.status_code == 200
    body = response.json()
    assert 1 <= body['predicted_score'] <= 5
    assert sum(body['class_probabilities'].values()) > 0.99


def test_sentiment_requires_text(client):
    assert client.post('/api/predict/sentiment', headers=AUTH, json={'text': ''}).status_code == 422


def test_season_prediction(client):
    response = client.post('/api/predict/season', headers=AUTH,
                           json={'slug': 'coxs-bazar', 'avg_daily_cost': 2000, 'category': 'beach'})
    assert response.status_code == 200
    body = response.json()
    assert 1 <= body['peak_month'] <= 12


def test_anomaly_detects_extreme_readings(client):
    response = client.post('/api/predict/anomaly', headers=AUTH,
                           json={'temperature': 46.0, 'humidity': 5.0, 'latitude': 0.0, 'longitude': 0.0})
    assert response.status_code == 200
    assert response.json()['anomaly'] is True


def test_anomaly_requires_all_fields(client):
    assert client.post('/api/predict/anomaly', headers=AUTH,
                       json={'temperature': 31, 'humidity': 70, 'latitude': 22, 'longitude': None}).status_code == 422


def test_extensions_require_auth(client):
    assert client.post('/api/predict/cluster', json={'days': 3, 'travellers': 1, 'daily_budget': 1500, 'distance_km': 60}).status_code == 401
    assert client.get('/api/extensions').status_code == 401


def test_anomaly_decision_score_present(client):
    body = client.post('/api/predict/anomaly', headers=AUTH,
                       json={'temperature': 30, 'humidity': 70, 'latitude': 23, 'longitude': 90}).json()
    assert 'decision_score' in body
    assert isinstance(body['decision_score'], (int, float))