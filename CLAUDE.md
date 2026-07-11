# GunGang 코드 저장소 — 작업 규칙

기획·설계 문서의 source of truth는 `C:\WorkSpace\메모\10. Project\GunGang\docs\` (특히 `11-decision-log.md`).
아키텍처·정책 변경 시 그쪽 문서를 함께 갱신한다.

## 절대 원칙 (변경 금지)

1. 추천보다 검증. 2. LLM은 최종 건강 판정 금지 — 함량·가격·중복·상한량·평가 계산은 전부 `src/domain`의 결정론적 로직. 3. 모든 분석 결과에 근거(출처·기준일·데이터 버전) 표시. 4. 의료행위처럼 보이지 않게 (진단·치료·복용 중단 표현 금지). 5. 제휴·광고는 평가와 노출 순위에 영향 금지.

## 레이어 규칙 (docs/02-architecture.md)

```
src/app (Presentation) → src/server (Application) → src/domain (Domain, 순수 TS)
                                   ↓ 주입
                          src/infra (Infrastructure)
```

- **`src/domain`은 어떤 외부 모듈도 import하지 않는다.** 프레임워크·DB·fetch 금지.
- domain 함수는 테스트 없이 머지 금지 (`tests/unit`).
- 규칙·변환 계수·평가 기준은 하드코딩하지 않고 데이터(+버전)로 관리.
- 외부 API(LLM/OCR)는 `src/infra`의 어댑터 인터페이스 뒤에만 둔다.

## 코딩 규칙 (마스터 프롬프트 19.7 요약)

- TypeScript strict. `any` 금지에 준해 최소화.
- 금액은 원 단위 정수, 함량은 정규화값+원본 표시값 병행 (D-010).
- 날짜·시각 UTC 저장, 표시할 때 KST.
- 입력은 서버에서 Zod로 재검증. API 오류 형식 통일 (docs/04-api-spec.md).
- 개인정보·복용 정보를 로그에 남기지 않는다.
- LLM 프롬프트도 버전 관리.

## 작업 단위와 검증

- 한 번에 하나: 사용자 흐름 1개 / 도메인 모듈 1개 / API 그룹 1개 / 화면 1개 / 마이그레이션 1개.
- 작업 전: 목표, 변경·신규 파일, DB 변경 여부, 테스트 계획을 먼저 제시.
- 작업 후: `npm run typecheck && npm run lint && npm test && npm run build` 통과 확인 후 완료 보고.
- 파괴적 변경(테이블·컬럼 삭제, 인증 변경, 응답 구조 변경)은 사전 고지.

## 커밋 규칙

`feat(scope): ...` / `fix(scope): ...` / `docs:` / `test:` 형식. 기능 단위, 빌드 가능한 상태로 커밋.

## 환경

- `.env` (git 제외): `DATA_GO_KR_API_KEY`, `FOODSAFETY_API_KEY` (+ Phase 1에서 Supabase 키 추가 예정)
- 데이터 검증: `python scripts/verify_data_sources.py`
