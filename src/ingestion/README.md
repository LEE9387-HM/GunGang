# Data Ingestion Layer

식약처 공공데이터 import → SourceSnapshot 원문 보존 → 정규화 → staging (docs/06-data-sources.md).

Phase 1 구현 예정:
- `htfs-import.ts` — 건강기능식품정보 API(HtfsInfoService03) 수집
- `base-standard-parser.ts` — `BASE_STANDARD` 텍스트에서 `성분명: 표시량(수치단위/기준량)` 패턴 함량 추출 (실사 결과 파싱 필요 판정, research/data-sources-check.md)
- 검수 게이트: staging → verified는 관리자 승인으로만
