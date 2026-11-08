"""Publish only chess data and a small allowlist of running metrics."""
# Refresh requested for the 2026-11-08 running video.
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'data/integrations.json'
USERNAME = 'peretoka73'
GARMIN = 'https://personal.connectapi.garmin.com'

def request(url, headers=None, method='GET', raw=False):
    req = Request(url, headers={'User-Agent': 'RunAndBreathe/1.0 (https://nvdemin073.github.io/run_chess_med/)', 'Accept': 'application/json', **(headers or {})}, method=method)
    with urlopen(req, timeout=40) as response:
        text = response.read().decode()
    return text.strip() if raw else json.loads(text)

def sync_chess():
    base = f'https://api.chess.com/pub/player/{USERNAME}'
    stats = request(base + '/stats')
    if not any(k.startswith('chess_') for k in stats):
        raise ValueError('No player statistics received')
    archives = request(base + '/games/archives').get('archives', [])
    games = []
    for url in reversed(archives[-3:]):
        # Follow only documented archive URLs, never arbitrary API-supplied hosts.
        if not url.startswith(base + '/games/'):
            raise ValueError('Unexpected archive URL')
        games.extend(g for g in request(url).get('games', []) if g.get('rules') == 'chess')
    games.sort(key=lambda g: g.get('end_time', 0), reverse=True)
    return {'username': USERNAME, 'updatedAt': datetime.now(timezone.utc).isoformat(), 'stats': stats,
            'games': [{k: g[k] for k in ('url', 'pgn', 'end_time', 'white', 'black', 'time_class', 'time_control', 'rules') if k in g} for g in games[:100]]}

def public_run(activity):
    # Do not publish names, routes, locations, heart rate, or raw health data.
    distance = activity.get('distance')
    duration = activity.get('duration')
    date = str(activity.get('startTimeLocal', ''))[:10]
    if not isinstance(distance, (int, float)) or not isinstance(duration, (int, float)) or distance <= 0 or duration <= 0:
        return None
    datetime.strptime(date, '%Y-%m-%d')
    result = {'date': date, 'distanceKm': round(distance / 1000, 3), 'durationSeconds': round(duration),
            'paceSecondsPerKm': round(duration / (distance / 1000))}
    ident = activity.get('activityId')
    if isinstance(ident, int) and not isinstance(ident, bool) and 0 < ident < 2**53:
        result['garminActivityId'] = ident
    return result

def sync_garmin(key):
    token = request(GARMIN + '/personalapitoken-service/personal-api/personal-api-key/token',
                    {'Authorization': 'ApiKey ' + key, 'Accept': '*/*'}, method='POST', raw=True)
    if len(token.split('.')) != 3:
        raise ValueError('Unexpected token format')
    if os.getenv('GITHUB_ACTIONS'):
        print('::add-mask::' + token)
    today = datetime.now(ZoneInfo('Europe/Moscow')).date()
    month_start = today.replace(day=1)
    # No date bounds: traverse every page of the account's running history.
    runs = []
    seen = set()
    offset = 0
    for page in range(10000):
        query = urlencode({'start': offset, 'limit': 100, 'activityType': 'running'})
        batch = request(GARMIN + '/activitylist-service/activities/search/activities?' + query,
                        {'Authorization': 'Bearer ' + token})
        if not isinstance(batch, list):
            raise ValueError('Unexpected activities response')
        if not batch:
            break
        new_ids = 0
        for activity in batch:
            ident = activity.get('activityId')
            if not isinstance(ident, int) or ident <= 0:
                raise ValueError('Activity without valid ID')
            if ident in seen:
                continue
            seen.add(ident)
            new_ids += 1
            run = public_run(activity)
            if run:
                runs.append(run)
        if not new_ids:
            raise ValueError('Activities pagination returned the same page')
        # Advance by the returned size, even if Garmin caps pages below our limit.
        offset += len(batch)
    else:
        raise ValueError('Activity pagination did not terminate')
    runs.sort(key=lambda r: (r['date'], r.get('garminActivityId', 0)), reverse=True)
    month_runs = [r for r in runs if r['date'] >= str(month_start)]
    return {'updatedAt': datetime.now(timezone.utc).isoformat(), 'month': today.strftime('%Y-%m'),
            'monthRuns': len(month_runs), 'monthDistanceKm': round(sum(r['distanceKm'] for r in month_runs), 2),
            'recentRuns': runs[:30], 'runs': runs, 'historyComplete': True,
            'historyStart': runs[-1]['date'] if runs else None,
            'totalRuns': len(runs), 'totalDistanceKm': round(sum(r['distanceKm'] for r in runs), 2)}

def main():
    payload = json.loads(OUTPUT.read_text()) if OUTPUT.exists() else {'version': 1}
    errors = []
    try:
        payload['chess'] = sync_chess()
        print('Chess.com synchronized')
    except Exception as exc:
        # Never log response bodies or authorization headers.
        errors.append('Chess.com: ' + (f'HTTP {exc.code}' if isinstance(exc, HTTPError) else type(exc).__name__))
    key = os.getenv('GARMIN_PERSONAL_API_KEY', '').strip()
    if key:
        try:
            payload['garmin'] = sync_garmin(key)
            print('Garmin running metrics synchronized')
        except Exception as exc:
            errors.append('Garmin: ' + (f'HTTP {exc.code}' if isinstance(exc, HTTPError) else type(exc).__name__))
    else:
        print('Garmin not enabled: repository secret GARMIN_PERSONAL_API_KEY is missing')
    OUTPUT.parent.mkdir(exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n')
    for error in errors:
        print(error, file=sys.stderr)
    return bool(errors)

if __name__ == '__main__':
    sys.exit(main())
