# GunGang (코드 저장소)

건강기능식품 성분·함량·가격 비교 서비스의 애플리케이션 코드 저장소.

- **기획·설계 문서(source of truth)**: `C:\WorkSpace\메모\10. Project\GunGang\` — 특히 `docs/11-decision-log.md`
- 현재 상태: **Phase 1 착수 — 아키텍처 뼈대 완성** (2026-07-11, D-008 데이터 검증 통과)

## 명령어

```bash
npm run dev        # 개발 서버
npm run typecheck  # TS strict 타입 검사
npm run lint       # ESLint
npm test           # vitest 단위 테스트 (domain 전수)
npm run build      # 프로덕션 빌드
python scripts/verify_data_sources.py  # 식약처 API 검증 (.env 필요)
```

## API 인증키 발급 (.env)

`.env.example`을 `.env`로 복사한 뒤 두 키를 채운다. 두 포털은 별개 시스템이다.

1. **DATA_GO_KR_API_KEY** — [공공데이터포털](https://www.data.go.kr) 가입 → 건강기능식품정보(15056760) "활용신청"(자동승인) → 마이페이지 > 활용신청 상세의 "일반 인증키 (Decoding)"
2. **FOODSAFETY_API_KEY** — [식품안전나라](https://www.foodsafetykorea.go.kr) 가입 → 공공데이터 활용 메뉴에서 I2710·C003 등 필요한 서비스 체크 → "Open-API 이용신청"(자동승인) → **마이페이지 > 인증키 관리**에서 키 확인. 서비스별로 이용신청을 해야 그 서비스에 키가 활성화된다.

주의: 식품안전나라 OpenAPI는 서버 불안정 시 **09:00~19:00 이용 제한** 공지가 뜰 수 있다 (ERROR-500). 수집 배치는 야간 실행 기준으로 설계한다.

## 구조 (요약 — 상세는 볼트 docs/02-architecture.md)

```
src/app         Presentation (App Router)
src/server      Application (services)
src/domain      Domain — 순수 TS, 외부 import 금지, 테스트 필수
src/infra       Infrastructure (db·storage·llm·ocr 어댑터)
src/ingestion   식약처 데이터 수집·정규화 (기준규격 파서 예정)
src/rules       선언적 규칙 시드
db/             마이그레이션·시드
tests/          unit / (Phase 2+) integration·e2e
```
