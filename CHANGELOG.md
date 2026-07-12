# Changelog

이 프로젝트의 사용자 관점 변경 사항을 기록한다. [Keep a Changelog](https://keepachangelog.com/ko/) 형식을 따른다.

## [Unreleased]

### Added
- BASE_STANDARD(기준규격) 텍스트 함량 파서 (`src/ingestion`)
- Import 파이프라인 (`npm run import`): HtfsInfoService03 수집 → 원문 보존 →
  파서 → product/product_ingredient staging 적재. 2,920개 제품·3,499개 성분 적재
- 검수 흐름 (`npm run verify`): staging→verified 전환, admin_review·audit_log
  기록. 자동 후보 규칙(단일 핵심성분·exact·카테고리)으로 2,323건 승인
- **공개 화면 (Phase 2)**: 홈·검색(카테고리 탭·이름검색)·제품 상세.
  핵심성분 정규화 함량 + 원문 병기, 출처·정보 기준일·검수일, 면책 문구.
  verified 제품만 노출 (RLS), SSR
- **함량 Top 10 랭킹**: 카테고리별 핵심성분 함량 순위(단위 통일), 기준·주의 명시
- **제조사(company) 표시**: ENTRPS 정규화(117개 업체), 검색·랭킹·상세·비교에 노출
- **제품 비교(2~4개)**: 다나와식 나란히 비교표(제조사·함량·1일 비용·단위당 가격·기준일),
  목록 체크박스 → GET form (client JS 없음)
- **가격·가성비**: 섭취방법 파서(parseServing), 1일 비용 + 핵심성분 100단위당 가격
  계산(domain/dosage·pricing). `npm run price`로 수동 가격 입력(D-006).
  가격 없으면 "준비 중" 표시
- Vercel 배포: https://gun-gang.vercel.app
- 원료 일일섭취량 규칙·주의사항 시드 (draft)
- product.source_registered_at (식약처 등록일) — 근거 표시용
- gstack 스킬 라우팅 규칙 (CLAUDE.md)
- README 식약처 API 인증키 발급 안내

### Changed
- CI: actions/checkout, setup-node v4 → v5

### Known Issues
- 복합제품(오메가3+비타민D 등)에서 파서가 한 성분만 잡으면 카테고리가
  그 성분 쪽으로 분류됨. staging 검수로 교정 예정

## [0.1.0] - 2026-07-11

### Added
- 프로젝트 스캐폴딩: Next.js 15 + TypeScript strict + Tailwind v4 + vitest
- 레이어 구조: app / server / domain(순수 TS) / infra / ingestion
- domain 실구현: units(IU↔μg 변환), pricing(1일 비용·단위당 가격)
- LLM/OCR 어댑터 인터페이스
- 식약처 공공데이터 검증 스크립트 (`scripts/verify_data_sources.py`)
- GitHub Actions CI (typecheck·lint·test·build)
