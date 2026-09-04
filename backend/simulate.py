import argparse
import os
import time
import uuid
from datetime import datetime, timezone

import httpx


def main():
    parser = argparse.ArgumentParser(description='Send explicitly simulated GPS and sensor data. Never contacts emergency services.')
    parser.add_argument('--url', default='http://127.0.0.1:8000')
    parser.add_argument('--count', type=int, default=5)
    parser.add_argument('--sos', action='store_true')
    args = parser.parse_args()
    token = os.environ.get('TOURIST_ADMIN_TOKEN', '')
    with httpx.Client(base_url=args.url, timeout=15) as client:
        response = client.post('/api/devices', headers={'Authorization': f'Bearer {token}'},
                               json={'name': 'CLI simulated wristband', 'simulated': True, 'consent': True})
        response.raise_for_status()
        device = response.json()
        print(f"Simulated device: {device['id']}")
        for index in range(args.count):
            event = {'event_id': uuid.uuid4().hex, 'recorded_at': datetime.now(timezone.utc).isoformat(),
                     'latitude': 21.4272 + index * .0001, 'longitude': 92.0058,
                     'temperature': 30 + index, 'humidity': 75, 'sos': args.sos and index == args.count - 1}
            response = client.post('/api/telemetry', headers={'Authorization': f"Bearer {device['token']}"}, json=event)
            response.raise_for_status()
            print(response.json())
            if index < args.count - 1:
                time.sleep(1)


if __name__ == '__main__':
    main()
