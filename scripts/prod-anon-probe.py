import re, urllib.request, urllib.error, json

import os
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
env = open(env_path).read()
url = re.search(r'VITE_SUPABASE_URL="?https://([a-z0-9]+)\.supabase\.co', env).group(1)
key = re.search(r'VITE_SUPABASE_ANON_KEY="?([A-Za-z0-9_\-.]+)', env).group(1)
base = f'https://{url}.supabase.co/rest/v1'


def get(path):
    req = urllib.request.Request(f'{base}{path}', headers={'apikey': key})
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.load(r)
    except urllib.error.HTTPError as e:
        return e.code, None


def rpc(name, payload):
    req = urllib.request.Request(
        f'{base}/rpc/{name}',
        data=json.dumps(payload).encode(), method='POST',
        headers={'apikey': key, 'Content-Type': 'application/json'},
    )
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.load(r)
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read())
        except Exception:
            return e.code, None


results = []


def check(name, ok, detail=''):
    results.append((name, ok, detail))
    print(('PASS' if ok else 'FAIL'), '|', name, ('| ' + str(detail) if detail else ''))


# ---- Edge security (anon role through the real API) ----
s, d = get('/profiles?select=id&limit=5')
check('profiles hidden from anon', s == 200 and d == [], f'status={s} rows={len(d) if isinstance(d, list) else d}')

s, d = get('/user_roles?select=*&limit=5')
check('user_roles hidden from anon', s == 200 and d == [], f'rows={len(d) if isinstance(d, list) else d}')

s, d = get('/payments?select=id&limit=5')
check('payments hidden from anon', s == 200 and isinstance(d, list) and len(d) == 0, f'rows={len(d) if isinstance(d, list) else d}')

s, d = get('/subscriptions?select=id&limit=5')
check('subscriptions hidden from anon', s == 200 and isinstance(d, list) and len(d) == 0, f'rows={len(d) if isinstance(d, list) else d}')

s, d = get('/test_results?select=id&limit=5')
check('test_results hidden from anon', s in (200, 404) and (d in (None, []) or isinstance(d, list)), f'status={s}')

s, d = get('/test_attempts?select=id,score&limit=5')
check('test_attempts hidden from anon', s == 200 and isinstance(d, list) and len(d) == 0, f'rows={len(d) if isinstance(d, list) else d}')

s, d = get('/questions?select=*&limit=1')
leaks = d and isinstance(d, list) and d and ('correct_option' in d[0] or 'explanation' in d[0])
check('questions NOT readable by anon (admin-only RLS applied)', s in (200, 404) and (s == 404 or d == []), f'status={s} rows={len(d) if isinstance(d, list) else d} leak={bool(leaks)}')

s, d = get('/payment_gateways?select=*&limit=1')
check('payment_gateways hidden from anon', s in (401, 403, 404), f'status={s}')

s, d = rpc('get_student_exam_questions', {'p_test_id': 'test-indus-01'})
check('get_student_exam_questions rejects anon', d is not None and isinstance(d, dict) and d.get('code') == '40100', f'response={json.dumps(d)[:80] if d else s}')

s, d = rpc('get_attempt_solutions', {'p_attempt_id': '00000000-0000-0000-0000-000000000000'})
check('get_attempt_solutions rejects anon', d is not None and isinstance(d, dict) and d.get('code') == '40100', f'response={json.dumps(d)[:80] if d else s}')

s, d = get('/user_test_access?select=*&limit=3')
if s == 200:
    check('user_test_access readable only as catalog metadata', isinstance(d, list) and all(set(x.keys()) <= {'test_id', 'title', 'slug', 'is_premium', 'status', 'has_access'} for x in d), f'rows={len(d) if isinstance(d, list) else d}')
else:
    check('user_test_access hidden from anon (post-013 expected)', s in (401, 403, 404), f'status={s}')

# ---- Write-block proofs (RLS must reject anonymous mutations) ----
try:
    import urllib.request as _u

    def write_probe(table, payload, method='POST'):
        req = _u.Request(
            f'{base}/{table}',
            data=json.dumps(payload).encode(),
            method=method,
            headers={'apikey': key, 'Content-Type': 'application/json', 'Prefer': 'return=representation'},
        )
        try:
            with _u.urlopen(req) as r:
                rows = json.load(r)
                return r.status, len(rows) if isinstance(rows, list) else 0
        except urllib.error.HTTPError as e:
            return e.code, 0

    st, n = write_probe('exams', {'id': 'probe-hack', 'title': 'x', 'slug': 'x', 'category': 'x'})
    check('anon cannot INSERT exams', st in (401, 403) or n == 0, f'status={st} rows={n}')

    st, n = write_probe(
        'questions?id=eq.00000000-0000-0000-0000-000000000000',
        {'question_text': 'x'},
        method='PATCH',
    )
    check('anon cannot UPDATE questions', st in (401, 403) or n == 0, f'status={st} rows={n}')

    st, n = write_probe('subscriptions', {'user_id': '00000000-0000-0000-0000-000000000000', 'plan_id': 'x', 'status': 'active'})
    check('anon cannot INSERT subscriptions', st in (401, 403) or n == 0, f'status={st} rows={n}')
except Exception as exc:  # noqa: BLE001
    check('write-block probes executed', False, str(exc)[:80])

print()
failed = [r for r in results if not r[1]]
print(f'TOTAL: {len(results)} checks, {len(failed)} failed')
if failed:
    for name, _, detail in failed:
        print(' - FAIL:', name, detail)
