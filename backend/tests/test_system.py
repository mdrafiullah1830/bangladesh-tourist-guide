from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from backend.app import create_app

TOKEN = 'test-operator-secret-at-least-32-characters'
AUTH = {'Authorization': f'Bearer {TOKEN}'}


@pytest.fixture
def client(tmp_path):
    with TestClient(create_app(tmp_path / 'test.sqlite3', TOKEN)) as client:
        yield client


def register(client, simulated=True):
    response = client.post('/api/devices', headers=AUTH, json={'name': 'Test wristband', 'simulated': simulated, 'consent': True})
    assert response.status_code == 201
    return response.json()


def event(**updates):
    return {'event_id': 'unique-event', 'recorded_at': datetime.now(timezone.utc).isoformat(),
            'latitude': 21.4272, 'longitude': 92.0058, 'temperature': 30, 'humidity': 70, 'sos': True, **updates}


def test_auth_and_consent(client):
    assert client.get('/api/safety').status_code == 401
    assert client.get('/api/models', headers={'Authorization': 'Bearer wrong-token'}).status_code == 401
    assert client.post('/api/devices', headers=AUTH, json={'name': 'No consent', 'consent': False}).status_code == 422
    assert client.post('/api/telemetry', headers=AUTH, json=event()).status_code == 401


def test_sos_deduplication_acknowledge_and_revocation(client):
    device = register(client)
    headers = {'Authorization': f"Bearer {device['token']}"}
    payload = event()
    response = client.post('/api/telemetry', headers=headers, json=payload)
    assert response.json()['alerts'] == ['SOS']
    assert client.post('/api/telemetry', headers=headers, json=payload).json()['duplicate']
    state = client.get('/api/safety', headers=AUTH).json()
    assert len(state['alerts']) == 1
    assert state['devices'][0]['stale'] is False
    assert 'token_hash' not in state['devices'][0]
    alert_id = state['alerts'][0]['id']
    assert client.post(f'/api/alerts/{alert_id}/ack', headers=AUTH).json()['external_dispatch'] is False
    assert client.delete(f"/api/devices/{device['id']}", headers=AUTH).status_code == 204
    assert client.post('/api/telemetry', headers=headers, json=event(event_id='revoked')).status_code == 401
    assert client.get('/api/safety', headers=AUTH).json()['alerts'] == []


@pytest.mark.parametrize('updates', [
    {'latitude': 91}, {'longitude': None}, {'humidity': 101}, {'temperature': -41},
    {'recorded_at': '2025-01-01T00:00:00'},
    {'recorded_at': (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()},
    {'recorded_at': (datetime.now(timezone.utc) - timedelta(days=8)).isoformat()},
    {'event_id': '../bad'}, {'device_id': 'spoofed'},
])
def test_bad_telemetry_rejected(client, updates):
    device = register(client)
    assert client.post('/api/telemetry', headers={'Authorization': f"Bearer {device['token']}"}, json=event(**updates)).status_code == 422


def test_sos_without_gps_and_stale_reading(client):
    device = register(client, simulated=False)
    response = client.post('/api/telemetry', headers={'Authorization': f"Bearer {device['token']}"},
                           json=event(latitude=None, longitude=None, temperature=39, recorded_at=(datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()))
    assert response.json()['alerts'] == ['SOS', 'HIGH_TEMPERATURE']
    state = client.get('/api/safety', headers=AUTH).json()
    assert state['devices'][0]['stale'] is True
    assert state['devices'][0]['latitude'] is None
    assert state['devices'][0]['simulated'] == 0


def test_out_of_order_delivery_does_not_replace_fresh_position(client):
    device = register(client)
    headers = {'Authorization': f"Bearer {device['token']}"}
    client.post('/api/telemetry', headers=headers, json=event(event_id='fresh', latitude=23))
    client.post('/api/telemetry', headers=headers, json=event(event_id='delayed', latitude=21, recorded_at=(datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()))
    assert client.get('/api/safety', headers=AUTH).json()['devices'][0]['latitude'] == 23


def test_models_and_input_boundaries(client):
    places = client.get('/api/places', headers=AUTH).json()
    assert len(places) >= 10
    response = client.post('/api/recommend', headers=AUTH, json={'interests': 'beach', 'daily_budget': 2000})
    assert response.status_code == 200
    assert all(place['daily_cost'] <= 2000 for place in response.json()['items'])
    assert client.post('/api/recommend', headers=AUTH, json={'daily_budget': 100}).json()['items'] == []
    assert client.post('/api/predict/cost', headers=AUTH, json={'slug': 'not-a-place'}).status_code == 404
    assert client.post('/api/predict/cost', headers=AUTH, json={'slug': places[0]['slug'], 'days': 0}).status_code == 422
    estimate = client.post('/api/predict/cost', headers=AUTH, json={'slug': places[0]['slug']}).json()
    assert estimate['estimated_bdt'] > 0
    assert estimate['data_status'] == 'SYNTHETIC_MODEL'
    crowd = client.post('/api/predict/crowd', headers=AUTH, json={'date': '2026-12-04', 'rain_mm': 10}).json()
    assert 0 <= crowd['index'] <= 100
    report = client.get('/api/models', headers=AUTH).json()
    for model in report['models'].values():
        assert model['random_forest']['mae'] < model['mean_baseline']['mae']
        assert model['test_rows'] > 100


def test_requires_nondefault_secret(tmp_path):
    with pytest.raises(RuntimeError, match='TOURIST_ADMIN_TOKEN'):
        with TestClient(create_app(tmp_path / 'test.sqlite3', admin_token='short')):
            pass
