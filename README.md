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
