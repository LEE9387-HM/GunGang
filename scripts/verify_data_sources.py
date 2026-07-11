#!/usr/bin/env python3
"""GunGang Phase 0 — 식약처 API 샘플 호출 검증 (D-008 최종 게이트).

확인 목표:
  1. [필수] 건강기능식품정보 API(data.go.kr 15056760)가 응답하는가.
     제품별 성분 '함량'이 구조화 필드로 오는가, 텍스트(기준규격) 파싱이 필요한가.
  2. [필수] 식품안전나라 I2710이 일일섭취량 상한/하한·주의사항 필드를 실제로 반환하는가.

사용법:
  .env 에 DATA_GO_KR_API_KEY, FOODSAFETY_API_KEY 를 채운 뒤
  python scripts/verify_data_sources.py
"""
import json
import os
import sys
import urllib.parse
import urllib.request

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# data.go.kr 서비스 버전 suffix는 개정될 수 있어 후보를 순차 시도한다.
# 실패 시: 공공데이터포털 활용신청 상세의 '참고문서'에서 정확한 엔드포인트를 확인해 교체.
PRODUCT_API_CANDIDATES = [
    "https://apis.data.go.kr/1471000/HtfsInfoService03/getHtfsItem01",
    "https://apis.data.go.kr/1471000/HtfsInfoService2/getHtfsItem01",
    "https://apis.data.go.kr/1471000/HtfsInfoService/getHtfsItem01",
]
I2710_URL = "https://openapi.foodsafetykorea.go.kr/api/{key}/I2710/json/1/5"

# 함량·기능성 관련일 가능성이 높은 필드명 단서
AMOUNT_HINTS = ("STDR", "STANDARD", "RAWMTRL", "FNCLTY", "FNCTN", "INTK", "NTK",
                "IRDNT", "CAPACITY", "SRV", "POG", "BASE")


def load_env():
    env = {}
    path = os.path.join(ROOT, ".env")
    if not os.path.exists(path):
        sys.exit("[중단] .env 파일이 없습니다. .env.example을 복사해 키를 채우세요.")
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, _, v = line.partition("=")
            env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def http_get(url, timeout=25):
    req = urllib.request.Request(url, headers={"User-Agent": "gungang-verify/0.1"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.status, r.read().decode("utf-8", errors="replace")


def as_json(body):
    try:
        return json.loads(body)
    except (json.JSONDecodeError, ValueError):
        return None


def service_key_param(key):
    # Encoding 키(%포함)는 그대로, Decoding 키는 URL 인코딩해서 사용
    return key if "%" in key else urllib.parse.quote(key, safe="")


def find_records(obj):
    """응답 JSON 어디에 있든 첫 번째 레코드 리스트를 찾는다."""
    if isinstance(obj, list) and obj and isinstance(obj[0], dict):
        return obj
    if isinstance(obj, dict):
        for k in ("row", "items", "item"):
            if k in obj:
                found = find_records(obj[k])
                if found:
                    return found
        for v in obj.values():
            found = find_records(v)
            if found:
                return found
    return None


def print_record(rec, flag_hints=True):
    hits = []
    for k, v in rec.items():
        text = str(v).replace("\n", " ")
        if len(text) > 90:
            text = text[:90] + "…"
        mark = ""
        if flag_hints and any(h in k.upper() for h in AMOUNT_HINTS):
            mark = "  ◀◀ 함량/기능성 후보"
            hits.append(k)
        print(f"    {k} = {text}{mark}")
    return hits


def check_product_api(key):
    print("\n" + "=" * 70)
    print("[1/2] 건강기능식품정보 API (data.go.kr 15056760) — 함량 필드 구조 판정")
    print("=" * 70)
    kp = service_key_param(key)
    for ep in PRODUCT_API_CANDIDATES:
        url = f"{ep}?serviceKey={kp}&pageNo=1&numOfRows=3&type=json"
        print(f"\n  시도: {ep}")
        try:
            status, body = http_get(url)
        except Exception as e:
            print(f"    -> 연결 실패: {e}")
            continue
        data = as_json(body)
        if data is None:
            # data.go.kr 오류는 XML로 온다 (인증/등록 오류 등)
            print(f"    -> HTTP {status}, JSON 아님. 응답 앞부분:")
            print("       " + body[:220].replace("\n", " "))
            continue
        recs = find_records(data)
        if not recs:
            print(f"    -> HTTP {status}, 레코드를 찾지 못함. 최상위 키: {list(data)[:8]}")
            continue
        print(f"    -> 성공. 샘플 레코드 1건의 필드 ({len(recs)}건 수신):")
        hits = print_record(recs[0])
        print(f"\n  [판정 재료] 함량/기능성 후보 필드: {hits if hits else '없음 — 텍스트 파싱 필요 가능성 높음'}")
        return True
    print("\n  [실패] 모든 후보 엔드포인트 실패. 활용신청 상세의 참고문서에서 엔드포인트 확인 필요.")
    return False


def check_i2710(key):
    print("\n" + "=" * 70)
    print("[2/2] 식품안전나라 I2710 — 원료별 상한/하한·주의사항 확인")
    print("=" * 70)
    url = I2710_URL.format(key=key)
    try:
        status, body = http_get(url)
    except Exception as e:
        print(f"  -> 연결 실패: {e}")
        return False
    data = as_json(body)
    if data is None:
        print(f"  -> HTTP {status}, JSON 아님. 응답 앞부분: {body[:220]}")
        return False
    result = (data.get("I2710") or {}).get("RESULT", {})
    if result.get("CODE") not in (None, "INFO-000"):
        print(f"  -> API 오류: {result.get('CODE')} {result.get('MSG')}")
        return False
    recs = find_records(data)
    if not recs:
        print(f"  -> 레코드 없음. 최상위 키: {list(data)[:8]}")
        return False
    print(f"  -> 성공. 샘플 레코드 1건의 필드 ({len(recs)}건 수신):")
    print_record(recs[0], flag_hints=False)
    need = {"DAY_INTK_LOWLIMIT", "DAY_INTK_HIGHLIMIT", "IFTKN_ATNT_MATR_CN", "PRIMARY_FNCLTY"}
    have = need & set(recs[0].keys())
    print(f"\n  [판정 재료] 기대 필드 확인: {sorted(have)} / 누락: {sorted(need - have) or '없음'}")
    return True


def main():
    env = load_env()
    dg = env.get("DATA_GO_KR_API_KEY", "")
    fs = env.get("FOODSAFETY_API_KEY", "")
    missing = [n for n, v in [("DATA_GO_KR_API_KEY", dg), ("FOODSAFETY_API_KEY", fs)] if not v]
    if missing:
        sys.exit(f"[중단] .env에 값이 비어 있음: {', '.join(missing)}")

    ok1 = check_product_api(dg)
    ok2 = check_i2710(fs)

    print("\n" + "=" * 70)
    print(f"결과 요약: 제품정보 API {'OK' if ok1 else 'FAIL'} / I2710 {'OK' if ok2 else 'FAIL'}")
    print("위 필드 출력을 근거로 D-008 최종 판정(함량 구조화 vs 파싱 필요)을 기록할 것.")
    print("=" * 70)
    sys.exit(0 if (ok1 and ok2) else 1)


if __name__ == "__main__":
    main()
