import os
import secrets
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[1]


def run():
    token = secrets.token_urlsafe(32)
    env = {**os.environ, 'TOURIST_ADMIN_TOKEN': token}
    processes = []
    with tempfile.TemporaryDirectory() as directory:
        env['SAFETY_DATABASE'] = str(Path(directory) / 'smoke.sqlite3')
        with open(Path(directory) / 'servers.log', 'w+') as log:
            try:
                for command in [
                    [sys.executable, '-m', 'uvicorn', 'backend.app:app', '--host', '127.0.0.1', '--port', '8000'],
                    ['node', 'node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', '3100'],
                ]:
                    processes.append(subprocess.Popen(command, cwd=ROOT, env=env, stdout=log, stderr=log))
                with httpx.Client(base_url='http://127.0.0.1:3100', timeout=10) as client:
                    for attempt in range(40):
                        if any(process.poll() is not None for process in processes):
                            raise RuntimeError('A smoke server exited. Ports 8000 and 3100 must be free.')
                        try:
                            response = client.get('/api/smart/models', headers={'Authorization': f'Bearer {token}'})
                            if response.status_code == 200:
                                break
                        except httpx.TransportError:
                            pass
                        time.sleep(.5)
                    else:
                        raise RuntimeError('Servers did not become ready')
                    assert client.get('/smart').status_code == 200
                    assert client.get('/api/smart/safety').status_code == 401
                    client.headers['Authorization'] = f'Bearer {token}'
                    recommended = client.post('/api/smart/recommend', json={'interests': 'beach'}).json()
                    assert recommended['items']
                    device = client.post('/api/smart/devices', json={'name': 'Smoke simulator', 'simulated': True, 'consent': True}).json()
                    event = {'event_id': 'smoke-1', 'recorded_at': datetime.now(timezone.utc).isoformat(), 'sos': True}
                    result = client.post('/api/smart/telemetry', headers={'Authorization': f"Bearer {device['token']}"}, json=event)
                    assert result.json()['alerts'] == ['SOS']
                    state = client.get('/api/smart/safety').json()
                    assert len(state['alerts']) == 1
                    assert client.post(f"/api/smart/alerts/{state['alerts'][0]['id']}/ack").status_code == 200
                    assert client.delete(f"/api/smart/devices/{device['id']}").status_code == 204
                    assert client.get('/api/smart/safety').json()['devices'] == []
                    assert client.post('/api/smart/predict/cluster', json={'days': 5, 'travellers': 2, 'daily_budget': 2200, 'distance_km': 180}).json()['cluster_name']
                    assert client.post('/api/smart/predict/season', json={'slug': 'coxs-bazar', 'avg_daily_cost': 2000, 'category': 'beach'}).json()['peak_month']
                    assert client.post('/api/smart/predict/sentiment', json={'text': 'amazing beach and wonderful staff'}).json()['predicted_score'] >= 1
                    assert client.post('/api/smart/predict/hotel', json={'slug': 'sylhet', 'stars': 3, 'distance_center_km': 2.0, 'baseline_daily_cost': 2500, 'season': 'winter', 'room_type': 'deluxe'}).json()['estimated_bdt'] > 0
                    assert client.post('/api/smart/predict/anomaly', json={'temperature': 46, 'humidity': 5, 'latitude': 0, 'longitude': 0}).json()['anomaly'] is True
                    print('PASS: production page, proxy, auth, recommendation, extensions, device telemetry, SOS, acknowledgement, deletion')
            except Exception:
                log.seek(0)
                print(log.read(), file=sys.stderr)
                raise
            finally:
                for process in processes:
                    process.terminate()
                for process in processes:
                    try:
                        process.wait(timeout=5)
                    except subprocess.TimeoutExpired:
                        process.kill()
                        process.wait()


if __name__ == '__main__':
    run()
